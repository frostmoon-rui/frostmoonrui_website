import {createArena} from './arena.mjs';

const BASE_DELAY = 105;
const STALE_AFTER = 650;
const blend = (a,b,t) => a+(b-a)*t;
const clamp = (value,low,high) => Math.min(high,Math.max(low,value));

export function createMotion() {
  const history=[], sent=new Map();
  let controls={axis:0,jump:false,link:false}, changedAt=-Infinity, queuedJump=false;
  let prediction=null, local=null, lastFrame=0, remoteAt=-Infinity;
  let offsetX=0, offsetY=0, oneWay=0, ack=0, delay=BASE_DELAY;

  function clearFrames() {
    history.length=0;
    prediction=null;
    local=null;
    offsetX=offsetY=lastFrame=0;
    remoteAt=-Infinity;
    delay=BASE_DELAY;
  }

  function reset() {
    clearFrames();
    sent.clear();
    queuedJump=false;
    ack=oneWay=0;
    changedAt=-Infinity;
  }

  function track(sequence,now) {
    sent.set(sequence,now);
    if(sent.size>64) sent.delete(sent.keys().next().value);
  }

  function control(next,now) {
    if (next.axis===controls.axis && next.jump===controls.jump && next.link===controls.link) return;
    if(next.jump && !controls.jump) queuedJump=true;
    controls=next;
    changedAt=now;
  }

  function push(state,now,id) {
    const previous=history.at(-1);
    const gap=previous ? now-previous.now : 0;
    if (previous && (state.clock<previous.state.clock || state.mode!==previous.state.mode ||
        state.checkpoint!==previous.state.checkpoint || gap>1000)) clearFrames();

    const frame={state,now,players:new Map(state.players.map(p=>[p.id,p]))};
    if (history.at(-1)?.state.clock===state.clock) history.pop();
    else if(gap>0) delay=blend(delay,clamp(gap+45,BASE_DELAY,235),gap+45>delay?.35:.10);
    history.push(frame);
    if(history.length>12) history.shift();

    const player=frame.players.get(id);
    if(!player || typeof player.ground!=='boolean') return;
    const sentAt=sent.get(player.ack);
    const newAck=sentAt!==undefined && player.ack>ack;
    if(newAck){
      ack=player.ack;
      const measured=clamp((now-sentAt)/2-12,0,165);
      oneWay=oneWay ? blend(oneWay,measured,.20) : measured;
    }
    const sameSpawn=local?.id===id && local.spawnId===player.spawnId;
    if(prediction && sameSpawn && (!newAck || sentAt<changedAt)) return;
    prediction=createArena(state.mode,state).predict(state,id);
    // A confirmed respawn or room transition always wins over local prediction.
    if(!sameSpawn){
      offsetX=offsetY=0;
      local={...player};
      return;
    }
    const steps=Math.ceil(oneWay/16);
    for(let i=0;i<steps;i++) prediction.advance(oneWay/steps/1000,controls);
    const dx=local.x-prediction.player.x, dy=local.y-prediction.player.y;
    offsetX=Math.abs(dx)<110 ? dx : 0;
    offsetY=Math.abs(dy)<85 ? dy : 0;
  }

  function sample(now,id,legacyAxis=controls.axis) {
    const newest=history.at(-1);
    if (!newest) return null;
    const {state}=newest;
    const dt=lastFrame ? clamp(now-lastFrame,0,42) : 16;
    lastFrame=now;
    remoteAt=Math.max(remoteAt,now-delay);
    const toIndex=history.findIndex(frame=>frame.now>=remoteAt);
    const to=toIndex<0 ? newest : history[toIndex];
    const from=toIndex<=0 ? to : history[toIndex-1];
    const span=to.now-from.now;
    const progress=span>0 ? clamp((remoteAt-from.now)/span,0,1) : 1;
    const age=clamp(now-newest.now,0,STALE_AFTER);
    const players=state.players.map(player=>{
      if(player.id===id) {
        if(prediction){
          if(now-newest.now<STALE_AFTER){
            const steps=Math.max(1,Math.ceil(dt/16));
            for(let i=0;i<steps;i++) prediction.advance(dt/steps/1000,controls,i===0&&queuedJump);
            queuedJump=false;
          }
          const decay=Math.exp(-dt/85);
          offsetX*=decay;offsetY*=decay;
          local={...player,x:prediction.player.x+offsetX,y:prediction.player.y+offsetY,link:controls.link};
        } else {
          const sameSpawn=local?.id===id && local.spawnId===player.spawnId;
          const vx=player.vx || 0;
          const lead=state.mode==='runner' || Math.sign(vx)===legacyAxis ? vx*Math.min(age,65)/1000 : 0;
          const x=sameSpawn ? blend(local.x,player.x+lead,1-Math.exp(-dt/28)) : player.x;
          const y=sameSpawn ? blend(local.y,player.y,1-Math.exp(-dt/39)) : player.y;
          local={...player,x,y};
        }
        return local;
      }
      const a=from.players.get(player.id), b=to.players.get(player.id);
      if(!a || !b || a.spawnId!==player.spawnId || b.spawnId!==player.spawnId) return player;
      return {...player,x:blend(a.x,b.x,progress),y:blend(a.y,b.y,progress)};
    });
    return {state,players,clock:state.clock+Math.min(age,165)/1000};
  }
  return {reset,push,sample,track,control};
}
