import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {handleStudio,createSession} from '../src/studio.js';
import {handle} from '../src/worker.js';
const origin='https://frostmoonrui.com';
const env={ADMIN_PASSWORD:'offline-owner-password',ADMIN_SESSION_SECRET:'offline-session-secret-at-least-32-characters',WEBSITE_GITHUB_TOKEN:'offline-only-token'};
const value=JSON.parse(fs.readFileSync(new URL('../content/site.json',import.meta.url),'utf8')),text=JSON.stringify(value),sha='a'.repeat(40);
const document=()=>Response.json({encoding:'base64',content:Buffer.from(text).toString('base64'),size:Buffer.byteLength(text),sha});
async function signed(path,method='GET',body){const session=await createSession(env,origin);return new Request(origin+'/api/studio/'+path,{method,headers:{Cookie:'__Host-frostmoon_studio='+session.token,Origin:origin,'Content-Type':'application/json','X-Studio-CSRF':session.data.csrf},...(body?{body:JSON.stringify(body)}:{})});}
function workersFetch(callback){return (url,options)=>{if(options.redirect==='error')throw new TypeError('Unsupported redirect mode');assert.equal(options.redirect,'manual');return callback(url,options);};}
test('Workers-compatible strict verification reads the validated authenticated document',async()=>{
 let calls=0;const response=await handleStudio(await signed('document?key=site&strict=1'),env,workersFetch(async(_,options)=>{calls++;assert.equal(options.method,'GET');assert.equal(options.headers.Authorization,'Bearer '+env.WEBSITE_GITHUB_TOKEN);return document();}));
 assert.equal(response.status,200);const data=await response.json();assert.equal(data.access.mode,'authenticated');assert.equal(data.access.canPublish,true);assert.deepEqual(data.value,value);assert.equal(calls,1);
});
test('Workers-compatible publication performs one preflight and one PUT without retries',async()=>{
 const methods=[];const response=await handleStudio(await signed('document?key=site','PUT',{sha,value}),env,workersFetch(async(_,options)=>{methods.push(options.method);return options.method==='GET'?document():Response.json({content:{sha:'b'.repeat(40)},commit:{sha:'c'.repeat(40)}});}));
 assert.equal(response.status,200);assert.equal((await response.json()).saved,true);assert.deepEqual(methods,['GET','PUT']);
});
test('read redirects never forward credentials or turn into an authenticated success',async()=>{
 let calls=0;const response=await handleStudio(await signed('document?key=site&strict=1'),env,workersFetch(async()=>{calls++;return new Response(null,{status:302,headers:{Location:'https://untrusted.example/'}});}));
 assert.equal(response.status,502);const data=await response.json();assert.equal(data.upstreamStatus,302);assert.equal(data.operation,'read');assert.equal(calls,1);assert.ok(!JSON.stringify(data).includes('untrusted'));
});
test('publication redirects are refused without following or retrying the PUT',async()=>{
 const methods=[];const response=await handleStudio(await signed('document?key=site','PUT',{sha,value}),env,workersFetch(async(_,options)=>{methods.push(options.method);return options.method==='GET'?document():new Response(null,{status:307,headers:{Location:'https://untrusted.example/'}});}));
 assert.equal(response.status,502);const data=await response.json();assert.equal(data.code,'github-publish-rejected');assert.equal(data.upstreamStatus,307);assert.deepEqual(methods,['GET','PUT']);assert.ok(!JSON.stringify(data).includes('untrusted'));
});
test('Amap shares the Workers-compatible policy and refuses upstream redirects',async()=>{
 for(const status of [200,302]){let calls=0;const response=await handle(new Request(origin+'/_AMapService/v3/place/text',{headers:{Origin:origin}}),{AMAP_JS_KEY:'offline-browser-key',AMAP_SECURITY_CODE:'offline-security-code'},workersFetch(async()=>{calls++;return new Response('{}',{status,headers:{Location:'https://untrusted.example/'}});}));assert.equal(response.status,status===200?200:502);assert.equal(response.headers.get('Location'),null);assert.equal(calls,1);}
});
