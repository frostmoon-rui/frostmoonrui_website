import {translate as t} from './i18n.js';
const buttons=[...document.querySelectorAll('.theme-button')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let changing=false,activeTransition=null,activeAnimation=null,transitionSkipped=false;
function skip(){if(activeTransition&&!transitionSkipped){transitionSkipped=true;activeTransition.skipTransition?.();}}
function cancelMotion(){if(reduced.matches||document.body.dataset.motion==='false'||document.visibilityState==='hidden'){skip();activeAnimation?.cancel();}}
reduced.addEventListener?.('change',cancelMotion);document.addEventListener?.('visibilitychange',cancelMotion);
if(typeof MutationObserver!=='undefined')new MutationObserver(cancelMotion).observe(document.body,{attributes:true,attributeFilter:['data-motion']});
function apply(dark){const theme=dark?'dark':'light';document.body.classList.toggle('dark',dark);if(document.documentElement.dataset)document.documentElement.dataset.theme=theme;for(const meta of document.querySelectorAll('meta[name="theme-color"]'))meta.setAttribute('content',dark?'#17242d':'#f5f6f2');for(const button of buttons){button.setAttribute('aria-label',t(dark?'Use light theme':'Use dark theme'));button.setAttribute('aria-pressed',String(dark));}try{localStorage.setItem('frostmoon-theme',theme);}catch{}try{document.cookie='frostmoon_theme='+theme+'; Path=/; Max-Age=31536000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');}catch{}}
let initial=document.documentElement.dataset?.theme;try{const saved=localStorage.getItem('frostmoon-theme');if(['dark','light'].includes(saved))initial=saved;}catch{}apply(initial==='dark');
for(const button of buttons)button.addEventListener('click',async event=>{
 if(changing)return;changing=true;const next=!document.body.classList.contains('dark');const moving=!reduced.matches&&document.body.dataset.motion!=='false'&&document.visibilityState!=='hidden';
 for(const item of buttons)item.disabled=true;
 try{
  if(moving&&document.startViewTransition){
   const rect=button.getBoundingClientRect(),x=event.clientX||rect.left+rect.width/2,y=event.clientY||rect.top+rect.height/2;
   const radius=Math.ceil(Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y)))+2;
   document.documentElement.style?.setProperty('--theme-x',x+'px');document.documentElement.style?.setProperty('--theme-y',y+'px');document.documentElement.style?.setProperty('--theme-radius',radius+'px');
   // Capture the untouched old page first; freeze color interpolation only inside the update.
   const transition=activeTransition=document.startViewTransition(()=>{document.documentElement.classList.add('theme-transition');document.documentElement.classList.toggle('theme-reverse',!next);apply(next);});await transition.ready;
   if(reduced.matches||document.body.dataset.motion==='false'||document.visibilityState==='hidden'){skip();await transition.finished;return;}
   const small=`circle(0px at ${x}px ${y}px)`,large=`circle(${radius}px at ${x}px ${y}px)`;
   activeAnimation=document.documentElement.animate({clipPath:next?[small,large]:[large,small]},{duration:550,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards',pseudoElement:next?'::view-transition-new(root)':'::view-transition-old(root)'});await activeAnimation.finished;
   await transition.finished;
  }else{if(moving)document.documentElement.classList.add('theme-fade');apply(next);if(moving)await new Promise(resolve=>setTimeout(resolve,350));}
 }catch{skip();apply(next);try{await activeTransition?.finished;}catch{}}finally{activeTransition=activeAnimation=null;transitionSkipped=false;document.documentElement.classList.remove('theme-transition','theme-reverse','theme-fade');for(const item of buttons)item.disabled=false;changing=false;}
});
