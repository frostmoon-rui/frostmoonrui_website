import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
function classes(){const items=new Set();return {add:(...values)=>values.forEach(value=>items.add(value)),remove:(...values)=>values.forEach(value=>items.delete(value)),contains:value=>items.has(value),toggle(value,on){on?items.add(value):items.delete(value);return on;}};}
function fixture({reduced=false,observerFails=false}={}){
 const observers=[],events={},destinations=[],timers=[],cards=Array.from({length:6},()=>({classList:classes(),styles:{},style:{setProperty(key,value){this.owner.styles[key]=value;}}}));for(const card of cards)card.style.owner=card;
 const media={matches:reduced,addEventListener:(_,callback)=>{media.change=callback;}},hero={},root={classList:classes(),dataset:{}},body={classList:classes(),dataset:{motion:'true'}};
 let cancelCount=0,rejectFlip;
 const animation={finished:new Promise((_,reject)=>{rejectFlip=reject;}),cancel(){cancelCount++;rejectFlip(Error('cancelled'));}};
 const avatar={href:'https://frostmoonrui.com/zh/about/',classList:classes(),querySelector:()=>({animate:()=>animation}),addEventListener:(key,callback)=>{events['avatar-'+key]=callback;}};
 const document={body,documentElement:root,visibilityState:'visible',addEventListener:(key,callback)=>{events[key]=callback;},querySelector:()=>hero,querySelectorAll:selector=>selector==='.avatar-link'?[avatar]:selector==='.is-flipping'?[avatar]:selector==='[data-copy-site]'?[]:cards};
 class IntersectionObserver{constructor(callback){this.callback=callback;this.targets=[];observers.push(this);}observe(node){if(observerFails)throw Error('fixture observer unavailable');this.targets.push(node);}unobserve(node){this.targets=this.targets.filter(value=>value!==node);}disconnect(){this.disconnected=true;}}
 class MutationObserver{constructor(callback){events.preference=callback;}observe(){}}
 vm.runInNewContext(read('dist/assets/motion.js').replace(/^import[^\n]*\n/,''),{t:key=>key,document,matchMedia:()=>media,IntersectionObserver,MutationObserver,window:{IntersectionObserver,MutationObserver,location:{assign:url=>destinations.push(url)},addEventListener:(key,callback)=>{events[key]=callback;}},setTimeout:(callback,delay)=>{timers.push({callback,delay});return timers.length;},navigator:{}});
 return {observers,events,destinations,timers,cards,media,root,body,document,avatar,cancels:()=>cancelCount};
}
test('scroll reveal has bounded stagger and only settles observed content once',()=>{
 const s=fixture();assert.equal(s.root.classList.contains('motion-ready'),true);assert.deepEqual(s.cards.map(card=>card.styles['--reveal-delay']),['0ms','55ms','110ms','165ms','0ms','55ms']);
 s.observers[0].callback([{target:s.cards[1],isIntersecting:true}]);assert.equal(s.cards[1].classList.contains('is-revealed'),true);assert.ok(!s.observers[0].targets.includes(s.cards[1]));s.timers.find(timer=>timer.delay===850).callback();assert.equal(s.cards[1].classList.contains('motion-settled'),true);
});
test('late reduced-motion or owner preferences expose all content and disable root transitions',()=>{
 for(const owner of [false,true]){const s=fixture();if(owner){s.body.dataset.motion='false';s.events.preference();}else{s.media.matches=true;s.media.change();}assert.equal(s.root.dataset.motion,'false');assert.equal(s.observers[0].disconnected,true);for(const card of s.cards)assert.equal(card.classList.contains('is-revealed'),true);}
});
test('observer failures cannot leave content hidden',()=>{const s=fixture({observerFails:true});assert.equal(s.root.classList.contains('motion-ready'),false);for(const card of s.cards)assert.equal(card.classList.contains('is-revealed'),true);});
test('hero animation pauses outside the viewport and while the page is hidden',()=>{
 const s=fixture();s.observers[1].callback([{isIntersecting:false}]);assert.equal(s.body.classList.contains('hero-at-rest'),true);s.observers[1].callback([{isIntersecting:true}]);assert.equal(s.body.classList.contains('hero-at-rest'),false);
 s.document.visibilityState='hidden';s.events.visibilitychange();assert.equal(s.body.classList.contains('motion-paused'),true);s.document.visibilityState='visible';s.events.visibilitychange();assert.equal(s.body.classList.contains('motion-paused'),false);
});
test('canceling an avatar flip preserves click count without navigating early',async()=>{
 const s=fixture();const event=()=>({button:0,preventDefault(){}});const pending=s.events['avatar-click'](event());s.media.matches=true;s.media.change();await pending;assert.equal(s.cancels(),1);assert.equal(s.destinations.length,0);await s.events['avatar-click'](event());assert.equal(s.destinations.length,0);await s.events['avatar-click'](event());assert.equal(s.destinations.length,1);assert.equal(s.destinations[0],s.avatar.href.replace('/about/','/about-secret/'));
});
test('restoring a cached page removes exit/flip residue',()=>{const s=fixture();s.body.classList.add('page-leaving');s.avatar.classList.add('is-flipping');s.events.pageshow();assert.equal(s.body.classList.contains('page-leaving'),false);assert.equal(s.avatar.classList.contains('is-flipping'),false);});
test('motion is shared across pages and does not intercept studio navigation or form submission',()=>{
 const css=read('dist/assets/transitions.css');for(const selector of ['.article-layout','.atlas-intro','.studio-intro','.login-card','.atlas-pin','.studio-help','aria-busy=true'])assert.ok(css.includes(selector));assert.match(css,/prefers-reduced-motion/);assert.match(css,/pointer:fine/);
 assert.doesNotMatch(read('dist/assets/motion.js'),/addEventListener\('submit'|querySelectorAll\('a\[href\]/);
 for(const locale of ['zh','en','ru','ja'])for(const route of ['','about/','food-map/','studio/'])assert.ok(read(`dist/${locale}/${route}index.html`).includes('/assets/transitions.css'));
});
