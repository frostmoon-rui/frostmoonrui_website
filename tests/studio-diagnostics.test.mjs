import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnoseRepository,transportCategory} from '../src/studio-repository.js';
import {handleStudio,createSession} from '../src/studio.js';
const origin='https://frostmoonrui.com';
const env={ADMIN_PASSWORD:'offline-owner-password',ADMIN_SESSION_SECRET:'offline-session-secret-with-at-least-32-characters',WEBSITE_GITHUB_TOKEN:'offline-token-never-live'};
test('diagnostics are authenticated and cannot probe arbitrary files or hosts',async()=>{
 let calls=0;const fetcher=async()=>{calls++;return new Response('ok');};
 const anonymous=await handleStudio(new Request(origin+'/api/studio/diagnostics'),env,fetcher);assert.equal(anonymous.status,401);assert.equal(calls,0);
 const session=await createSession(env,origin);const response=await handleStudio(new Request(origin+'/api/studio/diagnostics?key=https://example.org',{headers:{Cookie:'__Host-frostmoon_studio='+session.token}}),env,fetcher);assert.equal(response.status,400);assert.equal(calls,0);
});
test('diagnostics distinguish token rejection from a working public network without mutation',async()=>{
 const calls=[];const report=await diagnoseRepository(env,async(url,options)=>{
  calls.push({url,options});assert.equal(options.method,'GET');assert.equal(options.redirect,'manual');assert.equal(options.body,undefined);
  if(options.headers.Authorization)return new Response('Never reveal this body',{status:401});
  assert.ok(['api.github.com','raw.githubusercontent.com'].includes(new URL(url).hostname));return new Response('ok',{headers:{'X-GitHub-Request-Id':'FIXTURE:123'}});
 });
 assert.deepEqual(report.results.map(r=>r.outcome),['github-token-invalid','reachable','reachable']);assert.equal(report.writeAttempted,false);assert.equal(calls.length,3);assert.equal(calls[2].options.headers.Authorization,undefined);assert.ok(!JSON.stringify(report).includes(env.WEBSITE_GITHUB_TOKEN));
});
test('safe transport categories do not disclose arbitrary exception text or tokens',async()=>{
 const report=await diagnoseRepository(env,async()=>{throw Error('Authorization Bearer '+env.WEBSITE_GITHUB_TOKEN);});
 assert.ok(report.results.every(r=>r.outcome==='transport'));assert.ok(!JSON.stringify(report).includes(env.WEBSITE_GITHUB_TOKEN));
 assert.equal(transportCategory({cause:{code:'ENOTFOUND'}}),'dns');assert.equal(transportCategory({name:'TimeoutError'}),'timeout');assert.equal(transportCategory({message:'Illegal invocation'}),'runtime-binding');
});
test('malformed token diagnostics skip the authenticated fetch and still test public routes',async()=>{
 let calls=0;const report=await diagnoseRepository({...env,WEBSITE_GITHUB_TOKEN:'Bearer wrong-format'},async(_,options)=>{calls++;assert.equal(options.headers.Authorization,undefined);return new Response('ok');});assert.equal(calls,2);assert.equal(report.results[0].outcome,'github-token-format');
});
test('redirects are reported without following or disclosing destination headers',async()=>{
 const report=await diagnoseRepository(env,async()=>new Response(null,{status:301,headers:{Location:'https://untrusted.example/secret'}}));assert.ok(report.results.every(r=>r.outcome==='redirect'));assert.ok(!JSON.stringify(report).includes('untrusted'));
});
