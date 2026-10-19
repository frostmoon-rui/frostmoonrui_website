import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {handleStudio,createSession} from '../src/studio.js';
const origin='https://frostmoonrui.com';
const value=JSON.parse(fs.readFileSync(new URL('../content/site.json',import.meta.url),'utf8'));
const sha='a'.repeat(40);
const environment=()=>({ADMIN_PASSWORD:'offline-test-owner-password',ADMIN_SESSION_SECRET:'offline-test-session-secret-at-least-32',WEBSITE_GITHUB_TOKEN:'offline-token-not-a-real-secret'});
async function request(env,method='GET',input){const session=await createSession(env,origin);return new Request(origin+'/api/studio/document?key=site',{method,headers:{Cookie:'__Host-frostmoon_studio='+session.token,Origin:origin,'Content-Type':'application/json','X-Studio-CSRF':session.data.csrf},...(input?{body:JSON.stringify(input)}:{})});}
function documentResponse(){return Response.json({encoding:'base64',content:Buffer.from(JSON.stringify(value)).toString('base64'),sha,size:Buffer.byteLength(JSON.stringify(value))});}
for(const upstreamStatus of [401,403,404,429])test(`public read fallback after GitHub ${upstreamStatus} cannot enable publication or leak the token`,async()=>{
 const env=environment();let calls=0;
 const r=await handleStudio(await request(env),env,async(url,options)=>{calls++;assert.ok(url.startsWith('https://api.github.com/repos/frostmoon-rui/frostmoonrui_website/contents/content/'));assert.equal(options.method,undefined);if(calls===1){assert.equal(options.headers.Authorization,'Bearer '+env.WEBSITE_GITHUB_TOKEN);return new Response('Not accessible',{status:upstreamStatus});}assert.equal(options.headers.Authorization,undefined);return documentResponse();});
 assert.equal(r.status,200);const data=await r.json();assert.equal(data.sha,sha);assert.equal(data.access.mode,'public');assert.equal(data.access.canPublish,false);assert.equal(data.access.upstreamStatus,upstreamStatus);assert.equal(calls,2);assert.ok(!JSON.stringify(data).includes(env.WEBSITE_GITHUB_TOKEN));
});
test('read preflight before PUT never falls back or retries a rejected token',async()=>{
 const env=environment();let calls=0;const r=await handleStudio(await request(env,'PUT',{sha,value}),env,async(_,options)=>{calls++;assert.equal(options.method,undefined);return new Response('',{status:401});});assert.equal(r.status,502);const data=await r.json();assert.equal(data.code,'github-token-invalid');assert.equal(data.operation,'read');assert.equal(calls,1);
});
test('primary rate limits remain distinguishable from repository permissions',async()=>{
 const env=environment();const r=await handleStudio(await request(env,'PUT',{sha,value}),env,async()=>new Response('',{status:403,headers:{'X-RateLimit-Remaining':'0'}}));const data=await r.json();assert.equal(data.code,'github-rate-limit');assert.equal(data.upstreamStatus,403);assert.doesNotMatch(data.error,/uncertain/i);
});
test('malformed repository responses and invalid source schemas are separate safe failures',async()=>{
 for(const [response,code] of [[Response.json({encoding:'base64',content:'broken',sha,size:1}),'github-response-invalid'],[Response.json({encoding:'base64',content:Buffer.from('{"schemaVersion":99}').toString('base64'),sha,size:20}),'github-document-invalid']]){const env=environment(),r=await handleStudio(await request(env),env,async()=>response);assert.equal(r.status,502);const data=await r.json();assert.equal(data.code,code);assert.equal(data.operation,'read');}
});
test('network exceptions never echo raw messages or credentials',async()=>{
 const env=environment(),r=await handleStudio(await request(env),env,async()=>{throw Error('Authorization: Bearer '+env.WEBSITE_GITHUB_TOKEN);});const data=await r.json();assert.equal(data.code,'github-network');assert.equal(data.operation,'read');assert.ok(!JSON.stringify(data).includes(env.WEBSITE_GITHUB_TOKEN));
});
test('trimmed tokens are used for authenticated reads and no-token mode is preview only',async()=>{
 for(const token of ['  offline-token  ','   ']){const env={...environment(),WEBSITE_GITHUB_TOKEN:token};const r=await handleStudio(await request(env),env,async(_,options)=>{assert.equal(options.headers.Authorization,token.trim()?'Bearer '+token.trim():undefined);return documentResponse();});const data=await r.json();assert.equal(data.access.canPublish,!!token.trim());}
});
