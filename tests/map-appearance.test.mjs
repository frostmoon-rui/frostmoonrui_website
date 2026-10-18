import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {mapStyle,markerKind,createPin} from '../dist/assets/map-appearance.js';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
test('official map themes follow the website without filtering satellite imagery',()=>{
 assert.equal(mapStyle(false),'amap://styles/whitesmoke');assert.equal(mapStyle(true),'amap://styles/darkblue');
 const runtime=read('dist/assets/food-map.js');assert.match(runtime,/new MutationObserver\(syncTheme\)/);assert.match(runtime,/setMapStyle\(mapStyle/);assert.match(runtime,/mapStyle:mapStyle/);
 assert.doesNotMatch(read('dist/assets/atlas-polish.css'),/map-canvas[^}]*filter:|amap-layer[^}]*filter:/);
});
test('category icons have deterministic safe fallbacks',()=>{
 for(const [category,kind] of [['Coffee','coffee'],['Drinks','coffee'],['Dessert','dessert'],['Noodles','noodles'],['Dining','dining'],['<script>','dining']])assert.equal(markerKind(category),kind);
});
test('pins use safe DOM text, keyboard-native buttons and a selection callback',()=>{
 const make=tag=>({tag,attributes:{},children:[],events:{},setAttribute(key,value){this.attributes[key]=value;},append(...items){this.children.push(...items);},addEventListener(key,handler){this.events[key]=handler;}});
 const document={createElement:make,createElementNS:(_,tag)=>make(tag)};let selected=0,stopped=false;
 const pin=createPin(document,{name:'<img onerror=alert(1)>',category:'Coffee'},12,()=>selected++);
 assert.equal(pin.tag,'button');assert.equal(pin.type,'button');assert.equal(pin.attributes['aria-label'],'12. <img onerror=alert(1)>');assert.equal(pin.attributes['aria-pressed'],'false');
 assert.equal(pin.children[1].textContent,'12');assert.equal(pin.children[0].children[0].tag,'svg');assert.ok(!('innerHTML' in pin));
 pin.events.click({stopPropagation(){stopped=true;}});assert.equal(selected,1);assert.equal(stopped,true);
});
test('map and list share stable venue numbers, custom pins and selected state',()=>{
 const runtime=read('dist/assets/food-map.js');assert.match(runtime,/p.mapNumber=index\+1/);assert.match(runtime,/createPin\(document,p,p.mapNumber/);assert.match(runtime,/content:pin/);assert.match(runtime,/L.divIcon\(\{html:pin/);assert.match(runtime,/marker.pin.setAttribute\('aria-pressed'/);assert.match(runtime,/card.classList.toggle\('selected'/);
 assert.match(read('dist/assets/atlas-polish.css'),/prefers-reduced-motion:reduce/);
});
test('all map controls and theme explanations are localized',()=>{
 const ui=JSON.parse(read('content/ui.json'));for(const code of ['en','zh','ru','ja'])for(const key of ['Map zoom controls','Zoom in','Zoom out','Map colors follow the site theme. Satellite imagery keeps its original colors.'])assert.ok(ui[code][key]);
});
test('visible attribution is consolidated in About while original venue links remain',()=>{
 for(const code of ['en','zh','ru','ja']){
  const pages=JSON.parse(read(code==='en'?'content/pages.json':`content/pages.${code}.json`));
  assert.match(pages.find(p=>p.path==='about').body,/CacheTide/);
  for(const page of pages.filter(p=>p.path!=='about'))assert.doesNotMatch(page.body,/CacheTide/);
  const homepage=read(`dist/${code}/index.html`);assert.doesNotMatch(homepage,/CacheTide/);assert.ok(homepage.includes(`href="/${code}/about/"`));
  assert.doesNotMatch(read(`dist/${code}/food-map/index.html`),/CacheTide/);
  assert.ok(fs.existsSync(new URL(`../dist/${code}/about/index.html`,import.meta.url)));
 }
 assert.match(read('dist/assets/food-map.js'),/articleLink\(p\)/);
 assert.equal(JSON.parse(read('dist/data/food.json')).sourceUrl,'https://cachetide.top/food-map/index.json');
});
