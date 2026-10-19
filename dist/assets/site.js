import {translate as t} from './i18n.js';
import './motion.js';
import './navigation.js';
import './theme.js';
import './glass.js';
import './entry.js';
import './companions.js';
import './community.js';
import {createNoteFilter} from './note-filter.js';
// The Worker serves the preferred language in the first HTML response.
// Persist explicit locale pages for the next unprefixed visit; never reload here.
try {
  const code=document.documentElement.dataset.locale;
  if(['zh','en','ru','ja'].includes(code)&&document.documentElement.dataset.defaultEntry!=='true'){
    document.cookie='frostmoon_language='+code+'; Path=/; Max-Age=31536000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');
    localStorage.setItem('frostmoon-language',code);
  }
} catch {}
const noteCards=[...document.querySelectorAll('.note-card')],noteFilter=createNoteFilter(noteCards),noteMotion=matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 const choice=button.dataset.filter;
 document.querySelectorAll('[data-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
 const count=noteFilter.select(choice,!noteMotion.matches&&document.body.dataset.motion!=='false');
 const empty=document.querySelector('.filter-empty');if(empty)empty.hidden=count>0;
}));
noteMotion.addEventListener('change',()=>noteFilter.stop());
new MutationObserver(()=>noteFilter.stop()).observe(document.body,{attributes:true,attributeFilter:['data-motion']});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')noteFilter.stop();});
window.addEventListener('pagehide',()=>noteFilter.stop());
document.querySelectorAll('[data-site-language]').forEach(link => {
  const target=new URL(link.href);
  target.search=window.location.search;
  target.hash=window.location.hash;
  link.href=target.href;
  link.addEventListener('click',()=>{
    document.cookie='frostmoon_language='+link.dataset.siteLanguage+'; Path=/; Max-Age=31536000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');
    try { localStorage.setItem('frostmoon-language',link.dataset.siteLanguage); } catch {}
  });
});
// Localized navigation links preserve the selected language without translation APIs.
