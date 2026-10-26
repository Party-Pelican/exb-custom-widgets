/** @jsx jsx */
import { React, jsx, css, type AllWidgetProps } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import { Button, Modal, ModalHeader, ModalBody } from 'jimu-ui'
import FeatureLayer from 'esri/layers/FeatureLayer'
import GraphicsLayer from 'esri/layers/GraphicsLayer'
import Graphic from 'esri/Graphic'
import SketchViewModel from 'esri/widgets/Sketch/SketchViewModel'
import { type IMConfig } from '../config'
import { type ExportRecord } from './csv'
import { PermitWorker, type Progress } from './worker-client'
import { createClient } from './accela-core'

interface Permit extends ExportRecord { id: string; type: string; dateCreated: string; apns: string[] }
interface Failure { apn: string; message: string }
interface Result { recordCount: number; failures: Failure[]; complete: boolean; parcelCount: number; successfulParcels: number; queriedAt: string }
interface PermitType { id: string; value: string; text: string; module: string }
const style = css`
  padding: 20px; overflow: auto; height: 100%;
  h3 { font-size: 21px; margin: 0 0 8px; }
  .intro, .hint { opacity: .8; font-size: 13px; }
  .tag { font-size: 11px; letter-spacing: .08em; margin-bottom: 12px; }
  label { display: block; margin: 16px 0; font-weight: 600; }
  select, input { display: block; width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #8796a1; border-radius: 4px; color: inherit; background: inherit; }
  .tools { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0; }
  .notice { padding: 12px; margin: 12px 0; border-left: 4px solid #9a6500; background: #fff4d6; color: #4b3500; }
`
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 14 }
const cellStyle: React.CSSProperties = { padding: 10, borderBottom: '1px solid #ccd4db', textAlign: 'left', verticalAlign: 'top', overflowWrap: 'anywhere' }

export default function Widget(props: AllWidgetProps<IMConfig>) {
  const [jmv, setJmv] = React.useState<JimuMapView>(null)
  const [geometry, setGeometry] = React.useState<__esri.Geometry>(null)
  const [ready, setReady] = React.useState(false)
  const [types, setTypes] = React.useState<PermitType[]>([])
  const [statuses, setStatuses] = React.useState<Array<{ value: string; text: string }>>([])
  const [type, setType] = React.useState(''), [status, setStatus] = React.useState('')
  const [dateFrom, setDateFrom] = React.useState(''), [dateTo, setDateTo] = React.useState('')
  const [busy, setBusy] = React.useState(false), [metadataBusy, setMetadataBusy] = React.useState(false)
  const [error, setError] = React.useState(''), [toast, setToast] = React.useState('')
  const [result, setResult] = React.useState<Result>(null), [open, setOpen] = React.useState(false)
  const [page, setPage] = React.useState(0), [filter, setFilter] = React.useState(''), [sort, setSort] = React.useState<'permitId' | 'status'>('permitId')
  const [parcelCount, setParcelCount] = React.useState(0)
  const [progress, setProgress] = React.useState<Progress>(null)
  const [shown, setShown] = React.useState<Permit[]>([])
  const [pages, setPages] = React.useState(1), [pageBusy, setPageBusy] = React.useState(false)
  const [exporting, setExporting] = React.useState(false)
  const worker = React.useRef<PermitWorker>(null)
  const workerLifetime = React.useRef<AbortController>(null)
  const sketch = React.useRef<SketchViewModel>(null), layer = React.useRef<FeatureLayer>(null)
  const highlights = React.useRef<GraphicsLayer>(null)
  const controller = React.useRef<AbortController>(null)
  const agency = props.config.accelaAgency || 'ONT'
  const environment = props.config.accelaEnvironment || 'NONPROD1'
  const modulesText = props.config.accelaModules ?? 'Building,Planning'
  const modules = React.useMemo(() => [...new Set(modulesText.split(',').map(m => m.trim()).filter(Boolean))], [modulesText])
  const client = React.useMemo(() => createClient({ appId: props.config.accelaAppId || '', token: props.config.accelaAccessToken || '', agency, environment }),
    [props.config.accelaAppId, props.config.accelaAccessToken, agency, environment])
  const maxParcels = props.config.maxParcels || 500
  const selectedType = types.find(t => t.value === type)
  const configured = !!props.config.parcelLayerUrl && !!props.config.apnField && !!props.useMapWidgetIds?.length

  async function api(path: string, signal: AbortSignal) {
    if (path === 'types') {
      if (!modules.length) throw new Error('Configure at least one Accela module in widget settings.')
      const all: PermitType[] = []
      for (const module of modules) {
        const found = await client.all('/settings/records/types?module=' + encodeURIComponent(module), { signal })
        all.push(...found.filter(t => t.searchable !== false).map(t => ({ id: t.id, value: t.value, text: t.text || t.alias || t.value, module: t.module || module })))
      }
      return { types: [...new Map(all.map(t => [t.id || t.value, t])).values()] }
    }
    const typeId = new URLSearchParams(path.split('?')[1]).get('typeId')
    const found = await client.all('/settings/records/types/' + encodeURIComponent(typeId || '') + '/statuses', { signal })
    return { statuses: found.map(s => ({ value: s.value, text: s.text || s.value })) }
  }

  React.useEffect(() => {
    const lifetime = new AbortController(); workerLifetime.current = lifetime
    try { worker.current = new PermitWorker(props.context.folderUrl) }
    catch (e) { setError('Cannot start permit worker: ' + e.message) }
    return () => { lifetime.abort(); controller.current?.abort(); worker.current?.destroy(); worker.current = null }
  }, [props.context.folderUrl])

  React.useEffect(() => {
    controller.current?.abort(); worker.current?.clearResults(); setBusy(false); setResult(null); setOpen(false)
    const abort = new AbortController(); setMetadataBusy(true); setTypes([]); setType(''); setStatus(''); setError('')
    api('types', abort.signal).then(data => { if (!abort.signal.aborted) setTypes(data.types || []) })
      .catch(e => { if (!abort.signal.aborted) setError(e.message) })
      .finally(() => { if (!abort.signal.aborted) setMetadataBusy(false) })
    return () => abort.abort()
  }, [client, modules])
  React.useEffect(() => {
    setStatuses([]); setStatus('')
    if (!selectedType?.id) return
    const abort = new AbortController()
    api('statuses?typeId=' + encodeURIComponent(selectedType.id), abort.signal)
      .then(data => { if (!abort.signal.aborted) setStatuses(data.statuses || []) })
      .catch(e => { if (!abort.signal.aborted) setError('Unable to load statuses: ' + e.message) })
    return () => abort.abort()
  }, [selectedType?.id, client])

  React.useEffect(() => {
    setReady(false); setGeometry(null); setResult(null); setParcelCount(0); controller.current?.abort()
    if (!jmv?.view || !configured) return
    let disposed = false
    const drawLayer = new GraphicsLayer({ title: 'Permit search area', listMode: 'hide' })
    const matchLayer = new GraphicsLayer({ title: 'Permit search parcels', listMode: 'hide' })
    const parcels = new FeatureLayer({ url: props.config.parcelLayerUrl })
    jmv.view.map.addMany([drawLayer, matchLayer])
    const vm = new SketchViewModel({ view: jmv.view, layer: drawLayer,
      polygonSymbol: { type: 'simple-fill', color: [0,112,178,0.1], outline: { color: '#0070b2', width: 2 } } as __esri.SimpleFillSymbolProperties })
    sketch.current = vm; layer.current = parcels; highlights.current = matchLayer
    const handle = vm.on('create', event => {
      if (event.state === 'complete') setGeometry(event.graphic.geometry)
    })
    parcels.load().then(() => {
      if (parcels.geometryType !== 'polygon') throw new Error('Choose a polygon parcel layer.')
      const field = parcels.fields.find(f => f.name === props.config.apnField)
      if (!field) throw new Error('Configured APN field does not exist on the parcel layer.')
      if (field.type !== 'string') throw new Error('Use a string APN field so leading zeros are preserved.')
      if (!disposed) setReady(true)
    }).catch(e => { if (!disposed) setError(e.message) })
    return () => {
      disposed = true; controller.current?.abort(); handle.remove(); vm.destroy()
      jmv.view.map.removeMany([drawLayer, matchLayer]); drawLayer.destroy(); matchLayer.destroy(); parcels.destroy()
      sketch.current = null; layer.current = null; highlights.current = null
    }
  }, [jmv, props.config.parcelLayerUrl, props.config.apnField, configured])
  React.useEffect(() => () => controller.current?.abort(), [])
  React.useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 8000)
    return () => window.clearTimeout(timer)
  }, [toast])

  function draw(tool: 'polygon' | 'rectangle') {
    controller.current?.abort(); worker.current?.clearResults(); setBusy(false); setError(''); setGeometry(null); setResult(null); setParcelCount(0)
    highlights.current?.removeAll(); sketch.current?.layer.removeAll(); sketch.current?.create(tool)
  }
  function clear() {
    controller.current?.abort(); worker.current?.clearResults(); setBusy(false); sketch.current?.cancel(); sketch.current?.layer.removeAll()
    highlights.current?.removeAll(); setGeometry(null); setResult(null); setParcelCount(0); setError(''); setToast('')
  }
  async function search() {
    if (!geometry || !layer.current) return
    if (!worker.current) { setError('Permit worker is unavailable. Reload the widget.'); return }
    const abort = new AbortController(); controller.current?.abort(); controller.current = abort
    setBusy(true); setProgress(null); setError(''); setToast(''); setResult(null); setParcelCount(0); highlights.current?.removeAll()
    try {
      if (dateFrom && dateTo && dateFrom > dateTo) throw new Error('Start date must precede end date.')
      const query = layer.current.createQuery()
      query.geometry = geometry; query.spatialRelationship = 'intersects'
      const ids = await layer.current.queryObjectIds(query, { signal: abort.signal }) || []
      if (ids.length > maxParcels) throw new Error(`Area intersects ${ids.length} parcels. Narrow the area to ${maxParcels} or fewer.`)
      if (!ids.length) { setResult({ recordCount: 0, failures: [], complete: true, parcelCount: 0, successfulParcels: 0, queriedAt: new Date().toISOString() }); setOpen(true); return }
      const features: __esri.Graphic[] = []
      for (let i = 0; i < ids.length; i += 100) {
        const q = layer.current.createQuery(); q.objectIds = ids.slice(i, i + 100); q.outFields = [props.config.apnField]; q.returnGeometry = true
        const found = await layer.current.queryFeatures(q, { signal: abort.signal })
        if (found.exceededTransferLimit || found.features.length !== q.objectIds.length) throw new Error('Parcel service returned incomplete features; narrow the area and retry.')
        features.push(...found.features)
      }
      if (abort.signal.aborted) return
      setParcelCount(features.length)
      let missing = 0
      const apns = [...new Set(features.map(f => {
        const value = f.attributes[props.config.apnField]
        if (value == null || !String(value).trim()) { missing++; return '' }
        return String(value).trim()
      }).filter(Boolean))]
      highlights.current?.addMany(features.map(f => new Graphic({ geometry: f.geometry,
        symbol: { type: 'simple-fill', color: [0,112,178,0.07], outline: { color: '#0070b2', width: 1 } } as __esri.SimpleFillSymbolProperties })))
      const data: Result = apns.length ? (await worker.current.request('search', { filters: { apns, type, status, dateFrom, dateTo }, modules, maxParcels, connection: { appId: props.config.accelaAppId || '', token: props.config.accelaAccessToken || '', agency, environment } }, abort.signal, setProgress)).result :
        { recordCount: 0, failures: [], complete: false, parcelCount: 0, successfulParcels: 0, queriedAt: new Date().toISOString() }
      if (abort.signal.aborted) return
      if (missing) { data.failures.push({ apn: `${missing} GIS parcel(s) without APN`, message: 'No APN was available to query Accela.' }); data.complete = false }
      // Failed APNs are amber; successful lookups remain blue, even if no permit matched.
      const failed = new Set(data.failures.map(f => f.apn))
      highlights.current?.removeAll()
      highlights.current?.addMany(features.map(f => {
        const apn = String(f.attributes[props.config.apnField] ?? '').trim()
        return new Graphic({ geometry: f.geometry, symbol: { type: 'simple-fill', color: failed.has(apn) || !apn ? [224,153,0,.3] : [0,112,178,.08],
          outline: { color: failed.has(apn) || !apn ? '#9a6500' : '#0070b2', width: 1.5 } } as __esri.SimpleFillSymbolProperties })
      }))
      setResult(data); setOpen(true); setPage(0); setFilter('')
      if (!data.complete) setToast('Some parcels errored. Available records are shown; failed parcels are highlighted in amber.')
    } catch (e) { if (!abort.signal.aborted) setError(e.message || 'Search failed.') }
    finally { if (controller.current === abort) setBusy(false) }
  }
  React.useEffect(() => {
    setShown([]); setPageBusy(false)
    if (!result?.recordCount || !worker.current) { setPages(1); return }
    const abort = new AbortController(); setPageBusy(true)
    const timer = window.setTimeout(() => {
      worker.current?.request('page', { page, filter, sort }, abort.signal).then(data => {
        if (abort.signal.aborted) return
        setShown(data.records); setPages(data.pageCount)
        if (data.page !== page) setPage(data.page)
      }).catch(e => { if (!abort.signal.aborted) setError(e.message) })
        .finally(() => { if (!abort.signal.aborted) setPageBusy(false) })
    }, 150)
    return () => { window.clearTimeout(timer); abort.abort() }
  }, [result, page, filter, sort])
  async function exportCsv() {
    if (!result?.recordCount || !worker.current || exporting) return
    setExporting(true)
    try {
      const message = await worker.current.request('csv', {}, workerLifetime.current?.signal)
      const url = URL.createObjectURL(message.blob)
      const a = document.createElement('a'); a.href = url; a.download = `${agency}-permits${result.complete ? '' : '-PARTIAL'}-${new Date().toISOString().slice(0,10)}.csv`
      a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) { if (e.name !== 'AbortError') setError(e.message) }
    finally { setExporting(false) }
  }
  return <div css={style} className="widget-accela-parcel-search">
    {props.useMapWidgetIds?.[0] && <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds[0]} onActiveViewChange={setJmv}/>}
    <div className="tag">{agency} · {environment}</div>
    <h3>Find permits in an area</h3>
    <p className="intro">Draw an area. Every intersecting parcel is searched using its APN.</p>
    {!configured && <div role="alert" className="notice">Select a map, parcel layer URL, and APN field in widget settings.</div>}
    <div className="tools">
      <Button disabled={!ready || busy} onClick={() => draw('polygon')}>Draw polygon</Button>
      <Button disabled={!ready || busy} onClick={() => draw('rectangle')}>Draw rectangle</Button>
      <Button disabled={busy} onClick={clear}>Clear</Button>
    </div>
    <p className="hint">{geometry ? 'Area ready. Choose filters and search.' : 'Draw an area to begin.'}</p>
    <label>Permit type<select disabled={busy || metadataBusy} value={type} onChange={e => { setType(e.target.value); setStatus('') }}>
      <option value="">{metadataBusy ? 'Loading types…' : 'All permit types'}</option>
      {types.map(t => <option key={t.id || t.value} value={t.value}>{t.module} · {t.text}</option>)}
    </select></label>
    <label>Status<select disabled={busy || !type} value={status} onChange={e => setStatus(e.target.value)}>
      <option value="">All statuses</option>{statuses.map(s => <option key={s.value} value={s.value}>{s.text}</option>)}
    </select></label>
    {!type && <p className="hint">Choose a permit type to select one of its statuses.</p>}
    <label>Date created — from<input type="date" value={dateFrom} disabled={busy} onChange={e => setDateFrom(e.target.value)}/></label>
    <label>Date created — through<input type="date" value={dateTo} disabled={busy} onChange={e => setDateTo(e.target.value)}/></label>
    <p className="hint">Date created uses Accela's application opened date. Both dates are inclusive.</p>
    <Button type="primary" disabled={!geometry || !ready || busy || metadataBusy || !types.length} onClick={search}>{busy ? 'Searching parcels and permits…' : 'Search permits'}</Button>
    {busy && <p role="status" aria-live="polite">{progress ? `${progress.completed} of ${progress.total} APNs checked · ${progress.recordCount} permits found · ${progress.failureCount} failed` : 'Finding intersecting GIS parcels…'}</p>}
    {busy && <Button className="ml-2" onClick={() => { controller.current?.abort(); setBusy(false) }}>Cancel</Button>}
    {error && <div role="alert" className="notice">{error}</div>}
    {toast && <div role="status" aria-live="polite" className="notice" style={{ position: 'sticky', bottom: 0 }}>{toast}</div>}
    {result && <p className="mt-3"><Button onClick={() => setOpen(true)}>View {result.recordCount} records{!result.complete ? ' (partial)' : ''}</Button></p>}
    <Modal isOpen={open} toggle={() => setOpen(false)} size="lg">
      <ModalHeader toggle={() => setOpen(false)}>Permits in selected area</ModalHeader>
      <ModalBody>
        <p>{result?.recordCount || 0} unique permits · {parcelCount} GIS parcels · {result?.successfulParcels || 0} APNs searched successfully</p>
        {result && !result.complete && <div role="alert" style={{ padding: 12, background: '#fff4d6', color: '#4b3500' }}>
          Partial results. {result.failures.length} lookup issue(s). Amber parcels need attention.
          <details><summary>Failed parcel details</summary><ul>{result.failures.map(f => <li key={f.apn}><strong>{f.apn}</strong>: {f.message}</li>)}</ul></details>
        </div>}
        <div className="d-flex my-3" style={{ gap: 12, flexWrap: 'wrap' }}>
          <label>Find in results <input aria-label="Find in results" value={filter} onChange={e => { setFilter(e.target.value); setPage(0) }}/></label>
          <label>Sort by <select value={sort} onChange={e => { setSort(e.target.value as 'permitId' | 'status'); setPage(0) }}><option value="permitId">Permit ID</option><option value="status">Status</option></select></label>
          <Button disabled={!result?.recordCount || exporting} onClick={exportCsv}>{exporting ? 'Preparing CSV…' : 'Export all found records'}{result && !result.complete ? ' (partial)' : ''}</Button>
        </div>
        <div style={{ overflow: 'auto', maxHeight: '50vh' }}>
          <table style={tableStyle}><caption className="sr-only">Unique Accela permit records found for selected parcel APNs</caption>
            <thead><tr>{['Permit ID','Status','Description'].map(h => <th scope="col" style={cellStyle} key={h}>{h}</th>)}</tr></thead>
            <tbody>{shown.map(r => <tr key={r.id}><td style={cellStyle}>{r.permitId}</td><td style={cellStyle}>{r.status}</td><td style={cellStyle}>{r.description || '—'}</td></tr>)}</tbody>
          </table>
          {pageBusy && <p role="status" className="p-3">Updating table…</p>}
          {!pageBusy && !shown.length && <p className="p-3">{result?.complete ? 'No matching records.' : 'No records available from the successful lookups.'}</p>}
        </div>
        <div className="d-flex mt-3" style={{ gap: 12, alignItems: 'center' }}>
          <Button disabled={pageBusy || !page} onClick={() => setPage(p => p - 1)}>Previous</Button><span>Page {page + 1} of {pages}</span>
          <Button disabled={pageBusy || page + 1 >= pages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
        <small>Export includes every found record, regardless of table search or page. One row per unique Accela record; separate permits are not merged into projects.</small>
      </ModalBody>
    </Modal>
  </div>
}
