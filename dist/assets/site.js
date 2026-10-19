import {translate as t} from './i18n.js';
import './motion.js';
import './navigation.js';
import './theme.js';
import './glass.js';
import './entry.js';
import './companions.js';
try {
  const saved=localStorage.getItem('frostmoon-language');
  if(document.documentElement.dataset.defaultEntry==='true' && ['zh','ru','ja'].includes(saved)){
    const target=new URL(window.location.href);
    target.pathname='/'+saved+target.pathname;
    window.location.replace(target.href);
  }
} catch {}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  const choice = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  let count = 0;
  document.querySelectorAll('.note-card').forEach(card => { card.hidden = choice !== 'all' && card.dataset.category !== choice; if (!card.hidden) count++; });
  const empty = document.querySelector('.filter-empty'); if (empty) empty.hidden = count > 0;
}));
document.querySelectorAll('[data-site-language]').forEach(link => {
  const target=new URL(link.href);
  target.search=window.location.search;
  target.hash=window.location.hash;
  link.href=target.href;
  link.addEventListener('click',()=>{
    try { localStorage.setItem('frostmoon-language',link.dataset.siteLanguage); } catch {}
  });
});
// Localized navigation links preserve the selected language without translation APIs.
