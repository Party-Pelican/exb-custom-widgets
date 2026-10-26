export interface Progress { completed: number; total: number; recordCount: number; failureCount: number }
export class PermitWorker {
  private worker: Worker
  private serial = 0
  private pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void; progress?: (value: Progress) => void; cleanup: () => void }>()
  private dead = false
  constructor(folderUrl: string) {
    // Esri copies runtime/assets into dist/runtime/assets. Blob bootstrap also supports
    // extensions hosted on a different origin than the Enterprise portal.
    const asset = new URL('dist/runtime/assets/worker.js', folderUrl.endsWith('/') ? folderUrl : folderUrl + '/').href
    const blob = URL.createObjectURL(new Blob(['importScripts(' + JSON.stringify(asset) + ');'], {type:'text/javascript'}))
    try { this.worker = new Worker(blob, {name:'accela-permit-search'}) }
    finally { URL.revokeObjectURL(blob) }
    this.worker.onmessage = event => {
      const message = event.data, request = this.pending.get(message.id)
      if (!request) return
      if (message.kind === 'progress') { request.progress?.(message.progress); return }
      this.pending.delete(message.id); request.cleanup()
      if (message.kind === 'error') request.reject(new Error(message.error))
      else request.resolve(message)
    }
    this.worker.onerror = event => {
      event.preventDefault(); this.fail(new Error('Permit worker could not run. Check worker asset hosting and the app Content Security Policy.'))
    }
    this.worker.onmessageerror = () => this.fail(new Error('Permit worker returned an unreadable response.'))
  }
  private fail(error: Error) {
    this.dead = true; this.worker.terminate()
    for (const request of this.pending.values()) { request.cleanup(); request.reject(error) }
    this.pending.clear()
  }
  request(action: string, payload: object = {}, signal?: AbortSignal, progress?: (value: Progress) => void): Promise<any> {
    if (this.dead) return Promise.reject(new Error('Permit worker is unavailable. Reload the widget.'))
    if (signal?.aborted) return Promise.reject(new DOMException('Cancelled', 'AbortError'))
    const id = ++this.serial
    return new Promise((resolve, reject) => {
      const onAbort = () => {
        this.pending.delete(id); cleanup()
        if (action === 'search') this.worker.postMessage({id: ++this.serial, action:'cancel'})
        reject(new DOMException('Cancelled', 'AbortError'))
      }
      const cleanup = () => signal?.removeEventListener('abort', onAbort)
      this.pending.set(id, {resolve, reject, progress, cleanup})
      signal?.addEventListener('abort', onAbort, {once:true})
      try { this.worker.postMessage({id, action, ...payload}) }
      catch (error) { this.pending.delete(id); cleanup(); reject(error) }
    })
  }
  clearResults() { if (!this.dead) this.worker.postMessage({ id: ++this.serial, action: 'cancel' }) }
  destroy() { this.fail(new DOMException('Widget closed', 'AbortError')) }
}
