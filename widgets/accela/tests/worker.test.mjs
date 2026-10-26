import test from 'node:test'
import assert from 'node:assert/strict'
import { Worker } from 'node:worker_threads'
import { createClient, searchParcels } from '../widget/src/runtime/accela-core.js'

function runner(t) {
  const worker = new Worker(new URL('./worker-harness.mjs',import.meta.url))
  t.after(()=>worker.terminate())
  let id=0; const messages=[]; const pending=new Map()
  worker.on('message', message => {
    messages.push(message)
    if (message.kind !== 'progress') { pending.get(message.id)?.(message); pending.delete(message.id) }
  })
  return {
    messages,
    call(action, payload={}) {
      const next=++id
      return new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>{pending.delete(next);reject(new Error('Worker test timed out'))},5000)
        pending.set(next,value=>{clearTimeout(timer);resolve(value)})
        worker.postMessage({id:next,action,...payload})
      })
    },
    send(action,payload={}) {worker.postMessage({id:++id,action,...payload})}
  }
}
const query = apns => ({connection:{appId:'test'},filters:{apns},modules:['Building']})

test('generated worker runs search, progress, bounded table pages, sorting/filtering, and complete CSV',async t=>{
  const r=runner(t)
  const search=await r.call('search',query(['001','002','bad']))
  assert.equal(search.kind,'result')
  assert.equal(search.result.recordCount,60)
  assert.equal('records' in search.result,false)
  assert.equal(search.result.failures[0].apn,'bad')
  assert.equal(search.result.complete,false)
  const progress=r.messages.filter(m=>m.kind==='progress')
  assert.equal(progress[0].progress.completed,0)
  assert.equal(progress.at(-1).progress.completed,3)
  const page=await r.call('page',{page:1,sort:'permitId',filter:''})
  assert.equal(page.records.length,25);assert.equal(page.records[0].permitId,'BLD-025');assert.equal(page.pageCount,3)
  const filtered=await r.call('page',{page:99,sort:'status',filter:'Issued'})
  assert.equal(filtered.total,30);assert.equal(filtered.page,1);assert.equal(filtered.records.length,5)
  const csv=await r.call('csv')
  assert.ok(csv.blob instanceof Blob)
  const text=await csv.blob.text()
  assert.equal(text.split('\r\n').length,61)
  assert.match(text, /BLD-059/)
})
test('worker cancellation stops pending search and discards stored results',async t=>{
  const r=runner(t)
  r.send('search',query(['slow']))
  const cancel=await r.call('cancel')
  assert.equal(cancel.kind,'cancelled')
  const page=await r.call('page')
  assert.equal(page.kind,'error')
  await new Promise(resolve=>setTimeout(resolve,30))
  assert.equal(r.messages.some(m=>m.kind==='result'),false)
})
test('new worker search suppresses a superseded search response',async t=>{
  const r=runner(t)
  r.send('search',query(['slow']))
  const result=await r.call('search',query(['002']))
  assert.equal(result.result.recordCount,60)
  await new Promise(resolve=>setTimeout(resolve,30))
  assert.equal(r.messages.filter(m=>m.kind==='result').length,1)
})
test('record limit rejects entire overflowing parcel and progress still completes',async()=>{
  const client={all:async()=>[{id:'a'},{id:'b'}]}
  const progress=[]
  const result=await searchParcels(client,{apns:['001']},4,undefined,p=>progress.push(p),1)
  assert.equal(result.records.length,0);assert.equal(result.complete,false)
  assert.match(result.failures[0].message,/limit/)
  assert.equal(progress.at(-1).completed,1)
})
test('cancellation interrupts rate-limit backoff promptly',async()=>{
  const abort=new AbortController()
  const client=createClient({appId:'a',fetchImpl:async()=> {
    setTimeout(()=>abort.abort(),10)
    return new Response('',{status:429,headers:{'retry-after':'10'}})
  }})
  const start=Date.now()
  await assert.rejects(client.all('/search/records',{body:{},signal:abort.signal}))
  assert.ok(Date.now()-start<1000)
})
