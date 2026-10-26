import { parentPort, workerData } from 'node:worker_threads'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
globalThis.self = {postMessage: value => parentPort.postMessage(value)}
globalThis.fetch = async (_url, options) => {
  const apn = JSON.parse(options.body).parcel.parcelNumber
  if (apn === 'slow') await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, 500)
    options.signal.addEventListener('abort', () => {clearTimeout(timer); reject(options.signal.reason)}, {once:true})
  })
  if (apn === 'bad') return new Response('', {status:403})
  const rows = Array.from({length:60}, (_,i) => ({id:'id-'+i,customId:'BLD-'+String(i).padStart(3,'0'),status:{text:i%2 ? 'Issued':'Pending'},description:'Parcel permit '+i}))
  return Response.json({result:rows,page:{hasmore:false}})
}
vm.runInThisContext(await readFile(new URL('../widget/src/runtime/assets/worker.js',import.meta.url),'utf8'))
parentPort.on('message', data => self.onmessage({data}))
