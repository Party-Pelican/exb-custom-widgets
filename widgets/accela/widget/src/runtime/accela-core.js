export class ApiError extends Error {
  constructor(message, status = 502) { super(message); this.status = status }
}
export function validateSearch(body, maxParcels = 500) {
  if (!body || !Array.isArray(body.apns) || !body.apns.length || body.apns.length > maxParcels)
    throw new ApiError(`Provide 1–${maxParcels} parcel APNs.`, 400)
  if (body.apns.some(a => typeof a !== 'string' || !a.trim() || a.length > 100))
    throw new ApiError('APNs must be nonempty strings of at most 100 characters.', 400)
  const result = { apns: [...new Set(body.apns.map(a => a.trim()))] }
  for (const key of ['type', 'status', 'dateFrom', 'dateTo']) {
    if (body[key] !== undefined && (typeof body[key] !== 'string' || body[key].length > 250)) throw new ApiError(`Invalid ${key}.`, 400)
    result[key] = body[key] || ''
  }
  for (const key of ['dateFrom', 'dateTo']) {
    const d = result[key]
    if (d && (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !Number.isFinite(Date.parse(d)) || new Date(d).toISOString().slice(0,10) !== d)) throw new ApiError(`Invalid ${key}.`, 400)
  }
  if (result.dateFrom && result.dateTo && result.dateFrom > result.dateTo) throw new ApiError('Start date must precede end date.', 400)
  return result
}
export function searchBody(apn, filters) {
  const body = { parcel: { parcelNumber: apn } }
  if (filters.modules?.length) body.modules = filters.modules
  if (filters.type) body.type = { value: filters.type }
  if (filters.status) body.status = { value: filters.status }
  if (filters.dateFrom) body.openedDateFrom = `${filters.dateFrom} 00:00:00`
  if (filters.dateTo) body.openedDateTo = `${filters.dateTo} 23:59:59`
  return body
}
export function createClient({ appId, token, agency = 'ONT', environment = 'NONPROD1', maxPages = 100, fetchImpl = fetch }) {
  async function page(path, { body, signal } = {}) {
    if (!appId) throw new ApiError('Set the Accela App ID / API key in widget settings.', 400)
    for (let attempt = 0; attempt < 3; attempt++) {
      let res
      try { res = await fetchImpl(`https://apis.accela.com/v4${path}`, {
        method: body ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: token } : {}),
          'x-accela-appid': appId, 'x-accela-agency': agency, 'x-accela-environment': environment },
        body: body ? JSON.stringify(body) : undefined,
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(30000)]) : AbortSignal.timeout(30000)
      })
      } catch (error) {
        if (signal?.aborted) throw error
        throw new ApiError('Cannot reach Accela. Check network access, Accela CORS permission for this app origin, or request timeout.')
      }
      if ((res.status === 429 || res.status >= 500) && attempt < 2) {
        const seconds = Math.min(Number(res.headers.get('retry-after')) || attempt + 1, 10)
        await res.body?.cancel()
        await new Promise((resolve, reject) => {
          if (signal?.aborted) { reject(signal.reason); return }
          const onAbort = () => { clearTimeout(timer); reject(signal.reason) }
          const timer = setTimeout(() => { signal?.removeEventListener('abort', onAbort); resolve() }, seconds * 1000)
          signal?.addEventListener('abort', onAbort, { once: true })
        }); continue
      }
      if (!res.ok) throw new ApiError(res.status === 401 || res.status === 403
        ? `Accela returned HTTP ${res.status}. Check the App ID, access token, agency/environment, and record permissions in widget settings.`
        : `Accela returned HTTP ${res.status}.`)
      const json = await res.json()
      if (Number(json.status) >= 400) throw new ApiError(`Accela returned status ${json.status}.`)
      if (!Array.isArray(json.result)) throw new ApiError('Accela returned an unexpected result format.')
      return json
    }
  }
  async function all(path, options) {
    const records = []; const limit = 100
    for (let i = 0; i < maxPages; i++) {
      const data = await page(`${path}${path.includes('?') ? '&' : '?'}offset=${i * limit}&limit=${limit}`, options)
      records.push(...data.result)
      const more = data.page?.hasmore ?? data.page?.hasMore
      if (more === false || more === 'false' || (more == null && data.result.length < limit)) return records
      if (!data.result.length) throw new ApiError('Accela pagination did not advance.')
    }
    throw new ApiError('Accela page limit reached; narrow the search. This parcel was not included.')
  }
  return { all }
}
export async function searchParcels(client, filters, concurrency = 4, signal, onProgress = () => {}, maxRecords = 50000) {
  const records = new Map(); const failures = []; let cursor = 0; let completed = 0
  const progress = () => onProgress({ completed, total: filters.apns.length, recordCount: records.size, failureCount: failures.length })
  progress()
  await Promise.all(Array.from({ length: Math.min(concurrency, filters.apns.length) }, async () => {
    while (cursor < filters.apns.length) {
      const apn = filters.apns[cursor++]
      if (signal?.aborted) throw signal.reason
      try {
        const found = await client.all('/search/records', { body: searchBody(apn, filters), signal })
        if (found.some(r => !r.id)) throw new ApiError('A record has no stable Accela ID.')
        const newIds = new Set(found.filter(r => !records.has(r.id)).map(r => r.id))
        if (records.size + newIds.size > maxRecords) throw new ApiError('Result limit reached (50,000 unique permits). Narrow the area or filters. This parcel was not included.')
        for (const r of found) {
          const existing = records.get(r.id)
          if (existing) { if (!existing.apns.includes(apn)) existing.apns.push(apn); continue }
          records.set(r.id, { id: r.id, permitId: r.customId || r.id, status: r.status?.text || r.status?.value || '',
            description: r.description || '', type: r.type?.text || r.type?.value || '', dateCreated: r.openedDate || '', apns: [apn] })
        }
      } catch (error) {
        if (signal?.aborted) throw error
        failures.push({ apn, message: error instanceof ApiError ? error.message : 'Parcel lookup failed or timed out.' })
      }
      completed++; progress()
    }
  }))
  return { records: [...records.values()].sort((a,b) => a.permitId.localeCompare(b.permitId)), failures,
    parcelCount: filters.apns.length, successfulParcels: filters.apns.length - failures.length,
    complete: failures.length === 0, dateField: 'openedDate', queriedAt: new Date().toISOString() }
}
