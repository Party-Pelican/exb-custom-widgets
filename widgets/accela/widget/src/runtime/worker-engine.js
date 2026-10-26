// Shared protocol implementation; bundled into assets/worker.js for deployment.
export function createWorkerHandler({ createClient, validateSearch, searchParcels, toCsv, post, fetchImpl }) {
  let generation = 0, active = null, dataset = null
  return async function handle(message) {
    const { id, action } = message
    if (action === 'cancel') {
      generation++; active?.abort(); active = null; dataset = null
      post({ id, kind: 'cancelled' }); return
    }
    if (action === 'search') {
      const ownGeneration = ++generation
      active?.abort(); active = new AbortController(); dataset = null
      const abort = active
      try {
        const filters = validateSearch(message.filters, message.maxParcels || 500)
        filters.modules = message.modules || []
        const client = createClient({ ...message.connection, fetchImpl })
        let lastProgress = 0
        const progress = value => {
          if (generation !== ownGeneration) return
          const now = Date.now()
          if (!lastProgress || now - lastProgress >= 100 || value.completed === value.total) {
            lastProgress = now; post({ id, kind: 'progress', progress: value })
          }
        }
        const result = await searchParcels(client, filters, 4, abort.signal, progress)
        if (generation !== ownGeneration || abort.signal.aborted) return
        dataset = result
        const { records, ...summary } = result
        post({ id, kind: 'result', result: { ...summary, recordCount: records.length } })
      } catch (error) {
        if (generation === ownGeneration && !abort.signal.aborted)
          post({ id, kind: 'error', error: error.message || 'Worker search failed.' })
      } finally { if (generation === ownGeneration) active = null }
      return
    }
    try {
      if (!dataset) throw new Error('Search results are no longer available. Run the search again.')
      if (action === 'page') {
        const text = String(message.filter || '').toLowerCase()
        const sort = message.sort === 'status' ? 'status' : 'permitId'
        const found = dataset.records.filter(r => !text || [r.permitId, r.status, r.description].some(v => v.toLowerCase().includes(text)))
        found.sort((a,b) => a[sort].localeCompare(b[sort]))
        const pageCount = Math.max(1, Math.ceil(found.length / 25))
        const page = Math.min(Math.max(0, Number(message.page) || 0), pageCount - 1)
        post({ id, kind: 'page', records: found.slice(page * 25, page * 25 + 25), total: found.length, page, pageCount })
      } else if (action === 'csv') {
        // Blob structured cloning avoids sending a full array/string through React.
        post({ id, kind: 'csv', blob: new Blob([toCsv(dataset.records)], { type: 'text/csv;charset=utf-8' }) })
      } else throw new Error('Unknown worker action.')
    } catch (error) { post({ id, kind: 'error', error: error.message }) }
  }
}
