import {normalizeFeed,filtered,amapLink,toWgs84,mergeFeeds,articleLink} from './food-core.js';
import {mapStyle,createPin} from './map-appearance.js';
import {loadAmap} from './amap-loader.js';
import {translate as t,locale} from './i18n.js';
const $=id=>document.getElementById(id);const state={rows:[],map:null,markers:[],active:null,engine:null,busy:false,satellite:null,roads:null,traffic:null,info:null};
function element(tag,text,className){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;}
function link(text,url){const node=element('a',text);node.href=url;node.target='_blank';node.rel='noopener noreferrer';return node;}
function matches(){return filtered(state.rows,$('search').value,$('city').value,$('category').value,t);}
const scoreFormat=new Intl.NumberFormat(document.documentElement.lang,{maximumFractionDigits:2});
function venueCategory(p){return [t(p.category),p.rating===null?'':t('Rating')+' '+scoreFormat.format(p.rating)+' / 5'].filter(Boolean).join(' · ');}
function popup(p){const box=element('div',undefined,'atlas-popup');box.append(element('h3',p.name),element('p',p.city+' · '+venueCategory(p)),element('p',p.address||t('Check the original venue listing.')),link(t('Open in Amap ↗'),amapLink(p)));const original=articleLink(p,locale);if(original)box.append(element('br'),link(t(p.sourceName==='frostmoon-rui'?'Read note →':'Original recommendation ↗'),original));return box;}
function highlight(){for(const marker of state.markers){const active=marker.venueId===state.active;marker.pin.setAttribute('aria-pressed',String(active));if(state.engine==='amap')marker.setzIndex(active?200:100);else marker.setZIndexOffset(active?200:0);}}
function select(p){state.active=p.id;document.querySelectorAll('.venue-card').forEach(c=>c.classList.toggle('selected',c.dataset.id===p.id));highlight();if(state.map){if(state.engine==='amap'){state.map.setZoomAndCenter(15,[p.lng,p.lat]);state.info?.close();state.info=new AMap.InfoWindow({content:popup(p),offset:new AMap.Pixel(0,-48)});state.info.open(state.map,[p.lng,p.lat]);}else{state.map.setView(toWgs84(p.lng,p.lat),15);state.markers.find(m=>m.venueId===p.id)?.openPopup();}}else{$('map-status').textContent=t('Selected: {name}. Load the map to see its marker.',{name:p.name});}}
function markers(rows=matches()){
 if(!state.map)return;
 const visible=new Map(rows.map(p=>[p.id,p]));
 const retained=new Map();
 for(const marker of state.markers){
  const place=visible.get(marker.venueId);
  if(place&&marker.number===place.mapNumber)retained.set(place.id,marker);
  else{
   if(marker.venueId===state.active){state.info?.close();state.info=null;}
   state.engine==='amap'?marker.setMap(null):marker.remove();
  }
 }
 state.markers=rows.map(p=>{
  if(retained.has(p.id))return retained.get(p.id);
  const pin=createPin(document,p,p.mapNumber,()=>select(p));
  const marker=state.engine==='amap'
   ?new AMap.Marker({position:[p.lng,p.lat],title:p.name,content:pin,anchor:'bottom-center',map:state.map})
   :L.marker(toWgs84(p.lng,p.lat),{icon:L.divIcon({html:pin,className:'atlas-div-icon',iconSize:[42,49],iconAnchor:[21,49],popupAnchor:[0,-43]})}).addTo(state.map).bindPopup(()=>popup(p));
  marker.venueId=p.id;marker.number=p.mapNumber;marker.pin=pin;
  marker.on('click',()=>select(p));
  return marker;
 });
 highlight();
}
let lastMapStyle=null;
function syncTheme(){if(state.engine==='amap'&&state.map){const style=mapStyle(document.body.classList.contains('dark'));if(style!==lastMapStyle){state.map.setMapStyle(style);lastMapStyle=style;}}}
new MutationObserver(syncTheme).observe(document.body,{attributes:true,attributeFilter:['class']});
function fit(){if(!state.map||!state.markers.length)return;if(state.engine==='amap')state.map.setFitView(state.markers,false,[40,40,40,40],13);else state.map.fitBounds(L.featureGroup(state.markers).getBounds(),{padding:[40,40],maxZoom:13});}
function layers(){if(state.engine!=='amap'||!state.map)return;for(const layer of [state.satellite,state.roads,state.traffic])if(layer)state.map.remove(layer);if($('map-layer').value==='satellite'){state.satellite??=new AMap.TileLayer.Satellite();state.roads??=new AMap.TileLayer.RoadNet();state.map.add([state.satellite,state.roads]);}if($('map-traffic').checked){state.traffic??=new AMap.TileLayer.Traffic({autoRefresh:false});state.map.add(state.traffic);}}
function render(){const rows=matches();const cards=document.createDocumentFragment();$('result-count').textContent=t('Places to explore: {count}',{count:rows.length});if(!rows.length)cards.append(element('p',t('No matching places. Try another city or reset the filters.'),'empty-state'));for(const p of rows){const card=element('article',undefined,'venue-card');card.dataset.id=p.id;card.classList.toggle('selected',p.id===state.active);const top=element('div',undefined,'venue-top');top.append(element('span',String(p.mapNumber).padStart(2,'0')+' / '+p.city),element('span',venueCategory(p)));const actions=element('div',undefined,'venue-actions');const button=element('button',t('Show on map'));button.type='button';button.addEventListener('click',()=>select(p));actions.append(button,link(t('Amap ↗'),amapLink(p)));const original=articleLink(p,locale);if(original)actions.append(link(t(p.sourceName==='frostmoon-rui'?'Read note →':'Original ↗'),original));card.append(top,element('h2',p.name),element('p',p.address||t('Address details in the original listing.')),actions);cards.append(card);}$('results').replaceChildren(cards);markers(rows);}
const afterPaint=()=>new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
async function loadLeaflet(){
 const stylesheet=document.createElement('link');
 stylesheet.rel='stylesheet';
 stylesheet.href='/assets/vendor/leaflet.css';
 const css=new Promise((resolve,reject)=>{
  stylesheet.onload=resolve;
  stylesheet.onerror=reject;
 });
 const script=document.createElement('script');
 script.src='/assets/vendor/leaflet.js';
 const js=window.L?Promise.resolve():new Promise((resolve,reject)=>{
  script.onload=()=>window.L?resolve():reject(new Error('Map library unavailable'));
  script.onerror=reject;
 });
 let timer;
 const timeout=new Promise((_,reject)=>{
  timer=setTimeout(()=>reject(new Error('Map library timeout')),15000);
 });
 document.head.append(stylesheet);
 if(!window.L)document.head.append(script);
 try{await Promise.race([Promise.all([css,js]),timeout]);}
 catch(error){stylesheet.remove();script.remove();throw error;}
 finally{clearTimeout(timer);}
}
let leaflet;
function loadLeafletOnce(){
 leaflet??=loadLeaflet().catch(error=>{leaflet=null;throw error;});
 return leaflet;
}
async function loadMap(){
 if(state.busy)return;state.busy=true;const provider=$('map-provider');const engine=provider.value;const button=$('load-map');button.disabled=provider.disabled=true;button.textContent=t('Loading the map…');
 try{
  const pending=engine==='amap'?loadAmap():loadLeafletOnce();
  await pending;
  await afterPaint();
  if(state.map){state.engine==='amap'?state.map.destroy():state.map.remove();state.map=null;}state.engine=engine;state.markers=[];state.satellite=state.roads=state.traffic=null;state.info=null;lastMapStyle=null;$('map-navigation').hidden=true;
  $('map-canvas').replaceChildren();
  if(engine==='amap'){state.map=new AMap.Map('map-canvas',{zoom:4,center:[108.9,34.3],viewMode:'2D',mapStyle:mapStyle(document.body.classList.contains('dark')),lang:locale==='en'?'en':'zh_cn'});layers();$('map-status').textContent=t('Amap · original GCJ-02 coordinates');}
  else{state.map=L.map('map-canvas',{scrollWheelZoom:false,zoomControl:false}).setView([34.3,108.9],4);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> '+t('contributors'),updateWhenIdle:true,keepBuffer:1}).addTo(state.map).on('tileerror',()=>{$('map-status').textContent=t('Some map tiles are unavailable; the venue list and Amap links still work.');});
  $('map-status').textContent=t('Approximate WGS84 markers · source coordinates remain GCJ-02');}
  markers();fit();$('map-navigation').hidden=false;$('map-placeholder').hidden=true;$('fit-map').hidden=false;button.textContent=t('Open interactive map ↗');
  if(state.active){const p=state.rows.find(p=>p.id===state.active);if(p)select(p);}
 }catch(error){$('map-status').textContent=t(error.message==='configuration'?'Amap is not configured on the server yet. Use OpenStreetMap or the venue links.':'The map could not load. The venue list and Amap links remain available.');button.textContent=t('Try loading the map again');}finally{state.busy=false;button.disabled=provider.disabled=false;}
}
async function load(){
 const empty={schemaVersion:1,coordinateSystem:'GCJ-02',spots:[]};
 const feeds=[empty,empty];
 let successes=0;
 async function readFeed(url,index){
  const response=await fetch(url,{cache:index===0?'no-store':'default',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error('Collection unavailable');
  const data=await response.json();
  normalizeFeed(data);
  feeds[index]=data;
  successes++;
  state.rows=mergeFeeds(...feeds);
  state.rows.forEach((p,index)=>{p.mapNumber=index+1;});
  $('total-count').textContent=state.rows.length;
  const date=new Date(feeds[1].retrievedAt||feeds[0].generatedAt);
  $('updated').textContent=Number.isNaN(date.valueOf())?t('Public source'):t('Source changed {date}',{date:date.toLocaleDateString({zh:'zh-CN',en:'en-GB',ru:'ru-RU',ja:'ja-JP'}[locale],{day:'numeric',month:'short',year:'numeric'})});
  for(const id of ['city','category']){
   const select=$(id),selected=select.value;
   const options=[...new Set(state.rows.map(p=>p[id]))].sort().map(value=>{
    const option=element('option',id==='category'?t(value):value);
    option.value=value;
    return option;
   });
   select.replaceChildren(select.options[0],...options);
   select.value=options.some(option=>option.value===selected)?selected:'';
  }
  render();
  if(!state.active&&state.map&&successes===1)fit();
 }
 await Promise.allSettled(['/food-map/index.json','/data/food.json'].map(readFeed));
 if(successes)return;
 $('result-count').textContent=t('Collection temporarily unavailable');
 $('updated').textContent=t('No private or fabricated data was substituted.');
 $('results').replaceChildren(element('p',t('The public collection could not be loaded. Please return later or visit the original source.'),'empty-state'));
}
$('map-zoom-in').addEventListener('click',()=>state.map?.zoomIn());$('map-zoom-out').addEventListener('click',()=>state.map?.zoomOut());
let searchTimer;
$('search').addEventListener('input',()=>{
 clearTimeout(searchTimer);
 searchTimer=setTimeout(render,120);
});
$('city').addEventListener('change',()=>{render();fit();});$('category').addEventListener('change',()=>{render();fit();});$('reset').addEventListener('click',()=>{$('search').value='';$('city').value='';$('category').value='';render();fit();});$('load-map').addEventListener('click',loadMap);$('fit-map').addEventListener('click',fit);$('map-layer').addEventListener('change',layers);$('map-traffic').addEventListener('change',layers);$('map-provider').addEventListener('change',()=>{$('map-layer').disabled=$('map-traffic').disabled=$('map-provider').value!=='amap';if(state.map)loadMap();});load();
