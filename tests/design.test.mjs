import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {escape} from '../scripts/i18n.mjs';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const site=JSON.parse(read('content/site.json'));
function motionFixture(reduced=false){
 const animations=[],destinations=[],events={},classes=()=>{const set=new Set();return {add:value=>set.add(value),remove:value=>set.delete(value),contains:value=>set.has(value),toggle(value,on){on?set.add(value):set.delete(value);return on;}};};
 const flipper={animate:(frames,timing)=>{animations.push({frames,timing});return {finished:Promise.resolve()};}};
 const link={href:'https://frostmoonrui.com/zh/about/',classList:classes(),querySelector:()=>flipper,addEventListener:(key,handler)=>{events[key]=handler;}};
 const body={dataset:{motion:'true'},classList:classes()};
 const context={t:key=>key,matchMedia:()=>({matches:reduced}),document:{body,documentElement:{classList:classes(),dataset:{}},querySelectorAll:selector=>selector==='.avatar-link'?[link]:[]},window:{location:{assign:url=>destinations.push(url)},addEventListener:(key,handler)=>{events[key]=handler;}},setTimeout:callback=>callback(),navigator:{}};
 vm.runInNewContext(read('dist/assets/motion.js').replace(/^import[^\n]*\n/,''),context);
 return {animations,destinations,events,link,body};
}
const click=overrides=>({button:0,preventDefault(){this.prevented=true;},...overrides});
test('three separate avatar activations flip once each and only the third navigates',async()=>{
 const state=motionFixture();const event=click();await Promise.all([state.events.click(event),state.events.click(click())]);assert.equal(event.prevented,true);assert.equal(state.animations.length,1);assert.equal(state.animations[0].timing.iterations,1);assert.equal(state.animations[0].timing.duration,460);assert.equal(state.destinations.length,0);await state.events.click(click());assert.equal(state.animations.length,2);assert.equal(state.destinations.length,0);await state.events.click(click());assert.equal(state.animations.length,3);assert.equal(state.destinations.length,1);assert.equal(state.destinations[0],state.link.href);
 state.events.pageshow();assert.equal(state.body.classList.contains('page-leaving'),false);await state.events.click(click());assert.equal(state.destinations.length,1);assert.equal(state.animations.length,4);
});
test('reduced motion and owner motion preference keep navigation functional without flips',async()=>{
 for(const state of [motionFixture(true),motionFixture()]){state.body.dataset.motion='false';await state.events.click(click());await state.events.click(click());assert.equal(state.destinations.length,0);await state.events.click(click());assert.equal(state.animations.length,0);assert.equal(state.destinations.length,1);}
});
test('modified clicks keep native link behavior',async()=>{const state=motionFixture();const event=click({ctrlKey:true});await state.events.click(event);assert.equal(event.prevented,undefined);assert.equal(state.animations.length,0);assert.equal(state.destinations.length,0);});
test('every locale has accessible contact icons, localized avatar links, About and an owner entry',()=>{
 for(const code of ['en','zh','ru','ja']){
  const home=read(`dist/${code}/index.html`),about=read(`dist/${code}/about/index.html`),friends=read(`dist/${code}/links/index.html`);
  assert.match(home,new RegExp(`class="avatar-link" href="/${code}/about/"`));assert.ok(home.includes('class="contact-strip"'));assert.ok(home.includes('class="contact-tooltip" role="tooltip"'));
  for(const contact of site.contacts){assert.ok(home.includes(`href="${escape(contact.url)}"`));assert.ok(home.includes(`title="${escape(contact.note[code])}"`));}
  assert.ok(about.includes(`href="/${code}/studio/"`));assert.ok(about.indexOf('class="studio-entry"')>about.indexOf('class="about-credits"'));assert.match(about,/CacheTide/);assert.doesNotMatch(friends,/CacheTide/);assert.ok(friends.includes('data-copy-site'));
 }
});
test('studio is excluded from the public sitemap and previews are isolated',()=>{
 assert.doesNotMatch(read('dist/sitemap.xml'),/studio/);
 for(const code of ['en','zh','ru','ja']){const page=read(`dist/${code}/studio/index.html`);assert.match(page,/name="robots" content="noindex,nofollow"/);assert.match(page,/sandbox=""/);assert.match(page,/id="login-form" method="post" action="\/api\/studio\/login"/);assert.doesNotMatch(page,/name="password"/);}
 assert.match(read('dist/assets/studio.js'),/state\.dirty/);assert.match(read('dist/assets/studio.js'),/beforeunload/);assert.doesNotMatch(read('dist/assets/studio.js'),/localStorage|sessionStorage/);
});
test('studio source commits receive checked generated-file synchronization, never a force push',()=>{const workflow=read('.github/workflows/publish-content.yml');assert.match(workflow,/node --test tests\/\*\.test\.mjs/);assert.match(workflow,/git add -- dist\//);assert.match(workflow,/git push origin HEAD:main/);assert.doesNotMatch(workflow,/--force|force-with-lease/);});
