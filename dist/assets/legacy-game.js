const game=document.querySelector('[data-legacy-game]');
const canvas=game.querySelector('canvas');
const ctx=canvas.getContext('2d');
const output=game.querySelector('output');
const platformMode=game.dataset.legacyGame==='platform';
const width=canvas.width,height=canvas.height,ground=height-45,size=24;
const course=[
 {x:0,y:ground,w:154,h:19},
 {x:215,y:268,w:104,h:16},
 {x:382,y:221,w:111,h:16},
 {x:551,y:176,w:169,h:19}
];
const platforms=platformMode?course:[{x:0,y:ground,w:width,h:16}];
const goalX=677,goalY=course.at(-1).y;
const startButton=game.querySelector('[data-start]');
const shardPositions=course.slice(1).map(p=>({x:p.x+p.w*.42,y:p.y-size*.55}));
let shards=[];
const controls=new Set();
let player,obstacles,score,spawn,nextFrame,lastFrame,running;

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
  const sky=ctx.createLinearGradient(0,0,0,height);
  sky.addColorStop(0,theme.getPropertyValue('--soft').trim());
  sky.addColorStop(1,theme.getPropertyValue('--bg').trim());
  ctx.fillStyle=sky;
  ctx.fillRect(0,0,width,height);
  ctx.fillStyle=theme.getPropertyValue('--accent').trim();
  ctx.globalAlpha=.2;
  ctx.beginPath();
  ctx.arc(586,81,43,0,Math.PI*2);
  ctx.fill();
  ctx.globalAlpha=.45;
  for(const [x,y] of [[91,78],[140,131],[248,55],[342,155],[436,96],[541,58],[668,119]]){
   ctx.fillRect(x,y,4,4);
  }
  ctx.globalAlpha=1;
  for(const p of platforms){
   shape(p.x,p.y+5,p.w,p.h+3,'--soft',7);
   shape(p.x,p.y,p.w,p.h,'--muted',7);
  }
  for(const {x,y,collected} of shards){
   if(collected)continue;
   ctx.save();
   ctx.translate(x,y);
   ctx.rotate(Math.PI/4);
   shape(-6,-6,12,12,'--gold',2);
   ctx.restore();
  }
  shape(goalX-3,goalY-66,6,66,'--muted',2);
  shape(goalX-3,goalY-66,34,21,'--accent',5);
 }else{
  for(const p of platforms)shape(p.x,p.y,p.w,p.h,'--muted',5);
 }
 for(const obstacle of obstacles)shape(obstacle.x,ground-obstacle.h,obstacle.w,obstacle.h,'--accent',6);
 shape(player.x,player.y,size,size,'--ink',7);
}

function jump(){
 if(!running||player.jumps>=(platformMode?1:2))return;
 player.velocity=player.jumps===0?-10.8:-9.2;
 player.jumps++;
}

function platformStatus(label=''){
 const {shardLabel}=game.dataset;
 const collected=shards.filter(shard=>shard.collected).length;
 output.value=[label,`${shardLabel} ${collected}/${shards.length}`].filter(Boolean).join(' · ');
}

function finishPlatform(label){
 running=false;
 controls.clear();
 startButton.textContent=game.dataset.retry;
 platformStatus(label);
}

function frame(now){
 // The first animation timestamp can precede the click that started the game.
 const step=Math.max(0,Math.min(2,(now-lastFrame)/16.67));
 lastFrame=now;
 if(platformMode){
  const dx=Number(controls.has('right'))-Number(controls.has('left'));
  player.x=Math.max(0,Math.min(width-size,player.x+dx*4.2*step));
 }else{
  spawn-=step;
  if(spawn<=0){
   obstacles.push({x:width,w:22,h:28+Math.random()*48});
   spawn=92+Math.random()*45;
  }
  for(const obstacle of obstacles)obstacle.x-=4.7*step;
  while(obstacles.length&&obstacles[0].x+obstacles[0].w<0){
   obstacles.shift();
   output.value=game.dataset.score+' '+(++score);
  }
 }
 const bottom=player.y+size;
 player.velocity+=0.44*step;
 player.y+=player.velocity*step;
 let landed=false;
 for(const p of platforms){
  if(player.velocity>=0&&bottom<=p.y&&player.y+size>=p.y&&player.x+size>p.x&&player.x<p.x+p.w){
   player.y=p.y-size;
   player.velocity=0;
   player.jumps=0;
   landed=true;
  }
 }
 if(!landed&&platformMode&&player.jumps===0)player.jumps=1;
 if(platformMode){
  if(shards.some(shard=>{
   if(shard.collected||Math.abs(player.x+size/2-shard.x)>size/2+7||Math.abs(player.y+size/2-shard.y)>size/2+7)return false;
   shard.collected=true;
   return true;
  }))platformStatus();
  paint();
  if(player.y>height+size){
   finishPlatform(game.dataset.fell);
   return;
  }
  if(player.x+size>=goalX-4&&player.y+size>=goalY-48&&player.y+size<=goalY){
   finishPlatform(game.dataset.cleared);
   return;
  }
  nextFrame=requestAnimationFrame(frame);
  return;
 }
 paint();
 const collision=obstacles.some(o=>player.x<o.x+o.w&&player.x+size>o.x&&player.y+size>ground-o.h);
 if(collision){
  running=false;
  output.value=game.dataset.gameOver+' · '+game.dataset.score+' '+score;
  return;
 }
 nextFrame=requestAnimationFrame(frame);
}

function reset(){
 cancelAnimationFrame(nextFrame);
 controls.clear();
 player={x:platformMode?48:100,y:ground-size,velocity:0,jumps:0};
 obstacles=[];
 score=0;
 spawn=55;
 if(platformMode){
  shards=shardPositions.map(shard=>({...shard,collected:false}));
  platformStatus();
 }else output.value=game.dataset.score+' 0';
 paint();
}

function start(){
 reset();
 running=true;
 if(platformMode)startButton.textContent=game.dataset.retry;
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
