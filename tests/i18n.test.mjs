import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {locales,loadCatalog,localizeHtml,languagePath} from '../scripts/i18n.mjs';
import {translate} from '../dist/assets/i18n.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const catalog=loadCatalog(path.join(root,'content/ui.json'));
const routes=['about/','links/','studio/','','food-map/','projects/','privacy/','notes/a-quieter-bot/','notes/recovering-a-prototype/','notes/a-map-with-boundaries/'];
test('all locales have complete UI catalogs and preserved format parameters',()=>{for(const code of locales){assert.deepEqual(Object.keys(catalog[code]).sort(),Object.keys(catalog.en).sort());for(const key of Object.keys(catalog.en)){assert.equal(typeof catalog[code][key],'string');assert.deepEqual(catalog[code][key].match(/\{\w+\}/g)||[],key.match(/\{\w+\}/g)||[]);}}});
test('all full pages exist in every language with same-page language navigation',()=>{for(const code of locales)for(const route of routes){const html=read(`dist/${code}/${route}index.html`);assert.match(html,new RegExp(`data-locale="${code}"`));for(const other of locales)assert.ok(html.includes(`href="${languagePath(other,route)}"`));assert.ok(html.includes(`https://frostmoonrui.com/${code}/${route}`));}});

test('language selectors display ZH / EN / RU / JA with native accessible labels and unchanged locale URLs',()=>{
 const labels=[['zh','ZH','中文','zh-CN'],['en','EN','English','en'],['ru','RU','Русский','ru'],['ja','JA','日本語','ja']];
 for(const code of [...locales,null])for(const route of [...routes,'404.html']){
  const leaf=route.endsWith('.html')?route:`${route}index.html`;
  const html=read(`dist/${code?`${code}/`:''}${leaf}`);
  const nav=html.match(/<nav class="language-switch"[^>]*>([\s\S]*?)<\/nav>/);
  assert.ok(nav,`${code??'default'}/${leaf}`);
  const links=[...nav[1].matchAll(/<a\b([^>]*)>([^<]*)<\/a>/g)];
  assert.deepEqual(links.map(link=>link[2]),['ZH','EN','RU','JA']);
  for(const [index,[locale,display,native,language]] of labels.entries()){
   const [,attributes,text]=links[index];
   assert.equal(text,display);
   for(const attribute of [`data-site-language="${locale}"`,`lang="${locale}"`,`hreflang="${language}"`,`href="${languagePath(locale,route)}"`,`aria-label="${native}"`])assert.ok(attributes.includes(attribute),attribute);
   assert.equal(attributes.includes('aria-current="page"'),locale===(code??'en'));
  }
 }
});
test('all locale content translates every full article and preserves original links',()=>{const english=JSON.parse(read('content/pages.json'));for(const code of locales.filter(c=>c!=='en')){const translated=JSON.parse(read(`content/pages.${code}.json`));assert.deepEqual(translated.map(p=>p.path),english.map(p=>p.path));for(let i=0;i<english.length;i++){for(const field of ['title','description','body'])assert.notEqual(translated[i][field],english[i][field]);assert.deepEqual([...translated[i].body.matchAll(/href="([^"]+)"/g)].map(m=>m[1]),[...english[i].body.matchAll(/href="([^"]+)"/g)].map(m=>m[1]));}}});
test('map and theme runtime messages translate in all languages',()=>{for(const code of locales){assert.equal(translate('Places to explore: {count}',{count:7},code),catalog[code]['Places to explore: {count}'].replace('{count}','7'));assert.equal(translate('Source changed {date}',{date:'DATE'},code),catalog[code]['Source changed {date}'].replace('{date}','DATE'));assert.equal(translate('Use dark theme',{},code),catalog[code]['Use dark theme']);}});
test('every literal runtime translation key exists',()=>{for(const file of ['dist/assets/site.js','dist/assets/food-map.js','dist/assets/motion.js','dist/assets/studio.js'])for(const [,key] of read(file).matchAll(/\bt\('([^']+)'/g))assert.ok(Object.hasOwn(catalog.en,key),`${file}: ${key}`);});
test('localized internal links keep their locale but assets and external URLs do not change',()=>{const html=localizeHtml('<html lang="en"><a href="/projects/">Home</a><a href="/assets/moon.svg">icon</a><a href="https://cachetide.top">CacheTide</a><main></main></html>','ru','',catalog);assert.ok(html.includes('href="/ru/projects/"'));assert.ok(html.includes('href="/assets/moon.svg"'));assert.ok(html.includes('href="https://cachetide.top"'));assert.ok(html.includes(catalog.ru.Home));});
test('invalid localized routes fail closed',()=>{assert.throws(()=>languagePath('xx',''));assert.throws(()=>languagePath('zh','../private'));assert.throws(()=>languagePath('zh','/private'));});
test('the exchange JSON link is not rewritten into language-specific missing files',()=>{for(const code of locales){const html=read(`dist/${code}/food-map/index.html`);assert.ok(html.includes('href="/food-map/index.json"'));assert.ok(html.includes('id="map-provider"'));assert.ok(html.includes('value="satellite"'));assert.ok(html.includes('id="map-traffic"'));assert.ok(html.includes('href="/assets/map-tools.css"'));}});
test('all authored static template text has a localization entry',()=>{const names=new Set(['frostmoon','frostmoon-rui','CacheTide','© 2026 frostmoon-rui']);for(const file of ['templates/home.html','templates/food-map.html','templates/404.html','templates/studio.html'])for(const piece of read(file).split(/(<[^>]+>)/g)){if(piece.startsWith('<'))continue;const text=piece.trim();if(/[a-zA-Z]{3}/.test(text)&&!names.has(text))assert.ok(Object.hasOwn(catalog.en,text),`${file}: ${text}`);}});
test('article notebook links return to the localized homepage anchor',()=>{for(const code of locales){const html=read(`dist/${code}/notes/a-quieter-bot/index.html`);assert.ok(html.includes(`href="/${code}/#notes"`));}});
test('pnpm build has a real tracked manifest and locale-aware entry point',()=>{const manifest=JSON.parse(read('package.json'));assert.equal(manifest.scripts.build,'node scripts/build-site.mjs');assert.match(read('scripts/build.mjs'),/import '\.\/build-site\.mjs'/);});
