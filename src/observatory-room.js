import {createArena, MAX_PLAYERS} from '../dist/play/astrofall/co-op/arena.mjs';

const socketPath = /^\/play\/astrofall\/co-op\/socket\/(relay|runner)\/([a-z0-9-]{3,24})$/;

export async function handleObservatorySocket(request, env) {
 const url = new URL(request.url);
 const match = socketPath.exec(url.pathname);
 if (!match) return new Response('Room not found', {status:404});
 if (request.method !== 'GET' || request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
  return new Response('WebSocket required', {status:426});
 }
 if (request.headers.get('Origin') !== url.origin) return new Response('Same-origin rooms only', {status:403});
 if (!env.OBSERVATORY_ROOMS) return new Response('Rooms are unavailable', {status:503});
 const ip = request.headers.get('CF-Connecting-IP');
 if (ip && env.OBSERVATORY_JOIN_LIMIT && !(await env.OBSERVATORY_JOIN_LIMIT.limit({key:ip})).success) {
  return new Response('Try joining again in a minute', {status:429});
 }
 const id=env.OBSERVATORY_ROOMS.idFromName(match[1]+'/'+match[2]);
 return env.OBSERVATORY_ROOMS.get(id).fetch(request);
}

export class ObservatoryRoom {
 constructor(ctx) {
  this.ctx=ctx;
  this.lastTick=Date.now();
  this.lastBroadcast=0;
  this.remainder=0;
  this.rate=new WeakMap();
  ctx.blockConcurrencyWhile(async ()=>{
   const peers=ctx.getWebSockets();
   const mode=peers[0]?.deserializeAttachment()?.mode;
   if (!mode) return;
   this.arena=createArena(mode,await ctx.storage.get('progress'));
   for (const peer of peers){
    const id=peer.deserializeAttachment()?.id;
    if (id) this.arena.join(id);
   }
  });
 }

 async fetch(request) {
  const match=socketPath.exec(new URL(request.url).pathname);
  if (!match || request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
   return new Response('WebSocket required',{status:426});
  }
  const mode=match[1];
  if (!this.arena?.size) {
   this.arena=createArena(mode);
   this.lastTick=Date.now();
   this.remainder=0;
  }
  if (this.arena.size>=MAX_PLAYERS) return new Response('Room full',{status:503});
  const pair=new WebSocketPair();
  const id=crypto.randomUUID();
  this.arena.join(id);
  this.ctx.acceptWebSocket(pair[1]);
  pair[1].serializeAttachment({id,mode});
  pair[1].send(JSON.stringify({type:'welcome',id}));
  this.broadcast();
  return new Response(null,{status:101,webSocket:pair[0]});
 }

 broadcast(snapshot=this.arena.snapshot()) {
  this.lastBroadcast=Date.now();
  const data=JSON.stringify(snapshot);
  for(const peer of this.ctx.getWebSockets()){
   if(peer.readyState===1) peer.send(data);
  }
 }

 async webSocketMessage(socket, message) {
  if(typeof message!=='string' || message.length>256 || !this.arena) return;
  const player=socket.deserializeAttachment();
  if(!player) return;
  const now=Date.now();
  let window=this.rate.get(socket);
  if(!window || now>=window.end){window={end:now+1000,count:0};this.rate.set(socket,window);}
  if(++window.count>40){socket.close(1008,'Input rate exceeded');return;}
  let input;
  try{input=JSON.parse(message);}catch{return;}
  if(!input || typeof input!=='object') return;
  const before=this.arena.snapshot();
  this.remainder+=Math.min(.16,Math.max(0,(now-this.lastTick)/1000));
  this.lastTick=now;
  while(this.remainder>=1/30){this.arena.step(1/30);this.remainder-=1/30;}
  this.arena.input(player.id,input);
  const after=this.arena.snapshot();
  if(after.checkpoint!==before.checkpoint || after.complete!==before.complete){
   await this.ctx.storage.put('progress',{checkpoint:after.checkpoint,complete:after.complete});
  }
  if(now-this.lastBroadcast>=55) this.broadcast();
 }

 async webSocketClose(socket) {
  this.arena?.leave(socket.deserializeAttachment()?.id);
  socket.close();
  if(!this.arena?.size) await this.ctx.storage.delete('progress');
  else this.broadcast();
 }

 webSocketError(socket) {
  return this.webSocketClose(socket);
 }
}
