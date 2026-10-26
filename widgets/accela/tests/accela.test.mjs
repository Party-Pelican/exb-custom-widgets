import test from 'node:test'
import assert from 'node:assert/strict'
import { createClient, searchBody, searchParcels, validateSearch, ApiError } from '../widget/src/runtime/accela-core.js'

test('APNs preserve leading zeros and punctuation; duplicates collapse', () => {
  assert.deepEqual(validateSearch({ apns: [' 001-02 ', '001-02'] }).apns, ['001-02'])
  assert.throws(() => validateSearch({ apns: [123] }))
  assert.throws(() => validateSearch({ apns: ['x'], dateFrom: '2026-02-30' }))
  assert.throws(() => validateSearch({ apns: ['x'], dateFrom: '2026-02-02', dateTo: '2026-01-01' }))
  assert.throws(() => validateSearch({ apns: ['x','y'] }, 1))
})
test('filters use documented Accela fields and inclusive dates', () => {
  assert.deepEqual(searchBody('001', { type:'Building/A/B/C', status:'Issued', dateFrom:'2026-01-01', dateTo:'2026-01-31' }),
    { parcel:{parcelNumber:'001'}, type:{value:'Building/A/B/C'}, status:{value:'Issued'}, openedDateFrom:'2026-01-01 00:00:00', openedDateTo:'2026-01-31 23:59:59' })
})
test('all pages are fetched with agency headers and raw token', async () => {
  const calls = []
  const client = createClient({ appId:'app', token:'token', fetchImpl: async (url, options) => {
    calls.push({url,options}); return Response.json({result:[{id:String(calls.length)}],page:{hasmore:calls.length < 2}})
  } })
  assert.equal((await client.all('/search/records',{body:{parcel:{parcelNumber:'001'}}})).length,2)
  assert.match(calls[1].url,/offset=100/)
  assert.equal(calls[0].options.headers['x-accela-environment'],'NONPROD1')
  assert.equal(calls[0].options.headers['x-accela-agency'],'ONT')
  assert.equal(calls[0].options.headers.Authorization,'token')
})
test('authentication and malformed upstream responses fail explicitly', async () => {
  await assert.rejects(createClient({appId:'a',token:'t',fetchImpl:async()=>new Response('',{status:401})}).all('/x'), /401/)
  await assert.rejects(createClient({appId:'a',token:'t',fetchImpl:async()=>Response.json({result:{}})}).all('/x'), /unexpected/)
  await assert.rejects(createClient({}).all('/x'), /App ID/)
})
test('page cap fails parcel rather than returning truncated records', async () => {
  const client = createClient({appId:'a',token:'t',maxPages:1,fetchImpl:async()=>Response.json({result:[{id:'a'}],page:{hasmore:true}})})
  const result = await searchParcels(client,{apns:['001']})
  assert.equal(result.complete,false); assert.equal(result.records.length,0); assert.equal(result.failures[0].apn,'001')
})
test('deduplicates records across parcels, retains successful parcels, bounds concurrency', async () => {
  let active=0, peak=0
  const client={all:async (_path,{body}) => {
    active++; peak=Math.max(peak,active)
    await new Promise(r=>setTimeout(r,5)); active--
    if(body.parcel.parcelNumber==='bad') throw new ApiError('upstream failed')
    return [{id:'stable-id',customId:'BLD-1',status:{value:'Issued'},description:'Example'}]
  }}
  const result=await searchParcels(client,{apns:['001','002','bad','003']},2)
  assert.equal(peak,2); assert.equal(result.records.length,1); assert.equal(result.records[0].apns.length,3)
  assert.equal(result.successfulParcels,3); assert.equal(result.failures[0].apn,'bad'); assert.equal(result.complete,false)
})
test('App ID only uses anonymous headers without an Authorization header', async () => {
  let headers
  const client=createClient({appId:'public-id',fetchImpl:async (_url,options)=>{
    headers=options.headers
    return Response.json({result:[],page:{hasmore:false}})
  }})
  await client.all('/search/records',{body:{parcel:{parcelNumber:'001'}}})
  assert.equal(headers['x-accela-appid'],'public-id')
  assert.equal(headers['x-accela-agency'],'ONT')
  assert.equal('Authorization' in headers,false)
})
test('browser network/CORS failures are explicit and attributed to the parcel', async () => {
  const client=createClient({appId:'a',fetchImpl:async ()=>{throw new TypeError('Failed to fetch')}})
  const result=await searchParcels(client,{apns:['001']})
  assert.equal(result.complete,false)
  assert.match(result.failures[0].message,/CORS/)
})
test('cancelled searches propagate abort instead of producing misleading partial results', async () => {
  const abort=new AbortController(); abort.abort()
  await assert.rejects(searchParcels({all:async()=>[]},{apns:['001']},4,abort.signal))
})
