import {escape,htmlLanguages,languagePath} from './i18n.mjs';
import {applyChrome} from './site-chrome.mjs';

// An unlisted page is intentionally public, not an authentication boundary.
export function secretPage(room,site,locale,catalog){
 const entry=room.entries[locale],t=key=>catalog[locale][key];
 const sections=entry.sections.map((section,index)=>`<section class="room-entry"><span class="section-number">${String(index+1).padStart(2,'0')}</span><div><h2>${escape(section.title)}</h2>${section.text.split(/\n\n/).map(text=>`<p>${escape(text).replace(/\n/g,'<br>')}</p>`).join('')}</div></section>`).join('');
 const html=`<!doctype html><html lang="${htmlLanguages[locale]}" data-locale="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive,nosnippet,noimageindex"><meta name="referrer" content="no-referrer"><meta name="theme-color" content="#eff3f6"><title>${escape(entry.title)} · Frostmoon</title><link rel="icon" href="/favicon.jpg" type="image/jpeg"><link rel="stylesheet" href="/assets/site.css"><script type="module" src="/assets/site.js"></script></head><body><div class="room-shell"><header class="room-header"><a class="wordmark" href="${languagePath(locale)}">frostmoon<span>✦</span></a><button class="theme-button" type="button" aria-label="${escape(t('Switch color theme'))}">◐</button></header><main id="main" class="room-main"><div class="room-orbit" aria-hidden="true"><span></span></div><p class="eyebrow">${escape(t('Unlisted room'))}</p><h1>${escape(entry.title)}</h1><p class="lead">${escape(entry.intro)}</p><div class="room-entries">${sections}</div></main><footer><a class="text-link" href="${languagePath(locale,'about/')}">${escape(t('About'))}</a><span>FROSTMOON</span></footer></div></body></html>`;
 return applyChrome(html,site,locale,'about-secret/',catalog);
}
