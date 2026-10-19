// One delegated interaction layer also covers asynchronously rendered map links.
export function tipPosition(x,y,width,height,viewportWidth,viewportHeight){
 const margin=12,gap=18;
 return {left:Math.max(margin,Math.min(x+gap,viewportWidth-width-margin)),top:Math.max(margin,y+gap+height>viewportHeight-margin?y-height-gap:y+gap)};
}
export function glassPoint(x,y,rect){
 const px=Math.max(0,Math.min(1,(x-rect.left)/Math.max(1,rect.width))),py=Math.max(0,Math.min(1,(y-rect.top)/Math.max(1,rect.height)));
 return {x:px*100,y:py*100,rx:(.5-py)*4,ry:(px-.5)*4};
}
export const navPaths={home:'M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10',notes:'M5 3h14v18H5zM8 7h8M8 11h8M8 15h5',projects:'M8 7V4h8v3M3 7h18v14H3zM3 12h18M10 12v3h4v-3',map:'m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2zM9 3v16M15 5v16'};
if(typeof document!=='undefined'){
 const fine=matchMedia('(hover:hover) and (pointer:fine)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const selector='a[href]:not(.skip):not(.avatar-link):not(.wordmark),button:not(:disabled),summary,.import-button';
 const tip=document.createElement('div');tip.id='pointer-note';tip.className='pointer-note';tip.setAttribute('role','tooltip');tip.hidden=true;document.body.append(tip);
 let target=null,timer=0,frame=0,point={x:0,y:0},description=null;
 const moving=()=>fine.matches&&!reduced.matches&&document.body.dataset.motion!=='false';
 function position(){const r=tip.getBoundingClientRect(),p=tipPosition(point.x,point.y,r.width,r.height,innerWidth,innerHeight);tip.style.left=p.left+'px';tip.style.top=p.top+'px';}
 function hide(){clearTimeout(timer);cancelAnimationFrame(frame);tip.hidden=true;if(target){target.classList.remove('glass-tracking');for(const name of ['--pointer-x','--pointer-y','--press-x','--press-y'])target.style.removeProperty(name);if(description===null)target.removeAttribute('aria-describedby');else target.setAttribute('aria-describedby',description);}target=null;description=null;}
 function show(element,x,y){
  hide();target=element;point={x,y};description=target.getAttribute('aria-describedby');
  // Native title text is retained in data for the custom delayed tooltip.
  if(target.hasAttribute('title')){target.dataset.hoverNote=target.getAttribute('title');target.removeAttribute('title');}
  timer=setTimeout(()=>{if(!target||!target.isConnected||target.disabled)return;const text=target.dataset.hoverNote||target.getAttribute('aria-label')||target.textContent.trim();if(!text)return;tip.textContent=text.replace(/[↗→←↓]/g,'').trim();tip.hidden=false;position();target.setAttribute('aria-describedby',[description,tip.id].filter(Boolean).join(' '));},500);
 }
 document.addEventListener('pointerover',event=>{if(!fine.matches||event.pointerType==='touch')return;const element=event.target.closest(selector);if(!element||element===target)return;show(element,event.clientX,event.clientY);});
 document.addEventListener('pointermove',event=>{if(!target||event.pointerType==='touch')return;point={x:event.clientX,y:event.clientY};if(!frame)frame=requestAnimationFrame(()=>{frame=0;if(!target)return;if(moving()){const p=glassPoint(point.x,point.y,target.getBoundingClientRect());target.classList.add('glass-tracking');target.style.setProperty('--pointer-x',p.x+'%');target.style.setProperty('--pointer-y',p.y+'%');target.style.setProperty('--press-x',p.rx+'deg');target.style.setProperty('--press-y',p.ry+'deg');}if(!tip.hidden)position();});},{passive:true});
 document.addEventListener('pointerout',event=>{if(target&&!target.contains(event.relatedTarget))hide();});
 document.addEventListener('focusin',event=>{const element=event.target.closest(selector);if(!element)return;const r=element.getBoundingClientRect();show(element,r.left,r.bottom);});
 document.addEventListener('focusout',hide);document.addEventListener('pointerdown',hide);document.addEventListener('keydown',event=>{if(event.key==='Escape')hide();});
 document.addEventListener('scroll',hide,true);window.addEventListener('resize',hide);window.addEventListener('pagehide',hide);document.addEventListener('visibilitychange',hide);reduced.addEventListener('change',hide);fine.addEventListener('change',hide);
 for(const link of document.querySelectorAll('.nav-link')){const host=link.querySelector('span');if(!host)continue;const path=link.getAttribute('href'),key=path.includes('food-map')?'map':path.includes('projects')?'projects':path.includes('#notes')?'notes':'home';const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');for(const [name,value] of Object.entries({viewBox:'0 0 24 24',width:'19',height:'19',fill:'none',stroke:'currentColor','stroke-width':'1.5','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'}))svg.setAttribute(name,value);const line=document.createElementNS('http://www.w3.org/2000/svg','path');line.setAttribute('d',navPaths[key]);svg.append(line);host.replaceChildren(svg);}
 for(const link of document.querySelectorAll('a[href]')){
  if(link.matches('.skip,.avatar-link,.wordmark,.nav-link,[data-site-language],.leaflet-control-attribution a')||link.querySelector('svg,img'))continue;
  const walker=document.createTreeWalker(link,NodeFilter.SHOW_TEXT);let text;while((text=walker.nextNode()))text.textContent=text.textContent.replace(/[↗→←↓]/g,'');
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('action-icon');for(const [key,value] of Object.entries({viewBox:'0 0 24 24',width:'16',height:'16',fill:'none',stroke:'currentColor','stroke-width':'1.5','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true'}))svg.setAttribute(key,value);
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',link.origin!==location.origin?'M14 3h7v7M21 3l-11 11M10 5H3v16h16v-7':'M4 12h16m-6-6 6 6-6 6');svg.append(path);link.append(svg);
 }
}
