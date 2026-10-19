import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {readRepository,blobSha} from '../src/studio-repository.js';
import {documents} from '../shared/site-schema.js';
import {handle} from '../src/worker.js';
import {handleStudio,createSession} from '../src/studio.js';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url));
const content=read('content/site.json'),value=JSON.parse(content),sha='a'.repeat(40);
const env=()=>({ADMIN_PASSWORD:'fixture-only-owner-password',ADMIN_SESSION_SECRET:'fixture-only-session-secret-with-32-characters',WEBSITE_GITHUB_TOKEN:'fixture-only-token'});
const documentResponse=()=>Response.json({encoding:'base64',content:content.toString('base64'),size:content.length,sha});
const unavailable=async()=>{throw new TypeError('offline fixture');};
test('transient read transport errors receive one bounded retry and no write',async()=>{
 let calls=0;const result=await readRepository('site',env(),async(url,options)=>{calls++;assert.equal(options.method,'GET');assert.equal(options.redirect,'manual');assert.equal(new URL(url).hostname,'api.github.com');if(calls===1)throw Error('offline');return documentResponse();},{fallback:true});
 assert.equal(calls,2);assert.equal(result.access.attempts,2);assert.equal(result.access.canPublish,true);
});
test('a temporary upstream 503 is retried once, not indefinitely',async()=>{
 let calls=0;const result=await readRepository('site',env(),async()=>++calls===1?new Response('',{status:503}):documentResponse(),{fallback:true});assert.equal(calls,2);assert.equal(result.access.canPublish,true);
});
test('raw fallback pins the repository, omits credentials and computes a Git blob revision',async()=>{
 let calls=0;const configuration=env();const result=await readRepository('site',configuration,async(url,options)=>{calls++;if(new URL(url).hostname==='api.github.com')throw Error('offline');assert.equal(url,'https://raw.githubusercontent.com/frostmoon-rui/frostmoonrui_website/main/content/site.json');assert.equal(options.headers.Authorization,undefined);assert.equal(options.redirect,'manual');return new Response(content);},{fallback:true});
 assert.equal(calls,3);assert.equal(result.access.mode,'raw');assert.equal(result.access.canPublish,false);assert.equal(result.sha,createHash('sha1').update('blob '+content.length+'\0').update(content).digest('hex'));assert.ok(!JSON.stringify(result).includes(configuration.WEBSITE_GITHUB_TOKEN));
});
test('all external read failures fall back to the actual deployed source without enabling publication',async()=>{
 let network=0,assets=0;const configuration={...env(),ASSETS:{fetch:async request=>{assets++;assert.equal(new URL(request.url).pathname,'/__studio/site.json');assert.equal(request.headers.get('Authorization'),null);return new Response(content);}}};
 const result=await readRepository('site',configuration,async()=>{network++;throw Error('offline');},{fallback:true});assert.equal(network,3);assert.equal(assets,1);assert.equal(result.access.mode,'deployed');assert.equal(result.access.canPublish,false);assert.deepEqual(result.value,value);
});
test('strict verification and PUT preflights never retry or use public/deployed fallback',async()=>{
 let calls=0,assets=0;const configuration={...env(),ASSETS:{fetch:async()=>{assets++;return new Response(content);}}};
 await assert.rejects(readRepository('site',configuration,async()=>{calls++;throw Error('offline');}),error=>error.code==='github-network');assert.equal(calls,1);assert.equal(assets,0);
 const session=await createSession(configuration,'https://frostmoonrui.com');const request=new Request('https://frostmoonrui.com/api/studio/document?key=site&strict=1',{headers:{Cookie:'__Host-frostmoon_studio='+session.token}});
 const response=await handleStudio(request,configuration,unavailable);assert.equal(response.status,502);assert.equal((await response.json()).operation,'read');assert.equal(assets,0);
});
test('timeout names and unsafe token headers are classified without echoing credentials',async()=>{
 const configuration=env();await assert.rejects(readRepository('site',configuration,async()=>{throw Object.assign(Error('do not echo'),{name:'TimeoutError'});}),error=>error.code==='github-timeout');
 for(const token of ['Bearer fixture-value','fixture\nvalue','"fixture-value"']){let calls=0;await assert.rejects(readRepository('site',{...configuration,WEBSITE_GITHUB_TOKEN:token},async()=>{calls++;return documentResponse();}),error=>error.code==='github-token-format'&&!error.message.includes(token));assert.equal(calls,0);}
});
test('malformed authoritative sources do not silently fall back to old deployed data',async()=>{
 let calls=0;await assert.rejects(readRepository('site',{...env(),ASSETS:{fetch:async()=>{throw Error('must not run');}}},async()=>{calls++;return Response.json({encoding:'base64',sha,size:2,content:'e30='});},{fallback:true}),error=>error.code==='github-document-invalid');assert.equal(calls,1);
});
test('invalid or oversized public fallback content cannot become editable data',async()=>{
 for(const body of ['{"schemaVersion":99}', 'x'.repeat(300001)])await assert.rejects(readRepository('site',env(),async url=>new URL(url).hostname==='api.github.com'?Promise.reject(Error('offline')):new Response(body),{fallback:true}),error=>error.code==='github-network');
});
test('snapshot sources are byte-identical to reviewed source files, never runtime data',()=>{
 for(const [key,file] of Object.entries(documents))assert.deepEqual(read('dist/__studio/'+key+'.json'),read(file));
 const names=fs.readdirSync(new URL('../dist/__studio/',import.meta.url));assert.deepEqual(names.sort(),Object.keys(documents).map(key=>key+'.json').sort());
});
test('direct and encoded snapshot paths are refused before asset or external requests',async()=>{
 for(const path of ['/__studio/site.json','/%5f%5fstudio/site.json','/__studio%2froom.json','/%255f%255fstudio/site.json'])for(const method of ['GET','HEAD']){
  const response=await handle(new Request('https://frostmoonrui.com'+path,{method}),{ASSETS:{fetch:async()=>{throw Error('must not reach assets');}}},async()=>{throw Error('must not reach network');});assert.equal(response.status,404);assert.equal(response.headers.get('Cache-Control'),'no-store');
 }
});
test('anonymous users cannot obtain internal snapshots through the document API',async()=>{
 const response=await handleStudio(new Request('https://frostmoonrui.com/api/studio/document?key=room'),{...env(),ASSETS:{fetch:async()=>{throw Error('must not reach assets');}}},unavailable);assert.equal(response.status,401);
});
test('after falling back, authenticated snapshot browsing does not repeatedly call unavailable GitHub',async()=>{
 const configuration={...env(),ASSETS:{fetch:async()=>new Response(content)}};const session=await createSession(configuration,'https://frostmoonrui.com');let external=0;
 const response=await handleStudio(new Request('https://frostmoonrui.com/api/studio/document?key=site&source=deployed',{headers:{Cookie:'__Host-frostmoon_studio='+session.token}}),configuration,async()=>{external++;throw Error('must not reach network');});
 assert.equal(response.status,200);const data=await response.json();assert.equal(data.access.mode,'deployed');assert.equal(data.access.attempts,0);assert.equal(data.access.canPublish,false);assert.equal(external,0);
});
test('Git blob revision preserves UTF-8 bytes, not character counts',async()=>{
 const bytes=new TextEncoder().encode('Unicode: \u2603\n');assert.equal(await blobSha(bytes),createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'));
});
test('upstream write timeouts and 5xx results are uncertain and never retried',async()=>{
 for(const status of [408,500,503]){const configuration=env(),session=await createSession(configuration,'https://frostmoonrui.com');let writes=0;
  const request=new Request('https://frostmoonrui.com/api/studio/document?key=site',{method:'PUT',headers:{Origin:'https://frostmoonrui.com','Content-Type':'application/json',Cookie:'__Host-frostmoon_studio='+session.token,'X-Studio-CSRF':session.data.csrf},body:JSON.stringify({sha,value})});
  const response=await handleStudio(request,configuration,async(_,options)=>{if(options.method==='PUT'){writes++;return new Response('',{status});}return documentResponse();});
  assert.equal(response.status,502);assert.equal((await response.json()).code,'github-write-uncertain');assert.equal(writes,1);
 }
});
