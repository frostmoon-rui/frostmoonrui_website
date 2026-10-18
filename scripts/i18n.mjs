import fs from 'node:fs';
export const locales=['zh','en','ru','ja'];
export const htmlLanguages={zh:'zh-CN',en:'en',ru:'ru',ja:'ja'};
const languageLabels={zh:['ZH','中文'],en:['EN','English'],ru:['RU','Русский'],ja:['JA','日本語']};
export function escape(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function languagePath(locale,route=''){if(!locales.includes(locale)||route.includes('..')||route.startsWith('/'))throw new Error('Invalid localized route');return `/${locale}/${route}`;}
export function loadCatalog(file){const catalog=JSON.parse(fs.readFileSync(file,'utf8'));const expected=Object.keys(catalog.en).sort();for(const locale of locales){if(!catalog[locale]||JSON.stringify(Object.keys(catalog[locale]).sort())!==JSON.stringify(expected))throw new Error(`Incomplete ${locale} UI catalog`);for(const value of Object.values(catalog[locale]))if(typeof value!=='string'||!value.trim())throw new Error('Empty UI translation');}return catalog;}
export function languageBar(locale,route){const label={zh:'语言',en:'Language',ru:'Язык',ja:'言語'}[locale];return `<nav class="language-switch" aria-label="${label}">${locales.map(code=>`<a data-site-language="${code}" lang="${code}" hreflang="${htmlLanguages[code]}" href="${languagePath(code,route)}" aria-label="${languageLabels[code][1]}"${code===locale?' aria-current="page"':''}>${languageLabels[code][0]}</a>`).join('<span aria-hidden="true">/</span>')}</nav>`;}
export function localizeHtml(html,locale,route,catalog,{defaultEntry=false}={}){
 const dictionary=catalog[locale];
 const translate=value=>{const trimmed=value.trim();return dictionary[trimmed]===undefined?value:value.replace(trimmed,dictionary[trimmed]);};
 const parts=html.split(/(<[^>]+>)/g);
 const result=parts.map(part=>{
  if(!part.startsWith('<'))return translate(part);
  let tag=part.replace(/\b(alt|title|placeholder|aria-label|content)="([^"]*)"/g,(all,key,value)=>`${key}="${escape(dictionary[value]??value)}"`);
  tag=tag.replace(/\bhref="(\/(?!assets\/|data\/)[^"]*)"/g,(all,url)=>{
   if(url.startsWith('//')||url.endsWith('.json'))return all;
   return `href="${defaultEntry?url:languagePath(locale,url.slice(1))}"`;
  });
  if(tag.startsWith('<html '))tag=tag.replace(/lang="[^"]*"/,`lang="${htmlLanguages[locale]}" data-locale="${locale}"${defaultEntry?' data-default-entry="true"':''}`);
  return tag;
 }).join('');
 const canonical=`https://frostmoonrui.com${defaultEntry?'/'+route:languagePath(locale,route)}`;
 const alternates=locales.map(code=>`<link rel="alternate" hreflang="${htmlLanguages[code]}" href="https://frostmoonrui.com${languagePath(code,route)}">`).join('');
 return result.replace(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="${canonical}">${alternates}`)
  .replace(/(<main\b)/,languageBar(locale,route)+'$1');
}
