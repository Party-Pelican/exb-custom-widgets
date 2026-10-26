import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {stripTypeScriptTypes} from 'node:module'
const code=stripTypeScriptTypes(await readFile(new URL('../widget/src/runtime/worker-client.ts',import.meta.url),'utf8'))
const {PermitWorker}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))
let instance
globalThis.Worker=class {
  messages=[]; terminated=false
  constructor(){instance=this}
  postMessage(m){this.messages.push(m)}
  terminate(){this.terminated=true}
  receive(m){this.onmessage({data:m})}
}
test('bridge abort routes cancel and ignores stale responses',async()=>{
  const bridge=new PermitWorker('https://city.example/widgets/accela/')
  const abort=new AbortController(), progress=[]
  const pending=bridge.request('search',{},abort.signal,p=>progress.push(p))
  const id=instance.messages[0].id
  instance.receive({id,kind:'progress',progress:{completed:1}})
  assert.equal(progress.length,1)
  abort.abort()
  await assert.rejects(pending,{name:'AbortError'})
  assert.equal(instance.messages.at(-1).action,'cancel')
  instance.receive({id,kind:'result',result:{recordCount:99}})
  const page=bridge.request('page')
  instance.receive({id:instance.messages.at(-1).id,kind:'page',records:[]})
  assert.deepEqual((await page).records,[])
  bridge.destroy()
})
test('bridge worker error rejects pending work and blocks future requests',async()=>{
  const bridge=new PermitWorker('https://city.example/widgets/accela/')
  const a=bridge.request('page'), b=bridge.request('csv')
  const checks=Promise.all([assert.rejects(a,/Content Security Policy/),assert.rejects(b,/Content Security Policy/)])
  instance.onerror({preventDefault(){}})
  await checks
  assert.equal(instance.terminated,true)
  await assert.rejects(bridge.request('search'),/unavailable/)
})
test('teardown terminates worker and rejects pending work',async()=>{
  const bridge=new PermitWorker('https://city.example/widgets/accela/')
  const pending=bridge.request('csv'), check=assert.rejects(pending,{name:'AbortError'})
  bridge.destroy();await check
  assert.equal(instance.terminated,true)
})
