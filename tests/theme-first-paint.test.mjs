import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {handle} from '../src/worker.js';
import {themePreference,stampTheme} from '../src/theme-hint.js';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
function boot({saved=null,hint,system=false,blocked=false}={}){
 const root={dataset:{...(hint?{theme:hint}:{})}},document={documentElement:root,cookie:''};
 vm.runInNewContext(read('dist/assets/theme-init.js'),{document,localStorage:{getItem(){if(blocked)throw Error('Unavailable');return saved;}},matchMedia:()=>({matches:system}),location:{protocol:'https:'}});
 return {root,cookie:document.cookie};
}
test('saved theme wins before body parsing, even against system or server preference',()=>{assert.equal(boot({saved:'dark'}).root.dataset.theme,'dark');assert.equal(boot({saved:'light',hint:'dark',system:true}).root.dataset.theme,'light');assert.equal(boot({saved:'invalid',system:true}).root.dataset.theme,'dark');});
test('blocked storage falls back to the validated server hint or system theme',()=>{assert.equal(boot({blocked:true,hint:'dark'}).root.dataset.theme,'dark');assert.equal(boot({blocked:true,system:true}).root.dataset.theme,'dark');assert.equal(boot({blocked:true}).root.dataset.theme,'light');assert.match(boot({saved:'dark'}).cookie,/^frostmoon_theme=dark; Path=\/;.*SameSite=Lax; Secure$/);});
test('theme cookie accepts only literal dark and light values',()=>{for(const theme of ['dark','light'])assert.equal(themePreference(new Request('https://example.org',{headers:{Cookie:'other=1; frostmoon_theme='+theme+'; last=2'}})),theme);for(const value of ['darkness','dark%22','<script>','light;x=1;frostmoon_theme=bad'])assert.equal(themePreference(new Request('https://example.org',{headers:{Cookie:'frostmoon_theme='+value}})),value.startsWith('light;')?'light':null);});
test('server HTML starts with matching root and browser canvas theme hints',()=>{const html='<html lang="en"><head><meta name="color-scheme" content="light dark"><meta name="theme-color" content="#eff3f6"></head><body>Page</body></html>';const dark=stampTheme(html,'dark');assert.match(dark,/<html lang="en" data-theme="dark">/);assert.match(dark,/color-scheme" content="dark"/);assert.match(dark,/#17242d/);assert.equal(stampTheme(html,'invalid'),html);assert.equal((stampTheme(dark,'light').match(/data-theme=/g)||[]).length,1);});
test('personalized HTML cannot leak through shared cache and keeps security headers',async()=>{
 const page='<html><head><meta name="color-scheme" content="light dark"></head><body>Hello</body></html>';
 const env={ASSETS:{fetch:async()=>new Response(page,{headers:{'Content-Type':'text/html; charset=utf-8','Content-Length':String(page.length),ETag:'fixture','Content-Security-Policy':"script-src 'self'"}})}};
 const response=await handle(new Request('https://frostmoonrui.com/zh/',{headers:{Cookie:'frostmoon_theme=dark'}}),env);assert.match(await response.text(),/data-theme="dark"/);assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.equal(response.headers.get('Vary'),'Cookie');assert.equal(response.headers.get('ETag'),null);assert.equal(response.headers.get('Content-Length'),null);assert.equal(response.headers.get('Content-Security-Policy'),"script-src 'self'");
 const head=await handle(new Request('https://frostmoonrui.com/zh/',{method:'HEAD',headers:{Cookie:'frostmoon_theme=light'}}),env);assert.equal(await head.text(),'');
});
test('rewritten HTML removes stale compression headers and preserves existing vary keys',async()=>{
 const env={ASSETS:{fetch:async()=>new Response('<html><body>Page</body></html>',{headers:{'Content-Type':'text/html','Content-Encoding':'gzip',Vary:'Accept-Encoding'}})}};
 const response=await handle(new Request('https://frostmoonrui.com/',{headers:{Cookie:'frostmoon_theme=dark'}}),env);assert.equal(response.headers.get('Content-Encoding'),null);assert.equal(response.headers.get('Vary'),'Accept-Encoding, Cookie');assert.match(await response.text(),/data-theme="dark"/);
});
test('every language loads synchronous theme initialization before page CSS and modules',()=>{
 for(const code of ['en','zh','ru','ja'])for(const route of ['','about/','links/','studio/','food-map/','projects/']){const html=read(`dist/${code}/${route}index.html`);assert.ok(html.indexOf('/assets/theme-base.css')<html.indexOf('/assets/site.css'));assert.ok(html.indexOf('/assets/theme-init.js')<html.indexOf('/assets/site.css'));const tag=html.match(/<script[^>]*src="\/assets\/theme-init.js"[^>]*>/)[0];assert.doesNotMatch(tag,/\bdefer\b|\basync\b|type="module"/);assert.match(tag,/data-cfasync="false"/);}
 const css=read('dist/assets/theme-base.css');assert.match(css,/:root\[data-theme=dark\]/);assert.match(css,/view-transition-new\(root\)\{clip-path:circle\(0px/);assert.match(read('dist/assets/theme.js'),/fill:'forwards'/);
});
test('portrait, compact icon and public backlink metadata use their intended distinct assets',()=>{
 assert.notDeepEqual(fs.readFileSync(new URL('../dist/assets/avatar-portrait.jpg',import.meta.url)),fs.readFileSync(new URL('../dist/assets/avatar-cute.jpg',import.meta.url)));
 assert.deepEqual(fs.readFileSync(new URL('../dist/favicon.jpg',import.meta.url)),fs.readFileSync(new URL('../dist/assets/avatar-cute.jpg',import.meta.url)));
 const page=read('dist/zh/index.html');assert.match(page,/class="avatar" src="\/assets\/avatar-portrait.jpg" width="88"/);assert.match(page,/class="avatar" src="\/assets\/avatar-cute.jpg" width="36"/);assert.match(page,/rel="icon" href="\/favicon.jpg" type="image\/jpeg"/);assert.match(page,/og:image" content="https:\/\/frostmoonrui.com\/assets\/avatar-cute.jpg"/);assert.doesNotMatch(page,/src="\/assets\/moon.svg"/);
 assert.equal(JSON.parse(read('dist/food-map/index.json')).owner.avatar,'https://frostmoonrui.com/assets/avatar-cute.jpg');
});
