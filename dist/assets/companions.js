import {translate as t} from './i18n.js';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const nodes=[...document.querySelectorAll('.companion-greeting,.avatar-link')];
const pending=new Map();
const allowed=()=>!reduced.matches&&document.body.dataset.motion!=='false';
function reset(){for(const [node,timer] of pending){clearTimeout(timer);node.classList.remove('is-hugging');}pending.clear();}
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries){entry.target.classList.toggle('is-resting',!entry.isIntersecting);if(!entry.isIntersecting&&pending.has(entry.target)){clearTimeout(pending.get(entry.target));pending.delete(entry.target);entry.target.classList.remove('is-hugging');}}},{threshold:.05});for(const node of nodes){node.classList.add('is-resting');observer.observe(node);}}
for(const button of document.querySelectorAll('.companion-greeting')){
 const image=button.querySelector('.companion-photo');if(image){image.addEventListener('error',()=>{image.hidden=true;});if(image.complete&&image.naturalWidth===0)image.hidden=true;}
 button.addEventListener('click',()=>{const status=document.getElementById('companion-status');if(status)status.textContent=t('A little hello for {name}.',{name:button.dataset.companion});if(!allowed()||pending.has(button))return;button.classList.add('is-hugging');pending.set(button,setTimeout(()=>{button.classList.remove('is-hugging');pending.delete(button);},1000));});
}
reduced.addEventListener('change',reset);new MutationObserver(reset).observe(document.body,{attributes:true,attributeFilter:['data-motion']});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')reset();});window.addEventListener('pagehide',reset);
