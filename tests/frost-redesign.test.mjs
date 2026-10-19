import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createNoteFilter} from '../dist/assets/note-filter.js';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
function fixture(){
 const animations=[];
 const cards=['software','hardware','software'].map((category,index)=>({dataset:{category},hidden:false,getBoundingClientRect:()=>({top:index*100}),animate(frames,timing){let reject;const result={frames,timing,canceled:false,finished:new Promise((_,fail)=>{reject=fail;}),cancel(){this.canceled=true;reject(Error('Interrupted'));}};animations.push(result);return result;}}));
 return {cards,animations,filter:createNoteFilter(cards,{style:()=>({opacity:'.65'})})};
}
test('rapid filter reversals update visible content immediately and cancel stale animations',async()=>{
 const s=fixture();assert.equal(s.filter.select('software'),2);assert.equal(s.cards[1].hidden,true);assert.equal(s.animations.length,2);
 assert.equal(s.filter.select('hardware'),1);assert.ok(s.animations.slice(0,2).every(item=>item.canceled));assert.equal(s.cards[1].hidden,false);assert.equal(s.animations.length,3);
 assert.equal(s.filter.select('all'),3);assert.equal(s.animations[2].canceled,true);assert.equal(s.animations[3].frames[0].opacity,0);assert.equal(s.animations[4].frames[0].opacity,'.65');
 s.filter.stop();assert.ok(s.animations.every(item=>item.canceled));await Promise.resolve();
});
test('reduced motion applies filtering without scheduling any animation',()=>{const s=fixture();assert.equal(s.filter.select('hardware',false),1);assert.equal(s.animations.length,0);assert.equal(s.filter.select('none',false),0);});
test('every localized route loads the common optical layer after other styles',()=>{
 for(const locale of ['en','zh','ru','ja'])for(const route of ['','about/','links/','resources/','projects/','food-map/','studio/']){
  const html=read(`dist/${locale}/${route}index.html`);assert.ok(html.indexOf('/assets/frost.css')>html.indexOf('/assets/companions.css'));
 }
 for(const locale of ['en','zh','ru','ja'])assert.match(read(`dist/${locale}/links/index.html`),/class="companion-status" role="status"/);
});
test('optical surfaces preserve fallbacks, bounded greetings and mobile safe areas',()=>{
 const glass=read('dist/assets/glass.css'),frost=read('dist/assets/frost.css'),companions=read('dist/assets/companions.css');
 for(const token of ['--press-x:0deg','--press-y:0deg','transform 460ms','translateY(2px)','saturate(160%)','forced-colors'])assert.ok(glass.includes(token));
 for(const token of ['100dvh','safe-area-inset-bottom','scroll-snap-type','prefers-reduced-motion','forced-colors','motion-paused'])assert.ok(frost.includes(token));
 for(const token of ['tietie-snuggle-main 1000ms','tietie-snuggle-buddy 1000ms','tietie-sparks-burst','scale(1.16,.86)'])assert.ok(companions.includes(token));
});
