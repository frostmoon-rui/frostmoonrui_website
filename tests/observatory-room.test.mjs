import test from 'node:test';
import assert from 'node:assert/strict';
import {handle,ObservatoryRoom} from '../src/worker.js';

const origin='https://frostmoonrui.com';
const path='/play/astrofall/co-op/socket/relay/crew-01';

test('Observatory WebSocket requests stay on the site and are isolated by mode and room',async ()=>{
 const keys=[];
 const env={OBSERVATORY_ROOMS:{
  idFromName(name){keys.push(name);return name;},
  get(){return {fetch:()=>new Response('connected')};},
 }};
 const upgrade={Upgrade:'websocket',Origin:origin};
 assert.equal((await handle(new Request(origin+path),env)).status,426);
 assert.equal((await handle(new Request(origin+path,{headers:{...upgrade,Origin:'https://example.org'}}),env)).status,403);
 assert.equal((await handle(new Request(origin+path.replace('crew-01','a'),{headers:upgrade}),env)).status,404);
 assert.equal((await handle(new Request(origin+path,{headers:upgrade}),env)).status,200);
 assert.equal((await handle(new Request(origin+path.replace('/relay/','/runner/'),{headers:upgrade}),env)).status,200);
 for(const mode of ['jump','platform']){
  const result=await handle(new Request(origin+path.replace('/relay/','/'+mode+'/'),{headers:upgrade}),env);
  assert.equal(result.status,200);
 }
 assert.deepEqual(keys,['relay/crew-01','runner/crew-01','jump/crew-01','platform/crew-01']);
});

test('a visible driver advances the room with one snapshot per pulse and ignores backed-up recipients',async context=>{
 const snapshots=[];
 const blocked=[];
 const id='player-one';
 const peers=[
  {readyState:1,deserializeAttachment:()=>({id,mode:'runner'}),send:data=>snapshots.push(JSON.parse(data))},
  {readyState:1,bufferedAmount:40000,deserializeAttachment:()=>null,send:data=>blocked.push(data)},
 ];
 let time=1000, initialized;
 context.mock.method(Date,'now',()=>time);
 const room=new ObservatoryRoom({
  getWebSockets:()=>peers,
  blockConcurrencyWhile(callback){initialized=callback();},
  storage:{async get(){return undefined;}},
 });
 await initialized;
 for(let i=0;i<12;i++){
  time+=60;
  await room.webSocketMessage(peers[0],'{"axis":0}');
 }
 assert.equal(snapshots.length,12);
 assert.ok(snapshots[11].players[0].x>170);
 assert.equal(blocked.length,0);
});

test('co-op pages and module requests bypass stale validators',async ()=>{
 for(const route of ['/zh/play/astrofall/co-op/','/play/astrofall/co-op/arena.mjs']){
  const req=new Request(origin+route,{headers:{'If-None-Match':'"old"','If-Modified-Since':'Wed, 25 Nov 2026 00:00:00 GMT'}});
  const response=await handle(req,{ASSETS:{fetch(asset){
   assert.equal(asset.headers.get('If-None-Match'),null);
   assert.equal(asset.headers.get('If-Modified-Since'),null);
   return new Response('current',{headers:{'Cache-Control':'public, max-age=3600'}});
  }}});
  assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.equal(response.headers.get('Cloudflare-CDN-Cache-Control'),'no-store');
 }
});
