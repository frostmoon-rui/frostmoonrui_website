import test from 'node:test';
import assert from 'node:assert/strict';
import {handle} from '../src/worker.js';

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
 assert.deepEqual(keys,['relay/crew-01','runner/crew-01']);
});
