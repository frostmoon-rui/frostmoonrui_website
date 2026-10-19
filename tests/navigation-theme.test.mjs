import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
function classes(){const values=new Set();return {add:(...items)=>items.forEach(item=>values.add(item)),remove:(...items)=>items.forEach(item=>values.delete(item)),contains:item=>values.has(item),toggle(item,on){const active=on??!values.has(item);active?values.add(item):values.delete(item);return active;}};}
function element(){return {attributes:{},events:{},hidden:false,disabled:false,classList:classes(),setAttribute(key,value){this.attributes[key]=value;},removeAttribute(key){delete this.attributes[key];},addEventListener(key,handler){this.events[key]=handler;},getClientRects:()=>[{}],getBoundingClientRect:()=>({left:100,top:80,width:30,height:30})};}
function navigationFixture(isMobile=true){
 const sidebar=element(),trigger=element(),scrim=element(),close=element(),link=element(),media={matches:isMobile,addEventListener:(_,handler)=>{media.change=handler;}},events={};
 scrim.hidden=true;const document={body:{classList:classes()},documentElement:{classList:classes()},getElementById:()=>sidebar,querySelector:selector=>selector==='.menu-toggle'?trigger:scrim,addEventListener:(key,handler)=>{events[key]=handler;}};
 for(const target of [trigger,close,link])target.focus=()=>{document.activeElement=target;};
 sidebar.querySelector=()=>close;sidebar.querySelectorAll=()=>[close,link];
 vm.runInNewContext(read('dist/assets/navigation.js'),{document,matchMedia:()=>media,setTimeout:callback=>callback(),window:{addEventListener:(key,handler)=>{events[key]=handler;}}});
 return {sidebar,trigger,scrim,close,link,media,events,document};
}
test('mobile navigation opens as a focus-managed drawer and closes with Escape or scrim',()=>{
 const s=navigationFixture();assert.equal(s.sidebar.inert,true);s.trigger.events.click();assert.equal(s.trigger.attributes['aria-expanded'],'true');assert.equal(s.sidebar.inert,false);assert.equal(s.sidebar.attributes['aria-modal'],'true');assert.equal(s.document.activeElement,s.close);assert.equal(s.scrim.hidden,false);
 s.events.keydown({key:'Escape',preventDefault(){}});assert.equal(s.trigger.attributes['aria-expanded'],'false');assert.equal(s.sidebar.inert,true);assert.equal(s.document.activeElement,s.trigger);assert.equal(s.scrim.hidden,true);
 s.trigger.events.click();s.scrim.events.click();assert.equal(s.document.body.classList.contains('nav-open'),false);
});
test('mobile keyboard focus loops inside the drawer',()=>{
 const s=navigationFixture();s.trigger.events.click();s.document.activeElement=s.link;s.events.keydown({key:'Tab',preventDefault(){}});assert.equal(s.document.activeElement,s.close);s.events.keydown({key:'Tab',shiftKey:true,preventDefault(){}});assert.equal(s.document.activeElement,s.link);
});
test('ordinary menu links close the drawer but avatar flips stay visible',()=>{
 const s=navigationFixture();s.trigger.events.click();s.sidebar.events.click({target:{closest:selector=>selector==='a'||selector==='.avatar-link'}});assert.equal(s.trigger.attributes['aria-expanded'],'true');s.sidebar.events.click({target:{closest:selector=>selector==='a'}});assert.equal(s.trigger.attributes['aria-expanded'],'false');
});
test('desktop sidebar stays accessible across responsive breakpoint changes',()=>{
 const s=navigationFixture(false);assert.equal(s.sidebar.inert,false);s.trigger.events.click();assert.equal(s.trigger.attributes['aria-expanded'],'false');s.media.matches=true;s.media.change();assert.equal(s.sidebar.inert,true);s.media.matches=false;s.media.change();assert.equal(s.sidebar.inert,false);assert.equal(s.sidebar.attributes['aria-hidden'],'false');
});
function themeFixture({reduced=false,transitions=true,storageFails=false}={}){
 const buttons=[element(),element()],animations=[],storage=new Map(),body={dataset:{motion:'true'},classList:classes()},root={classList:classes(),animate:(frames,options)=>{animations.push({frames,options});return {finished:Promise.resolve()};}},document={body,documentElement:root,querySelectorAll:()=>buttons};let transitionsStarted=0;
 if(transitions)document.startViewTransition=callback=>{transitionsStarted++;callback();return {ready:Promise.resolve(),finished:Promise.resolve()};};
 vm.runInNewContext(read('dist/assets/theme.js').replace(/^import[^\n]*\n/,''),{document,matchMedia:()=>({matches:reduced}),localStorage:{getItem:key=>{if(storageFails)throw Error('blocked');return storage.get(key);},setItem:(key,value)=>{if(storageFails)throw Error('blocked');storage.set(key,value);}},innerWidth:1000,innerHeight:800,setTimeout:callback=>callback(),t:key=>key});
 return {buttons,animations,storage,body,root,count:()=>transitionsStarted};
}
test('theme switching uses a circular transition and synchronizes all theme buttons',async()=>{
 const s=themeFixture();await Promise.all([s.buttons[0].events.click({clientX:120,clientY:95}),s.buttons[1].events.click({})]);assert.equal(s.count(),1);assert.equal(s.body.classList.contains('dark'),true);assert.equal(s.storage.get('frostmoon-theme'),'dark');assert.equal(s.animations[0].options.duration,550);assert.equal(s.animations[0].options.pseudoElement,'::view-transition-new(root)');assert.ok(s.animations[0].frames.clipPath[0].includes('120px 95px'));for(const button of s.buttons){assert.equal(button.attributes['aria-label'],'Use light theme');assert.equal(button.disabled,false);}assert.equal(s.root.classList.contains('theme-transition'),false);
});
test('theme changes respect reduced motion and owner preferences',async()=>{
 for(const options of [{reduced:true},{}]){const s=themeFixture(options);if(!options.reduced)s.body.dataset.motion='false';await s.buttons[0].events.click({});assert.equal(s.count(),0);assert.equal(s.animations.length,0);assert.equal(s.body.classList.contains('dark'),true);}
});
test('theme switching still works without view transitions or local storage',async()=>{
 for(const options of [{transitions:false},{transitions:false,storageFails:true}]){const s=themeFixture(options);await s.buttons[0].events.click({});assert.equal(s.body.classList.contains('dark'),true);assert.equal(s.root.classList.contains('theme-fade'),false);}
});
test('mobile menu is present on every locale homepage, atlas, About and studio',()=>{
 for(const locale of ['zh','en','ru','ja'])for(const route of ['','food-map/','about/','studio/']){const html=read(`dist/${locale}/${route}index.html`);assert.equal((html.match(/id="site-sidebar"/g)||[]).length,1);assert.match(html,/class="menu-toggle"/);assert.match(html,/aria-controls="site-sidebar"/);assert.match(html,/class="mobile-theme"|class="theme-button mobile-theme"/);}
 assert.match(read('dist/assets/mobile.css'),/flex-direction:column/);assert.match(read('dist/assets/mobile.css'),/prefers-reduced-motion/);
});
