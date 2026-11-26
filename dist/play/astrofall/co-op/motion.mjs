import {createArena} from './arena.mjs';

const BASE_DELAY = 105;
const STALE_AFTER = 650;
const blend = (a,b,t) => a+(b-a)*t;
const clamp = (value,low,high) => Math.min(high,Math.max(low,value));

function curve(a,b,va,vb,duration,t){
  if(!Number.isFinite(va) || !Number.isFinite(vb)) return blend(a,b,t);
  const t2=t*t, t3=t2*t;
  const value=(2*t3-3*t2+1)*a+(t3-2*t2+t)*va*duration+
    (-2*t3+3*t2)*b+(t3-t2)*vb*duration;
  return clamp(value,Math.min(a,b),Math.max(a,b));
}

function advance(simulation,ms,input,jump=false){
  const steps=Math.ceil(ms/16);
  for(let i=0;i<steps;i++) simulation.advance(ms/steps/1000,input,i===0&&jump);
}

export function createMotion() {
  const history=[], sent=new Map(), changes=[], remotePositions=new Map();
  let controls={axis:0,vertical:0,jump:false,link:false,act:false}, queuedJump=false;
  let prediction=null, predictedAt=0, local=null, lastFrame=0, remoteAt=null;
  let offsetX=0, offsetY=0, oneWay=0, ack=0, delay=BASE_DELAY;

  function clearFrames() {
    history.length=0;
    remotePositions.clear();
    prediction=null;
    local=null;
    offsetX=offsetY=lastFrame=predictedAt=0;
    remoteAt=null;
    delay=BASE_DELAY;
  }

  function reset() {
    clearFrames();
    sent.clear();
    changes.length=0;
    queuedJump=false;
    ack=oneWay=0;
  }

  function track(sequence,now) {
    sent.set(sequence,{now,controls});
    if(sent.size>64) sent.delete(sent.keys().next().value);
  }

  function control(next,now) {
    if (next.axis===controls.axis && next.jump===controls.jump && next.link===controls.link && next.vertical===controls.vertical && next.act===controls.act) return;
    const jump=next.jump && !controls.jump;
    queuedJump ||= jump;
    controls=next;
    changes.push({now,controls,jump});
    if(changes.length>40) changes.shift();
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
    const applied=sent.get(player.ack);
    const newAck=applied && player.ack>ack;
    if(newAck){
      ack=player.ack;
      const measured=clamp((now-applied.now)/2-12,0,165);
      oneWay=oneWay ? blend(oneWay,measured,.20) : measured;
    }
    const sameSpawn=local?.id===id && local.spawnId===player.spawnId;
    const confirmedFall=player.respawnAt!=null && local?.respawnAt==null;
    if(prediction && sameSpawn && !newAck && !confirmedFall) return;
    const elapsed=clamp(now-predictedAt,0,42);
    // Reconcile both simulations at packet time. The last drawn position is one frame behind.
    let expectedX=local?.x, expectedY=local?.y;
    if(prediction && sameSpawn && !confirmedFall && newAck){
      advance(prediction,elapsed,controls,queuedJump);
      const decay=Math.exp(-elapsed/85);
      expectedX=prediction.player.x+offsetX*decay;
      expectedY=prediction.player.y+offsetY*decay;
    }
    prediction=createArena(state.mode,state).predict(state,id);
    predictedAt=now;
    // A confirmed respawn or room transition always wins over local prediction.
    if(!sameSpawn || confirmedFall || !newAck){
      offsetX=offsetY=0;
      local={...player};
      return;
    }
    while(changes[0] && changes[0].now<=applied.now) changes.shift();
    let cursor=now-oneWay, replayInput=applied.controls, jump=false;
    for(const change of changes){
      const at=clamp(change.now,cursor,now);
      if(at>cursor){
        advance(prediction,at-cursor,replayInput,jump);
        jump=false;
      }
      replayInput=change.controls;
      jump ||= change.jump;
      cursor=at;
    }
    advance(prediction,now-cursor,replayInput,jump);
    if(!changes.length || now>cursor) queuedJump=false;
    const dx=expectedX-prediction.player.x, dy=expectedY-prediction.player.y;
    offsetX=Math.abs(dx)<110 && Math.abs(dx)>.04 ? dx : 0;
    offsetY=Math.abs(dy)<85 && Math.abs(dy)>.04 ? dy : 0;
  }

  function sample(now,id,legacyAxis=controls.axis) {
    const newest=history.at(-1);
    if (!newest) return null;
    const {state}=newest;
    const frameGap=lastFrame ? now-lastFrame : 16;
    const dt=clamp(frameGap,0,42);
    lastFrame=now;
    const age=clamp(now-newest.now,0,STALE_AFTER);
    // Keep a small amount of forward motion if a single update arrives late.
    const horizon=state.clock+.065;
    const target=Math.min(horizon,state.clock+(age-delay)/1000);
    if(remoteAt===null || frameGap>90) remoteAt=target;
    else remoteAt+=dt/1000*clamp(1+(target-remoteAt-dt/1000)*3,.73,1.25);
    remoteAt=Math.min(remoteAt,horizon);
    const toIndex=history.findIndex(frame=>frame.state.clock>=remoteAt);
    const to=toIndex<0 ? newest : history[toIndex];
    const from=toIndex<=0 ? to : history[toIndex-1];
    const span=to.state.clock-from.state.clock;
    const progress=span>0 ? clamp((remoteAt-from.state.clock)/span,0,1) : 1;
    for(const playerId of remotePositions.keys()) if(!newest.players.has(playerId)) remotePositions.delete(playerId);
    const players=state.players.map(player=>{
      if(player.id===id) {
        if(prediction){
          const elapsed=clamp(now-predictedAt,0,42);
          if(elapsed && now-newest.now<STALE_AFTER){
            advance(prediction,elapsed,controls,queuedJump);
            queuedJump=false;
          }
          predictedAt=Math.max(predictedAt,now);
          const decay=Math.exp(-elapsed/85);
          offsetX*=decay;offsetY*=decay;
          local={...player,x:prediction.player.x+offsetX,y:prediction.player.y+offsetY,link:controls.link,
            respawnAt:player.respawnAt ?? prediction.player.respawnAt};
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
      if(!a || !b || a.spawnId!==player.spawnId || b.spawnId!==player.spawnId){
        remotePositions.delete(player.id);
        return player;
      }
      const va=Number.isFinite(a.velocity)?a.velocity*60:a.vy;
      const vb=Number.isFinite(b.velocity)?b.velocity*60:b.vy;
      const lead=player.ground && player.respawnAt==null ? Math.max(0,remoteAt-state.clock) : 0;
      const targetX=curve(a.x,b.x,a.vx,b.vx,span,progress)+(player.vx || 0)*lead;
      const previous=remotePositions.get(player.id);
      const correcting=previous && previous.spawnId===player.spawnId &&
        (previous.lead>0 && lead===0 || previous.correcting && Math.abs(previous.x-targetX)>.6);
      const x=correcting?blend(previous.x,targetX,1-Math.exp(-dt/52)):targetX;
      remotePositions.set(player.id,{spawnId:player.spawnId,x,lead,correcting});
      return {...player,x,y:curve(a.y,b.y,va,vb,span,progress)};
    });
    const renderAhead=Math.min(age+oneWay,185)/1000;
    const obstacles=state.mode==='jump' && state.obstacles?.map(o=>({...o,x:o.x-282*renderAhead}));
    return {state,players,clock:state.clock+renderAhead,obstacles};
  }
  return {reset,push,sample,track,control};
}
