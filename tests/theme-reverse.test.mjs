import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=name=>fs.readFileSync(new URL('../dist/assets/'+name,import.meta.url),'utf8');
function classes(){const set=new Set();return {add:(...k)=>k.forEach(v=>set.add(v)),remove:(...k)=>k.forEach(v=>set.delete(v)),contains:k=>set.has(k),toggle:(k,on)=>on?set.add(k):set.delete(k)};}
test('dark-to-light captures an untouched old frame before adding reverse/freeze classes',async()=>{
 const order=[],button={events:{},setAttribute(){},addEventListener(k,v){this.events[k]=v;},getBoundingClientRect:()=>({left:0,top:0,width:30,height:30})},root={classList:classes(),dataset:{theme:'dark'},style:{setProperty(){}},animate(frames,options){order.push('animation');assert.equal(options.pseudoElement,'::view-transition-old(root)');assert.equal(options.fill,'forwards');assert.match(frames.clipPath[1],/circle\(0px/);return {finished:Promise.resolve()};}},body={classList:classes(),dataset:{motion:'true'}};
 body.classList.add('dark');const document={body,documentElement:root,visibilityState:'visible',querySelectorAll:s=>s==='.theme-button'?[button]:[],addEventListener(){},startViewTransition(callback){assert.equal(root.classList.contains('theme-transition'),false);assert.equal(root.classList.contains('theme-reverse'),false);order.push('old-capture');callback();assert.equal(root.classList.contains('theme-reverse'),true);assert.equal(root.dataset.theme,'light');order.push('new-capture');return {ready:Promise.resolve(),finished:Promise.resolve()};}};
 vm.runInNewContext(read('theme.js').replace(/^import[^\n]*\n/,''),{document,matchMedia:()=>({matches:false,addEventListener(){}}),localStorage:{getItem:()=> 'dark',setItem(){}},innerWidth:390,innerHeight:844,t:v=>v,setTimeout,location:{protocol:'https:'}});
 await button.events.click({clientX:0,clientY:0});assert.deepEqual(order,['old-capture','new-capture','animation']);assert.equal(body.classList.contains('dark'),false);assert.equal(button.disabled,false);
});
test('reverse old snapshot has no premature mask and color interpolation is frozen',()=>{const css=read('theme-base.css');assert.match(css,/theme-reverse::view-transition-old\(root\)\{clip-path:none\}/);assert.match(css,/transition:none!important/);assert.match(css,/animation:none!important;mix-blend-mode:normal/);});
