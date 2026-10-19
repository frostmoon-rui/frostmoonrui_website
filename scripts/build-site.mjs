import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {locales,htmlLanguages,escape,loadCatalog,localizeHtml,languagePath} from './i18n.mjs';
import {exportFood} from './food-export.mjs';
import {validateSite} from '../shared/site-schema.js';
import {applyChrome,aboutBody,friendsBody} from './site-chrome.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const catalog=loadCatalog(path.join(root,'content/ui.json'));
const site=validateSite(JSON.parse(read('content/site.json')));
const english=JSON.parse(read('content/pages.json'));
const source={en:english};
for(const locale of locales.filter(code=>code!=='en')){
 source[locale]=JSON.parse(read(`content/pages.${locale}.json`));
 if(JSON.stringify(source[locale].map(p=>p.path))!==JSON.stringify(english.map(p=>p.path)))throw new Error(`Incomplete ${locale} article catalog`);
}
const home=read('templates/home.html');
const atlas=read('templates/food-map.html').replace('</head>','<link rel="stylesheet" href="/assets/map-tools.css"></head>');
const notFound=read('templates/404.html');
const aside=home.match(/<aside class="sidebar"[^>]*>[\s\S]*?<\/aside>/)[0].replace('nav-link active','nav-link').replace(' aria-current="page"','').replace('href="#notes"','href="/#notes"');
const mobileNav=home.match(/<!--MOBILE_NAV_START-->([\s\S]*?)<!--MOBILE_NAV_END-->/)[1];
const footer=home.match(/<footer>[\s\S]*?<\/footer>/)[0];
function article(page){return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(page.title)} · Frostmoon</title><meta name="description" content="${escape(page.description)}"><meta name="theme-color" content="#eff3f6"><link rel="canonical" href="https://frostmoonrui.com/${page.path}/"><link rel="icon" href="/assets/moon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/site.css"><script src="/assets/site.js" defer></script></head><body><a class="skip" href="#main">Skip to content</a>${aside}<div class="page"><header class="topline"><a href="/">← BACK TO THE NOTEBOOK</a><a href="/food-map/">Food atlas ↗</a></header><main id="main" class="article-layout"><p class="eyebrow">${escape(page.label)}</p><h1>${escape(page.title)}</h1>${page.body}<p style="margin-top:45px"><a class="text-link" href="/">Back to the notebook ←</a></p></main>${footer}</div></body></html>\n`;}
function write(file,content){const destination=path.join(root,'dist',file);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,content.replace(/\\n$/,'\n'));}
write('food-map/index.json',JSON.stringify(exportFood(JSON.parse(read('content/food-spots.json'))),null,2)+'\n');
for(const locale of locales){
 const text=key=>catalog[locale][key]||key;
 const credits=source[locale].find(p=>p.path==='about').body.replace(/^<p class="lead">[\s\S]*?<\/p>/,'');
 const about=aboutBody(site,locale,catalog).replace('<section class="studio-entry">',`<section class="about-credits">${credits}</section><section class="studio-entry">`);
 const extra=[{path:'about',title:site.about[locale].title,label:text('A LITTLE INTRODUCTION'),description:site.about[locale].intro,body:about},{path:'links',title:text('Good company, on the open web.'),label:text('MY COMPANIONS'),description:text('Independent corners of the web, and the people who keep them growing.'),body:friendsBody(site,locale,catalog)}];
 const pages=[['',home],['food-map/',atlas],['404.html',notFound],['studio/',read('templates/studio.html')],...extra.map(p=>[p.path+'/',article(p)]),...source[locale].filter(p=>p.path!=='about').map(p=>[p.path+'/',article(p).replace('</main>',(['privacy','notes/a-map-with-boundaries'].includes(p.path)?'<p>Loading Amap contacts Amap servers; the security code stays on the server. OpenStreetMap remains an optional alternative.</p>':'')+'</main>')])];
 for(const [route,html] of pages){
  if(route.includes('..')||!/^([a-z/-]+|404\.html)$/.test(route||'/'))throw new Error('Invalid route');
  const leaf=route.endsWith('.html')?route:route+'index.html';
  const navigationHtml=html.includes('class="mobile-topbar"')?html:html.replace('<body>',`<body>${mobileNav}${html.includes('id="site-sidebar"')?'':`<div class="mobile-only-drawer">${aside}</div>`}`);
  const moduleHtml=navigationHtml.replace('<script src="/assets/site.js" defer>','<script type="module" src="/assets/site.js">');
  write(`${locale}/${leaf}`,applyChrome(localizeHtml(moduleHtml,locale,route,catalog),site,locale,route,catalog));
  if(locale==='en')write(leaf,applyChrome(localizeHtml(moduleHtml,locale,route,catalog,{defaultEntry:true}),site,locale,route,catalog));
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
write('assets/site-schema.js',read('shared/site-schema.js'));
write('assets/appearance.css',`:root{--accent:${site.appearance.accent};--gold:${site.appearance.highlight};--surface-radius:${site.appearance.radius}px}.dark{--accent:color-mix(in srgb,${site.appearance.accent} 50%,white)}\n`);
write('data/site.json',JSON.stringify(site,null,2)+'\n');
const routes=[...new Set(['','food-map/','about/','links/',...english.map(p=>p.path+'/')])];
const urls=[...routes.map(route=>'https://frostmoonrui.com/'+route),...locales.flatMap(code=>routes.map(route=>'https://frostmoonrui.com'+languagePath(code,route)))];
write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url=>`<url><loc>${url}</loc></url>`).join('')}</urlset>\n`);
console.log(`Built ${locales.length} complete site languages, ${urls.length} public routes and localized 404 pages.`);
