const sidebar=document.getElementById('site-sidebar');
const trigger=document.querySelector('.menu-toggle');
const scrim=document.querySelector('.nav-scrim');
if(sidebar&&trigger&&scrim){
 const mobile=matchMedia('(max-width: 680px)');let open=false;
 document.documentElement.classList.add('nav-enhanced');
 function close(returnFocus=true){open=false;document.body.classList.remove('nav-open');trigger.setAttribute('aria-expanded','false');sidebar.inert=mobile.matches;sidebar.setAttribute('aria-hidden',String(mobile.matches));sidebar.removeAttribute('role');sidebar.removeAttribute('aria-modal');if(returnFocus&&mobile.matches)trigger.focus();setTimeout(()=>{if(!open)scrim.hidden=true;},320);}
 function show(){if(!mobile.matches)return;open=true;scrim.hidden=false;sidebar.inert=false;sidebar.setAttribute('aria-hidden','false');sidebar.setAttribute('role','dialog');sidebar.setAttribute('aria-modal','true');trigger.setAttribute('aria-expanded','true');document.body.classList.add('nav-open');sidebar.querySelector('.drawer-close')?.focus();}
 trigger.addEventListener('click',()=>open?close():show());
 scrim.addEventListener('click',()=>close());sidebar.querySelector('.drawer-close')?.addEventListener('click',()=>close());
 sidebar.addEventListener('click',event=>{if(event.target.closest('a')&&!event.target.closest('.avatar-link'))close(false);});
 document.addEventListener('keydown',event=>{if(!open)return;if(event.key==='Escape'){event.preventDefault();close();return;}if(event.key==='Tab'){const targets=[...sidebar.querySelectorAll('a[href],button:not([disabled])')].filter(node=>node.getClientRects().length);const first=targets[0],last=targets.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}});
 mobile.addEventListener('change',()=>close(false));window.addEventListener('pageshow',()=>close(false));close(false);
}
