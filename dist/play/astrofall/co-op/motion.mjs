const REMOTE_DELAY = 105;
const MAX_GAP = 350;
const MAX_LEAD = 65;
const blend = (a,b,t) => a+(b-a)*t;
const clamp = (value,low,high) => Math.min(high,Math.max(low,value));

export function createMotion() {
  const history=[];
  let local=null, lastFrame=0;

  function reset() {
    history.length=0;
    local=null;
    lastFrame=0;
  }

  function push(state, now) {
    const previous=history.at(-1);
    if (previous && (state.clock<previous.state.clock || state.mode!==previous.state.mode ||
        state.checkpoint!==previous.state.checkpoint || now-previous.now>MAX_GAP)) reset();

    const frame={state,now,players:new Map(state.players.map(p=>[p.id,p]))};
    if (history.at(-1)?.state.clock===state.clock) history.pop();
    history.push(frame);
    if(history.length>8) history.shift();
  }

  function sample(now,id,axis=0) {
    const newest=history.at(-1);
    if (!newest) return null;
    const {state}=newest;
    const dt=lastFrame ? clamp(now-lastFrame,0,50) : 16;
    lastFrame=now;
    const sampleTime=now-REMOTE_DELAY;
    const toIndex=history.findIndex(frame=>frame.now>=sampleTime);
    const to=toIndex<0 ? newest : history[toIndex];
    const from=toIndex<=0 ? to : history[toIndex-1];
    const span=to.now-from.now;
    const progress=span>0 ? clamp((sampleTime-from.now)/span,0,1) : 1;
    const age=clamp(now-newest.now,0,MAX_LEAD);
    const players=state.players.map(player=>{
      if(player.id===id) {
        const sameSpawn=local?.id===id && local?.spawnId===player.spawnId;
        const vx=player.vx || 0;
        const lead=state.mode==='runner' || Math.sign(vx)===axis ? vx*age/1000 : 0;
        const keepX=1-Math.exp(-dt/28);
        const keepY=1-Math.exp(-dt/39);
        const x=sameSpawn ? blend(local.x,player.x+lead,keepX) : player.x;
        const y=sameSpawn ? blend(local.y,player.y,keepY) : player.y;
        local={...player,x,y};
        return local;
      }
      const a=from.players.get(player.id), b=to.players.get(player.id);
      if(!a || !b || a.spawnId!==player.spawnId || b.spawnId!==player.spawnId) return player;
      return {...player,x:blend(a.x,b.x,progress),y:blend(a.y,b.y,progress)};
    });
    return {state,players,clock:state.clock+age/1000};
  }
  return {reset,push,sample};
}
