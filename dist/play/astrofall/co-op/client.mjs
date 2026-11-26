import {EXPANSION_MODES} from './expansion-arena.mjs';
import {expansionStatus,expansionText,drawExpansion} from './expansion-render.mjs';
import {cacheSegments, gatePads, SPAN, LENGTH, GATE_HOLD} from './arena.mjs';
import {createMotion} from './motion.mjs';
import {LEGACY_MODES} from './legacy-arena.mjs';
import {drawLegacy,LEGACY_LEVELS} from './legacy-render.mjs';

const $ = id => document.getElementById(id);
const params=new URLSearchParams(location.search);
const apacRoom=params.get('region')==='apac';
const networkLabels={zh:'亚太测试 · 输入确认',en:'Asia-Pacific trial · Input confirmation',ru:'Тест АТР · Подтверждение ввода',ja:'アジア太平洋テスト · 入力の確認'};
const copy = {
  en:['Observatory Co-op','Room code','Mode','Constellation Relay','Endless Run','Join','Copy invite','Link','Act',
    'Choose a room. Anyone with its code can join.', 'Connecting…','Room unavailable. Check the connection or try a different code.',
    'players','Hold your numbered plate. Use Link near a gap to build a bridge, or with a nearby partner for a jump boost.',
    'Stand on your numbered station and press Act in order. Finish before the timer expires.',
    'Run together or race ahead. A/D or arrows change speed. Space jumps; E links and F acts.',
    'The constellation is complete. Invite someone to a new room or try Endless Run.', 'Best', 'Invite copied'],
  zh:['天文台联机','房间码','玩法','星座接力','无限跑酷','加入','复制邀请','合体','互动',
    '按房间码加入，同一房间可以随时进人。','正在连接…','连接失败或房间已满。请检查网络或换一个房间码。',
    '人在线','站上自己的编号门。在缺口前开启合体可铺光桥，两人在近处同时开启合体可跳得更高。',
    '站上自己的编号门，按顺序互动。在倒计时结束前完成接力。',
    '一起跑或赛跑。方向键调速，空格跳跃，E 合体，F 互动。',
    '已点亮星座。可以邀请新伙伴或挑战无限跑酷。','最远','已复制邀请链接'],
  ru:['Совместная обсерватория','Код комнаты','Режим','Эстафета созвездий','Бесконечный забег','Войти','Копировать приглашение','Связь','Действие',
    'В комнату можно войти по её коду в любой момент.','Подключение…','Комната недоступна. Проверьте связь или выберите другой код.',
    'в комнате','Встаньте на свою плиту. Включите связь у края, чтобы появился мост. Вдвоём рядом вы прыгаете выше.',
    'Встаньте на свою плиту и нажимайте «Действие» по очереди до истечения времени.',
    'Бегите вместе или наперегонки. Стрелки меняют скорость, пробел — прыжок, E — связь, F — действие.',
    'Созвездие зажглось. Попробуйте новую комнату или бесконечный забег.','Рекорд','Приглашение скопировано'],
  ja:['天文台マルチプレイ','部屋コード','モード','星座リレー','エンドレスラン','参加','招待をコピー','連携','操作',
    '部屋コードがあれば途中からでも参加できます。','接続中…','部屋に接続できません。通信状態や部屋コードを確認してください。',
    '人参加中','自分の番号の床を踏みます。崖の手前で連携すると橋が現れ、仲間の近くで同時に連携すると高く跳べます。',
    '自分の番号の床に立ち、時間内に順番通りに操作してください。',
    '協力や競走ができます。矢印で速度、スペースでジャンプ、E で連携、F で操作。',
    '星座が完成しました。新しい部屋やエンドレスランでも遊べます。','最長','招待をコピーしました'],
};
const legacyLabels={
  en:['Classic single-player games','Jump game','Platform game'],
  zh:['经典单人游戏','跳跃游戏','平台游戏'],
  ru:['Классические одиночные игры','Игра с прыжками','Платформер'],
  ja:['クラシックな一人用ゲーム','ジャンプゲーム','アクションゲーム'],
};
const legacyModes={
  en:['Jump Race','Platform Co-op','Double-jump to dodge the shared obstacles. A new round starts after everyone falls.',
    'Help each other jump, share switches and checkpoints, and reach the flag together.','Score','At flag','All eight courses cleared'],
  zh:['跳跃竞速','平台合作','二段跳躲开同一组障碍。所有玩家出局后会开启下一轮。',
    '一起踩开关、共享存档点。靠近队友按住合体可跳得更高，全员到旗帜后进入下一关。','得分','到旗帜','八关全部通关'],
  ru:['Гонка прыжков','Совместный платформер','Двойной прыжок помогает уклоняться от общих препятствий. После выбывания всех начинается новый раунд.',
    'Помогайте друг другу прыгать, вместе включайте плиты и доберитесь до флага.','Очки','У флага','Все восемь уровней пройдены'],
  ja:['ジャンプレース','協力アクション','二段ジャンプで共通の障害を避けます。全員が脱落すると次のラウンドが始まります。',
    '連携ジャンプや共有スイッチ、チェックポイントを使い、全員で旗にたどり着こう。','スコア','旗に到達','全8ステージクリア'],
};
const runnerCopy={
  en:['Returning to checkpoint…','Pink blocks are hazards. Numbered blocks are players. The white outline marks you.'],
  zh:['正在返回检查点…','粉色小方块是障碍，带编号的是玩家，白色外框标出自己。'],
  ru:['Возврат к контрольной точке…','Розовые блоки — препятствия. Блоки с номерами — игроки. Ваш выделен белой рамкой.'],
  ja:['チェックポイントに戻っています…','ピンクのブロックは障害物、番号付きはプレイヤーです。白い枠が自分です。'],
};
const relayCopy={
  en:['Stand on station {n}, then press F or select Act.','Waiting for station {n}.','Station {n} ready. Press F or select Act.'],
  zh:['站上 {n} 号站，再按 F 或点「互动」。','等 {n} 号玩家先互动。','{n} 号站就绪，按 F 或点「互动」。'],
  ru:['Встаньте на площадку {n} и нажмите F или кнопку «Действие».','Ожидаем игрока {n}.','Площадка {n} готова. Нажмите F или кнопку «Действие».'],
  ja:['{n}番の台に立ち、Fキーか「操作」を押します。','{n}番の操作を待っています。','{n}番の台の準備完了。Fキーか「操作」を押します。'],
};
const abilityCopy={
  en:['Link on · waiting for a nearby partner','Linked · jump for a boost','Light bridge active','Link needs another player','Hold Link on your stations together.'],
  zh:['已开启合体，等待附近队友','已合体，现在跳跃可增高','光桥已开启','合体需要另一名玩家','各自站上编号站，再一起保持合体。'],
  ru:['Связь включена, ожидаем партнёра рядом','Связь установлена. Прыжок усилен.','Световой мост открыт','Для связи нужен партнёр','Займите свои площадки и включите связь вместе.'],
  ja:['連携オン。近くの仲間を待っています。','連携成立。ジャンプが高くなります。','光の橋が開きました。','連携には仲間が必要です。','番号の台に立ち、一緒に連携してください。'],
};
const gateCopy={
  en:['Go to station {n}.','Waiting for stations {n}.','Enable Link here with E or the Link button.','Waiting for Link from player {n}.','Opening gate'],
  zh:['请站上自己的 {n} 号站。','等 {n} 号站就位。','你已就位，按住 E 或点「合体」。','等 {n} 号开启合体。','正在开门'],
  ru:['Встаньте на площадку {n}.','Ожидаем площадки {n}.','Удерживайте E или нажмите «Связь».','Ожидаем связь от игроков {n}.','Ворота открываются'],
  ja:['自分の {n} 番の台に立ちます。','{n} 番の台を待っています。','Eを押し続けるか「連携」を押します。','{n} 番の連携を待っています。','ゲートを開いています'],
};
const requestedLocale=params.get('lang') || document.documentElement.dataset.locale;
let lang=Object.hasOwn(copy,requestedLocale)?requestedLocale:'en';
let socket,id,state,sequence=0;
const canvas=$('game'), ctx=canvas.getContext('2d',{alpha:false});
const motion=createMotion(), courseAt=cacheSegments();
let runnerWaiting=false, actRelease=0, action=0, linkLatched=false;
let camera=0, previousCameraTime=0, cameraSpawn;
let paintFrame=0, lastPulse=-Infinity, inputActiveUntil=0, statusUpdate=0;
const touchPointers=new Map();
const input={left:false,right:false,up:false,down:false,jump:false,link:false,act:false};
const colors=['#ffe4a9','#96eadc','#f3a6c3','#9abdf4','#c4a5ec','#ebad84'];
const text=index=>copy[lang][index];
let status=9;
const controls={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',Space:'jump',KeyE:'link',KeyF:'act'};
const relativePath = /^\/(zh|en|ru|ja)\/play\/astrofall\/co-op\/$/.test(location.pathname)
  ? '/play/astrofall/co-op/' : new URL('./',location.href).pathname;
if (/^[a-z0-9-]{3,24}$/.test(params.get('room')||'')) $('room').value=params.get('room');
if (['runner',...LEGACY_MODES,...EXPANSION_MODES].includes(params.get('mode'))) $('mode').value=params.get('mode');
if (params.get('home')?.match(/^\/(?:zh|en|ru|ja)\/play\/astrofall\/$/)) $('home').href=params.get('home');

function applyLanguage(){
  document.documentElement.lang=lang;
  for(const [index,id] of ['title','room-label','mode-label',null,null,'join','invite','touch-link','touch-act'].entries()){
    if(id) $(id).textContent=text(index);
  }
  $('mode').options[0].textContent=text(3); $('mode').options[1].textContent=text(4);
  for(const [index,mode] of LEGACY_MODES.entries()) $('mode').querySelector('option[value="'+mode+'"]').textContent=legacyModes[lang][index];
  $('relay-act').textContent=text(8);
  $('link-toggle').textContent=text(7);
  for(const mode of EXPANSION_MODES) $('mode').querySelector('option[value="'+mode+'"]').textContent=expansionText[lang][mode][0];
  $('language').value=lang; document.title=text(0);
  const [label,jump,platform]=legacyLabels[lang];
  $('legacy-games').setAttribute('aria-label',label);
  $('legacy-label').textContent=label;
  for(const [game,title] of [['jump',jump],['platform',platform]]){
    const link=$('legacy-'+game);
    link.textContent=title;
    link.href='https://frostmoonrui.com/'+lang+'/legacy/'+game+'/';
  }
}
applyLanguage();
$('language').addEventListener('change',()=>{
  lang=$('language').value;
  applyLanguage();
  nextHud=0;
  scheduleDraw();
});

const linkHeld=()=>input.link || linkLatched;
function showLink(){
  for(const button of [$('touch-link'),$('link-toggle')]) button.setAttribute('aria-pressed',String(linkHeld()));
}
function publish() {
  if(socket?.readyState!==WebSocket.OPEN || socket.bufferedAmount>2048) return;
  const seq=++sequence;
  lastPulse=performance.now();
  motion.track(seq,lastPulse);
  socket.send(JSON.stringify({axis:axis(),jump:input.jump,link:linkHeld(),act:input.act,vertical:vertical(),action,seq}));
}
const axis=()=>Number(input.right)-Number(input.left);
const vertical=()=>Number(input.down)-Number(input.up);
function pulse(){
  if(document.hidden || socket?.readyState!==WebSocket.OPEN) return;
  const now=performance.now();
  const driving=['runner','jump'].includes(state?.mode) || state?.players[0]?.id===id ||
    now<inputActiveUntil || linkHeld() || Object.values(input).some(Boolean);
  if(now-lastPulse >= (driving ? 57 : 155)) publish();
}
// Only visible players keep the room running. Non-driving peers send fewer idle packets.
setInterval(pulse,30);
function changedInput(){
  const now=performance.now();
  inputActiveUntil=now+750;
  motion.control({axis:axis(),vertical:vertical(),jump:input.jump,link:linkHeld(),act:input.act},now);
  showLink();
  publish();
}
function clear(){
  clearTimeout(actRelease);
  linkLatched=false;
  Object.keys(input).forEach(name=>{input[name]=false;});
  for(const [button,pointer] of touchPointers){
    touchPointers.delete(button);
    if(button.hasPointerCapture(pointer)) button.releasePointerCapture(pointer);
  }
  changedInput();
}
function key(event, down){
  if(['INPUT','SELECT'].includes(event.target?.tagName) && down) return;
  const name=controls[event.code];
  if((name==='up'||name==='down') && state?.mode!=='tanks') return;
  if(name==='jump' && event.target?.closest('button') && down) return;
  if(!name || runnerWaiting || socket?.readyState!==WebSocket.OPEN) return;
  event.preventDefault();
  if(name==='act' && down && !input.act) action++;
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
    if(state) motion.push(state,performance.now(),id);
    publish();
    scheduleDraw();
  }
});
for(const button of [$('touch-link'),$('link-toggle')]) button.addEventListener('click',()=>{
  if(socket?.readyState!==WebSocket.OPEN || runnerWaiting) return;
  linkLatched=!linkLatched;
  changedInput();
});
function interact(){
  if(socket?.readyState!==WebSocket.OPEN || runnerWaiting) return;
  clearTimeout(actRelease);
  action++;
  input.act=true;
  changedInput();
  actRelease=setTimeout(()=>{input.act=false;changedInput();},220);
}
$('relay-act').addEventListener('click',interact);
$('touch-act').addEventListener('click',interact);
for(const button of document.querySelectorAll('[data-input]')){
  const name=button.dataset.input;
  if(name==='link' || name==='act') continue;
  button.addEventListener('pointerdown',event=>{
    event.preventDefault();
    if(touchPointers.has(button) || runnerWaiting) return;
    touchPointers.set(button,event.pointerId);
    button.setPointerCapture(event.pointerId);
    input[name]=true;changedInput();
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(type,event=>{
    if(touchPointers.get(button)!==event.pointerId) return;
    touchPointers.delete(button);input[name]=false;changedInput();
  });
  button.addEventListener('contextmenu',event=>event.preventDefault());
}

$('lobby').addEventListener('submit',event=>{
  event.preventDefault(); clear(); socket?.close();
  const mode=$('mode').value, room=$('room').value.trim().toLowerCase();
  document.querySelector('main').dataset.mode=mode;
  if(!/^[a-z0-9-]{3,24}$/.test(room)) return;
  status=10;state=null;id=null;lastPulse=-Infinity;previousCameraTime=0;
  motion.reset();
  scheduleDraw();
  $('invite').hidden=true;
  const target=new URL(relativePath+'socket/'+mode+'/'+room,location.origin);
  target.protocol=location.protocol==='https:'?'wss:':'ws:';
  if(apacRoom) target.searchParams.set('region','apac');
  const connection=new WebSocket(target);
  socket=connection;
  connection.addEventListener('open',()=>{
    if(socket!==connection) return;
    params.set('room',room);params.set('mode',mode);params.set('lang',lang);
    history.replaceState(null,'','?'+params);
    $('invite').hidden=false;
    $('legacy-games').hidden=true;
    document.activeElement?.blur();
    publish();
  });
  connection.addEventListener('message',event=>{
    if(socket!==connection) return;
    const message=JSON.parse(event.data);
    if(message.type==='welcome') id=message.id;
    else if(Array.isArray(message.players)){
      state=message;
      if(!document.hidden) motion.push(state,performance.now(),id);
    }
    scheduleDraw();
  });
  connection.addEventListener('close',()=>{
    if(socket!==connection) return;
    status=11;state=null;id=null;$('invite').hidden=true;
    $('legacy-games').hidden=false;
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
  const view=motion.sample(now,id);
  const players=view?.players||[];
  const me=players.find(p=>p.id===id);
  const layout=state?.mode||'relay';
  const waiting=layout==='runner' && me?.respawnAt!=null;
  if(waiting!==runnerWaiting){
    runnerWaiting=waiting;
    if(waiting) clear();
    if(!waiting && document.activeElement?.closest('#controls')) document.activeElement.blur();
    $('respawn').hidden=!waiting;
    $('controls').inert=waiting;
  }
  if(waiting && $('respawn').textContent!==runnerCopy[lang][0]) $('respawn').textContent=runnerCopy[lang][0];
  const targetCamera=Math.max(0,(me?.x||0)-365);
  const elapsed=now-previousCameraTime;
  if(!previousCameraTime || cameraSpawn!==me?.spawnId) camera=targetCamera;
  else if(elapsed>0) camera+=(targetCamera-camera)*(1-Math.exp(-Math.min(elapsed,50)/82));
  previousCameraTime=now;
  cameraSpawn=me?.spawnId;
  const parallax=camera*.13%960;
  ctx.drawImage(sky,-parallax,0);
  if(parallax) ctx.drawImage(sky,960-parallax,0);
  if(view && EXPANSION_MODES.includes(layout)) drawExpansion(ctx,view,me);
  else if(view && LEGACY_MODES.includes(layout)) drawLegacy(ctx,view,me,colors);
  else {
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
      if(state.bridge){
        ctx.fillStyle='#72d5d2';ctx.fillRect(from,475,to-from,5);
      }
      for(const [i,plate] of gatePads(n,players.length).entries()){
        const relay=course.gate==='relay';
        const done=relay && i<state.relayStep;
        const occupied=state.relayStations?.[i];
        const ready=occupied && (relay ? i===state.relayStep : !state.linkGate || players[i]?.link);
        const color=done||ready?'#91efd1':occupied && !relay?'#f1c67e':colors[i];
        ctx.fillStyle=color;ctx.fillRect(plate.x,plate.y-3,plate.w,4);
        if(ready){ctx.fillStyle='#91efd133';ctx.fillRect(plate.x,plate.y-63,plate.w,60);}
        ctx.strokeStyle=color;ctx.strokeRect(plate.x,plate.y-63,plate.w,60);
        ctx.font='700 21px system-ui';ctx.fillText(String(i+1),plate.x+10,plate.y-66);
      }
      ctx.fillStyle=state.complete?'#86e3c3':'#c7a36d';
      ctx.fillRect((n+1)*SPAN-22,322,12,154);
    }
  }
  for(const [index,p] of players.entries()){
    if(p.respawnAt!=null || p.x < camera-60 || p.x > camera+1020) continue;
    if(p.id===id){
      ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(p.x-3,p.y-3,32,40,10);ctx.stroke();
    }
    if(p.link){ctx.strokeStyle=p.linked?'#75f5c8':p.role?'#ad9dff':'#c0eade';ctx.beginPath();ctx.arc(p.x+13,p.y+17,25,0,Math.PI*2);ctx.stroke();}
    ctx.fillStyle=colors[index];ctx.beginPath();ctx.roundRect(p.x,p.y,26,34,8);ctx.fill();
    ctx.fillStyle='#14243b';ctx.fillRect(p.x+4,p.y+11,18,9);
    ctx.fillStyle=p.role?'#edabff':'#80f4d5';ctx.fillRect(p.x+14,p.y+13,5,5);
    ctx.fillStyle='#f1f5fb';ctx.font='700 14px system-ui';ctx.fillText(String(index+1),p.x+9,p.y-12);
  }
  ctx.restore();
  }
  if(state) scheduleDraw();
  if(now<nextHud && statusUpdate===players.length) return;
  nextHud=now+180;statusUpdate=players.length;
  if(apacRoom){
    const network=$('room-latency');
    network.hidden=!state;
    const latency=motion.roundTrip;
    const value=networkLabels[lang]+(latency ? ' · '+Math.round(latency)+' ms' : '');
    if(network.textContent!==value) network.textContent=value;
  }
  const type=state&&courseAt(state.checkpoint,'relay')?.gate;
  const legacy=legacyModes[lang];
  const extra=EXPANSION_MODES.includes(layout);
  const stats=extra?expansionStatus(lang,state):layout==='jump' ? `${players.length}/6 ${text(12)} · ${legacy[4]} ${me?.score || 0} · ${text(17)} ${me?.best || 0}` :
    layout==='platform' ? `${players.length}/6 ${text(12)} · ${state.checkpoint+1}/${LEGACY_LEVELS} · ${legacy[5]} ${players.filter(p=>p.reached).length}/${players.length}` :
    state
    ? `${players.length}/6 ${text(12)} · ${layout==='runner' ? text(17)+' '+Math.floor((me?.best||0)/10)+' m' :
      `${state.checkpoint+1}/${LENGTH}`+(type==='relay' && state.relayTime ? ' · '+Math.ceil(state.relayTime)+' s · '+(state.relayStep+1) : '')}`
    : text(status);
  const isRelayStation=layout==='relay' && type==='relay' && !state.complete;
  const actButton=$('relay-act');
  const extraWords=expansionText[lang];
  const actionText=extra?extraWords[layout==='tanks'?'fire':layout==='brawl'?'strike':'flip']:text(8);
  const linkTextLabel=layout==='brawl'?extraWords.guard:text(7);
  actButton.textContent=actionText;
  $('touch-act').textContent=actionText;
  $('touch-link').textContent=$('link-toggle').textContent=linkTextLabel;
  actButton.hidden=!isRelayStation && !extra;
  $('touch-act').hidden=!isRelayStation && layout!=='runner' && !extra;
  $('link-toggle').hidden=!me || layout==='jump' || (extra && layout!=='brawl') || runnerWaiting;
  const slot=players.findIndex(p=>p.id===id);
  const turn=state?.relayStep;
  const ready=isRelayStation && slot===turn && state.relayStations?.[slot];
  actButton.classList.toggle('ready',Boolean(ready));
  $('touch-act').classList.toggle('ready',Boolean(ready));
  const relayHint=isRelayStation && slot>=0 ? relayCopy[lang][slot!==turn?1:ready?2:0]
    .replace('{n}',String((slot!==turn?turn:slot)+1)) : '';
  const ability=abilityCopy[lang];
  const linkText=linkHeld() && me && !extra && layout!=='jump' ?
    ability[players.length<2?3:me.linked?1:state.bridge?2:0] : '';
  if($('ability').textContent!==linkText) $('ability').textContent=linkText;
  const isHoldGate=layout==='relay' && state && !state.complete && type!=='relay' && slot>=0;
  const gate=gateCopy[lang];
  let gateHint='';
  if(isHoldGate && state.relayStations){
    const missing=players.flatMap((p,i)=>state.relayStations[i]?[]:[i+1]);
    const noLink=state.linkGate ? players.flatMap((p,i)=>p.link?[]:[i+1]) : [];
    const [label,number]=missing.includes(slot+1)?[0,slot+1]:missing.length?[1,missing.join(', ')]:
      noLink.includes(slot+1)?[2,'']:noLink.length?[3,noLink.join(', ')]:[4,''];
    gateHint=gate[label].replace('{n}',String(number));
  }
  const progress=$('gate-progress');
  progress.hidden=!isHoldGate || !state.hold;
  if(!progress.hidden){
    progress.setAttribute('aria-label',gate[4]);
    progress.value=Math.min(1,state.hold/GATE_HOLD);
  }
  const hint=extra?extraWords[layout][1]:layout==='jump'?legacy[2]:layout==='platform'?(state.complete?legacy[6]:legacy[3]):
    layout==='runner'?text(15)+' '+runnerCopy[lang][1]:state?(relayHint||gateHint||(type==='roles' && players.length>1 && !state.complete?ability[4]:text(state.complete?16:type==='relay'?14:13))):'';
  if(stats!==prevStatus){$('status').textContent=stats;prevStatus=stats;}
  if(hint!==prevHint){$('hint').textContent=hint;prevHint=hint;}
}
scheduleDraw();
