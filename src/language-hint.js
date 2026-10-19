// Resolve public page language before requesting HTML, never after first paint.
const languages=new Set(['zh','en','ru','ja']);
const pages=new Set(['','about','links','resources','studio','food-map','projects','privacy','about-secret','notes/a-quieter-bot','notes/recovering-a-prototype','notes/a-map-with-boundaries']);
export function languagePreference(request){
 const cookie=(request.headers.get('Cookie')||'').match(/(?:^|;\s*)frostmoon_language=(zh|en|ru|ja)(?:;|$)/)?.[1];
 if(cookie)return cookie;
 const choices=(request.headers.get('Accept-Language')||'').split(',').map((part,index)=>{
  const [tag,...parameters]=part.trim().toLowerCase().split(';');
  const quality=parameters.find(p=>p.trim().startsWith('q='));
  return {code:tag.split('-')[0],q:quality?Number(quality.trim().slice(2)):1,index};
 }).filter(item=>languages.has(item.code)&&Number.isFinite(item.q)&&item.q>0&&item.q<=1).sort((a,b)=>b.q-a.q||a.index-b.index);
 return choices[0]?.code||'en';
}
export function localizedAsset(request){
 const url=new URL(request.url);
 if(!['GET','HEAD'].includes(request.method))return null;
 const route=url.pathname.replace(/^\//,'').replace(/(?:\/index\.html|\/$)/,'');
 const page=route==='index.html'?'':route;
 if(!pages.has(page))return null;
 url.pathname='/'+languagePreference(request)+'/'+(page?page+'/':'');
 return url;
}
