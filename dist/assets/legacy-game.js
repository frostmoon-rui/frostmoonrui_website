import {enablePlatformFullscreen} from './legacy-platform-display.js';
import {blankPlatformSave,ledgeAt,platformLevels,readPlatformSave,writePlatformSave} from './legacy-platform-levels.js';

const game=document.querySelector('[data-legacy-game]');
const canvas=game.querySelector('canvas');
const ctx=canvas.getContext('2d');
const output=game.querySelector('output');
const labels=game.dataset;
const platformMode=labels.legacyGame==='platform';
const width=canvas.width,height=canvas.height,ground=height-45,size=24;
const startButton=game.querySelector('[data-start]');
const controls=new Set();
let save=platformMode?readPlatformSave():null;
let level,collected,camera=0,coyote=0,jumpBuffer=0,phase='ready';
let elapsed,ride,switchCount,previousSwitch,seenNotices,liveLedges;
let player,obstacles,score,spawn,nextFrame,lastFrame,running;

function drawCourse(theme,shape){
 const sky=ctx.createLinearGradient(0,0,0,height);
 sky.addColorStop(0,theme.getPropertyValue('--soft').trim());
 sky.addColorStop(1,theme.getPropertyValue('--bg').trim());
 ctx.fillStyle=sky;
 ctx.fillRect(0,0,width,height);

 ctx.fillStyle=theme.getPropertyValue('--accent').trim();
 ctx.globalAlpha=.18;
 ctx.beginPath();
 ctx.arc(width-130-camera*.055,74,42,0,Math.PI*2);
 ctx.fill();
 ctx.globalAlpha=.4;
 const skyOffset=camera*.23;
 for(let i=Math.floor(skyOffset/94);i<=(skyOffset+width)/94;i++){
  ctx.fillRect(i*94+22-skyOffset,38+i*53%117,4,4);
 }
 ctx.globalAlpha=1;

 ctx.save();
 ctx.translate(-camera,0);
 for(const [i,p] of liveLedges.entries()){
  if(p.x+p.w<camera||p.x>camera+width)continue;
  shape(p.x,p.y+6,p.w,p.h+3,'--soft',7);
  shape(p.x,p.y,p.w,p.h,p.motion?'--accent':'--muted',7);
  if(p.motion){
   ctx.fillStyle=theme.getPropertyValue('--bg').trim();
   ctx.font='bold 13px sans-serif';
   ctx.fillText(p.motion.axis==='x'?'↔':'↕',p.x+9,p.y+13);
  }
  if(!p.checkpoint)continue;
  const x=p.x+p.w/2;
  shape(x-3,p.y-39,6,39,'--muted',2);
  shape(x-8,p.y-46,16,13,i<=save.checkpoint?'--gold':'--accent',4);
 }
 for(const [i,{ledge,offset}] of level.shards.entries()){
  const platform=liveLedges[ledge];
  const x=platform.x+offset,y=platform.y-14;
  if(collected.has(i)||x<camera-10||x>camera+width+10)continue;
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(Math.PI/4);
  shape(-6,-6,12,12,'--gold',2);
  ctx.restore();
 }
 for(const spike of level.spikes){
  ctx.fillStyle=theme.getPropertyValue('--danger').trim()||'#c44b49';
  ctx.beginPath();
  const teeth=Math.ceil(spike.w/10);
  const unit=spike.w/teeth;
  for(let tooth=0;tooth<teeth;tooth++){
   const x=spike.x+tooth*unit;
   ctx.moveTo(x,spike.y+spike.h);
   ctx.lineTo(x+unit/2,spike.y);
   ctx.lineTo(x+unit,spike.y+spike.h);
   ctx.closePath();
  }
  ctx.fill();
 }
 for(const [i,plate] of level.switches.entries()){
  const active=i<switchCount;
  shape(plate.x-15,plate.y+9,30,8,active?'--gold':'--accent',4);
  ctx.fillStyle=theme.getPropertyValue('--ink').trim();
  ctx.font='bold 16px sans-serif';
  ctx.textAlign='center';
  ctx.fillText(i+1,plate.x,plate.y-6);
  ctx.textAlign='start';
 }
 const gate=level.gate;
 if(gate&&switchCount<level.switches.length){
  shape(gate.x,gate.y,gate.w,gate.h,'--accent',5);
  for(let y=gate.y+12;y<gate.y+gate.h-7;y+=18)shape(gate.x+4,y,gate.w-8,5,'--bg',2);
 }
 const {x,y}=level.goal;
 shape(x-3,y-66,6,66,'--muted',2);
 shape(x-3,y-66,34,22,'--accent',5);
 shape(player.x,player.y,size,size,'--ink',7);
 ctx.restore();
}

function paint(){
 const theme=getComputedStyle(canvas);
 ctx.clearRect(0,0,width,height);
 function shape(x,y,w,h,color,radius){
  ctx.beginPath();
  ctx.roundRect(x,y,w,h,radius);
  ctx.fillStyle=theme.getPropertyValue(color).trim();
  ctx.fill();
 }
 if(platformMode){
  drawCourse(theme,shape);
  return;
 }
 shape(0,ground,width,16,'--muted',5);
 for(const obstacle of obstacles)shape(obstacle.x,ground-obstacle.h,obstacle.w,obstacle.h,'--accent',6);
 shape(player.x,player.y,size,size,'--ink',7);
}

function jump(){
 if(!running)return;
 if(platformMode){
  jumpBuffer=7;
 }else if(player.jumps<2){
  player.velocity=player.jumps===0?-10.8:-9.2;
  player.jumps++;
 }
}

function platformStatus(message=''){
 output.value=[
  `${labels.levelLabel} ${save.level+1}/${platformLevels.length}`,
  `${labels.shardLabel} ${collected.size}/${level.shards.length}`,
  level.switches.length?`${labels.switches} ${switchCount}/${level.switches.length}`:'',
  message
 ].filter(Boolean).join(' · ');
}

function finishPlatform(nextPhase,message,button){
 phase=nextPhase;
 running=false;
 controls.clear();
 startButton.textContent=button;
 platformStatus(message);
}

function cameraTarget(){
 return Math.max(0,Math.min(level.width-width,player.x-width*.36));
}

function advancePlatform(step){
 const previous=liveLedges;
 elapsed+=step;
 liveLedges=level.ledges.map(p=>ledgeAt(p,elapsed));
 if(ride>=0){
  player.x+=liveLedges[ride].x-previous[ride].x;
  player.y+=liveLedges[ride].y-previous[ride].y;
 }
 const oldX=player.x;
 const dx=Number(controls.has('right'))-Number(controls.has('left'));
 player.x=Math.max(0,Math.min(level.width-size,player.x+dx*4.2*step));
 const gate=level.gate;
 if(gate&&switchCount<level.switches.length&&player.y+size>gate.y&&player.y<gate.y+gate.h){
  if(oldX+size<=gate.x&&player.x+size>gate.x)player.x=gate.x-size;
  if(oldX>=gate.x+gate.w&&player.x<gate.x+gate.w)player.x=gate.x+gate.w;
 }
 if(jumpBuffer>0&&coyote>0){
  player.velocity=-10.8;
  jumpBuffer=0;
  coyote=0;
 }
 jumpBuffer=Math.max(0,jumpBuffer-step);
 coyote=Math.max(0,coyote-step);

 const bottom=player.y+size;
 player.velocity+=.44*step;
 player.y+=player.velocity*step;
 const landed=liveLedges.findIndex((p,i)=>{
  const previousTop=i===ride?p.y:previous[i].y;
  return bottom<=previousTop+.001&&player.y+size>=p.y&&player.x+size>p.x&&player.x<p.x+p.w;
 });
 ride=landed;
 if(landed>=0){
  player.y=liveLedges[landed].y-size;
  player.velocity=0;
  coyote=6;
 }
 for(const spike of level.spikes){
  if(player.x+size-5<=spike.x||player.x+5>=spike.x+spike.w||player.y+size-4<=spike.y||player.y>=spike.y+spike.h)continue;
  paint();
  finishPlatform('ready',labels.hit,save.checkpoint?labels.resume:labels.retry);
  return;
 }
 let message='';
 const plate=level.switches.findIndex(p=>Math.abs(player.x+size/2-p.x)<19&&Math.abs(player.y+size-p.y-p.h)<2);
 if(plate>=0&&plate!==previousSwitch&&switchCount<level.switches.length){
  if(plate===switchCount){
   switchCount++;
   message=switchCount===level.switches.length?labels.opened:labels.activated;
  }else if(plate>switchCount){
   switchCount=0;
   message=labels.wrong;
  }
 }
 previousSwitch=plate;
 let foundShard=false;
 for(const [i,shard] of level.shards.entries()){
  const p=liveLedges[shard.ledge];
  if(collected.has(i)||Math.abs(player.x+size/2-p.x-shard.offset)>size/2+7||Math.abs(player.y+size/2-p.y+14)>size/2+7)continue;
  collected.add(i);
  foundShard=true;
 }
 for(const notice of level.notices){
  if(seenNotices.has(notice.type)||player.x<notice.x-145)continue;
  seenNotices.add(notice.type);
  message=message||labels[notice.type];
 }
 if(landed>save.checkpoint&&level.ledges[landed].checkpoint){
  save={level:save.level,checkpoint:landed,collected:[...collected],switchCount};
  writePlatformSave(save);
  startButton.textContent=labels.resume;
  message=labels.saved;
 }
 if(message||foundShard)platformStatus(message);

 camera+=(cameraTarget()-camera)*Math.min(1,step*.2);
 paint();
 if(player.y>height+size){
  finishPlatform('ready',labels.fell,save.checkpoint?labels.resume:labels.retry);
  return;
 }
 if(landed===level.goal.ledge&&player.x+size>=level.goal.x-4&&switchCount===level.switches.length){
  if(save.level+1===platformLevels.length){
   save={...save,collected:[...collected],switchCount,completed:true};
   writePlatformSave(save);
   finishPlatform('complete',labels.completed,labels.replay);
  }else{
   writePlatformSave(blankPlatformSave(save.level+1));
   finishPlatform('next',labels.cleared,labels.next);
  }
 }
}

function advanceJumpGame(step){
 spawn-=step;
 if(spawn<=0){
  obstacles.push({x:width,w:22,h:28+Math.random()*48});
  spawn=92+Math.random()*45;
 }
 for(const obstacle of obstacles)obstacle.x-=4.7*step;
 while(obstacles.length&&obstacles[0].x+obstacles[0].w<0){
  obstacles.shift();
  output.value=labels.score+' '+(++score);
 }
 player.velocity+=.44*step;
 player.y+=player.velocity*step;
 if(player.y>=ground-size){
  player.y=ground-size;
  player.velocity=0;
  player.jumps=0;
 }
 paint();
 if(obstacles.some(o=>player.x<o.x+o.w&&player.x+size>o.x&&player.y+size>ground-o.h)){
  running=false;
  output.value=labels.gameOver+' · '+labels.score+' '+score;
 }
}

function frame(now){
 // The first animation timestamp can precede the click that started the game.
 const step=Math.max(0,Math.min(2,(now-lastFrame)/16.67));
 lastFrame=now;
 if(step>0){
  if(platformMode)advancePlatform(step);
  else advanceJumpGame(step);
 }
 if(running)nextFrame=requestAnimationFrame(frame);
}

function reset(){
 cancelAnimationFrame(nextFrame);
 controls.clear();
 if(platformMode){
  level=platformLevels[save.level];
  const ledge=level.ledges[save.checkpoint];
  player={x:ledge.x+(save.checkpoint?ledge.w/2-size/2:42),y:ledge.y-size,velocity:0};
  collected=new Set(save.collected);
  elapsed=0;
  liveLedges=level.ledges.map(p=>ledgeAt(p,elapsed));
  ride=save.checkpoint;
  switchCount=save.switchCount;
  previousSwitch=-1;
  seenNotices=new Set(level.notices.filter(notice=>notice.x<player.x).map(notice=>notice.type));
  coyote=6;
  jumpBuffer=0;
  camera=cameraTarget();
  platformStatus();
 }else{
  player={x:100,y:ground-size,velocity:0,jumps:0};
  obstacles=[];
  score=0;
  spawn=55;
  output.value=labels.score+' 0';
 }
 paint();
}

function start(){
 if(platformMode){
  if(phase==='next')save=blankPlatformSave(save.level+1);
  if(phase==='complete')save=blankPlatformSave();
  writePlatformSave(save);
  phase='playing';
  startButton.textContent=save.checkpoint?labels.resume:labels.retry;
 }
 reset();
 running=true;
 lastFrame=performance.now();
 nextFrame=requestAnimationFrame(frame);
}

const keys={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'jump',Space:'jump'};
startButton.addEventListener('click',()=>{start();canvas.focus({preventScroll:true});});
canvas.addEventListener('pointerdown',()=>{if(!platformMode)jump();});
canvas.addEventListener('keydown',event=>{
 const control=keys[event.code];
 if(!control)return;
 event.preventDefault();
 if(control==='jump'&&!event.repeat)jump();
 if(control!=='jump')controls.add(control);
});
canvas.addEventListener('keyup',event=>controls.delete(keys[event.code]));
canvas.addEventListener('blur',()=>controls.clear());
window.addEventListener('blur',()=>controls.clear());
for(const button of game.querySelectorAll('[data-control]')){
 const {control}=button.dataset;
 if(control==='jump'){
  button.addEventListener('pointerdown',event=>{
   if(event.button!==0)return;
   event.preventDefault();
   jump();
  });
  button.addEventListener('click',event=>{if(event.detail===0)jump();});
  continue;
 }
 button.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;
  event.preventDefault();
  button.setPointerCapture(event.pointerId);
  controls.add(control);
 });
 for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>controls.delete(control));
 button.addEventListener('keydown',event=>{if(event.code==='Space'||event.code==='Enter')controls.add(control);});
 button.addEventListener('keyup',()=>controls.delete(control));
 button.addEventListener('blur',()=>controls.delete(control));
}
new MutationObserver(()=>{if(!running)paint();}).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
reset();
if(save?.completed)finishPlatform('complete',labels.completed,labels.replay);
else if(save?.checkpoint)startButton.textContent=labels.resume;
if(platformMode)enablePlatformFullscreen(game,canvas);
