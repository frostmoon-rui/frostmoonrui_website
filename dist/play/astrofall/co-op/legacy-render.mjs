import {LEGACY_BODY,LEGACY_WIDTH} from './legacy-arena.mjs';
import {ledgeAt,platformLevels} from './legacy-platform-levels.mjs';

export function drawLegacy(ctx,view,me,colors){
  const {state,players,clock}=view;
  const course=state.mode==='platform' ? platformLevels[state.checkpoint] : null;
  const camera=course ? Math.max(0,Math.min(course.width-LEGACY_WIDTH,(me?.x || 0)-250)) : 0;
  ctx.save();
  ctx.translate(0,30);
  ctx.scale(4/3,4/3);
  ctx.translate(-camera,0);
  if(course){
    const ledges=course.ledges.map(ledge=>ledgeAt(ledge,(clock-state.levelStart)*60));
    for(const [i,p] of ledges.entries()){
      if(p.x+p.w<camera || p.x>camera+LEGACY_WIDTH) continue;
      ctx.fillStyle=i===state.spawnLedge?'#327970':'#253f63';
      ctx.fillRect(p.x,p.y,p.w,p.h);
      ctx.fillStyle='#91b3cf';ctx.fillRect(p.x,p.y,p.w,2);
      if(p.checkpoint){
        ctx.fillStyle=i===state.spawnLedge?'#8cf1cc':'#efd298';
        ctx.fillRect(p.x+p.w/2,p.y-22,3,22);ctx.fillRect(p.x+p.w/2,p.y-22,15,8);
      }
    }
    const collected=new Set(state.collected);
    for(const [i,shard] of course.shards.entries()){
      if(collected.has(i)) continue;
      const p=ledges[shard.ledge];
      ctx.fillStyle='#a5c8fd';ctx.beginPath();
      ctx.arc(p.x+shard.offset,p.y-14,5,0,2*Math.PI);ctx.fill();
    }
    for(const s of course.spikes){
      ctx.fillStyle='#f28ba7';ctx.beginPath();
      for(let i=0;i<Math.ceil(s.w/8);i++){
        const left=s.x+i*8;
        ctx.moveTo(left,s.y+s.h);ctx.lineTo(left+4,s.y);ctx.lineTo(left+8,s.y+s.h);
      }
      ctx.fill();
    }
    for(const [i,s] of course.switches.entries()){
      ctx.fillStyle=i<state.switchCount?'#82e2b2':'#f1c776';
      ctx.fillRect(s.x-13,s.y+s.h-3,26,4);
      ctx.font='bold 14px system-ui';ctx.fillText(String(i+1),s.x-4,s.y-5);
    }
    if(course.gate && state.switchCount<course.switches.length){
      ctx.fillStyle='#ddab77'; const {x,y,w,h}=course.gate;ctx.fillRect(x,y,w,h);
    }
    ctx.fillStyle='#a0ebd4';
    ctx.fillRect(course.goal.x,course.goal.y-53,4,53);
    ctx.fillRect(course.goal.x,course.goal.y-53,27,16);
  }else{
    ctx.fillStyle='#253f63';ctx.fillRect(0,315,LEGACY_WIDTH,45);
    ctx.fillStyle='#8cabc9';ctx.fillRect(0,315,LEGACY_WIDTH,2);
    for(const o of view.obstacles || state.obstacles){
      ctx.fillStyle='#ec9b93';ctx.fillRect(o.x,315-o.h,o.w,o.h);
    }
    if(state.countdown>0){
      ctx.fillStyle='#fff0d6';ctx.font='bold 42px system-ui';
      ctx.fillText(String(Math.ceil(state.countdown)),345,134);
    }
  }
  for(const [index,p] of players.entries()){
    if(p.x<camera-32 || p.x>camera+LEGACY_WIDTH+32) continue;
    if(!p.alive) continue;
    const x=p.x+(course ? 0 : ((index%3)-1)*5), y=p.y;
    if(p.id===me?.id || p.link){
      ctx.strokeStyle=p.link?'#b6f6cf':'#ffffff';
      ctx.lineWidth=2;ctx.strokeRect(x-3,y-3,LEGACY_BODY+6,LEGACY_BODY+6);
    }
    ctx.fillStyle=colors[index];ctx.beginPath();ctx.roundRect(x,y,LEGACY_BODY,LEGACY_BODY,6);ctx.fill();
    ctx.fillStyle='#18243b';ctx.fillRect(x+5,y+7,14,6);
    ctx.fillStyle=p.reached?'#a2f5ca':'#ffffff';ctx.font='bold 12px system-ui';
    ctx.fillText(p.reached?'✓':String(index+1),x+8,y-7-(course?0:index*10));
  }
  ctx.restore();
}

export const LEGACY_LEVELS = platformLevels.length;
