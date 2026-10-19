import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {handleStudio,createSession,readSession} from '../src/studio.js';
import {handle} from '../src/worker.js';
import {documents,validateDocument,validateSite,validateHtml,publicUrl} from '../shared/site-schema.js';
import {exportFood} from '../scripts/food-export.mjs';
const origin='https://frostmoonrui.com';
const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
const fixture=key=>JSON.parse(read(documents[key]));
const environment=()=>({ADMIN_PASSWORD:'fixture-owner-password-only',ADMIN_SESSION_SECRET:'fixture-session-key-never-used-outside-offline-tests',WEBSITE_GITHUB_TOKEN:'fixture-token-never-live',ADMIN_LOGIN_LIMIT:{limit:async()=>({success:true})}});
const request=(path,method='GET',body,headers={})=>new Request(origin+'/api/studio/'+path,{method,headers:{...(method==='GET'?{}:{Origin:origin,'Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
async function signed(env){const session=await createSession(env,origin);return {Cookie:'__Host-frostmoon_studio='+session.token,'X-Studio-CSRF':session.data.csrf};}
const sha='a'.repeat(40),nextSha='b'.repeat(40),commit='c'.repeat(40);
function documentResponse(key='site'){const text=JSON.stringify(fixture(key));return Response.json({encoding:'base64',content:Buffer.from(text).toString('base64'),sha,size:Buffer.byteLength(text)});}

test('every editable source passes the shared validator and food exporter',()=>{for(const key of Object.keys(documents))assert.equal(validateDocument(key,fixture(key),fixture(key))?.schemaVersion??1,1);assert.ok(exportFood(fixture('food')));});
test('site schema rejects extra private fields, malformed colors and unsafe links',()=>{
 for(const change of [s=>s.apiKey='never-public',s=>s.appearance.accent='red;display:none',s=>s.home.zh.password='private',s=>s.contacts[0].url='javascript:alert(1)',s=>s.contacts.push({...s.contacts[0]})]){const value=fixture('site');change(value);assert.throws(()=>validateSite(value));}
 assert.equal(publicUrl('mailto:ericwang2795@email.com',{mail:true}),'mailto:ericwang2795@email.com');
 for(const value of ['http://example.org','https://user:password@example.org','javascript:alert(1)','//example.org'])assert.throws(()=>publicUrl(value));
});
test('article HTML accepts supported prose and rejects executable markup',()=>{
 assert.equal(validateHtml('<h2>Title</h2><p><strong>Text</strong> <a href="/projects/">Projects</a></p>'),'<h2>Title</h2><p><strong>Text</strong> <a href="/projects/">Projects</a></p>');
 for(const html of ['<script>alert(1)</script>','<p onclick="alert(1)">x</p>','<iframe src="/">','<a href="javascript:alert(1)">x</a>','<a href="&#106;avascript:alert(1)">x</a>','<p style="display:none">x</p>','<a href=unquoted>x</a>','<img src=x onerror=alert(1)>'])assert.throws(()=>validateHtml(html),html);
});
test('edits cannot add page routes, remove locales or inject HTML into translations',()=>{
 const pages=fixture('pages-en'),changed=structuredClone(pages);changed[0].path='../secrets';assert.throws(()=>validateDocument('pages-en',changed,pages));
 const ui=fixture('ui');delete ui.ja;assert.throws(()=>validateDocument('ui',ui,fixture('ui')));
 const unsafe=fixture('ui');unsafe.zh.Home='<script>';assert.throws(()=>validateDocument('ui',unsafe,fixture('ui')));
 const placeholders=fixture('ui');placeholders.zh['Places to explore: {count}']='No placeholder';assert.throws(()=>validateDocument('ui',placeholders,fixture('ui')));
 assert.throws(()=>validateDocument('../../wrangler',{},{}));
});
test('food edits reject fields that would break builds or republish imported data',()=>{
 const venue={name:'Fixture venue',city:'Fixture city',address:'',category:'Food',lng:116.4,lat:39.9};
 for(const change of [{address:42},{category:'line\nbreak'},{articleUrl:null},{rating:6},{source:{jsonUrl:'https://cachetide.top/food-map/index.json'}},{phone:'private'}]){const feed={...fixture('food'),spots:[{...venue,...change}]};assert.throws(()=>validateDocument('food',feed,fixture('food')));}
 const feed={...fixture('food'),spots:[venue]};validateDocument('food',feed,fixture('food'));assert.equal(exportFood(feed).spots.length,1);
});
test('sessions are signed, origin-bound, expiring and invalidated by key/password rotation',async()=>{
 const env=environment(),created=await createSession(env,origin,1000),headers={Cookie:'__Host-frostmoon_studio='+created.token};
 const req=request('document','GET',undefined,headers);assert.equal((await readSession(req,env,1100)).sub,'owner');assert.equal(await readSession(req,env,4600),null);assert.equal(await readSession(req,env,900),null);
 assert.equal(await readSession(req,{...env,ADMIN_PASSWORD:'different-password-value'},1100),null);assert.equal(await readSession(req,{...env,ADMIN_SESSION_SECRET:'another-session-key-with-at-least-thirty-two-characters'},1100),null);
 assert.equal(await readSession(new Request('https://other.example/api/studio/session',{headers}),env,1100),null);
 const [payload,signature]=created.token.split('.');const tampered=payload+'.'+(signature[0]==='A'?'B':'A')+signature.slice(1);assert.equal(await readSession(request('session','GET',undefined,{Cookie:'__Host-frostmoon_studio='+tampered}),env,1100),null);
 assert.equal(await readSession(request('session','GET',undefined,{Cookie:'__Host-frostmoon_studio=malformed'}),env),null);
});
test('anonymous readiness never returns secret values or a session nonce',async()=>{
 const env=environment(),response=await handleStudio(request('session'),env);const data=await response.json();assert.equal(data.configured,true);assert.equal(data.authenticated,false);assert.equal(data.csrf,undefined);for(const value of [env.ADMIN_PASSWORD,env.ADMIN_SESSION_SECRET,env.WEBSITE_GITHUB_TOKEN])assert.ok(!JSON.stringify(data).includes(value));assert.match(response.headers.get('Cache-Control'),/no-store/);
 assert.equal((await (await handleStudio(request('session'),{})).json()).configured,false);
});
test('login enforces HTTPS, same-origin JSON, and native rate protection',async()=>{
 const env=environment();assert.equal((await handleStudio(new Request('http://frostmoonrui.com/api/studio/session'),env)).status,400);
 assert.equal((await handleStudio(request('login','POST',{password:env.ADMIN_PASSWORD},{Origin:'https://evil.example'}),env)).status,403);
 assert.equal((await handleStudio(request('login','POST',{password:env.ADMIN_PASSWORD},{'Content-Type':'text/plain'}),env)).status,403);
 assert.equal((await handleStudio(request('login','POST',{password:env.ADMIN_PASSWORD}),{...env,ADMIN_LOGIN_LIMIT:null})).status,503);
 assert.equal((await handleStudio(request('login','POST',{password:env.ADMIN_PASSWORD}),{...env,ADMIN_LOGIN_LIMIT:{limit:async()=>{throw Error('unavailable');}}})).status,503);
 const limited=await handleStudio(request('login','POST',{password:env.ADMIN_PASSWORD}),{...env,ADMIN_LOGIN_LIMIT:{limit:async()=>({success:false})}});assert.equal(limited.status,429);assert.equal(limited.headers.get('Retry-After'),'60');
});
test('login sets a one-hour secure HTTPOnly cookie; wrong/oversized passwords fail',async()=>{
 const env=environment(),response=await handleStudio(request('login','POST',{password:env.ADMIN_PASSWORD}),env);assert.equal(response.status,200);const cookie=response.headers.get('Set-Cookie');for(const flag of ['__Host-frostmoon_studio=','Path=/','Max-Age=3600','HttpOnly','Secure','SameSite=Strict'])assert.ok(cookie.includes(flag));assert.ok((await response.json()).csrf);
 assert.equal((await handleStudio(request('login','POST',{password:'wrong'}),env)).status,401);assert.equal((await handleStudio(request('login','POST',{password:'x'.repeat(5000)}),env)).status,400);
});
test('anonymous reads and writes are denied before any GitHub request',async()=>{
 let count=0;const remote=async()=>{count++;throw Error('must not fetch');};const env=environment();
 assert.equal((await handleStudio(request('document?key=site'),env,remote)).status,401);assert.equal((await handleStudio(request('document?key=site','PUT',{sha,value:fixture('site')}),env,remote)).status,401);assert.equal(count,0);
});
test('authenticated document reads use the fixed repository and hide authorization',async()=>{
 const env=environment(),auth=await signed(env);let called=false;
 const response=await handleStudio(request('document?key=site','GET',undefined,auth),env,async(url,options)=>{called=true;assert.equal(url,'https://api.github.com/repos/frostmoon-rui/frostmoonrui_website/contents/content/site.json?ref=main');assert.equal(options.headers.Authorization,'Bearer '+env.WEBSITE_GITHUB_TOKEN);assert.equal(options.redirect,'error');return documentResponse();});
 assert.equal(response.status,200);assert.equal((await response.json()).sha,sha);assert.equal(called,true);
});
test('CSRF, path and method protections reject authenticated invalid writes',async()=>{
 const env=environment(),auth=await signed(env),noRemote=async()=>{throw Error('must not fetch');};
 assert.equal((await handleStudio(request('document?key=site','PUT',{sha,value:fixture('site')},{Cookie:auth.Cookie}),env,noRemote)).status,403);
 assert.equal((await handleStudio(request('document?key=../wrangler','GET',undefined,auth),env,noRemote)).status,400);
 assert.equal((await handleStudio(request('document?key=site','DELETE',undefined,auth),env,noRemote)).status,405);
 assert.equal((await handleStudio(request('unknown','GET',undefined,auth),env,noRemote)).status,404);
});
test('optimistic revision checks prevent stale edits from being published',async()=>{
 const env=environment(),auth=await signed(env);let calls=0;const response=await handleStudio(request('document?key=site','PUT',{sha:nextSha,value:fixture('site')},auth),env,async()=>{calls++;return documentResponse();});assert.equal(response.status,409);assert.equal(calls,1);
});
test('publication validates content, uses expected SHA and returns only a safe commit receipt',async()=>{
 const env=environment(),auth=await signed(env),value=fixture('site');value.displayName='Fixture edit';let calls=0;
 const response=await handleStudio(request('document?key=site','PUT',{sha,value},auth),env,async(url,options)=>{calls++;if(!options.method)return documentResponse();assert.equal(url,'https://api.github.com/repos/frostmoon-rui/frostmoonrui_website/contents/content/site.json');const body=JSON.parse(options.body);assert.equal(body.sha,sha);assert.equal(body.branch,'main');assert.equal(body.message,'Studio: update site');assert.deepEqual(JSON.parse(Buffer.from(body.content,'base64').toString('utf8')),value);assert.ok(!options.body.includes(env.WEBSITE_GITHUB_TOKEN));return Response.json({commit:{sha:commit},content:{sha:nextSha}});});
 assert.equal(response.status,200);assert.equal(calls,2);assert.deepEqual(await response.json(),{saved:true,sha:nextSha,commit,url:'https://github.com/frostmoon-rui/frostmoonrui_website/commit/'+commit});
});
test('publication errors keep conflicts explicit and never automatically retry uncertain writes',async()=>{
 const env=environment(),auth=await signed(env),body={sha,value:fixture('site')};
 for(const status of [409,422,403]){let writes=0;const response=await handleStudio(request('document?key=site','PUT',body,auth),env,async(_,options)=>{if(!options.method)return documentResponse();writes++;return new Response('',{status});});assert.equal(response.status,status===403?502:409);assert.equal(writes,1);}
 let writes=0;const uncertain=await handleStudio(request('document?key=site','PUT',body,auth),env,async(_,options)=>{if(!options.method)return documentResponse();writes++;throw Error('network failed');});assert.equal(uncertain.status,502);assert.match((await uncertain.json()).error,/uncertain/);assert.equal(writes,1);
});
test('invalid and oversized drafts cannot reach the GitHub write endpoint',async()=>{
 const env=environment(),auth=await signed(env);let writes=0;const remote=async(_,options)=>{if(options.method)writes++;return documentResponse();};const invalid=fixture('site');invalid.apiKey='not allowed';
 assert.equal((await handleStudio(request('document?key=site','PUT',{sha,value:invalid},auth),env,remote)).status,400);
 assert.equal((await handleStudio(request('document?key=site','PUT',{sha,value:'x'.repeat(300001)},auth),env,remote)).status,400);assert.equal(writes,0);
 assert.equal((await handleStudio(request('document?key=site','PUT',{sha,value:fixture('site')},auth),{...env,WEBSITE_GITHUB_TOKEN:''},remote)).status,503);
});
test('logout clears the secure cookie and studio pages receive non-indexable private headers',async()=>{
 const env=environment(),auth=await signed(env),logout=await handleStudio(request('logout','POST',{},auth),env);assert.equal(logout.status,200);assert.match(logout.headers.get('Set-Cookie'),/Max-Age=0/);
 for(const route of ['/studio/','/zh/studio/']){const response=await handle(new Request(origin+route),{ASSETS:{fetch:async()=>new Response('<html></html>')}});assert.match(response.headers.get('Cache-Control'),/no-store/);assert.match(response.headers.get('X-Robots-Tag'),/noindex/);assert.match(response.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);assert.match(response.headers.get('Content-Security-Policy'),/script-src 'self'/);}
});
