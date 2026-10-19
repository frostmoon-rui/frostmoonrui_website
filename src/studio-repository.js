import {documents,validateDocument} from '../shared/site-schema.js';

const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true}),limit=300000;
const api='https://api.github.com/repos/frostmoon-rui/frostmoonrui_website/contents/';
const raw='https://raw.githubusercontent.com/frostmoon-rui/frostmoonrui_website/main/';
export const repositoryMessages={
 'github-token-invalid':'GitHub rejected the configured token. Update the production WEBSITE_GITHUB_TOKEN secret.',
 'github-token-format':'The configured GitHub token contains an invalid header value. Check the runtime secret format.',
 'github-permission':'GitHub denied repository access. Check the selected repository and Contents permission.',
 'github-rate-limit':'GitHub rate limit reached. Wait before reloading; no write was attempted.',
 'github-network':'Could not reach GitHub. Reload the document; no write was attempted.',
 'github-timeout':'GitHub did not respond within the read time budget. No write was attempted.',
 'github-response-invalid':'GitHub returned an unexpected document response. No write was attempted.',
 'github-document-invalid':'The repository document failed validation. Review its source JSON before publishing.',
 'github-unavailable':'GitHub could not serve this document. Reload later; no write was attempted.'
};
export function repositoryError(code,upstreamStatus){return Object.assign(new Error(repositoryMessages[code]),{code,...(upstreamStatus?{upstreamStatus}:{})});}
export const repositoryToken=env=>typeof env.WEBSITE_GITHUB_TOKEN==='string'?env.WEBSITE_GITHUB_TOKEN.trim():'';
export function repositoryHeaders(env,authenticated=true){
 const token=repositoryToken(env);
 if(authenticated&&token&&(!/^[\x21-\x7e]{1,512}$/.test(token)||/^Bearer\s/i.test(token)||/["'`]/.test(token)))throw repositoryError('github-token-format');
 return {Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'frostmoon-site-studio',...(authenticated&&token?{Authorization:'Bearer '+token}:{})};
}
function rejected(response){const status=response.status;return repositoryError(status===401?'github-token-invalid':status===429||status===403&&(response.headers.get('X-RateLimit-Remaining')==='0'||response.headers.has('Retry-After'))?'github-rate-limit':[403,404].includes(status)?'github-permission':'github-unavailable',status);}
async function bytes(response,max=limit){
 const length=Number(response.headers.get('Content-Length'));if(length<0||length>max)throw repositoryError('github-response-invalid');
 const reader=response.body?.getReader();if(!reader)throw repositoryError('github-response-invalid');
 const parts=[];let size=0;try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max)throw repositoryError('github-response-invalid');parts.push(value);}}finally{await reader.cancel().catch(()=>{});}
 const result=new Uint8Array(size);let offset=0;for(const part of parts){result.set(part,offset);offset+=part.length;}return result;
}
function parsed(key,content){let value;try{value=JSON.parse(decoder.decode(content));}catch{throw repositoryError('github-response-invalid');}try{validateDocument(key,value,value);}catch{throw repositoryError('github-document-invalid');}return value;}
export async function blobSha(content){const header=encoder.encode('blob '+content.length+'\0'),buffer=new Uint8Array(header.length+content.length);buffer.set(header);buffer.set(content,header.length);return [...new Uint8Array(await crypto.subtle.digest('SHA-1',buffer))].map(value=>value.toString(16).padStart(2,'0')).join('');}
export async function readDeployedDocument(key,env){
 if(!Object.hasOwn(documents,key)||!env.ASSETS?.fetch)throw repositoryError('github-unavailable');
 const response=await env.ASSETS.fetch(new Request('https://studio-internal.invalid/__studio/'+key+'.json'));
 if(!response.ok)throw repositoryError('github-unavailable');
 const content=await bytes(response);return {sha:await blobSha(content),value:parsed(key,content),access:{mode:'deployed',canPublish:false,attempts:0}};
}
async function responseDocument(key,response){
 let file,content;try{file=JSON.parse(decoder.decode(await bytes(response,600000)));if(file.encoding!=='base64'||typeof file.content!=='string'||!/^[a-f0-9]{40}$/.test(file.sha)||!Number.isInteger(file.size)||file.size<0||file.size>limit)throw Error();content=Uint8Array.from(atob(file.content.replace(/\s/g,'')),c=>c.charCodeAt(0));if(content.length>limit)throw Error();}catch{throw repositoryError('github-response-invalid');}
 return {sha:file.sha,value:parsed(key,content)};
}
export async function readRepository(key,env,fetcher,{fallback=false}={}){
 if(!Object.hasOwn(documents,key))throw repositoryError('github-document-invalid');
 const authenticated=!!repositoryToken(env);let warning,attempts=0;
 async function get(url,auth,timeout=8000,retry=false){
  const headers=repositoryHeaders(env,auth);
  for(let attempt=0;attempt<(retry?2:1);attempt++){
   attempts++;
   try{const response=await fetcher(url,{headers,redirect:'error',signal:AbortSignal.timeout(timeout)});if(retry&&attempt===0&&[502,503,504].includes(response.status)){await response.body?.cancel().catch(()=>{});continue;}return response;}
   catch(error){if(retry&&attempt===0)continue;throw repositoryError(['AbortError','TimeoutError'].includes(error?.name)?'github-timeout':'github-network');}
  }
 }
 function result(data,mode,canPublish){return {...data,access:{mode,canPublish,attempts,...(warning?{warningCode:warning.code,...(warning.upstreamStatus?{upstreamStatus:warning.upstreamStatus}:{})}:{})}};}
 try{
  let response=await get(api+documents[key]+'?ref=main',authenticated,8000,fallback);
  if(!response.ok&&authenticated&&fallback&&[401,403,404,429].includes(response.status)){
   warning=rejected(response);await response.body?.cancel().catch(()=>{});response=await get(api+documents[key]+'?ref=main',false);
   if(response.ok)return result(await responseDocument(key,response),'public',false);
  }
  if(!response.ok)throw rejected(response);
  return result(await responseDocument(key,response),authenticated?'authenticated':'public',authenticated);
 }catch(error){
  if(!fallback||['github-response-invalid','github-document-invalid'].includes(error.code))throw error;
  warning=warning||error;
 }
 // Credentials are never sent to a fallback host, and fallback data never grants publication.
 try{const response=await get(raw+documents[key],false,6000);if(response.ok){const content=await bytes(response);return result({sha:await blobSha(content),value:parsed(key,content)},'raw',false);}await response.body?.cancel().catch(()=>{});}catch{}
 if(env.ASSETS?.fetch)try{const snapshot=await readDeployedDocument(key,env);return result({sha:snapshot.sha,value:snapshot.value},'deployed',false);}catch{}
 throw warning;
}
