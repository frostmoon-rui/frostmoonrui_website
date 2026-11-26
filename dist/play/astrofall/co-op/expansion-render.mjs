import {tileWalls,routeWalls,platforms,gravityCourses} from './expansion-maps.mjs';

const colors=['#f5c981','#86e4d7','#d6a5f8','#ffa4a9','#b4c9ff','#f3bca2'];
const rgb={gravity:['#091b2b','#203a52'],comets:['#1e1433','#432645'],tanks:['#19292a','#314749'],brawl:['#21182e','#54394a']};

export function drawExpansion(ctx,view,local){
  const {state,players}=view;
  const {mode,checkpoint,variant}=state;
  const gravity=mode==='gravity';
  const course=gravityCourses[checkpoint];
  const [back,wall]=rgb[mode];
  ctx.save();
  ctx.fillStyle=back;ctx.fillRect(0,0,960,540);
  ctx.strokeStyle='#ffffff12';ctx.lineWidth=1;
  for(let x=0;x<960;x+=48){
    ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,540);ctx.stroke();
  }
  for(let y=0;y<540;y+=48){
    ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(960,y);ctx.stroke();
  }
  const geometry=mode==='tanks'?tileWalls:mode==='brawl'?platforms:routeWalls(variant);
  for(const part of geometry){
    ctx.fillStyle=wall;ctx.fillRect(part.x,part.y,part.w,part.h);
    ctx.strokeStyle='#ffffff25';ctx.strokeRect(part.x,part.y,part.w,part.h);
  }
  if(gravity || mode==='comets'){
    ctx.fillStyle='#829fc0';ctx.fillRect(24,51,912,3);ctx.fillRect(24,487,912,3);
    ctx.fillStyle='#bfd5ff';ctx.fillRect(895,85,6,366);
    for(const [index,gate] of (gravity?course.gates:[]).entries()){
      ctx.fillStyle=local?.open?.[index]?'#88ffc160':'#ffc482b5';
      ctx.fillRect(gate-3,55,6,430);
      for(let slot=0;slot<2;slot++){
        ctx.fillStyle=colors[slot];
        const y=course.directions[slot]>0?483:53;
        for(const x of [gate-97,gate+87]){
          ctx.fillRect(x-41,y,82,5);
          ctx.font='700 15px system-ui';ctx.fillText(String(slot+1),x-4,y+(y<100?23:-12));
        }
      }
    }
    if(gravity){
      for(const [slot,dir] of course.directions.entries()){
        ctx.fillStyle=colors[slot];
        ctx.fillRect(869,dir>0?483:53,53,5);
      }
    }
  }
  for(const shot of state.projectiles){
    ctx.fillStyle='#fff0b9';ctx.beginPath();ctx.arc(shot.x,shot.y,5,0,Math.PI*2);ctx.fill();
  }
  for(const p of players){
    const color=p.bot?'#eb9c96':colors[p.slot];
    ctx.fillStyle=color;
    if(mode==='tanks'){
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.aimY,p.aimX));
      ctx.beginPath();ctx.roundRect(-15,-13,30,26,6);ctx.fill();
      ctx.fillStyle='#253036';ctx.fillRect(-12,-10,17,20);ctx.fillStyle=color;ctx.fillRect(0,-3,23,6);
      ctx.restore();
      ctx.strokeStyle=color;ctx.strokeRect(p.x-14,p.y-27,28,5);
      ctx.fillRect(p.x-13,p.y-26,26*p.hearts/3,3);
    }else{
      ctx.beginPath();ctx.roundRect(p.x-11,p.y-11,22,22,6);ctx.fill();
      ctx.fillStyle=back;ctx.beginPath();ctx.arc(p.x+(p.aimX>0?4:-4),p.y,3,0,Math.PI*2);ctx.fill();
      if(p.link && mode==='brawl'){
        ctx.strokeStyle=color;ctx.beginPath();ctx.arc(p.x,p.y,18,0,Math.PI*2);ctx.stroke();
      }
      if(mode==='brawl' && p.damage){
        ctx.fillStyle='#f9e8eb';ctx.font='600 13px system-ui';
        ctx.fillText(Math.round(p.damage)+'%',p.x-12,p.y-31);
      }
    }
    ctx.fillStyle='#fcf4e9';ctx.font='700 15px system-ui';
    ctx.fillText(p.bot?'CPU':String(p.slot+1),p.x-5,p.y+29);
    if(p.id===local?.id){ctx.strokeStyle='#fff';ctx.strokeRect(p.x-20,p.y-20,40,40);}
  }
  ctx.restore();
}

export const expansionText={
  en:{
    gravity:['Opposite Orbits','Two players required. Use F or Flip to change gravity. Stand on your numbered pad to open your partner’s gate. Both must finish on their marked rails.'],
    tanks:['Ricochet Garage','Move with arrows or WASD. Aim by moving; use F or Fire to shoot. Walls bounce shots. First to three wins. A CPU joins when you are alone.'],
    brawl:['Bell Tower Brawl','Jump with Space, use F or Strike to knock rivals off the ledges, and E or Guard to soften hits. First to five ring-outs wins.'],
    comets:['Comet Circuit','Race across the arena. Use F or Flip to swap floor and ceiling. The first to finish three runs wins.'],
    flip:'Flip', fire:'Fire', strike:'Strike', guard:'Guard', waiting:'Waiting for a second player', completed:'Course complete', win:'Winner', round:'Round',
  },
  zh:{
    gravity:['逆轨协作','必须双人。按 F 或点「翻转」切换重力。踩住自己的编号板，给队友开门。两人都要踩着各自颜色的轨道到终点。'],
    tanks:['回弹坦克','方向键或 WASD 移动，移动方向即瞄准方向。按 F 或点「开火」，炮弹碰墙反弹。先击毁对方 3 次获胜，单人自动匹配人机。'],
    brawl:['钟楼擂台','空格跳跃，F 或「出击」击退对手，E 或「防御」减轻击退。先将对手打出场外 5 次获胜。'],
    comets:['彗星竞速','用 F 或「翻转」在天花板和地面之间换轨，绕开挡墙。先跑完 3 趟获胜。'],
    flip:'翻转', fire:'开火', strike:'出击', guard:'防御', waiting:'等待第二名玩家', completed:'全部通关', win:'获胜', round:'回合',
  },
  ru:{
    gravity:['Встречные орбиты','Нужны двое. F меняет гравитацию. Ваша плита открывает ворота партнёру. Оба должны финишировать на своей стороне.'],
    tanks:['Рикошетный гараж','Стрелки или WASD — движение и прицеливание. F — выстрел. Снаряды отражаются от стен. Три победы решают исход. В одиночку играет бот.'],
    brawl:['Схватка на колокольне','Пробел — прыжок, F — удар, E — защита. Побеждает первый, кто пять раз столкнёт соперника.'],
    comets:['Кометная трасса','Переключайте гравитацию клавишей F, обходите стены. Три финиша приносят победу.'],
    flip:'Переворот', fire:'Огонь', strike:'Удар', guard:'Защита',waiting:'Ожидаем второго игрока',completed:'Трасса пройдена',win:'Победитель',round:'Раунд',
  },
  ja:{
    gravity:['逆軌道協力','二人専用。Fで重力を反転。自分の番号を踏むと相手の門が開きます。二人とも色付きの軌道でゴールしてください。'],
    tanks:['反射タンク','矢印またはWASDで移動・照準、Fで射撃。弾は壁で反射します。先に3撃破した方の勝ち。一人ならCPU戦です。'],
    brawl:['鐘楼バトル','スペースでジャンプ、Fで攻撃、Eで防御。先に5回場外へ押し出すと勝利です。'],
    comets:['彗星レース','Fで重力を反転して壁を回避。先に3回ゴールした方の勝ちです。'],
    flip:'反転',fire:'発射',strike:'攻撃',guard:'防御',waiting:'二人目を待機中',completed:'全ステージクリア',win:'勝者',round:'ラウンド',
  },
};

export function expansionStatus(lang,state){
  const words=expansionText[lang];
  if(state.mode==='gravity'){
    if(state.complete) return words.completed;
    if(state.players.length<2) return words.waiting;
    return (state.checkpoint+1)+' / '+state.roomCount;
  }
  const points=state.players.map(p=>(p.bot?'CPU':p.slot+1)+' · '+p.score).join('   /   ');
  const winner=state.players.find(p=>p.id===state.winner);
  return winner ? words.win+' · '+(winner.bot?'CPU':winner.slot+1)+' · '+Math.ceil(state.countdown)+' s' :
    words.round+' '+state.round+'   |   '+points;
}
