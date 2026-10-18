const paths=new Set(['/v4/map/styles','/v3/config/district','/v3/place/text','/v3/place/around','/v3/geocode/geo','/v3/geocode/regeo']);
const mapCsp="default-src 'self'; script-src 'self' 'unsafe-eval' https://webapi.amap.com https://*.amap.com https://*.autonavi.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.amap.com https://*.autonavi.com https://tile.openstreetmap.org; connect-src 'self' https://*.amap.com https://*.autonavi.com https://*.amap.com.cn https://*.amapcdn.com; worker-src 'self' blob:; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'; object-src 'none'; upgrade-insecure-requests";
function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});}
export function proxyTarget(url,env){
 const path=url.pathname.slice('/_AMapService'.length);
 if(!paths.has(path))throw new Error('Unsupported map service');
 const target=new URL(path,path==='/v4/map/styles'?'https://webapi.amap.com':'https://restapi.amap.com');
 target.search=url.search;
 target.searchParams.delete('jscode');target.searchParams.delete('key');
 target.searchParams.set('key',env.AMAP_JS_KEY);target.searchParams.set('jscode',env.AMAP_SECURITY_CODE);
 return target;
}
export async function handle(request,env,fetcher=fetch){
 const url=new URL(request.url);
 if(url.pathname==='/api/map-config'){
  if(request.method!=='GET')return json({error:'Method not allowed'},405);
  const missing=['AMAP_JS_KEY','AMAP_SECURITY_CODE'].filter(name=>!env[name]);
  if(missing.length)return json({configured:false,missing},503);
  return json({configured:true,key:env.AMAP_JS_KEY,serviceHost:url.origin+'/_AMapService'});
 }
 if(url.pathname.startsWith('/_AMapService/')){
  if(request.method!=='GET'||url.search.length>8192)return json({error:'Invalid map request'},400);
  let origin=request.headers.get('Origin');
  try{origin=origin||new URL(request.headers.get('Referer')).origin;}catch{}
  if(origin!==url.origin)return json({error:'Same-origin map requests only'},403);
  if(!env.AMAP_JS_KEY||!env.AMAP_SECURITY_CODE)return json({error:'Map configuration is incomplete'},503);
  let target;try{target=proxyTarget(url,env);}catch{return json({error:'Unsupported map service'},404);}
  try{
   const upstream=await fetcher(target,{method:'GET',redirect:'error',signal:AbortSignal.timeout(10000),headers:{Accept:'*/*'}});
   const headers=new Headers({'Content-Type':upstream.headers.get('Content-Type')||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':upstream.ok?'private, max-age=120':'no-store'});
   return new Response(upstream.body,{status:upstream.status,headers});
  }catch{return json({error:'Map provider unavailable'},502);}
 }
 if(!['GET','HEAD'].includes(request.method))return json({error:'Read-only website'},405);
 const asset=await env.ASSETS.fetch(request);
 const response=new Response(asset.body,asset);
 if(/^\/(?:zh\/|en\/|ru\/|ja\/)?food-map\/(?:index\.html)?$/.test(url.pathname))response.headers.set('Content-Security-Policy',mapCsp);
 if(url.pathname==='/food-map/index.json'){
  response.headers.set('Content-Type','application/json; charset=utf-8');
  response.headers.set('Access-Control-Allow-Origin','*');
  response.headers.set('Cache-Control','public, max-age=3600, stale-while-revalidate=86400');
 }
 return response;
}
export default {fetch:(request,env)=>handle(request,env)};
