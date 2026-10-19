import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
function fixture({reduced=false,owner=false}={}){
 const events={},animations=[],media={matches:reduced,addEventListener:(_,callback)=>{events.reduced=callback;}};let canceled=0;
 const intro={animate:(frames,options)=>{animations.push({frames,options});return {finished:Promise.resolve(),cancel(){canceled++;}};}};
 const document={body:{dataset:{motion:owner?'false':'true'}},visibilityState:'visible',querySelector:()=>intro,addEventListener:(key,callback)=>{events[key]=callback;}};
 class MutationObserver{constructor(callback){events.owner=callback;}observe(){}}
 vm.runInNewContext(read('dist/assets/entry.js'),{document,MutationObserver,matchMedia:()=>media,window:{addEventListener:(key,callback)=>{events[key]=callback;}}});
 return {events,animations,media,document,canceled:()=>canceled};
}
test('every localized page has one decorative self-dismissing opening',()=>{
 for(const code of ['en','zh','ru','ja'])for(const route of ['','about/','links/','projects/','food-map/','studio/','privacy/','notes/a-quieter-bot/','notes/recovering-a-prototype/','notes/a-map-with-boundaries/','404.html']){
  const html=read(`dist/${code}/${route.endsWith('.html')?route:route+'index.html'}`);assert.equal((html.match(/class="page-intro"/g)||[]).length,1);assert.match(html,/class="page-intro" aria-hidden="true"/);assert.match(html,/\/assets\/entry\.css/);
 }
 const css=read('dist/assets/entry.css');assert.match(css,/animation:intro-dismiss 960ms/);assert.match(css,/pointer-events:none/);assert.match(css,/visibility:hidden/);assert.match(css,/prefers-reduced-motion/);assert.match(css,/body\[data-motion=false\] \.page-intro\{display:none/);
});
test('normal entry relies on CSS and cached return replays the same fixed opening',()=>{const s=fixture();s.events.pageshow({persisted:false});assert.equal(s.animations.length,0);s.events.pageshow({persisted:true});assert.equal(s.animations[0].options.duration,960);assert.equal(s.animations[0].frames.at(-1).visibility,'hidden');});
test('cached return skips motion for either accessibility or owner preference',()=>{for(const options of [{reduced:true},{owner:true}]){const s=fixture(options);s.events.pageshow({persisted:true});assert.equal(s.animations.length,0);}});
test('cached animation can be canceled when preferences or visibility change',()=>{for(const kind of ['reduced','owner','visibilitychange']){const s=fixture();s.events.pageshow({persisted:true});if(kind==='reduced'){s.media.matches=true;s.events.reduced();}else if(kind==='owner'){s.document.body.dataset.motion='false';s.events.owner();}else{s.document.visibilityState='hidden';s.events.visibilitychange();}assert.equal(s.canceled(),1);}});
test('entry does not intercept navigation, forms or create simulated progress',()=>{const source=read('dist/assets/entry.js');assert.doesNotMatch(source,/preventDefault|fetch\(|localStorage|sessionStorage|addEventListener\('click'|addEventListener\('submit'/);assert.doesNotMatch(read('dist/assets/entry.css'),/width:100vw|white-space:nowrap/);});
