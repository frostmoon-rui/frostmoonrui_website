import {documents,validateDocument} from '../shared/site-schema.js';
import {readRepository,readDeployedDocument,diagnoseRepository,repositoryMessages as readMessages,repositoryError as readError,repositoryHeaders as headers,repositoryToken as tokenFor} from './studio-repository.js';
const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
const cookieName='__Host-frostmoon_studio',lifetime=3600,maxBody=300000;
const github='https://api.github.com/repos/frostmoon-rui/frostmoonrui_website/contents/';
function reply(data,status=200,extra={}){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow',...extra}});}
function base64(bytes){let value='';for(const byte of bytes)value+=String.fromCharCode(byte);return btoa(value);}
function unbase64(value){return Uint8Array.from(atob(value),c=>c.charCodeAt(0));}
const toUrl=bytes=>base64(bytes).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const fromUrl=value=>unbase64(value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4));
const ready=env=>typeof env.ADMIN_PASSWORD==='string'&&env.ADMIN_PASSWORD.length>=16&&env.ADMIN_PASSWORD.length<=256&&typeof env.ADMIN_SESSION_SECRET==='string'&&env.ADMIN_SESSION_SECRET.length>=32;
async function keyFor(env){return crypto.subtle.importKey('raw',encoder.encode(env.ADMIN_SESSION_SECRET+'\0'+env.ADMIN_PASSWORD),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
async function digest(value){return new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value)));}
async function samePassword(a,b){const x=await digest(a),y=await digest(b);let difference=0;for(let i=0;i<x.length;i++)difference|=x[i]^y[i];return difference===0;}
export async function createSession(env,origin,now=Math.floor(Date.now()/1000)){
 const data={v:1,sub:'owner',aud:origin,iat:now,exp:now+lifetime,csrf:toUrl(crypto.getRandomValues(new Uint8Array(24)))};
 const payload=toUrl(encoder.encode(JSON.stringify(data)));
 const signature=toUrl(new Uint8Array(await crypto.subtle.sign('HMAC',await keyFor(env),encoder.encode(payload))));
 return {token:payload+'.'+signature,data};
}
export async function readSession(request,env,now=Math.floor(Date.now()/1000)){
 if(!ready(env))return null;
 try{const token=(request.headers.get('Cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName+'='))?.slice(cookieName.length+1);if(!token||token.length>2048)return null;const parts=token.split('.');if(parts.length!==2)return null;if(!await crypto.subtle.verify('HMAC',await keyFor(env),fromUrl(parts[1]),encoder.encode(parts[0])))return null;const value=JSON.parse(decoder.decode(fromUrl(parts[0])));if(value.v!==1||value.sub!=='owner'||value.aud!==new URL(request.url).origin||!Number.isInteger(value.exp)||!Number.isInteger(value.iat)||value.exp<=now||value.iat>now+30||value.exp-value.iat!==lifetime||typeof value.csrf!=='string')return null;return value;}catch{return null;}
}
const cookie=(token,age=lifetime)=>`${cookieName}=${token}; Path=/; Max-Age=${age}; HttpOnly; Secure; SameSite=Strict`;
async function boundedJson(source,limit=maxBody){const length=source.headers.get('Content-Length');if(length&&(Number(length)>limit||Number(length)<0))throw new Error('Request too large');const reader=source.body?.getReader();if(!reader)throw new Error('Missing JSON body');const pieces=[];let size=0;try{while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;if(size>limit)throw new Error('Request too large');pieces.push(chunk.value);}}finally{await reader.cancel().catch(()=>{});}const joined=new Uint8Array(size);let offset=0;for(const piece of pieces){joined.set(piece,offset);offset+=piece.length;}return JSON.parse(decoder.decode(joined));}
function readFailure(error){const safe=Object.hasOwn(readMessages,error?.code)?error:readError('github-response-invalid');return reply({error:safe.message,code:safe.code,operation:'read',...(safe.upstreamStatus?{upstreamStatus:safe.upstreamStatus}:{})},502);}
const readDocument=(key,env,fetcher,fallback=false)=>readRepository(key,env,fetcher,{fallback});
export async function handleStudio(request,env,fetcher=fetch){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/studio/'))return null;
 if(url.protocol!=='https:')return reply({error:'HTTPS required'},400);
 if(!['GET','POST','PUT'].includes(request.method))return reply({error:'Method not allowed'},405);
 const writing=request.method!=='GET';
 if(writing&&(request.headers.get('Origin')!==url.origin||!request.headers.get('Content-Type')?.startsWith('application/json')))return reply({error:'Same-origin JSON requests only'},403);
 const session=await readSession(request,env);
 if(path==='/api/studio/session'&&request.method==='GET')return reply({configured:ready(env),authenticated:!!session,canPublish:!!tokenFor(env),documents:Object.keys(documents),...(session?{csrf:session.csrf,expiresAt:session.exp}:{})});
 if(path==='/api/studio/login'&&request.method==='POST'){
  if(!ready(env)||!env.ADMIN_LOGIN_LIMIT?.limit)return reply({error:'Studio configuration is incomplete'},503);
  let limited;try{limited=await env.ADMIN_LOGIN_LIMIT.limit({key:'frostmoon-studio:'+toUrl(await digest(request.headers.get('CF-Connecting-IP')||'anonymous'))});}catch{return reply({error:'Login protection unavailable'},503);}
  if(!limited.success)return reply({error:'Too many login attempts; try again in one minute'},429,{'Retry-After':'60'});
  let data;try{data=await boundedJson(request,4096);}catch{return reply({error:'Invalid login request'},400);}
  if(typeof data.password!=='string'||data.password.length>256||!await samePassword(data.password,env.ADMIN_PASSWORD))return reply({error:'Incorrect password'},401);
  const created=await createSession(env,url.origin);return reply({authenticated:true,csrf:created.data.csrf,expiresAt:created.data.exp,canPublish:!!tokenFor(env)},200,{'Set-Cookie':cookie(created.token)});
 }
 if(!session)return reply({error:'Authentication required'},401);
 if(writing&&request.headers.get('X-Studio-CSRF')!==session.csrf)return reply({error:'Session verification failed'},403);
 if(path==='/api/studio/diagnostics'&&request.method==='GET'){
  const name=url.searchParams.get('key')||'site';
  if(!Object.hasOwn(documents,name))return reply({error:'Unknown editable document'},400);
  return reply(await diagnoseRepository(env,fetcher,name));
 }
 if(path==='/api/studio/logout'&&request.method==='POST')return reply({authenticated:false},200,{'Set-Cookie':cookie('',0)});
 if(path!=='/api/studio/document')return reply({error:'Unknown studio operation'},404);
 const name=url.searchParams.get('key');if(!Object.hasOwn(documents,name||''))return reply({error:'Unknown editable document'},400);
 if(request.method==='GET'){try{return reply(url.searchParams.get('source')==='deployed'&&url.searchParams.get('strict')!=='1'?await readDeployedDocument(name,env):await readDocument(name,env,fetcher,url.searchParams.get('strict')!=='1'));}catch(error){return readFailure(error);}}
 if(request.method!=='PUT')return reply({error:'Method not allowed'},405);
 if(!tokenFor(env))return reply({error:'Publishing is not configured; export your draft instead'},503);
 let input;try{input=await boundedJson(request);}catch{return reply({error:'Invalid or oversized document'},400);}
 if(!input||typeof input.sha!=='string'||!/^[a-f0-9]{40}$/.test(input.sha))return reply({error:'A current document revision is required'},400);
 let previous;try{previous=await readDocument(name,env,fetcher);}catch(error){return readFailure(error);}
 if(previous.sha!==input.sha)return reply({error:'The document changed elsewhere. Export your draft, then reload before saving.'},409);
 try{validateDocument(name,input.value,previous.value);}catch(error){return reply({error:error.message},400);}
 const content=encoder.encode(JSON.stringify(input.value,null,2)+'\n');if(content.length>maxBody)return reply({error:'Document too large'},413);
 try{
  const result=await fetcher(github+documents[name],{method:'PUT',headers:{...headers(env),'Content-Type':'application/json'},body:JSON.stringify({message:'Studio: update '+name,content:base64(content),sha:input.sha,branch:'main'}),redirect:'manual',signal:AbortSignal.timeout(15000)});
  if(result.status===409||result.status===422)return reply({error:'Repository conflict or branch rule prevented publication. Reload the document before retrying.'},409);
  if(result.status>=500||result.status===408)throw new Error('Uncertain upstream write outcome');
  if(!result.ok)return reply({error:'GitHub rejected publication. Check Contents read/write access; no confirmed save was returned.',code:'github-publish-rejected',operation:'write',upstreamStatus:result.status},502);
  const saved=await boundedJson(result,100000);if(!/^[a-f0-9]{40}$/.test(saved.commit?.sha||'')||!/^[a-f0-9]{40}$/.test(saved.content?.sha||''))throw new Error('Missing publication receipt');
  return reply({saved:true,sha:saved.content.sha,commit:saved.commit.sha,url:'https://github.com/frostmoon-rui/frostmoonrui_website/commit/'+saved.commit.sha});
 }catch{return reply({error:'Publication status is uncertain. Check GitHub before retrying; your draft is retained.',code:'github-write-uncertain',operation:'write'},502);}
}
