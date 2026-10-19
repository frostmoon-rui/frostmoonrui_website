import {translate as t} from './i18n.js';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const allowed=()=>!reduced.matches&&document.body.dataset.motion!=='false';
document.body.classList.add('is-loaded');
if(allowed()&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-revealed');observer.unobserve(entry.target);}},{threshold:.08});const nodes=document.querySelectorAll('.note-card,.margin-card,.about-section,.friend-card,.contact-strip');for(const node of nodes){node.classList.add('reveal-item');observer.observe(node);}document.documentElement.classList.add('motion-ready');}
let navigating=false;
document.querySelectorAll('.avatar-link').forEach(link=>link.addEventListener('click',async event=>{
 if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 event.preventDefault();if(navigating)return;navigating=true;link.classList.add('is-flipping');
 try{if(allowed()&&link.querySelector('.avatar-flipper')?.animate)await link.querySelector('.avatar-flipper').animate([{transform:'rotateY(0deg)'},{transform:'rotateY(360deg)'}],{duration:460,iterations:3,easing:'cubic-bezier(.45,0,.55,1)'}).finished;}catch{}
 if(allowed()){document.body.classList.add('page-leaving');await new Promise(resolve=>setTimeout(resolve,180));}
 window.location.assign(link.href);
}));
window.addEventListener('pageshow',()=>{navigating=false;document.body.classList.remove('page-leaving');document.querySelectorAll('.is-flipping').forEach(node=>node.classList.remove('is-flipping'));});
document.querySelectorAll('[data-copy-site]').forEach(button=>button.addEventListener('click',async()=>{const status=button.parentElement.querySelector('.copy-status');try{await navigator.clipboard.writeText('https://frostmoonrui.com/');status.textContent=t('Site link copied.');}catch{status.textContent=t('Copy this address: https://frostmoonrui.com/');}}));
