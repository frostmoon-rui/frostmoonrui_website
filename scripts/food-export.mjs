import crypto from 'node:crypto';
export const feedUrl='https://frostmoonrui.com/food-map/index.json';
const safeUrl=value=>{if(value==='')return '';const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)throw new Error('Expected public HTTPS URL');return u.href;};
const text=(value,required=false)=>{if(typeof value!=='string'||value.length>500||/[\x00-\x1f]/.test(value)||(required&&!value.trim()))throw new Error('Invalid public food text');return value.trim();};
export function exportFood(data){
 if(data?.schemaVersion!==1||data.coordinateSystem!=='GCJ-02'||!Array.isArray(data.spots)||data.spots.length>5000||!Number.isFinite(Date.parse(data.generatedAt)))throw new Error('Invalid local food document');
 const spots=data.spots.map(p=>{
  if(!p||!Number.isFinite(p.lng)||!Number.isFinite(p.lat)||Math.abs(p.lng)>180||Math.abs(p.lat)>90||(p.coordinateSystem??'GCJ-02')!=='GCJ-02')throw new Error('Invalid GCJ-02 venue');
  const row={name:text(p.name,true),city:text(p.city,true),address:text(p.address??''),lng:p.lng,lat:p.lat,coordinateSystem:'GCJ-02',category:text(p.category??'Food'),articleUrl:safeUrl(p.articleUrl??''),amapUrl:safeUrl(p.amapUrl??'')};
  if(p.source&&p.source.jsonUrl!==feedUrl)throw new Error('Do not re-export imported venues');
  row.id=crypto.createHash('sha256').update(JSON.stringify([row.name.normalize('NFKC').toLowerCase(),row.city,row.lng,row.lat])).digest('hex').slice(0,24);
  for(const [key,max] of [['price',1000000],['rating',5]])if(p[key]!==undefined){if(p[key]!==null&&(!Number.isFinite(p[key])||p[key]<0||p[key]>max))throw new Error('Invalid '+key);row[key]=p[key];}
  row.source={id:'local',name:'frostmoon-rui',homepage:'https://frostmoonrui.com/',jsonUrl:feedUrl,type:'local'};
  return row;
 });
 return {schema:'https://valaxy.site/schemas/food-map.v1.json',schemaVersion:1,generator:{name:'frostmoon-food-atlas',version:'1.0.0'},owner:{name:'frostmoon-rui',avatar:'https://frostmoonrui.com/assets/avatar-cute.jpg'},site:{title:'Frostmoon Food Atlas',url:'https://frostmoonrui.com/',homepage:'https://frostmoonrui.com/'},generatedAt:data.generatedAt,coordinateSystem:'GCJ-02',spots:[...new Map(spots.map(p=>[p.id,p])).values()].sort((a,b)=>a.id.localeCompare(b.id))};
}
