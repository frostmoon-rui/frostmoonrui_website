import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {locales,htmlLanguages,escape,loadCatalog,localizeHtml,languagePath} from './i18n.mjs';
import {exportFood,foodNotePath} from './food-export.mjs';
import {documents,validateSite,validateDocument,surfaceCornerRadius,articleDate,foodArticle,foodLanguage} from '../shared/site-schema.js';
import {resourcesBody,applicationBody,deskBody} from './community-pages.mjs';
import {secretPage} from './secret-page.mjs';
import {buildNotebook,topicPaths} from './notebook.mjs';
import {archivePages,archiveTitle} from './legacy-archive.mjs';
import {applyChrome,aboutBody,friendsBody} from './site-chrome.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const catalog=loadCatalog(path.join(root,'content/ui.json'));
const site=validateSite(JSON.parse(read('content/site.json')));
const legacy=JSON.parse(read('content/legacy-archive.json'));
const room=validateDocument('room',JSON.parse(read('content/about-secret.json')));
const taxonomy=validateDocument('taxonomy',JSON.parse(read('content/taxonomy.json')));
const resources=validateDocument('resources',JSON.parse(read('content/resources.json')));
const english=JSON.parse(read('content/pages.json'));
const source={en:english};
for(const locale of locales.filter(code=>code!=='en')){
 source[locale]=JSON.parse(read(`content/pages.${locale}.json`));
 if(JSON.stringify(source[locale].map(p=>p.path))!==JSON.stringify(english.map(p=>p.path)))throw new Error(`Incomplete ${locale} article catalog`);
}
const astrofall=read('templates/astrofall.html');
const astrofallShell={
 zh:['星坠天文台','正在初始化星图…','返回公测文章'],
 en:['Astrofall Observatory','Preparing the star map…','Back to the playtest article'],
 ru:['Обсерватория «Звездопад»','Подготовка звёздной карты…','Назад к статье о тестировании'],
 ja:['星墜の天文台','星図を準備しています…','プレイテスト記事に戻る']
};
const nightGame=read('templates/night-observatory.html');
const nightWorker=read('templates/night-observatory-sw.js');
const nightManifest=JSON.parse(read('templates/night-observatory.webmanifest'));
const nightAssets=[...nightGame.matchAll(/(?:href|src)="((?:js\/|icons\/)[^"]+|style\.css)"/g)]
 .map(match=>match[1]);
const nightRevision=createHash('sha256').update(nightGame).update(nightWorker)
 .update(JSON.stringify(nightManifest))
 .update(nightAssets.map(asset=>read('dist/assets/night-observatory/'+asset)).join('')).digest('hex').slice(0,12);
const nightAsset=asset=>'/assets/night-observatory/'+asset+'?v='+nightRevision;
const nightTitles={
 zh:['夜间天文台','用落地冲量、光线和重力探索 38 间房。','返回公测文章','经典版 · 16 室'],
 en:['The Night Observatory','Explore 38 rooms using impact, light, and gravity.','Back to the playtest article','Classic edition · 16 rooms'],
 ru:['Ночная обсерватория','Исследуйте 38 комнат, используя силу падения, свет и гравитацию.','Назад к статье о тестировании','Классическая версия · 16 комнат'],
 ja:['夜の天文台','着地の衝撃、光、重力を使って38の部屋を探索。','プレイテスト記事に戻る','クラシック版 · 全16室'],
};
function writeNightGame(prefix, locale) {
 const [title,description,notes,classic]=nightTitles[locale];
 const route=prefix+'play/astrofall/';
 const hrefs='<nav class="title-links"><a href="'+languagePath(locale,'notes/astrofall-playtest/')+'">'+escape(notes)+'</a><a href="'+languagePath(locale,'play/astrofall/classic/')+'">'+escape(classic)+'</a></nav>';
 const html=nightGame
  .replace('<html lang="en" data-locale="en">','<html lang="'+htmlLanguages[locale]+'" data-locale="'+locale+'">')
  .replace(/<title>[^<]*<\/title>/,'<title>'+escape(title)+'</title>')
  .replace(/(<meta name="description" content=")[^"]*/,(_,start)=>start+escape(description))
  .replace(/(aria-label=")夜间天文台游戏画面"/,(_,start)=>start+escape(title)+'"')
  .replace('href="manifest.webmanifest"','href="./manifest.webmanifest"')
  .replace(/(href|src)="((?:js\/|icons\/)[^"]+|style\.css)"/g,(_,attr,asset)=>attr+'="'+nightAsset(asset)+'"')
  .replace('<!--OBSERVATORY_LINKS-->',hrefs);
 write(route+'index.html',html);
 write(route+'sw.js',nightWorker.replace('__REVISION__',nightRevision).replace('__PRECACHE__',JSON.stringify(nightAssets.map(nightAsset))));
 write(route+'manifest.webmanifest',JSON.stringify({...nightManifest,name:title,short_name:title,description,lang:htmlLanguages[locale],
  start_url:'./',icons:nightManifest.icons.map(icon=>({...icon,src:nightAsset(icon.src)}))},null,2)+'\n');
}
const home=read('templates/home.html');
const atlas=read('templates/food-map.html').replace('</head>','<link rel="stylesheet" href="/assets/map-tools.css"></head>');
const notFound=read('templates/404.html');
const aside=home.match(/<aside class="sidebar"[^>]*>[\s\S]*?<\/aside>/)[0].replace('nav-link active','nav-link').replace(' aria-current="page"','').replace('href="#notes"','href="/#notes"');
const mobileNav=home.match(/<!--MOBILE_NAV_START-->([\s\S]*?)<!--MOBILE_NAV_END-->/)[1];
const footer=home.match(/<footer>[\s\S]*?<\/footer>/)[0];
function article(page){return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(page.title)} · Frostmoon</title><meta name="description" content="${escape(page.description)}"><meta name="theme-color" content="#eff3f6"><link rel="canonical" href="https://frostmoonrui.com/${page.path}/"><link rel="icon" href="/assets/moon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/site.css"><script src="/assets/site.js" defer></script></head><body><a class="skip" href="#main">Skip to content</a>${aside}<div class="page"><header class="topline"><a href="/">← BACK TO THE NOTEBOOK</a><a href="/food-map/">Food atlas ↗</a></header><main id="main" class="article-layout"><p class="eyebrow">${escape(page.label)}</p><h1>${escape(page.title)}</h1>${page.body}<p style="margin-top:45px"><a class="text-link" href="/">Back to the notebook ←</a></p></main>${footer}</div></body></html>\n`;}
function write(file,content){const destination=path.join(root,'dist',file);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,content.replace(/\\n$/,'\n'));}
const food=JSON.parse(read('content/food-spots.json'));
const foodFeed=exportFood(food);
write('food-map/index.json',JSON.stringify(foodFeed,null,2)+'\n');
const foodNotes=new Map();
const foodTranslations=JSON.parse(read('content/food-translations.json'));
for(const spot of food.spots){
 const [venue]=exportFood({...food,spots:[spot]}).spots;
 const original=spot.note??'';
 const translation=foodTranslations[venue.id];
 const translated=translation?.sourceHash===createHash('sha256').update(original).digest('hex')?translation:null;
 foodNotes.set(foodNotePath(venue.id),{venue,...foodArticle(spot),categories:spot.notebookCategories??[],translated,localLanguage:foodLanguage(spot.localLanguage),localNote:spot.localNote??''});
}
// Only remove obsolete article files generated by this source collection.
for(const prefix of ['',...locales.map(locale=>`${locale}/`)]){
 const folder=path.join(root,'dist',prefix,'notes','food');
 if(!fs.existsSync(folder))continue;
 for(const entry of fs.readdirSync(folder,{withFileTypes:true})){
  if(!entry.isDirectory()||!/^[a-f0-9]{24}$/.test(entry.name)||foodNotes.has(foodNotePath(entry.name)))continue;
  fs.rmSync(path.join(folder,entry.name,'index.html'),{force:true});
 }
}
for(const locale of locales){
 const [gameTitle,loading,returnToNotes]=astrofallShell[locale];
 const game=astrofall
  .replace('<html lang="zh-CN" data-locale="zh">',`<html lang="${htmlLanguages[locale]}" data-locale="${locale}">`)
  .replace(/<title>[^<]*<\/title>/,`<title>${escape(gameTitle)}</title>`)
  .replace(/(id="loader-title">)[^<]*/,`$1${escape(gameTitle)}`)
  .replace(/(id="loader-status">)[^<]*/,`$1${escape(loading)} 0%`)
  .replace('<!--PUBLIC_TEST_NOTES-->',`<a class="test-notes-link" href="${languagePath(locale,'notes/astrofall-playtest/')}">${escape(returnToNotes)}</a>`);
 write(`${locale}/play/astrofall/classic/index.html`,game);
 writeNightGame(`${locale}/`,locale);
 if(locale==='en'){
  write('play/astrofall/classic/index.html',game);
  writeNightGame('',locale);
 }
 const roomHtml=secretPage(room,site,locale,catalog);
 write(`${locale}/about-secret/index.html`,roomHtml);
 if(locale==='en')write('about-secret/index.html',roomHtml);
 for(const page of archivePages(legacy,locale)){
  const html=article({...page,path:page.route.slice(0,-1)})
   .replace('<head>','<head><meta name="robots" content="noindex, nofollow"><link rel="stylesheet" href="/assets/legacy.css">')
   .replace('class="article-layout"','class="article-layout legacy-layout"')
   .replace('<h1>',page.lang?`<h1 lang="${page.lang}">`:'<h1>')
   .replace('width=device-width,initial-scale=1',page.route==='legacy/platform/'?'width=device-width,initial-scale=1,viewport-fit=cover':'width=device-width,initial-scale=1');
  const navigationHtml=html.replace('<body>',`<body>${mobileNav}`)
   .replace('<script src="/assets/site.js" defer>','<script type="module" src="/assets/site.js">');
  const render=(options)=>applyChrome(localizeHtml(navigationHtml,locale,page.route,catalog,options),site,locale,page.route,catalog);
  write(`${locale}/${page.route}index.html`,render());
  if(locale==='en')write(`${page.route}index.html`,render({defaultEntry:true}));
 }
 const text=key=>catalog[locale][key]||key;
 const credits=source[locale].find(p=>p.path==='about').body.replace(/^<p class="lead">[\s\S]*?<\/p>/,'');
 const about=aboutBody(site,locale,catalog).replace('<section class="studio-entry">',`<section class="about-credits">${credits}</section><p><a class="text-link" href="${languagePath(locale,'legacy/')}">${escape(archiveTitle[locale])} <span aria-hidden="true">›</span></a></p><section class="studio-entry">`);
 const extra=[{path:'about',title:site.about[locale].title,label:text('A LITTLE INTRODUCTION'),description:site.about[locale].intro,body:about},{path:'links',title:text('Good company, on the open web.'),label:text('MY COMPANIONS'),description:text('Independent corners of the web, and the people who keep them growing.'),body:friendsBody(site,locale,catalog)}];
 extra[1].body+=applicationBody(locale,catalog);
 extra.push({path:'resources',title:text('Recommended links'),label:text('Resource collection'),description:text('A small shelf of useful places.'),body:resourcesBody(resources,locale,catalog)});
 const dateFormat=new Intl.DateTimeFormat(htmlLanguages[locale],{dateStyle:'medium',timeZone:'UTC'});
 const time=date=>date?`<time datetime="${date}">${escape(dateFormat.format(new Date(date)))}</time>`:'';
 const notebook=buildNotebook(source[locale],foodNotes,taxonomy.members,text,time,htmlLanguages[locale]);
 const categoryPages=notebook.sections.map(page=>[page.path+'/',article({...page,label:text('Blog articles'),description:page.title})
  .replace('class="article-layout"','class="article-layout note-directory"')]);
 const venuePages=[...foodNotes].map(([route,{venue,note,date,translated,localLanguage,localNote}])=>{
  const country=venue.countryCode?new Intl.DisplayNames([htmlLanguages[locale]],{type:'region'}).of(venue.countryCode):'';
  const description=[country,venue.city,venue.address].filter(Boolean).join(' · ');
  const details=[['Price',venue.price],['Rating',venue.rating]].filter(([,value])=>value!=null)
   .map(([label,value])=>`<li>${escape(text(label))} · ${escape(value)}</li>`).join('');
  const localizedNote=translated?.[locale]??note;
  const localLabel=localLanguage?new Intl.DisplayNames([localLanguage],{type:'language'}).of(localLanguage):'';
  const body=`<p class="lead" lang="zh-CN">${escape(description)}</p>${time(date)}${notebook.topics(route)}`+
   (localizedNote.trim()?`<div lang="${translated?.[locale]?htmlLanguages[locale]:'zh-CN'}" style="white-space:pre-wrap">${escape(localizedNote)}</div>`:'')+
   (localLabel&&localNote.trim()?`<section lang="${escape(localLanguage)}"><h2>${escape(localLabel)}</h2><div style="white-space:pre-wrap">${escape(localNote)}</div></section>`:'')+
   (details?`<ul>${details}</ul>`:'')+
   (venue.amapUrl?`<p><a class="text-link" href="${escape(venue.amapUrl)}">${escape(text('Amap'))} ↗</a></p>`:'')+
   `<p><a class="text-link" href="/food-map/">${escape(text('Food atlas'))} ↗</a></p>`+notebook.related(route);
  return [route+'/',article({path:route,title:venue.name,label:text('Food atlas'),description,body})];
 });
 const pages=[['',home],...categoryPages,...venuePages,['food-map/',atlas],['404.html',notFound],['studio/',read('templates/studio.html')],...extra.map(p=>[p.path+'/',p.path==='about'?article(p).replace('class="article-layout"','class="article-layout about-layout"'):article(p)]),...source[locale].filter(p=>p.path!=='about').map(p=>[p.path+'/',article({...p,body:time(articleDate(p))+notebook.topics(p.path)+(p.path==='projects'?notebook.decorateProjects(p.body):p.body)+notebook.related(p.path)}).replace('</main>',(['privacy','notes/a-map-with-boundaries'].includes(p.path)?'<p>Loading Amap contacts Amap servers; the security code stays on the server. OpenStreetMap remains an optional alternative.</p>':'')+'</main>')])];
 for(const [route,html] of pages){
  if(route.includes('..')||!/^([a-z/-]+|404\.html)$/.test(route||'/')&&!foodNotes.has(route.slice(0,-1)))throw new Error('Invalid route');
  const leaf=route.endsWith('.html')?route:route+'index.html';
  const navigationHtml=html.includes('class="mobile-topbar"')?html:html.replace('<body>',`<body>${mobileNav}${html.includes('id="site-sidebar"')?'':`<div class="mobile-only-drawer">${aside}</div>`}`);
  let moduleHtml=navigationHtml.replace('<script src="/assets/site.js" defer>','<script type="module" src="/assets/site.js">');
  if(route==='studio/')moduleHtml=moduleHtml.replace('</section></main>',deskBody(locale,catalog)+'</section></main>');
  const render=(options)=>{
   const page=applyChrome(localizeHtml(moduleHtml,locale,route,catalog,options),site,locale,route,catalog);
   return route==='notes/astrofall-playtest/'?page.replace('</head>','<style>@view-transition{navigation:none}</style></head>'):page;
  };
  write(`${locale}/${leaf}`,render());
  if(locale==='en')write(leaf,render({defaultEntry:true}));
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
write('assets/appearance.css',`:root{--accent:${site.appearance.accent};--gold:${site.appearance.highlight};--surface-radius:${surfaceCornerRadius(site.appearance.radius)}px}.dark{--accent:color-mix(in srgb,${site.appearance.accent} 50%,white)}\n`);
for(const [key,file] of Object.entries(documents)){const content=read(file);const value=JSON.parse(content);validateDocument(key,value,value);write('__studio/'+key+'.json',content);}
write('data/site.json',JSON.stringify(site,null,2)+'\n');
write('data/bot-site.json',JSON.stringify({schemaVersion:1,origin:'https://frostmoonrui.com',pages:{home:'',about:'about/',friends:'links/',resources:'resources/',food:'food-map/',projects:'projects/'},locales,resources:resources.links},null,2)+'\n');
const routes=[...new Set(['','notes/',...topicPaths.map(route=>route+'/'),'food-map/','about/','links/','resources/',...english.map(p=>p.path+'/'),...[...foodNotes.keys()].map(route=>route+'/')])];
const urls=[...routes.map(route=>'https://frostmoonrui.com/'+route),...locales.flatMap(code=>routes.map(route=>'https://frostmoonrui.com'+languagePath(code,route)))];
write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url=>`<url><loc>${url}</loc></url>`).join('')}</urlset>\n`);
console.log(`Built ${locales.length} complete site languages, ${urls.length} public routes and localized 404 pages.`);
