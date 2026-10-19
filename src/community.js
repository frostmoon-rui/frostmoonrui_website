import {readSession} from './studio.js';
import {validateApplication,validatePublication} from '../shared/community-schema.js';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex'}});
async function body(request){const reader=request.body?.getReader();if(!reader)throw Error('Missing body');const pieces=[];let size=0;try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>12000)throw Error('Too large');pieces.push(value);}}finally{await reader.cancel().catch(()=>{});}const bytes=new Uint8Array(size);let offset=0;for(const piece of pieces){bytes.set(piece,offset);offset+=piece.length;}return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
const configured=env=>!!env.WEBSITE_DB?.prepare&&!!env.FRIEND_APPLY_LIMIT?.limit;
export async function handleCommunity(request,env){
 const u=new URL(request.url),path=u.pathname,admin=path.startsWith('/api/studio/');
 if(!path.startsWith('/api/community/')&&!['/api/studio/community','/api/studio/health'].includes(path))return null;
 if(u.protocol!=='https:')return json({error:'HTTPS required'},400);
 if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed'},405);
 if(request.method==='POST'&&(request.headers.get('Origin')!==u.origin||!request.headers.get('Content-Type')?.startsWith('application/json')))return json({error:'Same-origin JSON required'},403);
 if(admin){const session=await readSession(request,env);if(!session)return json({error:'Authentication required'},401);if(request.method==='POST'&&request.headers.get('X-Studio-CSRF')!==session.csrf)return json({error:'Session verification failed'},403);}
 if(path==='/api/studio/health'&&request.method==='GET'){let schemaReady=false;try{await env.WEBSITE_DB.prepare('SELECT id FROM friend_applications LIMIT 1').all();schemaReady=true;}catch{}return json({database:schemaReady,databaseBinding:!!env.WEBSITE_DB?.prepare,applicationProtection:!!env.FRIEND_APPLY_LIMIT?.limit,githubPublishing:!!env.WEBSITE_GITHUB_TOKEN,map:!!env.AMAP_JS_KEY&&!!env.AMAP_SECURITY_CODE,botFeed:'/data/bot-site.json',queueConfigured:configured(env)&&schemaReady});}
 if(path==='/api/community/config'&&request.method==='GET'){
  if(!configured(env))return json({configured:false});
  try{await env.WEBSITE_DB.prepare('SELECT id FROM friend_applications LIMIT 1').all();return json({configured:true});}catch{return json({configured:false});}
 }
 if(!env.WEBSITE_DB?.prepare)return path==='/api/community/approved'&&request.method==='GET'?json({configured:false,friends:[]}):json({error:'Application queue is not configured'},503);
 const db=env.WEBSITE_DB;
 try{
  if(path==='/api/community/approved'&&request.method==='GET'){
   const rows=await db.prepare("SELECT publication_json FROM friend_applications WHERE status='approved' ORDER BY reviewed_at DESC LIMIT 100").all();
   return json({configured:configured(env),friends:rows.results.map(row=>validatePublication(JSON.parse(row.publication_json)))});
  }
  if(path==='/api/community/apply'&&request.method==='POST'){
   if(!configured(env))return json({error:'Application protection is unavailable'},503);
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(request.headers.get('CF-Connecting-IP')||'anonymous')))).map(v=>v.toString(16).padStart(2,'0')).join('');
   if(!(await env.FRIEND_APPLY_LIMIT.limit({key:'friend:'+hash})).success)return json({error:'Please try again later'},429);
   let input;try{input=validateApplication(await body(request));}catch{return json({error:'Check the application fields'},400);}
   const id=crypto.randomUUID(),now=new Date().toISOString();
   const result=await db.prepare("INSERT INTO friend_applications (id,url,name,description,locale,links_url,icon_url,created_at) SELECT ?,?,?,?,?,?,?,? WHERE (SELECT count(*) FROM friend_applications WHERE status='pending')<500 AND (SELECT count(*) FROM friend_applications WHERE created_at>=?)<100 ON CONFLICT(url) DO NOTHING").bind(id,input.url,input.name,input.description,input.locale,input.linksUrl,input.iconUrl,now,now.slice(0,10)).run();
   if(result.meta.changes!==1)return json({error:'Already submitted or queue capacity reached'},409);
   return json({submitted:true,id,status:'pending'},201);
  }
  if(path==='/api/studio/community'&&request.method==='GET'){
   const status=u.searchParams.get('status')||'pending';if(!['pending','approved','rejected'].includes(status))return json({error:'Invalid status'},400);
   const page=Number(u.searchParams.get('page')||0);if(!Number.isInteger(page)||page<0||page>10000)return json({error:'Invalid page'},400);
   const rows=await db.prepare('SELECT * FROM friend_applications WHERE status=? ORDER BY created_at DESC LIMIT 100 OFFSET ?').bind(status,page*100).all();return json({applications:rows.results,page});
  }
  if(path==='/api/studio/community'&&request.method==='POST'){
   let input,publication=null;try{input=await body(request);if(!/^[a-f0-9-]{36}$/.test(input.id)||!Number.isInteger(input.version)||!['approved','rejected','pending'].includes(input.status))throw Error();if(input.status==='approved')publication=validatePublication(input.publication);}catch{return json({error:'Check the review fields and all four descriptions'},400);}
   const result=await db.prepare('UPDATE friend_applications SET status=?,publication_json=?,reviewed_at=?,version=version+1 WHERE id=? AND version=?').bind(input.status,publication?JSON.stringify(publication):null,new Date().toISOString(),input.id,input.version).run();
   return result.meta.changes===1?json({saved:true}):json({error:'Review changed elsewhere; reload first'},409);
  }
  return json({error:'Unknown operation'},404);
 }catch{return json({error:'Queue storage unavailable; verify the D1 migration'},503);}
}
