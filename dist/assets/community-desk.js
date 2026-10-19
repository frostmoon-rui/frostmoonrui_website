import {translate as t} from './i18n.js';
const $=id=>document.getElementById(id),host=$('review-queue');
let epoch=0,controller=null,dirty=false,reviewBusy=false,page=0;
function node(tag,text){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el;}
function locked(){epoch++;controller?.abort();host?.replaceChildren();$('studio-health')?.replaceChildren();if($('review-status'))$('review-status').textContent='';dirty=false;}
async function api(path,options={},signal){const r=await fetch('/api/studio/'+path,{...options,credentials:'same-origin',cache:'no-store',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000)});const data=await r.json();if(!r.ok)throw Error(String(r.status));return data;}
function input(parent,label,value,textarea=false){const wrap=node('label',label),field=node(textarea?'textarea':'input');field.value=value||'';field.maxLength=textarea?400:1000;field.addEventListener('input',()=>{dirty=true;});wrap.append(field);parent.append(wrap);return field;}
async function refresh(){
 if(!host||reviewBusy)return;
 if(dirty&&!confirm(t('Discard unsaved changes? Export first if you need a copy.')))return;
 const current=++epoch;controller?.abort();controller=new AbortController();const signal=controller.signal;
 try{
  const session=await api('session',{},signal);if(!session.authenticated){locked();return;}
  const [health,queue]=await Promise.all([api('health',{},signal),api('community?status='+$('review-filter').value+'&page='+page,{},signal).catch(()=>null)]);
  if(current!==epoch)return;host.replaceChildren();$('studio-health').replaceChildren();dirty=false;
  for(const [key,label] of [['database','Private review database'],['applicationProtection','Application rate protection'],['githubPublishing','GitHub token configured'],['map','Amap configuration']]){const row=node('div');row.className='health-line';row.append(node('span',t(label)),node('strong',t(health[key]?'Ready':'Not configured')));$('studio-health').append(row);}
  const feed=node('a',t('Public bot feed'));feed.href='/data/bot-site.json';feed.className='text-link';feed.target='_blank';feed.rel='noopener';$('studio-health').append(feed);
  if(!queue){$('review-status').textContent=t('Applications are not open yet. The owner needs to connect the private review database.');return;}
  $('review-prev').disabled=page===0;$('review-next').disabled=queue.applications.length<100;
  $('review-status').textContent=queue.applications.length?'':t('No applications in this view.');
  for(const item of queue.applications){
   const card=node('article');card.className='review-card';card.append(node('p',item.id+' · '+item.created_at),node('p',item.description));
   if(item.icon_url)card.append(node('p',t('Public icon URL (optional)')+': '+item.icon_url));
   let published={};try{published=JSON.parse(item.publication_json||'{}');}catch{}
   const name=input(card,t('Website name'),published.name||item.name),url=input(card,t('Website URL'),published.url||item.url),links=input(card,t('Friend page URL (optional)'),published.linksUrl||item.links_url||item.url),descriptions={};
   for(const code of ['zh','en','ru','ja'])descriptions[code]=input(card,code.toUpperCase()+' · '+t('Short public description'),published.description?.[code]||(item.locale===code?item.description:''),true);
   const actions=node('div');actions.className='review-actions';
   for(const [status,label] of [['approved','Approve and publish'],['rejected','Reject or withdraw'],['pending','Return to pending']]){const button=node('button',t(label));button.type='button';button.addEventListener('click',async()=>{
    if(reviewBusy)return;if(status==='approved'&&Object.values(descriptions).some(field=>!field.value.trim())){$('review-status').textContent=t('Complete all four descriptions before approving.');return;}
    if(!confirm(t('Confirm this review change? Approved information becomes public immediately.')))return;
    reviewBusy=true;for(const b of host.querySelectorAll('button'))b.disabled=true;
    try{await api('community',{method:'POST',headers:{'Content-Type':'application/json','X-Studio-CSRF':session.csrf},body:JSON.stringify({id:item.id,version:item.version,status,publication:{name:name.value,url:url.value,linksUrl:links.value,description:Object.fromEntries(Object.entries(descriptions).map(([code,field])=>[code,field.value]))}})},signal);if(current!==epoch)return;dirty=false;$('review-status').textContent=t('Review saved.');reviewBusy=false;await refresh();}catch{if(current===epoch)$('review-status').textContent=t('Review conflicts or service errors require a refresh. No draft was automatically published.');}finally{reviewBusy=false;for(const b of host.querySelectorAll('button'))b.disabled=false;}
   });actions.append(button);}card.append(actions);host.append(card);
  }
 }catch{if(current===epoch)$('review-status').textContent=t('Review conflicts or service errors require a refresh. No draft was automatically published.');}
}
if(host){for(const id of ['review-refresh','health-refresh'])$(id).addEventListener('click',refresh);$('review-filter').addEventListener('change',()=>{page=0;refresh();});$('review-prev').addEventListener('click',()=>{if(page>0&&(!dirty||confirm(t('Discard unsaved changes? Export first if you need a copy.')))){dirty=false;page--;refresh();}});$('review-next').addEventListener('click',()=>{if(!dirty||confirm(t('Discard unsaved changes? Export first if you need a copy.'))){dirty=false;page++;refresh();}});$('studio-logout').addEventListener('click',event=>{if(dirty&&!confirm(t('Discard unsaved changes? Export first if you need a copy.'))){event.stopImmediatePropagation();event.preventDefault();}},true);window.addEventListener('studio-unlocked',refresh);window.addEventListener('studio-locked',locked);window.addEventListener('pagehide',locked);window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});refresh();}
