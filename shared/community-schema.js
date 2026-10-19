// Submitted URLs are metadata only; the Worker never fetches them.
export function communityUrl(value,optional=false){
 if(optional&&!value)return '';
 if(typeof value!=='string'||value.length>1000||/[\s\\\x00-\x1f]/.test(value))throw Error('Invalid website URL');
 const u=new URL(value),h=u.hostname.toLowerCase().replace(/\.$/,'');
 if(u.protocol!=='https:'||u.username||u.password||u.port||!h.includes('.')||h.includes(':')||/^\d+(\.\d+){3}$/.test(h)||/(^|\.)(localhost|local|internal|test|invalid|example)$/.test(h))throw Error('Use a public HTTPS website');
 u.hash='';return u.href;
}
function plain(value,max){if(typeof value!=='string'||value.length>max||/[<>\x00-\x1f]/.test(value)||!value.trim())throw Error('Invalid public text');return value.trim();}
export function validateApplication(value){
 if(!value||value.consent!==true||value.websiteTrap)throw Error('Invalid application');
 return {url:communityUrl(value.url),name:plain(value.name,100),description:plain(value.description,400),locale:['zh','en','ru','ja'].includes(value.locale)?value.locale:'en',linksUrl:communityUrl(value.linksUrl,true),iconUrl:communityUrl(value.iconUrl,true)};
}
export function validatePublication(value){
 const result={name:plain(value.name,100),url:communityUrl(value.url),linksUrl:communityUrl(value.linksUrl||value.url),description:{}};
 for(const code of ['zh','en','ru','ja'])result.description[code]=plain(value.description?.[code],400);
 return result;
}
