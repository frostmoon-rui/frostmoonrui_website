import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateDocument} from '../shared/site-schema.js';
import {handle} from '../src/worker.js';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const room=JSON.parse(read('content/about-secret.json'));
test('the unlisted room has complete, neutral placeholders and no public feed export',()=>{
 validateDocument('room',room);
 for(const locale of ['en','zh','ru','ja']){
  const html=read(`dist/${locale}/about-secret/index.html`);
  assert.match(html,/name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex"/);
  assert.match(html,/name="referrer" content="no-referrer"/);
  assert.ok(html.includes(room.entries[locale].title));assert.equal(room.entries[locale].sections.length,0);
  assert.doesNotMatch(html,/undefined|rel="canonical"|rel="alternate"|language-switch|companion-greeting|avatar-link/);
 }
 for(const file of ['dist/sitemap.xml','dist/data/site.json','dist/data/bot-site.json'])assert.doesNotMatch(read(file),/about-secret|A room of my own/);
});
test('no static public HTML link, menu, language switch or metadata enters the unlisted route',()=>{
 function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())walk(file);else if(file.endsWith('.html')){const html=fs.readFileSync(file,'utf8');assert.doesNotMatch(html,/(?:href|src|content)="[^"\s]*about-secret[^"\s]*"/,file);}}}
 walk(fileURLToPath(new URL('../dist',import.meta.url)));
});
test('room responses disable indexing, caching and referrers on all route spellings',async()=>{
 for(const locale of ['',...['zh','en','ru','ja'].map(code=>code+'/')])for(const suffix of ['', '/', '/index.html']){
  for(const method of ['GET','HEAD']){const response=await handle(new Request('https://frostmoonrui.com/'+locale+'about-secret'+suffix,{method}),{ASSETS:{fetch:async()=>new Response(method==='HEAD'?null:'<html>room</html>',{headers:{'Content-Type':'text/html'}})}});
   assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.match(response.headers.get('X-Robots-Tag'),/noindex/);assert.equal(response.headers.get('Referrer-Policy'),'no-referrer');}
 }
});
test('room fields remain text-only, bounded and translated',()=>{
 for(const mutate of [value=>delete value.entries.ja,value=>value.entries.en.extra='not allowed',value=>value.entries.en.sections=[{title:'Title',text:'x'.repeat(12001)}],value=>value.privateKey='not allowed']){const value=structuredClone(room);mutate(value);assert.throws(()=>validateDocument('room',value));}
});
test('public About is substantive, technical and independent of the hidden room',()=>{
 const site=JSON.parse(read('content/site.json'));
 for(const code of ['en','zh','ru','ja']){assert.equal(site.about[code].sections.length,4);const html=read(`dist/${code}/about/index.html`);for(const token of ['about-prologue','about-specialties','about-directions','about-layout','about-credits'])assert.ok(html.includes(token));assert.doesNotMatch(html,/about-secret/i);}
});
