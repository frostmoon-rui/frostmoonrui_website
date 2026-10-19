import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=file=>fs.readFileSync(new URL('../dist/assets/'+file,import.meta.url),'utf8');
function classes(){const values=new Set();return {add:(...keys)=>keys.forEach(key=>values.add(key)),remove:(...keys)=>keys.forEach(key=>values.delete(key)),contains:key=>values.has(key),toggle(key,on){on?values.add(key):values.delete(key);}};}
function element(){return {events:{},attributes:{},classList:classes(),setAttribute(key,value){this.attributes[key]=value;},removeAttribute(key){delete this.attributes[key];},addEventListener(key,handler){this.events[key]=handler;},focus(){},getBoundingClientRect:()=>({left:10,top:10,width:30,height:30})};}
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}

test('stale drawer close timers cannot hide a reopened or newly closing scrim',()=>{
 const sidebar=element(),trigger=element(),scrim=element(),close=element(),timers=[];
 sidebar.querySelector=()=>close;
 const document={body:{classList:classes()},documentElement:{classList:classes()},getElementById:()=>sidebar,querySelector:key=>key==='.menu-toggle'?trigger:scrim,addEventListener(){}};
 vm.runInNewContext(read('navigation.js'),{document,matchMedia:()=>({matches:true,addEventListener(){}}),setTimeout:callback=>timers.push(callback),window:{addEventListener(){}}});
 trigger.events.click();close.events.click();trigger.events.click();close.events.click();
 timers[0]();timers[1]();assert.equal(scrim.hidden,false);
 timers[2]();assert.equal(scrim.hidden,true);
 trigger.events.click();assert.equal(scrim.hidden,false);assert.equal(sidebar.inert,false);
});

function themeFixture(){
 const button=element(),events={},ready=deferred(),animation=deferred(),media={matches:false,addEventListener:(_,callback)=>{events.preference=callback;}},storage=new Map();
 let skipped=0,canceled=0,animated=0;
 const body={dataset:{motion:'true'},classList:classes()},root={classList:classes(),animate(){animated++;return {finished:animation.promise,cancel(){canceled++;animation.reject(Error('Canceled'));}};}};
 const document={body,documentElement:root,visibilityState:'visible',querySelectorAll:()=>[button],addEventListener:(key,callback)=>{events[key]=callback;},startViewTransition(callback){callback();return {ready:ready.promise,finished:Promise.resolve(),skipTransition(){skipped++;ready.reject(Error('Skipped'));}};}};
 class MutationObserver{constructor(callback){events.owner=callback;}observe(){}}
 vm.runInNewContext(read('theme.js').replace(/^import[^\n]*\n/,''),{document,matchMedia:()=>media,MutationObserver,localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)},innerWidth:390,innerHeight:844,t:key=>key,setTimeout:callback=>callback()});
 return {button,events,ready,media,body,root,document,counts:()=>({skipped,canceled,animated})};
}
function interrupt(s,kind){if(kind==='reduced'){s.media.matches=true;s.events.preference();}else if(kind==='owner'){s.body.dataset.motion='false';s.events.owner();}else{s.document.visibilityState='hidden';s.events.visibilitychange();}}
function assertRecovered(s){assert.equal(s.button.disabled,false);assert.equal(s.body.classList.contains('dark'),true);assert.equal(s.root.classList.contains('theme-transition'),false);assert.equal(s.root.classList.contains('theme-fade'),false);}

for(const kind of ['reduced','owner','hidden']){
 test(`theme ${kind} interruption before transition readiness preserves the selected theme`,async()=>{
  const s=themeFixture(),pending=s.button.events.click({});interrupt(s,kind);await pending;assertRecovered(s);assert.equal(s.counts().animated,0);assert.equal(s.counts().skipped,1);
 });
 test(`theme ${kind} interruption during the reveal releases controls`,async()=>{
  const s=themeFixture(),pending=s.button.events.click({});s.ready.resolve();await new Promise(resolve=>setImmediate(resolve));assert.equal(s.counts().animated,1);interrupt(s,kind);await pending;assertRecovered(s);assert.equal(s.counts().canceled,1);
 });
}

test('transition readiness rejection leaves theme controls usable',async()=>{
 const s=themeFixture(),pending=s.button.events.click({});s.ready.reject(Error('Unavailable'));await pending;assertRecovered(s);
 s.body.dataset.motion='false';await s.button.events.click({});assert.equal(s.body.classList.contains('dark'),false);assert.equal(s.button.disabled,false);
});
