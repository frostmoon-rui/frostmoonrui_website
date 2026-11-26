import {ledgeAt, platformLevels} from './legacy-platform-levels.mjs';

export const LEGACY_MODES = ['jump','platform'];
export const LEGACY_WIDTH = 720, LEGACY_HEIGHT = 360, LEGACY_BODY = 24;
const GROUND = 315, JUMP_X = 100;
const overlap = (x,w,a,b) => x+w>a && x<b;
const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
const hasPartner=(p,party)=>party.some(other=>other.id!==p.id && other.alive && other.input.link &&
  Math.abs(other.x-p.x)<86 && Math.abs(other.y-p.y)<60);
const blankInput = () => ({axis:0,jump:false,link:false,act:false});

function resetPlayer(player,ledge=null,index=0,now=0) {
  Object.assign(player,{
    x:ledge ? ledge.x+(index ? (ledge.w-LEGACY_BODY)/2 : 42) : JUMP_X,
    y:(ledge?.y ?? GROUND)-LEGACY_BODY, vx:0, velocity:0, ground:true,
    coyote:6, buffer:0, ride:index, jumps:0, alive:true, protectedUntil:now,
    reached:false, previousSwitch:-1, spawnId:(player.spawnId || 0)+1,
  });
}

function jumpMovement(p,frames,obstacles,clock) {
  if (!p.alive) return;
  if (p.jumpQueued && p.jumps<2) {
    p.velocity=p.jumps===0 ? -10.8 : -9.2;
    p.jumps++;
  }
  p.velocity+=.44*frames;
  p.y+=p.velocity*frames;
  p.ground=p.y>=GROUND-LEGACY_BODY;
  if (p.ground) {p.y=GROUND-LEGACY_BODY;p.velocity=0;p.jumps=0;}
  if (p.protectedUntil<=clock && obstacles.some(o=>
      overlap(JUMP_X,LEGACY_BODY,o.x,o.x+o.w) && p.y+LEGACY_BODY>GROUND-o.h)) p.alive=false;
}

function platformMovement(p,frames,course,previous,ledges,open,party) {
  const size=LEGACY_BODY;
  if (p.ride>=0 && ledges[p.ride]) {
    p.x+=ledges[p.ride].x-previous[p.ride].x;
    p.y+=ledges[p.ride].y-previous[p.ride].y;
  }
  const oldX=p.x;
  p.x=clamp(p.x+p.input.axis*4.2*frames,0,course.width-size);
  const gate=course.gate;
  if (gate && !open && p.y+size>gate.y && p.y<gate.y+gate.h) {
    if (oldX+size<=gate.x && p.x+size>gate.x) p.x=gate.x-size;
    if (oldX>=gate.x+gate.w && p.x<gate.x+gate.w) p.x=gate.x+gate.w;
  }
  p.vx=(p.x-oldX)*60/frames;
  if (p.jumpQueued) p.buffer=7;
  if (p.buffer>0 && p.coyote>0) {
    const partner=p.input.link && hasPartner(p,party);
    p.velocity=partner ? -13.2 : -10.8;
    p.buffer=0;p.coyote=0;p.ride=-1;
  }
  p.buffer=Math.max(0,p.buffer-frames);
  p.coyote=Math.max(0,p.coyote-frames);
  const bottom=p.y+size;
  p.velocity+=.44*frames;
  p.y+=p.velocity*frames;
  const ride=p.ride;
  const landed=p.velocity>=0 ? ledges.findIndex((ledge,i)=>
    bottom<=(ride===i ? ledge.y : previous[i].y)+.01 && p.y+size>=ledge.y &&
      overlap(p.x,size,ledge.x,ledge.x+ledge.w)) : -1;
  p.ride=landed;p.ground=landed>=0;
  if (p.ground) {p.y=ledges[landed].y-size;p.velocity=0;p.coyote=6;}
  if (p.y>LEGACY_HEIGHT+size || course.spikes.some(s=>
      overlap(p.x+5,size-10,s.x,s.x+s.w) && p.y+size-4>s.y && p.y<s.y+s.h)) p.alive=false;
}

export function createLegacyArena(mode,resume={},capacity=6) {
  const players=new Map();
  const platform=mode==='platform';
  let clock=0, round=0, nextRound=2, nextObstacle=0, obstacles=[];
  let level=clamp(Number.isInteger(resume.checkpoint) ? resume.checkpoint : 0,0,platformLevels.length-1);
  let complete=resume.complete===true && platform;
  let levelStart=0, spawnLedge=0, switchCount=0, collected=new Set();
  let ledges=platformLevels[level].ledges;
  const resetPlatform=p=>resetPlayer(p,ledges[spawnLedge],spawnLedge);
  function beginRound(){
    round++;nextRound=null;nextObstacle=clock+.9;obstacles=[];
    for (const p of players.values()) {resetPlayer(p);p.score=0;}
  }
  function join(id){
    if (players.size>=capacity || players.has(id)) return false;
    const player={id,input:blankInput(),jumpQueued:false,actQueued:false,lastInput:clock,score:0,best:0};
    if(platform) resetPlatform(player);
    else resetPlayer(player,null,0,clock+(nextRound===null ? .85 : 0));
    players.set(id,player);
    return true;
  }
  function leave(id){players.delete(id);}
  function input(id,value){
    const p=players.get(id);
    if(!p)return;
    if(Number.isSafeInteger(value.seq) && value.seq>0){
      if(value.seq<=(p.inputSeq || 0)) return;
      p.inputSeq=value.seq;
    }
    p.lastInput=clock;
    p.jumpQueued ||= value.jump===true && !p.input.jump;
    p.actQueued ||= value.act===true && !p.input.act;
    p.input={axis:[-1,0,1].includes(value.axis) ? value.axis : 0,
      jump:value.jump===true,link:value.link===true,act:value.act===true};
  }
  function stepJump(dt,party){
    if(nextRound!==null){
      if(clock>=nextRound) beginRound();
      return;
    }
    if(clock>=nextObstacle){
      obstacles.push({x:LEGACY_WIDTH,w:22,h:28+Math.random()*48});
      nextObstacle=clock+1.53+Math.random()*.75;
    }
    const movement=282*dt;
    let passed=false;
    for(const o of obstacles){
      if(o.x+o.w>=JUMP_X && o.x+o.w-movement<JUMP_X) passed=true;
      o.x-=movement;
    }
    if(obstacles[0] && obstacles[0].x+obstacles[0].w<0) obstacles.shift();
    for(const p of party){
      jumpMovement(p,dt*60,obstacles,clock);
      if(passed && p.alive && p.protectedUntil<=clock) {
        p.score++;
        p.best=Math.max(p.best,p.score);
      }
    }
    if(!party.some(p=>p.alive)) nextRound=clock+2;
  }
  function stepPlatform(dt,party){
    if(complete) return;
    const course=platformLevels[level], previous=ledges;
    ledges=course.ledges.map(p=>ledgeAt(p,(clock-levelStart)*60));
    const pressed=new Set();
    const open=switchCount>=course.switches.length;
    for(const p of party){
      platformMovement(p,dt*60,course,previous,ledges,open,party);
      if(!p.alive){
        const reached=p.reached;
        resetPlatform(p);
        p.reached=reached;
        continue;
      }
      const plate=course.switches.findIndex(s=>Math.abs(p.x+LEGACY_BODY/2-s.x)<19 &&
        Math.abs(p.y+LEGACY_BODY-s.y-s.h)<2);
      if(plate>=0 && plate!==p.previousSwitch) pressed.add(plate);
      p.previousSwitch=plate;
      for(const [i,shard] of course.shards.entries()){
        const ledge=ledges[shard.ledge];
        if(Math.abs(p.x+LEGACY_BODY/2-ledge.x-shard.offset)<=19 &&
            Math.abs(p.y+LEGACY_BODY/2-ledge.y+14)<=19) collected.add(i);
      }
      if(p.ride>spawnLedge && course.ledges[p.ride].checkpoint)spawnLedge=p.ride;
      if(open && p.ride===course.goal.ledge && p.x+LEGACY_BODY>=course.goal.x-4) p.reached=true;
    }
    if(!open && pressed.has(switchCount)) switchCount++;
    else if(!open && [...pressed].some(i=>i>switchCount)) switchCount=0;
    if(party.every(p=>p.reached)){
      if(level===platformLevels.length-1) {complete=true;return;}
      level++;spawnLedge=switchCount=0;collected=new Set();levelStart=clock;
      ledges=platformLevels[level].ledges;
      for(const p of party) resetPlatform(p);
    }
  }
  function step(dt){
    clock+=dt;
    const party=[...players.values()];
    if(!party.length) return;
    for(const p of party) if(clock-p.lastInput>.7) p.input=blankInput();
    if(platform) stepPlatform(dt,party);
    else stepJump(dt,party);
    for(const p of party){p.ack=p.inputSeq;p.heldJump=p.input.jump;p.jumpQueued=false;p.actQueued=false;}
  }
  function snapshot(){
    const party=[...players.values()];
    return {mode,clock,checkpoint:platform?level:0,complete,levelStart,spawnLedge,switchCount,collected:[...collected],
      obstacles:obstacles.map(o=>({...o})),round,countdown:nextRound===null?0:Math.max(0,nextRound-clock),
      players:party.map(player=>{
        const {id,x,y,vx,ground,velocity,ride,coyote,buffer,jumps,alive,protectedUntil,
          spawnId,score,best,reached,input,ack,heldJump}=player;
        return {id,x,y,vx,ground,velocity,ride,coyote,buffer,jumps,alive,protectedUntil,spawnId,score,best,reached,
          link:input.link,linked:platform && input.link && hasPartner(player,party),ack,heldJump};
      })};
  }
  function predict(state,id){
    const party=state.players.map(p=>({...p,input:{...blankInput(),link:p.link,jump:p.heldJump===true}}));
    const player=party.find(p=>p.id===id);
    if(!player) return null;
    const course=platformLevels[state.checkpoint];
    let elapsed=state.clock;
    return {player,advance(dt,controls,jumpEdge=false){
      if(dt<=0 || !player.alive || state.complete || (!platform && state.countdown)) return;
      const previous=elapsed;
      elapsed+=dt;
      const held=player.input.jump;
      player.input={...controls};
      player.jumpQueued=jumpEdge || (controls.jump && !held);
      if(platform) {
        const at=time=>course.ledges.map(p=>ledgeAt(p,(time-state.levelStart)*60));
        const before={x:player.x,y:player.y};
        platformMovement(player,dt*60,course,at(previous),at(elapsed),state.switchCount>=course.switches.length,party);
        if(!player.alive) Object.assign(player,before);
      }else jumpMovement(player,dt*60,[],elapsed);
    }};
  }
  return {join,leave,input,step,snapshot,predict,get size(){return players.size;},
    get checkpoint(){return platform?level:0;},get complete(){return complete;}};
}
