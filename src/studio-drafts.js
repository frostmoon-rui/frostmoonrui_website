const table='studio_drafts';
const schema=`CREATE TABLE IF NOT EXISTS ${table} (
 document TEXT PRIMARY KEY, revision TEXT NOT NULL, base_sha TEXT NOT NULL,
 raw TEXT NOT NULL, updated_at TEXT NOT NULL
)`;
const initialized=new WeakMap();
function initialize(db){
 if(!initialized.has(db))initialized.set(db,db.prepare(schema).run().catch(error=>{initialized.delete(db);throw error;}));
 return initialized.get(db);
}
const revisionFormat=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
export async function studioDraft(request,db,key,readBody,reply){
 if(!db?.prepare)return reply({error:'Draft storage is unavailable'},503);
 const put=request.method==='PUT';
 if(!put&&request.method!=='GET')return reply({error:'Method not allowed'},405);
 let input;
 if(put){
  try{input=await readBody(request,1900000);}catch{return reply({error:'Invalid or oversized draft'},400);}
  if(!input||(input.revision!==null&&(typeof input.revision!=='string'||!revisionFormat.test(input.revision)))||
     (input.raw!==null&&(typeof input.raw!=='string'||new TextEncoder().encode(input.raw).length>300000||typeof input.baseSha!=='string'||!/^[a-f0-9]{40}$/.test(input.baseSha))))return reply({error:'Invalid draft'},400);
 }
 try{
  await initialize(db);
  if(!put){
   const draft=await db.prepare(`SELECT revision,base_sha AS baseSha,raw,updated_at AS updatedAt FROM ${table} WHERE document=?`).bind(key).first();
   return reply({draft});
  }
  if(input.raw===null){
   if(input.revision)await db.prepare(`DELETE FROM ${table} WHERE document=? AND revision=?`).bind(key,input.revision).run();
   return reply({revision:null});
  }
  const revision=crypto.randomUUID(),updatedAt=new Date().toISOString();
  const result=input.revision
   ?await db.prepare(`UPDATE ${table} SET revision=?,base_sha=?,raw=?,updated_at=? WHERE document=? AND revision=?`)
     .bind(revision,input.baseSha,input.raw,updatedAt,key,input.revision).run()
   :await db.prepare(`INSERT INTO ${table}(revision,base_sha,raw,updated_at,document) VALUES(?,?,?,?,?) ON CONFLICT(document) DO NOTHING`)
     .bind(revision,input.baseSha,input.raw,updatedAt,key).run();
  return result.meta.changes===1?reply({revision,updatedAt}):reply({error:'A draft changed on another device'},409);
 }catch{return reply({error:'Draft storage is unavailable'},503);}
}
