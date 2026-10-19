import {translate as t} from './i18n.js';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const allowed=()=>!reduced.matches&&document.body.dataset.motion!=='false';
let observer=null,avatarAnimation=null,navigating=false,avatarFlipping=false,avatarClicks=0;
const revealSelector='.note-card,.margin-card,.about-section,.friend-card,.contact-strip,.project-row,.about-credits,.friend-exchange,.studio-entry,.atlas-footnote';
function revealAll(){observer?.disconnect();observer=null;for(const node of document.querySelectorAll('.reveal-item'))node.classList.add('is-revealed');}
function syncMotion(){document.documentElement.dataset.motion=String(allowed());if(!allowed()){revealAll();avatarAnimation?.cancel();}}
syncMotion();document.body.classList.add('is-loaded');
if(allowed()&&'IntersectionObserver' in window){
 try{observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-revealed');setTimeout(()=>entry.target.classList.add('motion-settled'),850);observer?.unobserve(entry.target);}},{threshold:.08});const nodes=document.querySelectorAll(revealSelector);for(const [index,node] of [...nodes].entries()){node.style.setProperty('--reveal-delay',`${Math.min(index%4,3)*55}ms`);node.classList.add('reveal-item');observer.observe(node);}document.documentElement.classList.add('motion-ready');}catch{revealAll();}
 const hero=document.querySelector?.('.hero');if(hero)try{const visibility=new IntersectionObserver(entries=>{document.body.classList.toggle('hero-at-rest',!entries[0].isIntersecting);},{threshold:0});visibility.observe(hero);}catch{}
}
reduced.addEventListener?.('change',syncMotion);
if('MutationObserver' in window)new MutationObserver(syncMotion).observe(document.body,{attributes:true,attributeFilter:['data-motion']});
function syncVisibility(){document.body.classList.toggle('motion-paused',document.visibilityState==='hidden');}
document.addEventListener?.('visibilitychange',syncVisibility);syncVisibility();

document.querySelectorAll('.avatar-link').forEach(link=>link.addEventListener('click',async event=>{
 if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 event.preventDefault();if(navigating||avatarFlipping)return;avatarFlipping=true;link.classList.add('is-flipping');
 try{const flipper=link.querySelector('.avatar-flipper');if(allowed()&&flipper?.animate){avatarAnimation=flipper.animate([{transform:'rotateY(0deg)'},{transform:'rotateY(360deg)'}],{duration:460,iterations:1,easing:'cubic-bezier(.45,0,.55,1)'});await avatarAnimation.finished;}}catch{}finally{avatarAnimation=null;avatarFlipping=false;link.classList.remove('is-flipping');}
 avatarClicks++;document.querySelectorAll('.avatar-link').forEach(node=>node.setAttribute?.('aria-label',t('Avatar flips: {count}/3. About opens on the third click.',{count:avatarClicks})));
 if(avatarClicks<3)return;navigating=true;
 if(allowed()){document.body.classList.add('page-leaving');await new Promise(resolve=>setTimeout(resolve,180));}
 window.location.assign(link.href);
}));
window.addEventListener('pageshow',()=>{navigating=false;avatarFlipping=false;avatarClicks=0;document.body.classList.remove('page-leaving');document.querySelectorAll('.is-flipping').forEach(node=>node.classList.remove('is-flipping'));document.querySelectorAll('.avatar-link').forEach(node=>node.setAttribute?.('aria-label',t('Flip the avatar and visit About')));syncMotion();syncVisibility();});
document.querySelectorAll('[data-copy-site]').forEach(button=>button.addEventListener('click',async()=>{const status=button.parentElement.querySelector('.copy-status');try{await navigator.clipboard.writeText('https://frostmoonrui.com/');status.textContent=t('Site link copied.');}catch{status.textContent=t('Copy this address: https://frostmoonrui.com/');}}));
