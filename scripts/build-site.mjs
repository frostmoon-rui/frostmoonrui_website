import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {locales,htmlLanguages,escape,loadCatalog,localizeHtml,languagePath} from './i18n.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const catalog=loadCatalog(path.join(root,'content/ui.json'));
const english=JSON.parse(read('content/pages.json'));
const source={en:english};
for(const locale of locales.filter(code=>code!=='en')){
 source[locale]=JSON.parse(read(`content/pages.${locale}.json`));
 if(JSON.stringify(source[locale].map(p=>p.path))!==JSON.stringify(english.map(p=>p.path)))throw new Error(`Incomplete ${locale} article catalog`);
}
const home=read('templates/home.html');
const atlas=read('templates/food-map.html');
const notFound=read('templates/404.html');
const aside=home.match(/<aside class="sidebar">[\s\S]*?<\/aside>/)[0].replace('nav-link active','nav-link').replace(' aria-current="page"','').replace('href="#notes"','href="/#notes"');
const footer=home.match(/<footer>[\s\S]*?<\/footer>/)[0];
function article(page){return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(page.title)} · Frostmoon</title><meta name="description" content="${escape(page.description)}"><meta name="theme-color" content="#eff3f6"><link rel="canonical" href="https://frostmoonrui.com/${page.path}/"><link rel="icon" href="/assets/moon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/site.css"><script src="/assets/site.js" defer></script></head><body><a class="skip" href="#main">Skip to content</a>${aside}<div class="page"><header class="topline"><a href="/">← BACK TO THE NOTEBOOK</a><a href="/food-map/">Food atlas ↗</a></header><main id="main" class="article-layout"><p class="eyebrow">${escape(page.label)}</p><h1>${escape(page.title)}</h1>${page.body}<p style="margin-top:45px"><a class="text-link" href="/">Back to the notebook ←</a></p></main>${footer}</div></body></html>\n`;}
function write(file,content){const destination=path.join(root,'dist',file);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,content.replace(/\\n$/,'\n'));}
for(const locale of locales){
 const pages=[['',home],['food-map/',atlas],['404.html',notFound],...source[locale].map(p=>[p.path+'/',article(p)])];
 for(const [route,html] of pages){
  if(route.includes('..')||!/^([a-z/-]+|404\.html)$/.test(route||'/'))throw new Error('Invalid route');
  const leaf=route.endsWith('.html')?route:route+'index.html';
  const moduleHtml=html.replace('<script src="/assets/site.js" defer>','<script type="module" src="/assets/site.js">');
  write(`${locale}/${leaf}`,localizeHtml(moduleHtml,locale,route,catalog));
  if(locale==='en')write(leaf,localizeHtml(moduleHtml,locale,route,catalog,{defaultEntry:true}));
 }
}
const runtime=[
 '// Generated from the complete authored UI catalogs.',
 `export const catalog=${JSON.stringify(catalog)};`,
 "export const locale=typeof document==='undefined'?'en':(document.documentElement.dataset.locale||'en');",
 "export function translate(key,params={},code=locale){let text=catalog[code]?.[key]??catalog.en[key]??key;return text.replace(/\\{(\\w+)\\}/g,(_,name)=>Object.hasOwn(params,name)?String(params[name]):'{'+name+'}');}",
 ''
].join('\n');
write('assets/i18n.js',runtime);
const routes=['','food-map/',...english.map(p=>p.path+'/')];
const urls=[...routes.map(route=>'https://frostmoonrui.com/'+route),...locales.flatMap(code=>routes.map(route=>'https://frostmoonrui.com'+languagePath(code,route)))];
write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url=>`<url><loc>${url}</loc></url>`).join('')}</urlset>\n`);
console.log(`Built ${locales.length} complete site languages, ${urls.length} public routes and localized 404 pages.`);
