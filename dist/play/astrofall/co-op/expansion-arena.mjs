import {clamp, tileWalls, routeWalls, platforms, gravityCourses} from './expansion-maps.mjs';

export const EXPANSION_MODES=['gravity','tanks','brawl','comets'];
export const EXPANSION_WIDTH=960, EXPANSION_HEIGHT=540;
const top=64, bottom=476, body=22, minX=48, maxX=912;
const blank=()=>({axis:0,vertical:0,jump:false,link:false,act:false});
const overlap=(x,y,radius,r)=>x+radius>r.x && x-radius<r.x+r.w &&
  y+radius>r.y && y-radius<r.y+r.h;
const onRail=(p,dir)=>p.ground && p.polarity===dir;
const gravitySize=gravityCourses.length;
export const getRoomCapacity=mode=>mode==='gravity'?2:6;

function gravityPad(p,course,gate,slot){
  const dir=course.directions[slot];
  return onRail(p,dir) && (Math.abs(p.x-(gate-97))<45 || Math.abs(p.x-(gate+87))<43);
}

function gravMove(p,dt,input,checkpoint,coop,open,variant){
  const course=gravityCourses[checkpoint];
  p.cooldown=Math.max(0,p.cooldown-dt);
  if(p.actQueued && !p.cooldown){
    p.polarity*=-1;p.cooldown=.31;p.vy=0;p.ground=false;
  }
  const oldX=p.x;
  const oldY=p.y;
  p.x=clamp(oldX+input.axis*255*dt,minX,maxX);
  p.vy=clamp(p.vy+p.polarity*1260*dt,-640,640);
  p.y=clamp(oldY+p.vy*dt,top,bottom);
  p.ground=p.y===top || p.y===bottom;
  if(p.ground) p.vy=0;
  if(coop){
    for(const [index,gate] of course.gates.entries()){
      if(!open[index] && oldX<=gate-body/2 && p.x>gate-body/2) p.x=gate-body/2;
    }
  }
  for(const wall of routeWalls(variant)){
    if(!overlap(p.x,p.y,body/2,wall)) continue;
    if(!overlap(oldX,p.y,body/2,wall)) p.x=oldX;
    else {p.y=oldY;p.vy=0;}
  }
  p.vx=dt?(p.x-oldX)/dt:0;
}

function tankMove(p,dt,input){
  const x=input.axis,y=input.vertical || 0;
  const n=Math.hypot(x,y)||1;
  if(x || y){p.aimX=x/n;p.aimY=y/n;}
  const oldX=p.x,oldY=p.y;
  p.x=clamp(p.x+x*172*dt/n,34,926);
  if(tileWalls.some(wall=>overlap(p.x,p.y,15,wall))) p.x=oldX;
  p.y=clamp(p.y+y*172*dt/n,34,506);
  if(tileWalls.some(wall=>overlap(p.x,p.y,15,wall))) p.y=oldY;
  p.vx=(p.x-oldX)/dt;p.vy=(p.y-oldY)/dt;p.ground=true;
}

function brawlMove(p,dt,input){
  if(p.ground && p.jumpQueued && !input.link){p.vy=-525;p.ground=false;}
  const base=input.axis*(input.link?116:245);
  if(input.axis) p.aimX=input.axis;
  p.kick*=Math.exp(-dt*2.7);
  p.vx=base+p.kick;
  const priorFoot=p.y+body/2;
  p.x+=p.vx*dt;
  p.vy=Math.min(760,p.vy+1400*dt);
  p.y+=p.vy*dt;
  const ledge=p.vy>=0 && platforms.find(s=>priorFoot<=s.y+1 && p.y+body/2>=s.y &&
    p.x+body/2>s.x && p.x-body/2<s.x+s.w);
  p.ground=Boolean(ledge);
  if(ledge){p.y=ledge.y-body/2;p.vy=0;}
}

export function createExpansionArena(mode,resume={},capacity=getRoomCapacity(mode)){
  const players=new Map();
  const coop=mode==='gravity', tanks=mode==='tanks', brawl=mode==='brawl';
  let checkpoint=coop?clamp(Number.isInteger(resume.checkpoint)?resume.checkpoint:0,0,gravitySize-1):0;
  const variant=()=>coop?gravityCourses[checkpoint].variant:(round-1)%gravitySize;
  let complete=coop && resume.complete===true;
  let clock=0,round=1,winner=null,nextRound=0,projectiles=[];
  const bots={id:'opponent',bot:true,slot:1};
  function spawn(p,slot){
    p.slot=slot;
    const spots=[[95,115],[865,430],[105,430],[855,115],[460,96],[490,450]];
    const sides=[[175,404],[785,404],[300,312],[620,312],[423,220],[538,220]];
    const polarity=slot%2===0?1:-1;
    const [x,y]=tanks?spots[slot%spots.length]:brawl?sides[slot%sides.length]:
      [minX+slot%2*24,polarity>0?bottom:top];
    Object.assign(p,{x,y,polarity,vx:0,vy:0,kick:0,cooldown:0,ground:true,aimX:slot%2?-1:1,aimY:0,
      hearts:3,damage:0,spawnId:(p.spawnId||0)+1,protectedUntil:clock+.6});
  }
  function join(id){
    if(players.has(id) || players.size>=capacity) return false;
    const slot=Array.from({length:capacity},(_,i)=>i).find(i=>![...players.values()].some(p=>p.slot===i));
    const p={id,slot,score:0,input:blank(),lastInput:clock};
    spawn(p,slot);players.set(id,p);
    if(tanks && players.size===1){bots.score=0;bots.input=blank();spawn(bots,slot===0?1:0);}
    if(tanks && players.size===2) projectiles=projectiles.filter(shot=>shot.owner!==bots.id);
    if(!coop && winner && !players.has(winner) && winner!==bots.id){winner=null;nextRound=0;}
    return true;
  }
  function leave(id){
    players.delete(id);
    projectiles=projectiles.filter(shot=>shot.owner!==id);
    if(tanks && players.size===1){
      bots.score=0;bots.input=blank();spawn(bots,[...players.values()][0].slot===0?1:0);
    }
  }
  function input(id,value){
    const p=players.get(id);
    if(!p) return;
    if(Number.isSafeInteger(value.seq) && value.seq>0){
      if(value.seq<=(p.inputSeq||0)) return;
      p.inputSeq=value.seq;
    }
    const action=Number.isSafeInteger(value.action) && value.action>(p.lastAction||0);
    if(action) p.lastAction=value.action;
    p.actQueued ||= action || (value.act===true && !p.input.act);
    p.jumpQueued ||= value.jump===true && !p.input.jump;
    p.lastInput=clock;
    p.input={axis:[-1,0,1].includes(value.axis)?value.axis:0,
      vertical:[-1,0,1].includes(value.vertical)?value.vertical:0,jump:value.jump===true,
      link:value.link===true,act:value.act===true};
  }
  function participants(){
    const party=[...players.values()];
    if(tanks && players.size===1) party.push(bots);
    return party;
  }
  function gateState(party,course,p){
    const partner=party.find(o=>o.id!==p.id);
    return course.gates.map(gate=>Boolean(partner && gravityPad(partner,course,gate,partner.slot)));
  }
  function score(p){
    if(!p) return;
    p.score++;
    if(p.score>=(brawl?5:3)){winner=p.id;nextRound=clock+3;}
  }
  function tankAI(dt,enemy){
    const dx=enemy.x-bots.x,dy=enemy.y-bots.y;
    const axes=[{axis:Math.sign(dx),vertical:0},{axis:0,vertical:Math.sign(dy)},
      {axis:-Math.sign(dx),vertical:0},{axis:0,vertical:-Math.sign(dy)}];
    const [along,across,...escape]=Math.abs(dx)>Math.abs(dy)?axes:[axes[1],axes[0],axes[3],axes[2]];
    const order=Math.floor(clock/2)%3===0?[across,along,...escape]:[along,across,...escape];
    const travel=order.find(o=>(o.axis||o.vertical) &&
      !tileWalls.some(w=>overlap(bots.x+o.axis*21,bots.y+o.vertical*21,15,w))) || blank();
    bots.input={...blank(),...travel,act:true};
    tankMove(bots,dt,bots.input);
    const distance=Math.hypot(dx,dy);
    if(distance>0 && distance<350){
      bots.aimX=dx/distance;bots.aimY=dy/distance;
    }
  }
  function fire(p,interval){
    const x=p.x+p.aimX*19,y=p.y+p.aimY*19;
    if(tileWalls.some(w=>overlap(x,y,4,w))) return;
    projectiles.push({owner:p.id,x,y,vx:p.aimX*343,vy:p.aimY*343,bounces:2,expires:clock+3.4});
    p.cooldown=interval;
  }
  function stepTanks(dt,party){
    for(const p of party){
      if(p.bot) tankAI(dt,party[0]); else tankMove(p,dt,p.input);
      p.cooldown=Math.max(0,p.cooldown-dt);
      if((p.input.act || p.actQueued) && !p.cooldown) fire(p,p.bot?.8:.42);
    }
    projectiles=projectiles.filter(shot=>{
      if(shot.expires<=clock) return false;
      const oldX=shot.x,oldY=shot.y;
      shot.x+=shot.vx*dt;
      if(shot.x<19 || shot.x>941 || tileWalls.some(r=>overlap(shot.x,oldY,4,r))){
        shot.x=oldX;shot.vx*=-1;shot.bounces--;
      }
      shot.y+=shot.vy*dt;
      if(shot.y<19 || shot.y>521 || tileWalls.some(r=>overlap(shot.x,shot.y,4,r))){
        shot.y=oldY;shot.vy*=-1;shot.bounces--;
      }
      if(shot.bounces<0) return false;
      const hit=party.find(p=>p.id!==shot.owner && clock>=p.protectedUntil && Math.hypot(p.x-shot.x,p.y-shot.y)<19);
      if(!hit) return true;
      hit.hearts--;
      if(hit.hearts<=0){
        score(party.find(p=>p.id===shot.owner));
        spawn(hit,hit.slot);
      }
      return false;
    });
  }
  function stepBrawl(dt,party){
    for(const p of party){
      brawlMove(p,dt,p.input);
      p.cooldown=Math.max(0,p.cooldown-dt);
    }
    for(const p of party){
      if(p.actQueued && !p.cooldown){
        p.cooldown=.38;
        for(const other of party){
          const dx=(other.x-p.x)*p.aimX;
          if(other===p || dx<0 || dx>64 || Math.abs(other.y-p.y)>40 || clock<other.protectedUntil) continue;
          const guard=other.input.link?.35:1;
          other.damage=Math.min(other.damage+14*guard,120);
          other.kick=p.aimX*(320+other.damage*3.1)*guard;
          other.vy=-190*guard;other.hitBy=p.id;other.hitUntil=clock+4;
        }
      }
      if(p.y>575 || p.x<-35 || p.x>995){
        if(p.hitUntil>clock) score(party.find(o=>o.id===p.hitBy));
        spawn(p,p.slot);
        p.hitBy=null;
      }
    }
  }
  function stepGravity(dt,party){
    const course=gravityCourses[checkpoint];
    if(coop && (party.length<2 || complete)) return;
    const gates=party.map(p=>gateState(party,course,p));
    for(const [index,p] of party.entries()){
      gravMove(p,dt,p.input,checkpoint,coop,gates[index],variant());
      if(!coop && p.x>=900){
        score(p);spawn(p,p.slot);
      }
    }
    if(coop && party.every(p=>p.x>=870 && onRail(p,course.directions[p.slot]))){
      if(checkpoint===gravitySize-1) complete=true;
      else {checkpoint++;for(const p of party) spawn(p,p.slot);}
    }
  }
  function step(dt){
    clock+=dt;
    const party=participants();
    if(!party.length) return;
    if(winner){
      if(clock<nextRound) return;
      winner=null;round++;projectiles=[];
      for(const p of party){p.score=0;spawn(p,p.slot);}
    }
    for(const p of party) if(!p.bot && clock-p.lastInput>.8) p.input=blank();
    if(tanks) stepTanks(dt,party);
    else if(brawl) stepBrawl(dt,party);
    else stepGravity(dt,party);
    for(const p of party){p.ack=p.inputSeq;p.actQueued=false;p.jumpQueued=false;}
  }
  function snapshot(){
    const party=participants();
    return {mode,clock,checkpoint,complete,variant:variant(),round,winner,countdown:winner?Math.max(0,nextRound-clock):0,
      roomCount:coop?gravitySize:undefined,projectiles:projectiles.map(({x,y})=>({x,y})),
      players:party.map(p=>({id:p.id,bot:p.bot,slot:p.slot,x:p.x,y:p.y,vx:p.vx,vy:p.vy,ground:p.ground,
        spawnId:p.spawnId,ack:p.ack,heldJump:p.input.jump,heldAct:p.input.act,hearts:p.hearts,damage:p.damage,score:p.score,
        kick:p.kick,aimX:p.aimX,aimY:p.aimY,link:p.input.link,
        polarity:p.polarity,cooldown:p.cooldown,open:coop?gateState(party,gravityCourses[checkpoint],p):undefined}))};
  }
  function predict(state,id){
    const found=state.players.find(p=>p.id===id);
    if(!found) return null;
    const p={...found};
    return {player:p,advance(dt,control,jumpEdge=false){
      if(!dt || state.complete || state.winner || (coop && state.players.length<2)) return;
      p.jumpQueued=jumpEdge || control.jump && !p.heldJump;
      p.actQueued=control.act && !p.heldAct;
      if(tanks) tankMove(p,dt,control);
      else if(brawl) brawlMove(p,dt,control);
      else gravMove(p,dt,control,state.checkpoint,coop,p.open,state.variant);
      p.heldJump=control.jump;p.heldAct=control.act;
    }};
  }
  return {join,leave,input,step,snapshot,predict,get size(){return players.size;},get checkpoint(){return checkpoint;},get complete(){return complete;}};
}
