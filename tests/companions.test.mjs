import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {validateSite} from '../shared/site-schema.js';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const site=JSON.parse(read('content/site.json'));
function classes(){const set=new Set();return {add:key=>set.add(key),remove:key=>set.delete(key),contains:key=>set.has(key),toggle(key,on){on?set.add(key):set.delete(key);}};}
function fixture({reduced=false,owner=false}={}){
 const events={},timers=[],observers=[],image={hidden:false,complete:true,naturalWidth:80,addEventListener:(key,handler)=>{events['image-'+key]=handler;}},button={classList:classes(),dataset:{companion:'Public fixture'},addEventListener:(key,handler)=>{events[key]=handler;},querySelector:()=>image},status={textContent:''},media={matches:reduced,addEventListener:(_,callback)=>{events.reduced=callback;}};
 const document={body:{dataset:{motion:owner?'false':'true'}},visibilityState:'visible',querySelectorAll:()=>[button],getElementById:()=>status,addEventListener:(key,callback)=>{events[key]=callback;}};
 class IntersectionObserver{constructor(callback){observers.push(callback);}observe(){}}
 class MutationObserver{constructor(callback){events.owner=callback;}observe(){}}
 vm.runInNewContext(read('dist/assets/companions.js').replace(/^import[^\n]*\n/,''),{document,matchMedia:()=>media,t:(key,params)=>key.replace('{name}',params.name),IntersectionObserver,MutationObserver,window:{IntersectionObserver,addEventListener:(key,callback)=>{events[key]=callback;}},setTimeout:(callback,delay)=>{timers.push({callback,delay});return timers.length;},clearTimeout:id=>{timers[id-1].canceled=true;}});
 return {events,timers,observers,image,button,status,media,document};
}
test('all public companions, including CacheTide, render in every language',()=>{
 assert.equal(site.friends.length,16);assert.ok(site.friends.some(friend=>friend.id==='cachetide'));assert.equal(new Set(site.friends.map(friend=>friend.url)).size,16);
 for(const code of ['en','zh','ru','ja']){const html=read(`dist/${code}/links/index.html`);assert.equal((html.match(/data-companion=/g)||[]).length,16);for(const friend of site.friends)assert.ok(html.includes(friend.url));assert.match(html,/role="status" id="companion-status"/);}
 for(const friend of site.friends)if(friend.avatar)assert.ok(fs.existsSync(new URL('../dist'+friend.avatar,import.meta.url)));assert.ok(site.friends.some(friend=>!friend.avatar));
});
test('only fixed local companion images are accepted; old records remain valid',()=>{
 for(const avatar of ['https://untrusted.example/pixel.png','/assets/companions/../secret.png','data:image/png,anything','/assets/companions/payload.svg']){const copy=structuredClone(site);copy.friends[0].avatar=avatar;assert.throws(()=>validateSite(copy));}
 const legacy=structuredClone(site);for(const friend of legacy.friends)delete friend.avatar;assert.equal(validateSite(legacy),legacy);
});
test('a greeting is bounded, ignores repeated taps and never navigates',()=>{
 const s=fixture();s.events.click();s.events.click();assert.equal(s.timers.length,1);assert.equal(s.timers[0].delay,1000);assert.equal(s.button.classList.contains('is-hugging'),true);assert.match(s.status.textContent,/Public fixture/);s.timers[0].callback();assert.equal(s.button.classList.contains('is-hugging'),false);
 assert.doesNotMatch(read('dist/assets/companions.js'),/fetch\(|location|innerHTML/);
});
test('offscreen breathing rests and greeting timers stop when leaving the viewport',()=>{
 const s=fixture();assert.equal(s.button.classList.contains('is-resting'),true);s.observers[0]([{target:s.button,isIntersecting:true}]);assert.equal(s.button.classList.contains('is-resting'),false);s.events.click();s.observers[0]([{target:s.button,isIntersecting:false}]);assert.equal(s.button.classList.contains('is-hugging'),false);assert.equal(s.timers[0].canceled,true);
});
test('failed images expose the shared cat placeholder and reduced motion keeps a textual greeting',()=>{
 const s=fixture({reduced:true});s.events['image-error']();assert.equal(s.image.hidden,true);s.events.click();assert.equal(s.timers.length,0);assert.match(s.status.textContent,/Public fixture/);
 const owner=fixture({owner:true});owner.events.click();assert.equal(owner.timers.length,0);
});
test('every companion has a local blank cat beneath optional real portraits',()=>{
 for(const code of ['en','zh','ru','ja']){const html=read(`dist/${code}/links/index.html`);assert.equal((html.match(/class="companion-placeholder"/g)||[]).length,16);assert.match(html,/companions\/blank-cat\.png/);}
 const png=fs.readFileSync(new URL('../dist/assets/companions/blank-cat.png',import.meta.url));assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png[25],6);
});
test('backgrounding clears greetings and mobile layout remains single-column',()=>{
 const s=fixture();s.events.click();s.document.visibilityState='hidden';s.events.visibilitychange();assert.equal(s.button.classList.contains('is-hugging'),false);const css=read('dist/assets/companions.css');assert.match(css,/grid-template-columns:1fr/);assert.match(css,/prefers-reduced-motion/);assert.match(css,/animation-play-state:paused/);assert.match(css,/theme-reverse::view-transition-old\(root\)\{z-index:2\}/);
});
