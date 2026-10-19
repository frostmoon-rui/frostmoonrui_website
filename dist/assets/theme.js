import {translate as t} from './i18n.js';
const buttons=[...document.querySelectorAll('.theme-button')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let changing=false,activeTransition=null,activeAnimation=null;
function cancelMotion(){if(reduced.matches||document.body.dataset.motion==='false'||document.visibilityState==='hidden'){activeTransition?.skipTransition?.();activeAnimation?.cancel();}}
reduced.addEventListener?.('change',cancelMotion);document.addEventListener?.('visibilitychange',cancelMotion);
if(typeof MutationObserver!=='undefined')new MutationObserver(cancelMotion).observe(document.body,{attributes:true,attributeFilter:['data-motion']});
function apply(dark){document.body.classList.toggle('dark',dark);for(const button of buttons){button.setAttribute('aria-label',t(dark?'Use light theme':'Use dark theme'));button.setAttribute('aria-pressed',String(dark));}try{localStorage.setItem('frostmoon-theme',dark?'dark':'light');}catch{}}
try{apply(localStorage.getItem('frostmoon-theme')==='dark');}catch{apply(false);}
for(const button of buttons)button.addEventListener('click',async event=>{
 if(changing)return;changing=true;const next=!document.body.classList.contains('dark');const moving=!reduced.matches&&document.body.dataset.motion!=='false'&&document.visibilityState!=='hidden';
 for(const item of buttons)item.disabled=true;
 try{
  if(moving&&document.startViewTransition){
   const rect=button.getBoundingClientRect(),x=event.clientX||rect.left+rect.width/2,y=event.clientY||rect.top+rect.height/2;
   const radius=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
   document.documentElement.classList.add('theme-transition');
   const transition=activeTransition=document.startViewTransition(()=>apply(next));await transition.ready;
   if(reduced.matches||document.body.dataset.motion==='false'||document.visibilityState==='hidden'){transition.skipTransition?.();return;}
   activeAnimation=document.documentElement.animate({clipPath:[`circle(0px at ${x}px ${y}px)`,`circle(${radius}px at ${x}px ${y}px)`]},{duration:550,easing:'cubic-bezier(.22,1,.36,1)',pseudoElement:'::view-transition-new(root)'});await activeAnimation.finished;
   await transition.finished;
  }else{if(moving)document.documentElement.classList.add('theme-fade');apply(next);if(moving)await new Promise(resolve=>setTimeout(resolve,350));}
 }catch{apply(next);}finally{activeTransition=activeAnimation=null;document.documentElement.classList.remove('theme-transition','theme-fade');for(const item of buttons)item.disabled=false;changing=false;}
});
