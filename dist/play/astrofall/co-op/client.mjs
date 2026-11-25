import {cacheSegments, gatePads, SPAN, LENGTH} from './arena.mjs';
import {createMotion} from './motion.mjs';

const $ = id => document.getElementById(id);
const params=new URLSearchParams(location.search);
const copy = {
  en:['Observatory Co-op','Room code','Mode','Constellation Relay','Endless Run','Join','Copy invite','Link','Act',
    'Choose a room. Anyone with its code can join.', 'Connecting…','Room unavailable. Check the connection or try a different code.',
    'players','Hold your numbered plate. Match colors to build bridges and hold Link near a partner to boost jumps.',
    'Stand on your numbered station and press Act in order. Finish before the timer expires.',
    'Run together or race ahead. A/D or arrows change speed. Space jumps; E links and F acts.',
    'The constellation is complete. Invite someone to a new room or try Endless Run.', 'Best', 'Invite copied'],
  zh:['天文台联机','房间码','玩法','星座接力','无限跑酷','加入','复制邀请','合体','互动',
    '按房间码加入，同一房间可以随时进人。','正在连接…','连接失败或房间已满。请检查网络或换一个房间码。',
    '人在线','站上自己的编号门。不同相位的搭档按住合体可铺光桥，靠近一起合体能跳得更高。',
    '站上自己的编号门，按顺序互动。在倒计时结束前完成接力。',
    '一起跑或赛跑。方向键调速，空格跳跃，E 合体，F 互动。',
    '已点亮星座。可以邀请新伙伴或挑战无限跑酷。','最远','已复制邀请链接'],
  ru:['Совместная обсерватория','Код комнаты','Режим','Эстафета созвездий','Бесконечный забег','Войти','Копировать приглашение','Связь','Действие',
    'В комнату можно войти по её коду в любой момент.','Подключение…','Комната недоступна. Проверьте связь или выберите другой код.',
    'в комнате','Встаньте на свою плиту. Разные фазы создают мост. Удерживайте связь рядом с партнёром для высокого прыжка.',
    'Встаньте на свою плиту и нажимайте «Действие» по очереди до истечения времени.',
    'Бегите вместе или наперегонки. Стрелки меняют скорость, пробел — прыжок, E — связь, F — действие.',
    'Созвездие зажглось. Попробуйте новую комнату или бесконечный забег.','Рекорд','Приглашение скопировано'],
  ja:['天文台マルチプレイ','部屋コード','モード','星座リレー','エンドレスラン','参加','招待をコピー','連携','操作',
    '部屋コードがあれば途中からでも参加できます。','接続中…','部屋に接続できません。通信状態や部屋コードを確認してください。',
    '人参加中','自分の番号の床を踏みます。異なる位相の仲間が連携すると橋が現れ、近くで同時に連携すると高く跳べます。',
    '自分の番号の床に立ち、時間内に順番通りに操作してください。',
    '協力や競走ができます。矢印で速度、スペースでジャンプ、E で連携、F で操作。',
    '星座が完成しました。新しい部屋やエンドレスランでも遊べます。','最長','招待をコピーしました'],
};
const requestedLocale=params.get('lang') || document.documentElement.dataset.locale;
let lang=Object.hasOwn(copy,requestedLocale)?requestedLocale:'en';
let socket,id,state;
const canvas=$('game'), ctx=canvas.getContext('2d',{alpha:false});
const motion=createMotion(), courseAt=cacheSegments();
let paintFrame=0, lastPulse=-Infinity, inputActiveUntil=0, statusUpdate=0;
const input={left:false,right:false,jump:false,link:false,act:false};
const colors=['#ffe4a9','#96eadc','#f3a6c3','#9abdf4','#c4a5ec','#ebad84'];
const text=index=>copy[lang][index];
let status=9;
const controls={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',KeyE:'link',KeyF:'act'};
const relativePath = /^\/(zh|en|ru|ja)\/play\/astrofall\/co-op\/$/.test(location.pathname)
  ? '/play/astrofall/co-op/' : new URL('./',location.href).pathname;
if (/^[a-z0-9-]{3,24}$/.test(params.get('room')||'')) $('room').value=params.get('room');
if (params.get('mode')==='runner') $('mode').value='runner';
if (params.get('home')?.match(/^\/(?:zh|en|ru|ja)\/play\/astrofall\/$/)) $('home').href=params.get('home');

function applyLanguage(){
  document.documentElement.lang=lang;
  for(const [index,id] of ['title','room-label','mode-label',null,null,'join','invite','touch-link','touch-act'].entries()){
    if(id) $(id).textContent=text(index);
  }
  $('mode').options[0].textContent=text(3); $('mode').options[1].textContent=text(4);
  $('language').value=lang; document.title=text(0);
}
applyLanguage();
$('language').addEventListener('change',()=>{
  lang=$('language').value;
  applyLanguage();
  nextHud=0;
  scheduleDraw();
});

function publish() {
  if(socket?.readyState!==WebSocket.OPEN || socket.bufferedAmount>2048) return;
  socket.send(JSON.stringify({axis:axis(),jump:input.jump,link:input.link,act:input.act}));
  lastPulse=performance.now();
}
const axis=()=>Number(input.right)-Number(input.left);
function pulse(){
  if(document.hidden || socket?.readyState!==WebSocket.OPEN) return;
  const now=performance.now();
  const driving=state?.mode==='runner' || state?.players[0]?.id===id ||
    now<inputActiveUntil || Object.values(input).some(Boolean);
  if(now-lastPulse >= (driving ? 57 : 155)) publish();
}
// Only visible players keep the room running. Non-driving peers send fewer idle packets.
setInterval(pulse,30);
function changedInput(){
  inputActiveUntil=performance.now()+750;
  publish();
}
function clear(){
  Object.keys(input).forEach(name=>{input[name]=false;});
  publish();
}
function key(event, down){
  if(['INPUT','SELECT','BUTTON'].includes(event.target?.tagName) && down) return;
  const name=controls[event.code];
  if(!name || socket?.readyState!==WebSocket.OPEN) return;
  event.preventDefault();
  if(input[name]!==down){input[name]=down;changedInput();}
}
window.addEventListener('keydown',event=>key(event,true));
window.addEventListener('keyup',event=>key(event,false));
window.addEventListener('blur',clear);
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
    clear();
    cancelAnimationFrame(paintFrame);
    paintFrame=0;
    motion.reset();
  } else {
    if(state) motion.push(state,performance.now());
    publish();
    scheduleDraw();
  }
});
for(const button of document.querySelectorAll('[data-input]')){
  const name=button.dataset.input;
  let owner=null;
  button.addEventListener('pointerdown',event=>{
    event.preventDefault();
    if(owner!==null) return;
    owner=event.pointerId;
    button.setPointerCapture(owner);
    input[name]=true;changedInput();
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(type,event=>{
    if(owner!==event.pointerId) return;
    owner=null;input[name]=false;changedInput();
  });
  button.addEventListener('contextmenu',event=>event.preventDefault());
}

$('lobby').addEventListener('submit',event=>{
  event.preventDefault(); clear(); socket?.close();
  const mode=$('mode').value, room=$('room').value.trim().toLowerCase();
  if(!/^[a-z0-9-]{3,24}$/.test(room)) return;
  status=10;state=null;id=null;lastPulse=-Infinity;
  motion.reset();
  scheduleDraw();
  $('invite').hidden=true;
  const target=new URL(relativePath+'socket/'+mode+'/'+room,location.origin);
  target.protocol=location.protocol==='https:'?'wss:':'ws:';
  const connection=new WebSocket(target);
  socket=connection;
  connection.addEventListener('open',()=>{
    if(socket!==connection) return;
    params.set('room',room);params.set('mode',mode);params.set('lang',lang);
    history.replaceState(null,'','?'+params);
    $('invite').hidden=false;document.activeElement?.blur();
    publish();
  });
  connection.addEventListener('message',event=>{
    if(socket!==connection) return;
    const message=JSON.parse(event.data);
    if(message.type==='welcome') id=message.id;
    else if(Array.isArray(message.players)){
      state=message;
      if(!document.hidden) motion.push(state,performance.now());
    }
    scheduleDraw();
  });
  connection.addEventListener('close',()=>{
    if(socket!==connection) return;
    status=11;state=null;id=null;$('invite').hidden=true;
    motion.reset();
    scheduleDraw();
  });
});
$('invite').addEventListener('click',async ()=>{
  try {await navigator.clipboard.writeText(location.href);}
  catch {window.prompt(text(6),location.href);return;}
  $('invite').textContent=text(18);
  setTimeout(()=>{$('invite').textContent=text(6);},1300);
});

function makeSky(){
  const sky=document.createElement('canvas');
  sky.width=960;sky.height=540;
  const layer=sky.getContext('2d',{alpha:false});
  const gradient=layer.createLinearGradient(0,0,0,540);
  gradient.addColorStop(0,'#162241');gradient.addColorStop(1,'#0b1226');
  layer.fillStyle=gradient;layer.fillRect(0,0,960,540);
  for(let i=0;i<64;i++){
    layer.fillStyle=i%7===0?'#a3bbdc':'#516282';
    layer.fillRect(i*151%960,i*61%450,i%7===0?3:1,i%7===0?3:1);
  }
  return sky;
}
const sky=makeSky();
let prevStatus='',prevHint='',nextHud=0;
function scheduleDraw(){
  if(!paintFrame && !document.hidden) paintFrame=requestAnimationFrame(draw);
}
function draw(now){
  paintFrame=0;
  const view=motion.sample(now,id,axis());
  const players=view?.players||[];
  const me=players.find(p=>p.id===id);
  const camera=Math.max(0,(me?.x||0)-365);
  const layout=state?.mode||'relay';
  const parallax=Math.floor(camera*.13)%960;
  ctx.drawImage(sky,-parallax,0);
  if(parallax) ctx.drawImage(sky,960-parallax,0);
  ctx.save();ctx.translate(-camera,0);
  const first=Math.floor(camera/SPAN);
  const last=Math.floor((camera+960)/SPAN);
  for(let n=first;n<=last;n++){
    const course=courseAt(n,layout);
    if(!course) continue;
    ctx.font='600 16px system-ui';ctx.fillStyle='#b7c6e4';
    ctx.fillText(String(n+1).padStart(2,'0'),course.x+40,405);
    for(const platform of course.platforms){
      ctx.fillStyle='#253f63';ctx.fillRect(platform.x,platform.y,platform.w,platform.h);
      ctx.fillStyle='#89a5c3';ctx.fillRect(platform.x,platform.y,platform.w,2);
    }
    if(course.obstacle && Math.sin((view?.clock||0)*2.3+n)>.12){
      const {x,y,w,h}=course.obstacle;ctx.fillStyle='#f879a4';ctx.fillRect(x,y,w,h);
    }
    if(layout==='relay' && n===state?.checkpoint){
      const [from,to]=course.gap;
      if(n>0 && me && players.some(p=>p.role!==me.role && p.link && p.x>=from-130 && p.x<from+10 && p.y>440)){
        ctx.fillStyle='#72d5d2';ctx.fillRect(from,460,to-from,6);
      }
      for(const [i,plate] of gatePads(n,players.length).entries()){
        ctx.fillStyle=colors[i];ctx.fillRect(plate.x,plate.y-3,plate.w,4);
        ctx.strokeStyle=colors[i];ctx.strokeRect(plate.x,plate.y-63,plate.w,60);
        ctx.font='700 21px system-ui';ctx.fillText(String(i+1),plate.x+10,plate.y-66);
      }
      ctx.fillStyle=state.complete?'#86e3c3':'#c7a36d';
      ctx.fillRect((n+1)*SPAN-22,322,12,154);
    }
  }
  for(const [index,p] of players.entries()){
    if(p.x < camera-60 || p.x > camera+1020) continue;
    if(p.link){ctx.strokeStyle=p.role?'#ad9dff':'#c0eade';ctx.beginPath();ctx.arc(p.x+13,p.y+17,25,0,Math.PI*2);ctx.stroke();}
    ctx.fillStyle=colors[index];ctx.beginPath();ctx.roundRect(p.x,p.y,26,34,8);ctx.fill();
    ctx.fillStyle='#14243b';ctx.fillRect(p.x+4,p.y+11,18,9);
    ctx.fillStyle=p.role?'#edabff':'#80f4d5';ctx.fillRect(p.x+14,p.y+13,5,5);
    ctx.fillStyle='#f1f5fb';ctx.font='700 14px system-ui';ctx.fillText(String(index+1),p.x+9,p.y-12);
  }
  ctx.restore();
  if(state) scheduleDraw();
  if(state?.mode==='runner' && now<nextHud && statusUpdate===players.length) return;
  nextHud=now+180;statusUpdate=players.length;
  const type=state&&courseAt(state.checkpoint,'relay')?.gate;
  const stats=state
    ? `${players.length}/6 ${text(12)} · ${layout==='runner' ? text(17)+' '+Math.floor((me?.best||0)/10)+' m' :
      `${state.checkpoint+1}/${LENGTH}`+(type==='relay' && state.relayTime ? ' · '+Math.ceil(state.relayTime)+' s · '+(state.relayStep+1) : '')}`
    : text(status);
  const hint=state?text(state.complete?16:layout==='runner'?15:type==='relay'?14:13):'';
  if(stats!==prevStatus){$('status').textContent=stats;prevStatus=stats;}
  if(hint!==prevHint){$('hint').textContent=hint;prevHint=hint;}
}
scheduleDraw();
