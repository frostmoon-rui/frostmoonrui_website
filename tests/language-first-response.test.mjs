import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {languagePreference,localizedAsset} from '../src/language-hint.js';
import {handle} from '../src/worker.js';
const origin='https://frostmoonrui.com';
const request=(path='/',headers={})=>new Request(origin+path,{headers});
test('cookie language takes priority over weighted browser languages',()=>{
 assert.equal(languagePreference(request('/',{Cookie:'frostmoon_language=ja','Accept-Language':'zh-CN,en;q=0.8'})),'ja');
 assert.equal(languagePreference(request('/',{'Accept-Language':'fr;q=1,ru-RU;q=0.9,zh;q=0.2'})),'ru');
 assert.equal(languagePreference(request('/',{'Accept-Language':'ja;q=0,en;q=0.8'})),'en');
 assert.equal(languagePreference(request('/',{Cookie:'frostmoon_language=zh-injected','Accept-Language':'en'})),'en');
});
test('only known unprefixed HTML routes use language negotiation',()=>{
 for(const path of ['/','/index.html','/about','/about/','/about/index.html','/studio/'])assert.ok(localizedAsset(request(path)));
 for(const path of ['/zh/','/en/about/','/api/studio/session','/assets/site.js','/data/site.json','/food-map/index.json','/unknown','/sitemap.xml'])assert.equal(localizedAsset(request(path)),null);
});
test('one asset request serves Chinese before any English HTML or redirect',async()=>{
 let calls=0;const env={ASSETS:{fetch:async r=>{calls++;assert.equal(new URL(r.url).pathname,'/zh/');return new Response('<html lang="zh-CN"><body>中文</body></html>',{headers:{'Content-Type':'text/html',ETag:'fixture'}});}}};
 const response=await handle(request('/?source=test',{'Accept-Language':'zh-CN,en;q=0.8'}),env);
 assert.equal(calls,1);assert.equal(response.status,200);assert.equal(response.headers.get('Location'),null);assert.match(await response.text(),/中文/);assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.match(response.headers.get('Vary'),/Accept-Language/);
});
test('explicit language URLs never follow browser language or a conflicting cookie',async()=>{
 const response=await handle(request('/ru/about/',{Cookie:'frostmoon_language=zh'}),{ASSETS:{fetch:async r=>{assert.equal(new URL(r.url).pathname,'/ru/about/');return new Response('Russian');}}});assert.equal(await response.text(),'Russian');
});
test('the browser persists language without late navigation or a second page load',()=>{
 const source=fs.readFileSync(new URL('../dist/assets/site.js',import.meta.url),'utf8');
 assert.doesNotMatch(source,/location\.(?:replace|assign|reload)\(/);assert.match(source,/frostmoon_language=/);assert.match(source,/Max-Age=31536000/);
});
