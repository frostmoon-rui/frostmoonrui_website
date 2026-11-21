import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {handle} from '../src/worker.js';

const read=path=>fs.readFileSync(new URL('../dist/'+path,import.meta.url),'utf8');
const data=JSON.parse(fs.readFileSync(new URL('../content/legacy-archive.json',import.meta.url),'utf8'));
const locales=['zh','en','ru','ja'];

test('each localized About has one archive entry and the main navigation omits it',()=>{
 for(const locale of locales){
  assert.equal(read(locale+'/about/index.html').split(`href="/${locale}/legacy/"`).length,2);
  assert.doesNotMatch(read(locale+'/index.html'),/\/legacy\//);
 }
 assert.doesNotMatch(read('sitemap.xml'),/\/legacy\//);
 assert.doesNotMatch(read('data/bot-site.json'),/legacy/);
});

test('all archived talks and remaining archive pages build in each locale with unlisted metadata',()=>{
 for(const locale of locales){
  const prefix=locale+'/legacy/';
  for(const route of ['','talks/','recording/','jump/','platform/']){
   assert.match(read(prefix+route+'index.html'),/name="robots" content="noindex, nofollow"/);
  }
  const directory=read(prefix+'talks/index.html');
  assert.equal(data.talks.length,29);
  for(const {date,bvid,aid,cid} of data.talks){
   const route='talks/'+date+'/';
   assert.ok(directory.includes(prefix+route));
   const page=read(prefix+route+'index.html');
   if(data.audit.unavailableVideos.includes(bvid)){
    assert.match(page,/data-legacy-status="video"/);
    assert.doesNotMatch(page,/<iframe/);
   }else{
    assert.ok(page.includes(`https://player.bilibili.com/player.html?bvid=${bvid}&amp;aid=${aid}&amp;cid=${cid}`));
   }
   assert.ok(page.includes('href="/'+prefix+'talks/"'));
   assert.doesNotMatch(page,/ericwjy|\{\$rthSuffix\}/);
  }
  assert.match(read(prefix+'jump/index.html'),/data-legacy-game="jump"/);
  assert.match(read(prefix+'platform/index.html'),/data-legacy-game="platform"/);
 }
});

test('archive permits Bilibili frames only on recording and talk detail pages',async()=>{
 const env={ASSETS:{fetch:()=>new Response('archive',{headers:{'Content-Type':'text/html','Content-Security-Policy':"default-src 'self'"}})}};
 for(const route of ['/legacy/recording/','/zh/legacy/talks/2022-04-02/']){
  const result=await handle(new Request('https://frostmoonrui.com'+route),env);
  assert.ok(result.headers.get('content-security-policy').endsWith('frame-src https://player.bilibili.com https://www.bilibili.com/blackboard/webplayer/mbplayer.html'));
  assert.equal(result.headers.get('x-robots-tag'),'noindex, nofollow');
 }
 const result=await handle(new Request('https://frostmoonrui.com/ru/legacy/'),env);
 assert.doesNotMatch(result.headers.get('content-security-policy'),/bilibili/);
});

test('archive toolbox only contains verified replacements and retained links',()=>{
 for(const locale of locales){
  const page=read(locale+'/legacy/index.html');
  for(const {url} of data.tools){
   assert.ok(url.startsWith('https://'));
   assert.ok(page.includes(`href="${url.replaceAll('&','&amp;')}"`));
  }
  assert.doesNotMatch(page,/tool\.retiehe\.com|mp\.weixin\.qq\.com|pan\.baidu\.com|wwei\.cn|102429\.htm|legacy-disabled|legacy\/(?:controller|project|recording-2024)\//);
  assert.doesNotMatch(read(locale+'/legacy/talks/index.html'),/seriesdetail/);
  for(const route of ['controller','project','recording-2024']){
   assert.equal(fs.existsSync(new URL(`../dist/${locale}/legacy/${route}/index.html`,import.meta.url)),false);
  }
 }
});
