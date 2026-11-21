const game=document.querySelector('[data-legacy-game]');
const canvas=game.querySelector('canvas');
const ctx=canvas.getContext('2d');
const output=game.querySelector('output');
const platformMode=game.dataset.legacyGame==='platform';
const width=canvas.width,height=canvas.height,ground=height-45,size=24;
const platforms=[{x:0,y:ground,w:width,h:16}];
if(platformMode)platforms.push({x:165,y:255,w:165,h:13},{x:390,y:190,w:160,h:13});
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
 for(const p of platforms)shape(p.x,p.y,p.w,p.h,'--muted',5);
 for(const obstacle of obstacles)shape(obstacle.x,ground-obstacle.h,obstacle.w,obstacle.h,'--accent',6);
 shape(player.x,player.y,size,size,'--ink',7);
}

function jump(){
 if(!running||player.jumps>=(platformMode?1:2))return;
 player.velocity=player.jumps===0?-10.8:-9.2;
 player.jumps++;
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
 output.value=platformMode?'':game.dataset.score+' 0';
 paint();
}

function start(){
 reset();
 running=true;
 lastFrame=performance.now();
 nextFrame=requestAnimationFrame(frame);
}

const keys={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'jump',Space:'jump'};
game.querySelector('[data-start]').addEventListener('click',()=>{start();canvas.focus();});
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
