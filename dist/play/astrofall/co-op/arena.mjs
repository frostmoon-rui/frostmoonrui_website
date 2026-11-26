import {createLegacyArena,LEGACY_MODES} from './legacy-arena.mjs';

export const MAX_PLAYERS = 6;
export const HEIGHT = 540;
export const SPAN = 840;
export const TICK = 1 / 30;
const GROUND = 476;
const WIDTH = 26;
const BODY = 34;
const COURSE = [
  {gap:[245,352], shelves:[[368,395,83]], gate:'plates'},
  {gap:[180,350], shelves:[[250,438,54],[393,398,100]], gate:'roles'},
  {gap:[265,447], shelves:[[334,418,58],[480,382,92]], gate:'relay'},
  {gap:[310,507], shelves:[[365,443,56],[449,395,48]], gate:'plates'},
  {gap:[210,395], shelves:[[260,427,63],[418,374,95]], gate:'roles'},
  {gap:[332,541], shelves:[[384,443,62],[472,404,54]], gate:'relay'},
  {gap:[280,490], shelves:[[331,414,73],[442,401,64]], gate:'roles'},
  {gap:[211,379], shelves:[[270,427,36],[413,385,86]], gate:'plates'},
  {gap:[264,464], shelves:[[321,434,63],[415,369,73]], gate:'finish'},
];

export const LENGTH = COURSE.length;
export const neutral = () => ({axis:0, jump:false, link:false, act:false});
const pad = (x, y, w) => ({x,y,w,h:16});
const overlaps = (x,w,left,right) => x + w > left && x < right;
const groundedOn = (p, plate) => p.ground && Math.abs(p.y + BODY - plate.y) <= 3 &&
  overlaps(p.x,WIDTH,plate.x,plate.x+plate.w);
const clamp = (v,l,h) => Math.min(h,Math.max(l,v));

export function segment(index, mode) {
  const offset = SPAN * index;
  const c = mode === 'relay' ? COURSE[index] : COURSE[((index * 5 + Math.floor(index / 4)) % COURSE.length)];
  if (!c) return null;
  const [from,to] = c.gap;
  const platforms = [pad(offset,GROUND,from), pad(offset+to,GROUND,SPAN-to),
    ...c.shelves.map(([x,y,w]) => pad(offset+x,y,w))];
  const obstacle = index > 1 ? {x:offset+from-65,y:GROUND-28,w:22,h:28} : null;
  return {platforms, obstacle, x:offset, gap:[offset+from,offset+to], gate:c.gate};
}

export function cacheSegments() {
  const cache = new Map();
  return (index, mode) => {
    const key=mode+':'+index;
    if (!cache.has(key)) {
      if (cache.size>=16) cache.delete(cache.keys().next().value);
      cache.set(key,segment(index,mode));
    }
    return cache.get(key);
  };
}

export function gatePads(index, count) {
  return Array.from({length:count}, (_, slot) => pad(index*SPAN + 536 + slot*41,GROUND,32));
}

export function createArena(mode, resume = {}) {
  if(LEGACY_MODES.includes(mode)) return createLegacyArena(mode,resume,MAX_PLAYERS);
  const players = new Map();
  const courseAt = cacheSegments();
  let clock = 0, checkpoint = clamp(Number.isInteger(resume.checkpoint) ? resume.checkpoint : 0,0,LENGTH-1);
  let hold = 0, relayTime = 0, relayStep = 0, serial = 0, complete = resume.complete === true;
  const spawn = (player, level) => {
    Object.assign(player,{x:level*SPAN+42,y:GROUND-BODY,vx:0,vy:0,ground:true,coyote:.12,
      pushed:false,support:null,buffer:0,runCheckpoint:level,spawnId:(player.spawnId || 0)+1});
  };
  function join(id) {
    if (players.size >= MAX_PLAYERS || players.has(id)) return false;
    const leader = Math.max(0, ...Array.from(players.values(), player => player.runCheckpoint));
    const player = {id, role:serial++ % 2, input:neutral(), lastInput:clock, jumpQueued:false, actQueued:false, best:0, cooldown:0};
    spawn(player,mode === 'runner' ? leader : Math.min(checkpoint,LENGTH-1));
    players.set(id,player);
    hold=0; relayStep=0; relayTime=0;
    return true;
  }
  function leave(id) {
    if (players.delete(id)) {hold=0; relayStep=0; relayTime=0;}
  }
  function input(id, value) {
    const player = players.get(id);
    if (!player) return;
    player.lastInput=clock;
    if (Number.isSafeInteger(value.seq) && value.seq>0) player.inputSeq=value.seq;
    player.jumpQueued ||= value.jump === true && !player.input.jump;
    player.actQueued ||= value.act === true && !player.input.act;
    player.input = {axis:[-1,0,1].includes(value.axis) ? value.axis : 0,
      jump:value.jump === true, link:value.link === true, act:value.act === true};
  }
  function activePlatforms(index, player, party) {
    const course = courseAt(index,mode);
    if (!course) return [];
    if (mode === 'relay' && index > 0 && party.length > 1) {
      const [from,to] = course.gap;
      const supported = party.some(other =>
        other.id !== player.id && other.role !== player.role && other.input.link &&
        other.ground && other.x >= from - 130 && other.x < from + 10);
      if (supported) return [...course.platforms,pad(from,GROUND-16,to-from)];
    }
    return course.platforms;
  }
  function move(p, dt, party) {
    p.cooldown=Math.max(0,p.cooldown-dt);
    p.buffer=p.jumpQueued ? .16 : Math.max(0,p.buffer-dt);
    p.coyote=p.ground ? .12 : Math.max(0,p.coyote-dt);
    const partner = p.input.link && party.find(o => o !== p && o.input.link && o.role !== p.role &&
      Math.abs(o.x-p.x) < 104 && Math.abs(o.y-p.y) < 75);
    if (p.buffer && p.coyote) {
      p.vy=partner ? -685 : -520;
      p.buffer=0; p.coyote=0; p.ground=false;
      if (partner && !partner.ground && !partner.cooldown) {
        partner.vy=Math.min(partner.vy,-560);
        partner.cooldown=.9;
      }
    }
    p.vx=(mode === 'runner' ? 205 + 48*p.input.axis : 244*p.input.axis);
    const before=p.x;
    p.x=Math.max(0,p.x+p.vx*dt);
    if (mode === 'relay') {
      const wall = Math.min(checkpoint+1,LENGTH)*SPAN-22;
      p.x=Math.min(p.x,wall-WIDTH);
    }
    const index=Math.floor((p.x+WIDTH/2)/SPAN);
    p.vx=(p.x-before)/dt;
    const floor=activePlatforms(index,p,party);
    const platforms=index ? floor.concat(activePlatforms(index-1,p,party)) : floor;
    const bottom = p.y+BODY;
    p.vy=Math.min(850,p.vy+1350*dt);
    let landing = null;
    if (p.vy >= 0) {
      for (const platform of platforms) {
        if (overlaps(p.x,WIDTH,platform.x,platform.x+platform.w) &&
            bottom <= platform.y+1 && bottom+p.vy*dt >= platform.y &&
            (!landing || platform.y < landing.y)) landing=platform;
      }
    }
    p.ground=!!landing;
    if (landing) {p.y=landing.y-BODY;p.vy=0;}
    else p.y+=p.vy*dt;
    const obstacle=courseAt(index,mode)?.obstacle;
    const hazardLive = Math.sin(clock*2.3+index) > .12;
    const hit = obstacle && hazardLive && overlaps(p.x,WIDTH,obstacle.x,obstacle.x+obstacle.w) &&
      p.y+BODY > obstacle.y && p.y < obstacle.y+obstacle.h;
    if (p.y > HEIGHT+48 || hit) spawn(p,mode === 'runner' ? p.runCheckpoint : checkpoint);
    else if (mode === 'runner' && Math.trunc(before/SPAN)<index && p.ground) p.runCheckpoint=index;
    if (mode === 'runner' && p.ground && p.x % SPAN < 100) p.runCheckpoint=index;
    p.best=Math.max(p.best,Math.round(p.x));
  }
  function advanceGate(party,dt) {
    if (complete || !party.length) return;
    const type=COURSE[checkpoint].gate;
    const pads=gatePads(checkpoint,party.length);
    const right=pads.map((plate,i) => groundedOn(party[i],plate));
    if (type === 'relay') {
      relayTime=Math.max(0,relayTime-dt);
      if (!relayTime) relayStep=0;
      if (right[relayStep] && party[relayStep].actQueued) {
        if (!relayStep) relayTime=6;
        relayStep++;
      }
      if (relayStep < party.length) return;
    } else {
      const requiresLink=type==='roles' && new Set(party.map(p=>p.role)).size>1;
      hold=right.every(Boolean) && (!requiresLink || party.every(p=>p.input.link)) ? hold+dt : 0;
      if (hold < .65) return;
    }
    hold=0; relayStep=0; relayTime=0;
    if (checkpoint===LENGTH-1) complete=true;
    else {
      checkpoint++;
      // Keep the party together and place future arrivals beyond the opened doors.
      for (const player of party) spawn(player,checkpoint);
    }
  }
  function step(dt) {
    clock+=dt;
    const party=[...players.values()];
    for (const p of party) {
      if (clock-p.lastInput>.7 && (p.input.axis || p.input.jump || p.input.link || p.input.act)) {
        p.input=neutral();
      }
    }
    for (const p of party) {
      move(p,dt,party);
      p.ack=p.inputSeq;
      p.heldJump=p.input.jump;
    }
    if (mode === 'relay') advanceGate(party,dt);
    for (const p of party) {p.jumpQueued=false;p.actQueued=false;}
  }
  function snapshot() {
    return {mode,clock,checkpoint,hold,relayStep,relayTime,complete,
      players:[...players.values()].map(({id,role,x,y,vx,vy,ground,coyote,buffer,cooldown,runCheckpoint,best,spawnId,input,ack,heldJump}) =>
        ({id,role,x,y,vx,vy,ground,coyote,buffer,cooldown,runCheckpoint,best,spawnId,link:input.link,ack,heldJump}))};
  }
  function predict(state,id) {
    clock=state.clock;
    const party=state.players.map(player=>({...player,input:{...neutral(),link:player.link,jump:player.heldJump===true}}));
    const player=party.find(item=>item.id===id);
    if(!player || typeof player.ground!=='boolean') return null;
    const spawnId=player.spawnId;
    return {
      player,
      advance(dt,controls,jumpEdge=false){
        if(!dt || player.spawnId!==spawnId) return;
        clock+=dt;
        const was=player.input.jump;
        player.input={axis:controls.axis,jump:controls.jump,link:controls.link,act:false};
        player.jumpQueued=jumpEdge || (controls.jump && !was);
        const before={x:player.x,y:player.y};
        move(player,dt,party);
        if(player.spawnId!==spawnId) Object.assign(player,before);
      },
    };
  }
  return {join,leave,input,step,snapshot,predict,get size(){return players.size;},get checkpoint(){return checkpoint;},get complete(){return complete;}};
}
