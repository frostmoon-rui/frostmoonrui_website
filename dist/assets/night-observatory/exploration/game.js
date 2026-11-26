(() => {
  'use strict';

  /* =========================================================
     1. LOCALIZATION (ZH / EN / RU / JA)
     ========================================================= */
  const I18N = window.ObservatoryLabels;
  if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('./sw.js').catch(() => {});

  /* =========================================================
     2. WEB AUDIO SYNTHESIZER (Zero External Audio Files)
     ========================================================= */
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.sfxOn = true;
      this.bgmOn = true;
      this.bgmNodes = null;
      this.started = false;
    }
    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.started = true;
      if (this.bgmOn) this.startAmbient();
    }
    startAmbient() {
      if (!this.ctx || this.bgmNodes) return;
      try {
        const master = this.ctx.createGain();
        master.gain.value = 0.045;
        master.connect(this.ctx.destination);
        const freqs = [110, 164.81, 220, 329.63];
        const oscs = freqs.map((f, idx) => {
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
          osc.frequency.value = f;
          g.gain.value = idx < 2 ? 0.35 : 0.14;
          osc.connect(g);
          g.connect(master);
          osc.start();
          return osc;
        });
        this.bgmNodes = { master, oscs };
      } catch (_) {}
    }
    stopAmbient() {
      if (!this.bgmNodes) return;
      try {
        this.bgmNodes.oscs.forEach(o => o.stop());
        this.bgmNodes.master.disconnect();
      } catch (_) {}
      this.bgmNodes = null;
    }
    tone(freq, dur, type = 'sine', vol = 0.14, slideTo = null) {
      if (!this.sfxOn || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
        g.gain.setValueAtTime(0.001, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(g);
        g.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + dur + 0.02);
      } catch (_) {}
    }
    playJump() { this.tone(260, 0.14, 'triangle', 0.1, 480); }
    playLand(level) {
      if (level === 0) this.tone(150, 0.07, 'sine', 0.06, 90);
      else if (level === 1) this.tone(130, 0.13, 'triangle', 0.12, 72);
      else {
        this.tone(95, 0.34, 'sine', 0.24, 42);
        this.tone(220, 0.25, 'triangle', 0.12, 110);
        setTimeout(() => this.tone(440, 0.28, 'sine', 0.08, 660), 40);
      }
    }
    playPlateHalf() { this.tone(330, 0.18, 'triangle', 0.12, 290); }
    playPlateFull() {
      [440, 554.37, 659.25, 880].forEach((f, i) => setTimeout(() => this.tone(f, 0.28, 'sine', 0.11), i * 55));
    }
    playGlassBreak() {
      [1100, 1480, 920, 1760].forEach((f, i) => setTimeout(() => this.tone(f, 0.12, 'triangle', 0.09, f * 0.6), i * 24));
    }
    playSpring(power) {
      const base = power > 660 ? 340 : 240;
      this.tone(base, 0.26, 'sine', 0.16, base * 2.5);
    }
    playPhase() {
      this.tone(523.25, 0.22, 'sine', 0.12, 783.99);
      setTimeout(() => this.tone(783.99, 0.26, 'triangle', 0.09, 659.25), 60);
    }
    playCollect(isCore) {
      const notes = isCore ? [392, 493.88, 587.33, 783.99, 987.77] : [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => setTimeout(() => this.tone(f, 0.35, 'sine', 0.14), i * 70));
    }
  }
  const sound = new SoundEngine();

  const W = 960, H = 540;
  const ROOMS = ObservatoryWorld.makeRooms();
  const mainSeals = ['A2-5','A4-5','A6-5','A8-5'].filter(id => ROOMS[id]);
  const seals = Object.values(ROOMS).filter(room => room.seal).map(room => room.id);
  const campaignWords = {
    zh: ['机关顺序','相位不符','顺序重置','机关已解锁','封印','还需工坊、月镜、钟楼与井底的封印','互动','门未解锁','月','星','重落','顺序刻在入口的铭牌上'],
    en: ['Circuit','Change phase','Sequence reset','Circuit restored','Seals','Restore the Foundry, Mirror, Viaduct and Cavern seals','Interact','Sealed','Moon','Star','Heavy landing','The sequence is etched beside the entrance'],
    ru: ['Цепь','Смените фазу','Цепь сброшена','Цепь восстановлена','Печати','Нужны печати литейной, зеркал, виадука и пещер','Действие','Закрыто','Луна','Звезда','Сильный удар','Порядок выгравирован у входа'],
    ja: ['回路','位相を切り替える','順序をリセット','回路を復旧','封印','鋳造所・月鏡殿・高架橋・洞窟の封印が必要','調べる','未開通','月','星','強い着地','順番は入口の銘板に刻まれている'],
  };
  const campaignText = index => campaignWords[state.lang][index];
  const hasMainSeals = () => mainSeals.every(id => state.puzzles.includes(id));
  const portalOpen = portal => portal.needs.every(id => state.puzzles.includes(id));
  const portalWords = {
    zh: ['先完成','走左侧标有这些房名的门','走右侧标有这些房名的门','机关已完成'],
    en: ['Still needed','Use the doors to the left marked with these room names','Use the doors to the right marked with these room names','circuits restored'],
    ru: ['Осталось пройти','Воспользуйтесь дверями слева с этими названиями','Воспользуйтесь дверями справа с этими названиями','цепей восстановлено'],
    ja: ['先にクリア','左側にある該当する部屋名の扉へ','右側にある該当する部屋名の扉へ','回路復旧'],
  };
  function explainLockedPortal(portal) {
    const words = portalWords[state.lang];
    const missing = portal.needs.filter(id => !state.puzzles.includes(id));
    const names = missing.map(id => ROOMS[id].name[state.lang]).join(' / ');
    const back = missing.map(id => currentRoom.portals.find(exit => exit.to === id && portalOpen(exit)));
    const left = back.every(exit => exit && exit.x < portal.x);
    const right = back.every(exit => exit && exit.x > portal.x);
    showToast(words[0] + ' · ' + names + (left || right ? ' · ' + words[left ? 1 : 2] : ''), 5500);
  }
  const languages = ['zh','en','ru','ja'];
  const routeLocale = document.documentElement.dataset.locale;
  const previewText = {
    zh: {impact:'落地', grades:['轻落','中落','重落'], fullscreen:'横屏全屏', exitFullscreen:'退出全屏', rotate:'横过手机可获得更大的操作空间', glassLocked:'玻璃的铜扣连着工坊悬锤。', copied:'已复制存档码', copyManual:'存档码已生成，可从输入框复制。', confirm:'开始新探索会清空当前进度。确定继续？', saveCode:'存档码', preview:'80 间互通星室', reset:'返回本房间入口', audio:'切换机关音效', left:'向左', right:'向右', jump:'跳跃', act:'互动'},
    en: {impact:'Landing', grades:['Light','Medium','Heavy'], fullscreen:'Enter fullscreen', exitFullscreen:'Exit fullscreen', rotate:'Rotate your phone for more room to play', glassLocked:'The glass latch is wired to the Workshop counterweight.', copied:'Save code copied', copyManual:'Save code generated. Copy it from the field.', confirm:'Start over and clear your current exploration?', saveCode:'Save code', preview:'80 connected rooms', reset:'Return to room entrance', audio:'Toggle sound effects', left:'Left', right:'Right', jump:'Jump', act:'Interact'},
    ru: {impact:'Удар', grades:['Лёгкий','Средний','Тяжёлый'], fullscreen:'Во весь экран', exitFullscreen:'Выйти из полноэкранного режима', rotate:'Поверните телефон для удобной игры', glassLocked:'Защёлка стекла соединена с противовесом мастерской.', copied:'Код сохранения скопирован', copyManual:'Код создан. Скопируйте его из поля.', confirm:'Начать заново и стереть текущий прогресс?', saveCode:'Код сохранения', preview:'80 связанных комнат', reset:'Вернуться ко входу в комнату', audio:'Переключить звуковые эффекты', left:'Влево', right:'Вправо', jump:'Прыжок', act:'Действие'},
    ja: {impact:'着地', grades:['軽','中','重'], fullscreen:'全画面', exitFullscreen:'全画面を終了', rotate:'端末を横向きにすると操作しやすくなります', glassLocked:'ガラスの留め具は工房の重りにつながっています。', copied:'セーブコードをコピーしました', copyManual:'セーブコードを生成しました。入力欄からコピーできます。', confirm:'現在の進行状況を消して最初から遊びますか？', saveCode:'セーブコード', preview:'全80室', reset:'部屋の入口に戻る', audio:'効果音の切り替え', left:'左', right:'右', jump:'ジャンプ', act:'調べる'}
  };

  /* =========================================================
     4. GAME STATE & SAVE SYSTEM
     ========================================================= */
  const SAVE_KEY = 'astrofall_observatory_exploration_v3';
  const savedLists = {
    visited: new Set(Object.keys(ROOMS)),
    puzzles: new Set(Object.values(ROOMS).filter(room => room.puzzle).map(room => room.id)),
    openedDoors: allowedIds('doors'), brokenGlass: allowedIds('glass'),
    droppedWeights: allowedIds('weights'), cores: allowedIds('cores'), shards: allowedIds('shards')
  };
  function allowedIds(group) {
    return new Set(Object.values(ROOMS).flatMap(room => (room[group] || []).map(item => item.id)));
  }
  const defaultState = () => ({
    version: 3, started: false, roomId: 'H0', phases: {},
    visited: ['H0'],
    openedDoors: [],
    puzzles: [],
    brokenGlass: [],
    droppedWeights: [],
    cores: [],
    shards: [],
    lang: languages.includes(routeLocale) ? routeLocale : 'en',
    sfxOn: true,
    bgmOn: true,
    touchMode: 'auto',
    handSwap: false,
    btnScale: 1,
    endingSeen: false
  });

  let state = defaultState();
  let hasSavedGame = false;

  function normalizeSave(input) {
    if (!input || input.version !== 3 || !Object.hasOwn(ROOMS, input.roomId)) {
      throw new Error('Invalid observatory save');
    }
    const result = defaultState();
    result.started = input.version === 3 ? input.started === true : true;
    result.roomId = input.roomId;
    for (const [key, allowed] of Object.entries(savedLists)) {
      if (input[key] === undefined) continue;
      if (!Array.isArray(input[key]) || input[key].length > allowed.size * 2 || input[key].some(item => !allowed.has(item))) {
        throw new Error('Invalid observatory save list');
      }
      result[key] = [...new Set(input[key])];
    }
    if (input.phases && typeof input.phases === 'object') {
      for (const id of Object.keys(ROOMS)) {
        if (input.phases[id] === 0 || input.phases[id] === 1) result.phases[id] = input.phases[id];
      }
    }
    if (languages.includes(input.lang)) result.lang = input.lang;
    if (['auto','on','off'].includes(input.touchMode)) result.touchMode = input.touchMode;
    if ([0.85,1,1.18].includes(input.btnScale)) result.btnScale = input.btnScale;
    for (const key of ['sfxOn','bgmOn','handSwap','endingSeen']) {
      if (typeof input[key] === 'boolean') result[key] = input[key];
    }
    return result;
  }

  function loadSaveFromStorage() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) state = normalizeSave(JSON.parse(raw));
      if (languages.includes(routeLocale)) state.lang = routeLocale;
    } catch (_) {}
    hasSavedGame = state.started;
  }

  function persistSave() {
    hasSavedGame = state.started;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (_) {}
    document.getElementById('btn-continue').style.display = hasSavedGame ? 'inline-block' : 'none';
  }

  function resetExploration() {
    const { lang, sfxOn, bgmOn, handSwap, touchMode, btnScale } = state;
    state = { ...defaultState(), lang, sfxOn, bgmOn, handSwap, touchMode, btnScale };
    hintUnlocked = {};
  }

  /* =========================================================
     5. RUNTIME ENGINE VARIABLES
     ========================================================= */
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  let playing = false;
  let paused = false;
  let currentRoom = null;
  let roomPhase = 0;
  let currentCourse = null;
  let lastImpact = null;
  let roomBrokenGlass = new Set();
  let roomWeights = [];
  let roomMovers = [];
  let plateStates = {}; // plateId -> { charge: 0..2, pulse: 0..1 }
  let prismContact = null;
  let hintUnlocked = {}; // roomId -> tier (0..3)

  // Player physics
  const P = {
    x: 160, y: 450, w: 22, h: 28,
    vx: 0, vy: 0,
    facing: 1,
    onGround: false,
    coyote: 0,
    jumpBuf: 0,
    peakVy: 0,
    squashX: 1, squashY: 1,
    onMover: null,
    airBoostVx: 0,
    trail: []
  };

  // Visual effects
  const stars = Array.from({ length: 85 }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    r: Math.random() * 1.6 + 0.5,
    tw: Math.random() * Math.PI * 2,
    sp: 0.8 + Math.random() * 1.8
  }));
  let particles = [];
  let shockwaves = [];
  let shakeTime = 0;
  let shakeMag = 0;
  let toastTimer = null;
  let roomFade = 0;
  let circuitStep = 0;
  let circuitTime = 0;
  let roomClock = 0;
  let resetConfirmArm = false;

  // Input
  const keys = { left: false, right: false, jump: false, jumpJust: false, actJust: false };

  /* =========================================================
     6. ROOM LOADING & NEIGHBOR PRE-CACHE
     ========================================================= */
  const roomCache = new Map();

  function prepareRoom(roomId) {
    if (roomCache.has(roomId)) return roomCache.get(roomId);
    const room = ROOMS[roomId];
    if (!room) throw new Error('Unknown room: ' + roomId);
    const solids = room.solids.map(rect => ({ ...rect, kind: 'solid' }));
    const course = { solids, exits: room.exits || [] };
    roomCache.set(roomId, course);
    return course;
  }

  function preCacheNeighbors(roomId) {
    for (const exit of prepareRoom(roomId).exits) prepareRoom(exit.to);
  }

  function enterRoom(roomId, spawnX, spawnY, showMicroSpinner = false) {
    const r = ROOMS[roomId];
    if (!r) return;
    const sp = document.getElementById('room-spinner');
    if (showMicroSpinner && !roomCache.has(roomId)) {
      sp.classList.add('active');
      setTimeout(() => sp.classList.remove('active'), 160);
    }
    currentRoom = r;
    circuitStep = 0;
    circuitTime = 0;
    roomClock = 0;
    currentCourse = prepareRoom(roomId);
    lastImpact = null;
    state.roomId = roomId;
    if (!state.visited.includes(roomId)) state.visited.push(roomId);
    preCacheNeighbors(roomId);
    for (const portal of r.portals || []) prepareRoom(portal.to);

    roomPhase = (r.puzzle && !state.puzzles.includes(roomId) ? r.initialPhase : state.phases[roomId]) ?? r.initialPhase ?? 0;
    roomBrokenGlass = new Set(state.brokenGlass);
    plateStates = {};
    (r.plates || []).forEach(pl => {
      const done = (pl.action === 'openDoor' && state.openedDoors.includes(pl.target)) ||
                   (pl.action === 'dropWeight' && state.droppedWeights.includes(pl.target));
      plateStates[pl.id] = { charge: done ? 2 : 0, pulse: 0 };
    });

    roomWeights = (r.weights || []).map(wt => {
      const dropped = state.droppedWeights.includes(wt.id);
      return { ...wt, cy: dropped ? wt.restY : wt.y, vy: 0, dropped };
    });

    roomMovers = (r.movers || []).map(mv => ({
      ...mv, cx: mv.x, cy: mv.y, vx: mv.speed, vy: 0, dir: 1
    }));

    P.x = spawnX !== undefined ? spawnX : r.spawn.x;
    P.y = spawnY !== undefined ? spawnY : r.spawn.y;
    P.vx = 0; P.vy = 0; P.peakVy = 0; P.airBoostVx = 0; P.onMover = null; P.trail = [];
    P.onGround = false; P.coyote = 0; P.jumpBuf = 0;
    prismContact = null;
    particles = [];
    shockwaves = [];
    roomFade = 0.55;
    updateHUD();
    persistSave();
  }

  /* =========================================================
     7. UI & I18N HELPERS
     ========================================================= */
  function t(key) { return (I18N[state.lang] || I18N.zh)[key] || key; }

  function showToast(msg, dur = 3200) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), dur);
  }

  const app = document.getElementById('app');
  const fullscreenButton = document.getElementById('btn-fullscreen');
  const landscape = matchMedia('(orientation: landscape)');
  const coarsePointer = matchMedia('(any-pointer: coarse)');
  let immersive = false;

  function updateFullscreen() {
    const active = immersive || document.fullscreenElement === app;
    fullscreenButton.setAttribute('aria-pressed', String(active));
    setLabel('btn-fullscreen', active ? previewText[state.lang].exitFullscreen : previewText[state.lang].fullscreen);
    const rotateHint = document.getElementById('rotate-hint');
    rotateHint.hidden = !playing || !coarsePointer.matches || landscape.matches;
    rotateHint.textContent = previewText[state.lang].rotate;
    resizeCanvas();
  }

  function setLabel(id, label) {
    const element = document.getElementById(id);
    element.setAttribute('aria-label', label);
    element.title = label;
  }

  fullscreenButton.addEventListener('click', async () => {
    if (document.fullscreenElement === app) {
      await document.exitFullscreen();
      return;
    }
    if (immersive) {
      immersive = false;
    } else if (app.requestFullscreen) {
      try {
        await app.requestFullscreen();
        try { await screen.orientation?.lock?.('landscape'); } catch (_) {}
        return;
      } catch (_) {
        immersive = true;
      }
    } else {
      immersive = true;
    }
    app.classList.toggle('immersive', immersive);
    updateFullscreen();
  });
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      try { screen.orientation?.unlock?.(); } catch (_) {}
    }
    updateFullscreen();
  });
  landscape.addEventListener('change', updateFullscreen);
  coarsePointer.addEventListener('change', applyLanguage);

  function applyLanguage() {
    const online = document.getElementById('online-link');
    if (online?.getAttribute?.('href')) {
      const links = {zh:'联机试玩',en:'Online co-op',ru:'Совместная игра',ja:'マルチプレイ'};
      online.textContent = links[state.lang];
      const target = new URL(online.href, window.location.href);
      target.searchParams.set('lang',state.lang);
      if (/^\/(zh|en|ru|ja)\/play\/astrofall\/$/.test(window.location.pathname)) {
        target.searchParams.set('home',window.location.pathname);
      }
      online.href=target.href;
    }

    const extra = previewText[state.lang];
    const article = document.getElementById('game-article');
    article.href = `/${state.lang}/notes/astrofall-playtest/`;
    article.textContent = t('gameArticle');
    document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : state.lang;
    document.title = t('title');
    document.getElementById('loader-title').textContent = t('title');
    setLabel('loader-progress', t('loadSteps')[0]);
    setLabel('save-code-box', extra.saveCode);
    for (const [id, label] of Object.entries({
      'btn-hint':t('hint'), 'btn-map':t('map'), 'btn-reset':extra.reset, 'btn-audio':extra.audio,
      'btn-settings':t('settings'), 'tc-left':extra.left, 'tc-right':extra.right,
      'tc-jump':extra.jump, 'tc-act':extra.act
    })) setLabel(id, label);
    updateFullscreen();
    document.getElementById('t-badge').textContent = extra.preview;
    document.getElementById('t-main').textContent = t('title');
    document.getElementById('t-sub').textContent = t('sub');
    document.getElementById('btn-start').textContent = t('start');
    document.getElementById('btn-continue').textContent = t('cont');
    document.getElementById('btn-title-settings').textContent = t('settings');
    document.getElementById('lbl-hint').textContent = t('hint');
    document.getElementById('lbl-map').textContent = t('map');
    document.getElementById('kb-move').textContent = t('kbMove');
    document.getElementById('kb-jump').textContent = t('kbJump');
    document.getElementById('kb-act').textContent = t('kbAct');
    document.getElementById('kb-reset').textContent = t('kbReset');
    document.getElementById('kb-map').textContent = t('kbMap');
    document.getElementById('m-map-title').textContent = t('mapTitle');
    document.getElementById('m-map-sub').textContent = t('mapSub');
    document.getElementById('btn-warp-hub').textContent = t('warpHub');
    document.getElementById('btn-warp-hub').disabled = !state.visited.includes('H1');
    document.getElementById('btn-close-map').textContent = t('close');
    document.getElementById('m-hint-title').textContent = t('hintTitle');
    document.getElementById('m-set-title').textContent = t('setTitle');
    document.getElementById('s-lang-lbl').textContent = t('langLbl');
    document.getElementById('s-sfx-lbl').textContent = t('sfxLbl');
    document.getElementById('s-bgm-lbl').textContent = t('bgmLbl');
    document.getElementById('s-touch-lbl').textContent = t('touchLbl');
    document.getElementById('s-hand-lbl').textContent = t('handLbl');
    document.getElementById('s-size-lbl').textContent = t('sizeLbl');
    document.getElementById('set-sfx-on').textContent = t('on');
    document.getElementById('set-sfx-off').textContent = t('mute');
    document.getElementById('set-bgm-on').textContent = t('on');
    document.getElementById('set-bgm-off').textContent = t('off');
    document.getElementById('set-touch-auto').textContent = t('auto');
    document.getElementById('set-touch-on').textContent = t('show');
    document.getElementById('set-touch-off').textContent = t('hide');
    document.getElementById('set-hand-std').textContent = t('handStd');
    document.getElementById('set-hand-swap').textContent = t('handSwap');
    updateControlsTip();
    document.getElementById('s-save-lbl').textContent = t('saveLbl');
    document.getElementById('btn-export-save').textContent = t('exportSave');
    document.getElementById('btn-import-save').textContent = t('importSave');
    document.getElementById('btn-new-game').textContent = t('resetAll');
    document.getElementById('btn-keep-exploring').textContent = t('keepExploring');
    document.getElementById('btn-back-title').textContent = t('backTitle');

    document.querySelectorAll('[data-lang]').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === state.lang);
    });
    updateHUD();
  }

  function updateHUD() {
    if (!currentRoom) return;
    document.getElementById('hud-room').textContent = currentRoom.name[state.lang] || currentRoom.name.zh;
    showImpact();
    document.getElementById('hud-cores-txt').textContent = `${t('cores')} ${state.cores.length}/4`;
    document.getElementById('hud-shards-txt').textContent = `${t('shards')} ${state.shards.length}/4` + (seals.length ? ` · ${campaignText(4)} ${seals.filter(id => state.puzzles.includes(id)).length}/${seals.length}` : '');
    const pDot = document.getElementById('hud-phase-dot');
    const pTxt = document.getElementById('hud-phase-txt');
    if (roomPhase === 0) {
      pDot.className = 'dot-lunar';
      pTxt.textContent = t('lunarPhase');
    } else {
      pDot.className = 'dot-star';
      pTxt.textContent = t('starPhase');
    }
    document.getElementById('btn-audio').textContent = sound.sfxOn ? '🔊' : '🔇';
  }

  function updateControlsTip() {
    const useTouch = state.touchMode === 'on' || (state.touchMode === 'auto' && coarsePointer.matches);
    document.getElementById('controls-tip').textContent = t(useTouch ? 'touchControls' : 'keyboardControls');
  }

  function applySettingsUI() {
    updateControlsTip();
    sound.sfxOn = state.sfxOn;
    sound.bgmOn = state.bgmOn;
    if (sound.started) {
      if (state.bgmOn) sound.startAmbient(); else sound.stopAmbient();
    }
    document.getElementById('set-sfx-on').classList.toggle('active', state.sfxOn);
    document.getElementById('set-sfx-off').classList.toggle('active', !state.sfxOn);
    document.getElementById('set-bgm-on').classList.toggle('active', state.bgmOn);
    document.getElementById('set-bgm-off').classList.toggle('active', !state.bgmOn);
    document.getElementById('set-touch-auto').classList.toggle('active', state.touchMode === 'auto');
    document.getElementById('set-touch-on').classList.toggle('active', state.touchMode === 'on');
    document.getElementById('set-touch-off').classList.toggle('active', state.touchMode === 'off');
    document.getElementById('set-hand-std').classList.toggle('active', !state.handSwap);
    document.getElementById('set-hand-swap').classList.toggle('active', state.handSwap);
    document.querySelectorAll('[data-size]').forEach(b => {
      b.classList.toggle('active', Math.abs(parseFloat(b.dataset.size) - state.btnScale) < 0.05);
    });
    document.documentElement.style.setProperty('--btn-scale', String(state.btnScale));
    const tc = document.getElementById('touch-controls');
    const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.innerWidth <= 860;
    const showTouch = playing && (state.touchMode === 'on' || (state.touchMode === 'auto' && isTouchDevice));
    tc.classList.toggle('visible', showTouch);
    tc.classList.toggle('swapped', state.handSwap);
    updateHUD();
    resizeCanvas();
  }

  function renderMapModal() {
    const grid = document.getElementById('map-grid');
    const mapCard = grid.closest('.modal-card');
    grid.innerHTML = '';
    const byPos = {};
    Object.values(ROOMS).forEach(r => { byPos[`${r.gx},${r.gy}`] = r; });
    const xmin = Math.min(...Object.values(ROOMS).map(room => room.gx));
    const xmax = Math.max(...Object.values(ROOMS).map(room => room.gx));
    const ymax = Math.max(...Object.values(ROOMS).map(room => room.gy));
    grid.style.gridTemplateColumns = `repeat(${xmax - xmin + 1}, minmax(0, 1fr))`;
    for (let gy = 1; gy <= ymax; gy++) {
      for (let gx = xmin; gx <= xmax; gx++) {
        const cell = document.createElement('div');
        const r = byPos[`${gx},${gy}`];
        if (!r) {
          cell.className = 'map-cell empty';
        } else {
          const vis = state.visited.includes(r.id);
          cell.className = 'map-cell' + (vis ? ' visited' : '') + (state.roomId === r.id ? ' current' : '');
          if (vis && r.exits.some(exit => exit.dir === 'right' && state.visited.includes(exit.to))) cell.classList.add('east');
          if (vis && r.exits.some(exit => exit.dir === 'down' && state.visited.includes(exit.to))) cell.classList.add('south');
          const title = document.createElement('div');
          title.textContent = vis ? (r.name[state.lang] || r.name.zh) : '???';
          title.style.fontWeight = state.roomId === r.id ? '700' : '500';
          const icons = document.createElement('div');
          icons.className = 'map-icons';
          if (r.cores) {
            r.cores.forEach(c => {
              const s = document.createElement('span');
              s.textContent = state.cores.includes(c.id) ? '★' : '☆';
              s.style.color = '#f5c451';
              icons.appendChild(s);
            });
          }
          if (r.shards) {
            r.shards.forEach(sh => {
              const s = document.createElement('span');
              s.textContent = state.shards.includes(sh.id) ? '✦' : '✧';
              s.style.color = '#5eead4';
              icons.appendChild(s);
            });
          }
          if (vis && r.puzzle) icons.textContent += state.puzzles.includes(r.id) ? ' ✓' : ' ◈';
          if (vis && r.portals?.length) title.title = r.portals.filter(portalOpen)
            .map(portal => ROOMS[portal.to].name[state.lang]).join(' · ');
          cell.appendChild(title);
          cell.appendChild(icons);
        }
        grid.appendChild(cell);
      }
    }
    const here = grid.querySelector('.current');
    if (here && mapCard) mapCard.scrollLeft = here.offsetLeft - grid.offsetLeft - mapCard.clientWidth / 2 + here.offsetWidth / 2;
  }

  function renderHintModal() {
    if (!currentRoom) return;
    const container = document.getElementById('hint-content');
    container.innerHTML = '';
    const tier = hintUnlocked[currentRoom.id] || 0;
    const list = (currentRoom.hints && (currentRoom.hints[state.lang] || currentRoom.hints.zh)) || [];
    const labels = [t('tier1'), t('tier2'), t('tier3')];
    list.forEach((txt, idx) => {
      const box = document.createElement('div');
      box.className = 'hint-tier';
      const head = document.createElement('div');
      head.className = 'hint-tier-head';
      head.innerHTML = `<span>${labels[idx]}</span>`;
      const body = document.createElement('div');
      body.className = 'hint-body';
      if (idx < tier) {
        body.textContent = txt;
      } else if (idx === tier) {
        const btn = document.createElement('button');
        btn.className = 'btn-glass';
        btn.style.padding = '5px 12px';
        btn.textContent = t('unlockHint');
        btn.addEventListener('click', () => {
          hintUnlocked[currentRoom.id] = idx + 1;
          renderHintModal();
        });
        head.appendChild(btn);
        body.className = 'hint-body hint-locked';
        body.textContent = '···';
      } else {
        body.className = 'hint-body hint-locked';
        body.textContent = '🔒';
      }
      box.appendChild(head);
      box.appendChild(body);
      container.appendChild(box);
    });
  }

  function openModal(id) {
    clearInput();
    document.querySelectorAll('.modal-backdrop.open').forEach(element => element.classList.remove('open'));
    clearInput();
    paused = true;
    if (id === 'modal-map') renderMapModal();
    if (id === 'modal-hint') renderHintModal();
    if (id === 'modal-settings') {
      resetConfirmArm = false;
      document.getElementById('btn-new-game').textContent = t('resetAll');
      applySettingsUI();
    }
    document.getElementById(id).classList.add('open');
  }
  function closeModal(id) {
    document.getElementById(id).classList.remove('open');
    const anyOpen = document.querySelector('.modal-backdrop.open');
    if (!anyOpen) paused = false;
  }

  function triggerEnding() {
    if (!hasMainSeals()) {
      showToast(campaignText(5));
      enterRoom('H1');
      return;
    }
    paused = true;
    state.endingSeen = true;
    persistSave();
    const isTrue = state.shards.length >= 4 && seals.every(id => state.puzzles.includes(id));
    document.getElementById('end-badge').textContent = isTrue ? t('endTrueBadge') : t('endNormalBadge');
    document.getElementById('end-title').textContent = isTrue ? t('endTrueTitle') : t('endNormalTitle');
    document.getElementById('end-desc').textContent = isTrue ? t('endTrueDesc') : t('endNormalDesc');
    document.getElementById('end-stats').textContent = `★ ${t('cores')}: ${state.cores.length}/4  ·  ✦ ${t('shards')}: ${state.shards.length}/4  ·  ${state.visited.length}/${Object.keys(ROOMS).length}`;
    sound.playCollect(true);
    openModal('modal-ending');
  }

  /* =========================================================
     8. PHYSICS & COLLISION ENGINE
     ========================================================= */
  const GRAVITY = 1400;
  const JUMP_VY = -525;
  const MOVE_SPEED = 242;

  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function doorOpen(door) {
    return state.openedDoors.includes(door.id) || (door.requiresWeight && state.droppedWeights.includes(door.requiresWeight)) ||
      (door.requiresGlass && roomBrokenGlass.has(door.requiresGlass));
  }

  function getActiveSolids() {
    const list = [...currentCourse.solids];
    (currentRoom.phaseSolids || []).forEach(s => {
      if (s.phase === roomPhase) list.push({ ...s, kind: 'phase' });
    });
    (currentRoom.glass || []).forEach(g => {
      if (!roomBrokenGlass.has(g.id)) list.push({ ...g, kind: 'glass' });
    });
    (currentRoom.doors || []).forEach(d => {
      if (!doorOpen(d)) list.push({ ...d, kind: 'door' });
    });
    roomWeights.forEach(wt => {
      list.push({ x: wt.x, y: wt.cy, w: wt.w, h: wt.h, kind: 'weight' });
    });
    roomMovers.forEach(mv => {
      list.push({ x: mv.cx, y: mv.cy, w: mv.w, h: mv.h, kind: 'mover', ref: mv });
    });
    return list;
  }

  function landingGrade(speed) { return speed >= 585 ? 2 : speed >= 430 ? 1 : 0; }

  function showImpact() {
    const strings = previewText[state.lang];
    const meter = document.getElementById('hud-impact');
    meter.dataset.grade = lastImpact === null ? '0' : String(lastImpact + 1);
    document.getElementById('hud-impact-txt').textContent = strings.impact + ' · ' + (lastImpact === null ? '—' : strings.grades[lastImpact]);
  }

  function spawnParticles(x, y, color, count, speed = 120) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = (0.3 + Math.random() * 0.85) * speed;
      particles.push({
        x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 40,
        r: Math.random() * 3.2 + 1.4, life: 0.45 + Math.random() * 0.35,
        maxLife: 0.8, color
      });
    }
  }

  function addShockwave(x, y, color, maxR = 110) {
    shockwaves.push({ x, y, r: 8, maxR, color, alpha: 0.95 });
  }

  function handleLandingImpact(landVy, floorObj) {
    // Classify landing impact: 0 = light (<430), 1 = medium (430..584), 2 = heavy (>=585)
    const level = landingGrade(landVy);
    lastImpact = level;
    showImpact();
    P.squashX = level === 2 ? 1.42 : (level === 1 ? 1.2 : 1.08);
    P.squashY = level === 2 ? 0.62 : (level === 1 ? 0.82 : 0.92);
    sound.playLand(level);

    const cx = P.x + P.w / 2, cy = P.y + P.h;
    if (level === 2) {
      shakeTime = 0.24; shakeMag = 7;
      addShockwave(cx, cy, '#f5c451', 120);
      spawnParticles(cx, cy, '#f5c451', 18, 175);
    } else if (level === 1) {
      spawnParticles(cx, cy, '#94a3b8', 7, 85);
    }

    // 1) Cracked Glass check (Breaks ONLY on Heavy Landing level >= 2!)
    if (floorObj?.kind === 'glass' && level >= 2 &&
        floorObj.requiresWeight && !state.droppedWeights.includes(floorObj.requiresWeight)) {
      showToast(previewText[state.lang].glassLocked);
    } else if (floorObj?.kind === 'glass' && level >= 2) {
      roomBrokenGlass.add(floorObj.id);
      if (floorObj.persistent && !state.brokenGlass.includes(floorObj.id)) {
        state.brokenGlass.push(floorObj.id);
        persistSave();
      }
      sound.playGlassBreak();
      spawnParticles(floorObj.x + floorObj.w / 2, floorObj.y + 10, '#5eead4', 24, 210);
      P.onGround = false;
      P.vy = 180; // fall cleanly through!
    }

    // 2) Resonance Plates check
    (currentRoom.plates || []).forEach(pl => {
      const box = { x: pl.x - 6, y: pl.y - 10, w: pl.w + 12, h: pl.h + 14 };
      if (aabb(P, box)) {
        const ps = plateStates[pl.id] || { charge: 0, pulse: 0 };
        if (level >= pl.req && (ps.charge !== 2 || pl.action === 'togglePhase' || pl.action === 'finale' || pl.action === 'campaign')) {
          ps.charge = 2; ps.pulse = 1;
          plateStates[pl.id] = ps;
          triggerPlateAction(pl);
        } else if (level >= 1 && ps.charge < 2) {
          ps.charge = 1; ps.pulse = 0.7;
          plateStates[pl.id] = ps;
          sound.playPlateHalf();
          spawnParticles(pl.x + pl.w / 2, pl.y, '#fbbf24', 8, 90);
        }
      }
    });
  }

  function triggerPlateAction(pl) {
    sound.playPlateFull();
    addShockwave(pl.x + pl.w / 2, pl.y, '#f5c451', 160);
    if (pl.action === 'openDoor') {
      if (!state.openedDoors.includes(pl.target)) {
        state.openedDoors.push(pl.target);
        persistSave();
        showToast(t('doorOpen'));
      }
    } else if (pl.action === 'dropWeight') {
      if (!state.droppedWeights.includes(pl.target)) {
        state.droppedWeights.push(pl.target);
        persistSave();
      }
      roomWeights.forEach(wt => {
        if (wt.id === pl.target && !wt.dropped) {
          wt.dropped = true;
          wt.vy = 40;
        }
      });
    } else if (pl.action === 'togglePhase') {
      flipRoomPhase();
    } else if (pl.action === 'campaign') {
      energize(currentRoom.puzzle.switches.find(part => part.id === pl.target));
    } else if (pl.action === 'finale') {
      triggerEnding();
    }
  }

  function flipRoomPhase() {
    roomPhase = roomPhase === 0 ? 1 : 0;
    state.phases[currentRoom.id] = roomPhase;
    persistSave();
    sound.playPhase();
    const col = roomPhase === 0 ? '#5eead4' : '#c084fc';
    addShockwave(P.x + P.w / 2, P.y + P.h / 2, col, 180);
    showToast(t('phaseShift'), 2000);
    updateHUD();
    // Safety nudge if player now overlaps a newly solidified phase platform
    (currentRoom.phaseSolids || []).forEach(s => {
      if (s.phase === roomPhase && aabb(P, s)) {
        P.y = s.y - P.h - 1;
        P.vy = Math.min(P.vy, 0);
      }
    });
  }

  function energize(part) {
    const puzzle = currentRoom.puzzle;
    if (state.puzzles.includes(currentRoom.id)) return;
    if (part.phase !== undefined && roomPhase !== part.phase) {
      showToast(campaignText(1));
      return;
    }
    if (puzzle.sequence[circuitStep] !== part.id) {
      circuitStep = 0;
      circuitTime = 0;
      showToast(campaignText(2));
      return;
    }
    if (circuitStep === 0) circuitTime = puzzle.seconds;
    circuitStep++;
    sound.playPlateFull();
    addShockwave(part.x, part.y, '#5eead4', 85);
    if (circuitStep === puzzle.sequence.length) {
      state.puzzles.push(currentRoom.id);
      persistSave();
      showToast(campaignText(3));
      updateHUD();
    }
  }

  const nearPoint = (x, y, dx, dy) =>
    Math.abs(P.x + P.w / 2 - x) <= dx && Math.abs(P.y + P.h / 2 - y) <= dy;
  const beamLive = beam => roomClock % beam.period >= beam.period * .58;

  function updatePhysics(dt) {
    if (!currentRoom) return;
    roomClock += dt;
    if (circuitTime > 0 && !state.puzzles.includes(currentRoom.id)) {
      circuitTime -= dt;
      if (circuitTime <= 0) {
        circuitStep = 0;
        showToast(campaignText(2));
      }
    }
    if (roomFade > 0) roomFade = Math.max(0, roomFade - dt * 2.4);
    if (shakeTime > 0) shakeTime = Math.max(0, shakeTime - dt);

    // Update Moving Platforms
    roomMovers.forEach(mv => {
      const prevX = mv.cx;
      mv.cx += mv.dir * mv.speed * dt;
      if (mv.cx >= mv.x2) { mv.cx = mv.x2; mv.dir = -1; }
      if (mv.cx <= mv.x1) { mv.cx = mv.x1; mv.dir = 1; }
      mv.vx = (mv.cx - prevX) / Math.max(dt, 0.001);
    });

    // Update Falling Weights
    roomWeights.forEach(wt => {
      if (wt.dropped && wt.cy < wt.restY) {
        wt.vy += GRAVITY * dt;
        wt.cy += wt.vy * dt;
        if (wt.cy >= wt.restY) {
          wt.cy = wt.restY;
          wt.vy = 0;
          shakeTime = 0.2; shakeMag = 5;
          sound.playLand(2);
          spawnParticles(wt.x + wt.w / 2, wt.cy + wt.h, '#f5c451', 14, 140);
        }
      }
    });

    // Carry player if standing on a moving platform
    if (P.onGround && P.onMover) {
      P.x += P.onMover.vx * dt;
    }

    // Horizontal movement + inherited momentum decay
    let moveDir = 0;
    if (keys.left) moveDir -= 1;
    if (keys.right) moveDir += 1;
    if (moveDir !== 0) P.facing = moveDir;

    if (P.onGround) {
      P.airBoostVx = 0;
      P.vx = moveDir * MOVE_SPEED;
    } else {
      P.airBoostVx *= Math.pow(0.28, dt);
      P.vx = moveDir * MOVE_SPEED + P.airBoostVx;
    }

    // Coyote time & Jump buffer
    if (P.onGround) P.coyote = 0.14;
    else P.coyote = Math.max(0, P.coyote - dt);

    if (keys.jumpJust) P.jumpBuf = 0.16;
    else P.jumpBuf = Math.max(0, P.jumpBuf - dt);

    keys.jumpJust = false;

    if (P.jumpBuf > 0 && P.coyote > 0) {
      P.vy = JUMP_VY;
      if (P.onMover) P.airBoostVx = P.onMover.vx * 0.92;
      P.onGround = false;
      P.onMover = null;
      P.coyote = 0;
      P.jumpBuf = 0;
      P.peakVy = 0;
      P.squashX = 0.78; P.squashY = 1.26;
      sound.playJump();
      spawnParticles(P.x + P.w / 2, P.y + P.h, '#93c5fd', 6, 70);
    }

    // Gravity
    P.vy = Math.min(920, P.vy + GRAVITY * dt);
    if (P.vy > P.peakVy) P.peakVy = P.vy;

    const solids = getActiveSolids();

    // Move X & resolve
    P.x += P.vx * dt;
    for (const s of solids) {
      if (P.vx && aabb(P, s)) {
        if (P.vx > 0) P.x = s.x - P.w;
        else if (P.vx < 0) P.x = s.x + s.w;
        P.vx = 0;
        P.airBoostVx = 0;
      }
    }

    // Move Y & resolve
    const wasOnGround = P.onGround;
    P.onGround = false;
    P.onMover = null;
    let landedFloor = null;
    P.y += P.vy * dt;
    for (const s of solids) {
      if (aabb(P, s)) {
        if (P.vy > 0) {
          P.y = s.y - P.h;
          P.onGround = true;
          landedFloor = s;
          if (s.kind === 'mover') P.onMover = s.ref;
          P.vy = 0;
        } else if (P.vy < 0) {
          P.y = s.y + s.h;
          P.vy = 0;
        }
      }
    }

    const touchdownSpeed = P.onGround && !wasOnGround ? P.peakVy : 0;
    if (P.onGround && !wasOnGround) {
      handleLandingImpact(touchdownSpeed, landedFloor);
      P.peakVy = 0;
    }

    // A spring uses the impact before the grounded collision clears vertical velocity.
    (currentRoom.springs || []).forEach(sp => {
      const box = { x: sp.x, y: sp.y - 6, w: sp.w, h: sp.h + 8 };
      if (P.onGround && aabb(P, box)) {
        const bounce = -Math.min(920, Math.max(sp.minimum ?? 575, touchdownSpeed * 1.32));
        P.vy = bounce;
        P.onGround = false;
        P.onMover = null; P.coyote = 0; P.jumpBuf = 0;
        P.peakVy = 0;
        P.squashX = 0.72; P.squashY = 1.35;
        sound.playSpring(Math.abs(bounce));
        addShockwave(sp.x + sp.w / 2, sp.y, '#5eead4', Math.abs(bounce) > 700 ? 115 : 70);
        spawnParticles(sp.x + sp.w / 2, sp.y, '#5eead4', 12, 160);
      }
    });

    const beam = currentRoom.puzzle?.beam;
    if (beam && beamLive(beam) && aabb(P, beam)) {
      enterRoom(currentRoom.id);
      return;
    }

    // Each contact can switch the prism once. Standing inside one is safe.
    const prism = currentRoom.prisms.find(pr =>
      !pr.remoteOnly && aabb(P, {x:pr.x - 16, y:pr.y - 16, w:32, h:32}));
    if (prism && prism.id !== prismContact) flipRoomPhase();
    prismContact = prism?.id ?? null;

    // Collect Cores
    (currentRoom.cores || []).forEach(c => {
      if (state.cores.includes(c.id)) return;
      const box = { x: c.x - 18, y: c.y - 18, w: 36, h: 36 };
      if (aabb(P, box)) {
        state.cores.push(c.id);
        persistSave();
        sound.playCollect(true);
        addShockwave(c.x, c.y, '#f5c451', 180);
        spawnParticles(c.x, c.y, '#f5c451', 30, 220);
        showToast(`${t('gotCore')}${c.name[state.lang] || c.name.zh} (${state.cores.length}/4)`, 3800);
        updateHUD();
      }
    });

    // Collect Hidden Shards
    (currentRoom.shards || []).forEach(sh => {
      if (state.shards.includes(sh.id)) return;
      const box = { x: sh.x - 16, y: sh.y - 16, w: 32, h: 32 };
      if (aabb(P, box)) {
        state.shards.push(sh.id);
        persistSave();
        sound.playCollect(false);
        addShockwave(sh.x, sh.y, '#5eead4', 140);
        spawnParticles(sh.x, sh.y, '#5eead4', 24, 190);
        showToast(`${t('gotShard')} (${state.shards.length}/4)`, 3500);
        updateHUD();
      }
    });

    // Interact (E / Stele / Astrolabe)
    if (keys.actJust) {
      keys.actJust = false;
      const portal = currentRoom.portals?.find(part => nearPoint(part.x, part.y, 28, 100));
      const part = currentRoom.puzzle?.switches.find(part => !part.impact && nearPoint(part.x, part.y, 44, 37));
      const distance = part => Math.hypot(P.x + P.w / 2 - part.x, P.y + P.h / 2 - part.y);
      if (portal && (!part || state.puzzles.includes(currentRoom.id) || distance(portal) < distance(part))) {
        if (portalOpen(portal)) enterRoom(portal.to, portal.tx, undefined, true);
        else explainLockedPortal(portal);
        return;
      }
      if (part) energize(part);
      if (currentRoom.stele) {
        const dx = Math.abs((P.x + P.w / 2) - currentRoom.stele.x);
        const dy = Math.abs((P.y + P.h / 2) - currentRoom.stele.y);
        if (dx < 60 && dy < 60) {
          showToast(currentRoom.stele.text[state.lang] || currentRoom.stele.text.zh, 4200);
        }
      }
      if (currentRoom.astrolabe) {
        const dx = Math.abs((P.x + P.w / 2) - currentRoom.astrolabe.x);
        const dy = Math.abs((P.y + P.h / 2) - currentRoom.astrolabe.y);
        if (dx < 90 && dy < 120) {
          if (state.cores.length >= 4 && hasMainSeals()) {
            enterRoom('H2', undefined, undefined, true);
            return;
          } else {
            showToast(state.cores.length < 4 ? t('needCores') : campaignText(5), 3200);
          }
        }
      }
    }

    // Only cross the part of the boundary with an opening.
    for (const ex of currentCourse.exits) {
      const span = currentRoom.openings[ex.dir];
      const center = P.x + P.w / 2;
      if ((ex.dir === 'up' || ex.dir === 'down') &&
          (center < span[0] || center > span[1])) continue;
      if (ex.dir === 'right' && P.x + P.w > W - 4) { enterRoom(ex.to, ex.tx, ex.ty, true); return; }
      if (ex.dir === 'left' && P.x < 4) { enterRoom(ex.to, ex.tx, ex.ty, true); return; }
      if (ex.dir === 'down' && P.y > H - 4) { enterRoom(ex.to, ex.tx, ex.ty, true); return; }
      if (ex.dir === 'up' && P.y + P.h < 8) { enterRoom(ex.to, ex.tx, ex.ty, true); return; }
    }

    // Out-of-bounds safety net
    if (P.y > H + 80 || P.y < -120 || P.x < -80 || P.x > W + 80) {
      enterRoom(currentRoom.id);
      return;
    }

    // Squash recovery & scarf trail
    P.squashX += (1 - P.squashX) * Math.min(1, dt * 14);
    P.squashY += (1 - P.squashY) * Math.min(1, dt * 14);
    P.trail.unshift({ x: P.x + P.w / 2, y: P.y + P.h / 2 });
    if (P.trail.length > 9) P.trail.pop();

    // Update FX
    particles.forEach(pt => {
      pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 320 * dt; pt.life -= dt;
    });
    particles = particles.filter(pt => pt.life > 0);
    shockwaves.forEach(sw => {
      sw.r += (sw.maxR - sw.r) * Math.min(1, dt * 10);
      sw.alpha -= dt * 2.2;
    });
    shockwaves = shockwaves.filter(sw => sw.alpha > 0.02);
    Object.values(plateStates).forEach(ps => {
      if (ps.pulse > 0) ps.pulse = Math.max(0, ps.pulse - dt * 2.4);
    });

    keys.jumpJust = false;
    keys.actJust = false;
  }

  /* =========================================================
     9. RENDERER (Celestial Observatory Glass Aesthetic)
     ========================================================= */
  function render(now) {
    const tSec = now * 0.001;
    ctx.save();
    if (shakeTime > 0) {
      ctx.translate((Math.random() - 0.5) * shakeMag, (Math.random() - 0.5) * shakeMag);
    }

    // Deep night sky gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#070c1a');
    bg.addColorStop(0.55, '#0d1730');
    bg.addColorStop(1, '#111d3a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle Observatory Dome Arcs in background
    ctx.strokeStyle = 'rgba(148, 184, 255, 0.06)';
    ctx.lineWidth = 1.5;
    for (let r = 140; r <= 420; r += 90) {
      ctx.beginPath();
      ctx.arc(W / 2, H + 60, r, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
    }

    // Twinkling Stars
    stars.forEach(st => {
      const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(tSec * st.sp + st.tw));
      ctx.fillStyle = `rgba(226, 238, 255, ${a.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    });

    if (!currentRoom) { ctx.restore(); return; }

    // Draw Conduit Lines from Resonance Plates to Targets
    (currentRoom.plates || []).forEach(pl => {
      let tx = pl.x + pl.w / 2, ty = pl.y - 120;
      if (pl.action === 'openDoor') {
        const d = (currentRoom.doors || []).find(o => o.id === pl.target);
        if (d) { tx = d.x + d.w / 2; ty = d.y + d.h / 2; }
      } else if (pl.action === 'dropWeight') {
        const w = roomWeights.find(o => o.id === pl.target);
        if (w) { tx = w.x + w.w / 2; ty = w.cy; }
      } else if (pl.action === 'togglePhase') {
        const pr = (currentRoom.prisms || []).find(o => o.id === pl.target);
        if (pr) { tx = pr.x; ty = pr.y; }
      }
      const ps = plateStates[pl.id] || { charge: 0 };
      ctx.save();
      ctx.strokeStyle = ps.charge >= 2 ? 'rgba(245, 196, 81, 0.72)' : (ps.charge === 1 ? 'rgba(245, 196, 81, 0.35)' : 'rgba(148, 184, 255, 0.18)');
      ctx.lineWidth = ps.charge >= 2 ? 3 : 2;
      ctx.setLineDash(ps.charge >= 2 ? [] : [6, 6]);
      ctx.beginPath();
      ctx.moveTo(pl.x + pl.w / 2, pl.y + 4);
      ctx.lineTo(tx, pl.y + 4);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.restore();
    });

    // Hub Astrolabe Centerpiece
    if (currentRoom.astrolabe) {
      const ax = currentRoom.astrolabe.x, ay = currentRoom.astrolabe.y;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.strokeStyle = state.cores.length >= 4 ? 'rgba(245, 196, 81, 0.85)' : 'rgba(148, 184, 255, 0.28)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 74, 0, Math.PI * 2); ctx.stroke();
      ctx.rotate(tSec * 0.35);
      ctx.beginPath(); ctx.ellipse(0, 0, 74, 26, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.rotate(-tSec * 0.7);
      ctx.beginPath(); ctx.ellipse(0, 0, 56, 20, Math.PI / 3, 0, Math.PI * 2); ctx.stroke();
      // 4 Core sockets
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + tSec * 0.2;
        const sx = Math.cos(ang) * 74, sy = Math.sin(ang) * 74;
        const lit = i < state.cores.length;
        ctx.fillStyle = lit ? '#f5c451' : '#1e293b';
        ctx.beginPath(); ctx.arc(sx, sy, 7, 0, Math.PI * 2); ctx.fill();
        if (lit) { ctx.strokeStyle = '#fff6d6'; ctx.stroke(); }
      }
      ctx.restore();
      if (state.cores.length >= 4) {
        ctx.fillStyle = '#f5c451';
        ctx.font = '600 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('▲ ' + (ROOMS.H2.name[state.lang] || '星穹之顶'), ax, ay - 88);
      }
    }

    const marker = {left:'‹', right:'›', up:'↑', down:'↓'};
    ctx.fillStyle = 'rgba(169, 200, 238, .74)';
    ctx.textAlign = 'center';
    ctx.font = '700 20px system-ui';
    for (const {dir} of currentRoom.exits) {
      const [lo, hi] = currentRoom.openings[dir];
      const x = dir === 'left' ? 17 : dir === 'right' ? W - 17 : (lo + hi) / 2;
      const y = dir === 'up' ? 52 : dir === 'down' ? H - 51 : H - 112;
      ctx.fillText(marker[dir], x, y);
    }

    // Stele Inscriptions
    if (currentRoom.stele) {
      const st = currentRoom.stele;
      ctx.fillStyle = 'rgba(30, 48, 86, 0.85)';
      ctx.strokeStyle = 'rgba(94, 234, 212, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(st.x - 14, st.y, 28, 42, [8, 8, 2, 2]);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#5eead4';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✦', st.x, st.y + 22);
      if (Math.hypot((P.x + P.w / 2) - st.x, (P.y + P.h / 2) - st.y) < 62) {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(coarsePointer.matches ? '✦' : '[E]', st.x, st.y - 8);
      }
    }

    // Solid Architecture
    (currentRoom.solids || []).forEach(s => {
      const grad = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.h);
      grad.addColorStop(0, '#1c2b4d');
      grad.addColorStop(1, '#111b33');
      ctx.fillStyle = grad;
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeStyle = 'rgba(148, 184, 255, 0.24)';
      ctx.lineWidth = 1;
      ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);
    });

    // Phase Platforms (Lunar Cyan vs Star Violet)
    (currentRoom.phaseSolids || []).forEach(s => {
      const active = s.phase === roomPhase;
      const col = s.phase === 0 ? '94, 234, 212' : '192, 132, 252';
      ctx.save();
      if (active) {
        ctx.fillStyle = `rgba(${col}, 0.28)`;
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.strokeStyle = `rgba(${col}, 0.92)`;
        ctx.lineWidth = 2;
        ctx.strokeRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2);
      } else {
        ctx.strokeStyle = `rgba(${col}, 0.34)`;
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2);
      }
      ctx.restore();
    });

    const puzzle = currentRoom.puzzle;
    if (puzzle) {
      const solved = state.puzzles.includes(currentRoom.id);
      const recipe = puzzle.sequence.map(id => {
        const part = puzzle.switches[id - 1];
        const qualifiers = [part.phase === 0 ? campaignText(8) : part.phase === 1 ? campaignText(9) : '',
          part.impact ? campaignText(10) : 'E'].filter(Boolean);
        return part.mark + ' ' + qualifiers.join(' + ');
      });
      ctx.textAlign = 'left';
      ctx.font = '700 19px system-ui';
      ctx.fillStyle = solved ? '#70ebce' : '#f4deb3';
      const inscription = puzzle.kind === 'memory' && !nearPoint(112,480,102,82);
      ctx.fillText(solved ? '✓ ' + campaignText(3) : inscription ? campaignText(11) :
        campaignText(0) + ' · ' + recipe.join('  →  '), 52, 72, 850);
      if (puzzle.kind === 'memory') {
        ctx.fillStyle='#9d7856'; ctx.fillRect(105,459,14,28);
        ctx.strokeStyle='#e7c492'; ctx.strokeRect(105,459,14,28);
      }
      if (puzzle.seconds && !solved) {
        ctx.font = '700 16px system-ui';
        ctx.fillText('⏱ ' + (circuitStep ? Math.ceil(circuitTime) : puzzle.seconds.toFixed(1)) + ' s', 52, 101);
      }
      for (const part of puzzle.switches) {
        const done = solved || puzzle.sequence.slice(0,circuitStep).includes(part.id);
        ctx.fillStyle = done ? '#5eead4' : '#17243c';
        ctx.strokeStyle = part.phase === 1 ? '#c084fc' : '#9dd4ea';
        ctx.beginPath();
        ctx.arc(part.x,part.y,17,0,Math.PI*2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = done ? '#081a20' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(String(part.mark),part.x,part.y+6);
      }
      if (puzzle.beam) {
        const beam = puzzle.beam;
        ctx.fillStyle = beamLive(beam) ? '#ff759c' : '#632853';
        ctx.fillRect(beam.x,beam.y,beam.w,beam.h);
      }
    }
    for (const portal of currentRoom.portals || []) {
      const open = portalOpen(portal);
      ctx.strokeStyle = open ? '#79d9c8' : '#aa8972';
      ctx.fillStyle = open ? 'rgba(54,190,167,.2)' : 'rgba(118,82,67,.22)';
      ctx.beginPath();
      ctx.roundRect(portal.x-17,portal.y-26,34,53,[14,14,2,2]);
      ctx.fill(); ctx.stroke();
      ctx.font = '700 18px system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#e7efe9';
      ctx.fillText(open ? 'E' : '·',portal.x,portal.y+6);
      if (nearPoint(portal.x,portal.y,70,100)) {
        ctx.font = '700 15px system-ui';
        const labelX = Math.max(135,Math.min(W-135,portal.x));
        ctx.fillText(ROOMS[portal.to].name[state.lang],labelX,portal.y-36,270);
        if (!open) {
          const restored = portal.needs.filter(id => state.puzzles.includes(id)).length;
          ctx.fillStyle = '#f4d4a1';
          ctx.font = '600 12px system-ui';
          ctx.fillText(restored + '/' + portal.needs.length + ' · ' + portalWords[state.lang][3],
            labelX,portal.y-55,270);
        }
      }
    }

    // Cracked Glass Floors
    (currentRoom.glass || []).forEach(g => {
      if (roomBrokenGlass.has(g.id)) return;
      ctx.fillStyle = 'rgba(94, 234, 212, 0.16)';
      ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.strokeStyle = 'rgba(165, 243, 252, 0.72)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(g.x + 0.5, g.y + 0.5, g.w - 1, g.h - 1);
      // Cracks visual cue
      ctx.beginPath();
      const mid = g.x + g.w / 2;
      ctx.moveTo(mid - 22, g.y + 2); ctx.lineTo(mid - 6, g.y + 13); ctx.lineTo(mid + 12, g.y + 8); ctx.lineTo(mid + 26, g.y + g.h - 3);
      ctx.moveTo(mid - 6, g.y + 13); ctx.lineTo(mid - 14, g.y + g.h - 2);
      ctx.stroke();
    });

    // Doors
    (currentRoom.doors || []).forEach(d => {
      if (doorOpen(d)) return;
      ctx.fillStyle = 'rgba(245, 196, 81, 0.2)';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.strokeStyle = '#f5c451';
      ctx.lineWidth = 2;
      ctx.strokeRect(d.x + 1, d.y + 1, d.w - 2, d.h - 2);
      // Lock bars
      for (let yy = d.y + 20; yy < d.y + d.h - 10; yy += 24) {
        ctx.beginPath(); ctx.moveTo(d.x + 4, yy); ctx.lineTo(d.x + d.w - 4, yy); ctx.stroke();
      }
    });

    // Hanging / Fallen Weights
    roomWeights.forEach(wt => {
      if (!wt.dropped) {
        ctx.strokeStyle = 'rgba(245, 196, 81, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(wt.x + wt.w / 2, 30); ctx.lineTo(wt.x + wt.w / 2, wt.cy); ctx.stroke();
      }
      ctx.fillStyle = '#29395f';
      ctx.fillRect(wt.x, wt.cy, wt.w, wt.h);
      ctx.strokeStyle = '#f5c451';
      ctx.lineWidth = 2;
      ctx.strokeRect(wt.x + 1, wt.cy + 1, wt.w - 2, wt.h - 2);
    });

    // Moving Platforms
    roomMovers.forEach(mv => {
      // Track rail
      ctx.strokeStyle = 'rgba(148, 184, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(mv.x1, mv.cy + mv.h / 2); ctx.lineTo(mv.x2 + mv.w, mv.cy + mv.h / 2); ctx.stroke();
      // Platform body
      ctx.fillStyle = '#243b6b';
      ctx.fillRect(mv.cx, mv.cy, mv.w, mv.h);
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.strokeRect(mv.cx + 1, mv.cy + 1, mv.w - 2, mv.h - 2);
      // Direction chevron
      ctx.fillStyle = '#93c5fd';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(mv.dir > 0 ? '▶' : '◀', mv.cx + mv.w / 2, mv.cy + 14);
    });

    // Resonance Plates
    (currentRoom.plates || []).forEach(pl => {
      const ps = plateStates[pl.id] || { charge: 0, pulse: 0 };
      ctx.fillStyle = ps.charge >= 2 ? '#f5c451' : (ps.charge === 1 ? '#b48a2c' : '#4a3d20');
      ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(pl.x, pl.y, pl.w, pl.h);
      // 2-segment visual energy meter right on the plate!
      for (let i = 0; i < 2; i++) {
        ctx.fillStyle = i < ps.charge ? '#fffbeb' : 'rgba(255,255,255,0.18)';
        ctx.fillRect(pl.x + 10 + i * (pl.w / 2 - 6), pl.y + 3, pl.w / 2 - 14, 5);
      }
    });

    // Spring Pads
    (currentRoom.springs || []).forEach(sp => {
      ctx.fillStyle = 'rgba(94, 234, 212, 0.28)';
      ctx.fillRect(sp.x, sp.y, sp.w, sp.h);
      ctx.strokeStyle = '#5eead4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sp.x + 2, sp.y + 2); ctx.lineTo(sp.x + sp.w - 2, sp.y + 2);
      ctx.moveTo(sp.x + 8, sp.y + sp.h - 2); ctx.lineTo(sp.x + sp.w / 2, sp.y + 3); ctx.lineTo(sp.x + sp.w - 8, sp.y + sp.h - 2);
      ctx.stroke();
    });

    // Lunar/Star Prisms
    (currentRoom.prisms || []).forEach(pr => {
      const col = roomPhase === 0 ? '#5eead4' : '#c084fc';
      const bob = Math.sin(tSec * 3.2) * 4;
      ctx.save();
      ctx.translate(pr.x, pr.y + bob);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = col;
      ctx.shadowColor = col; ctx.shadowBlur = 16;
      ctx.fillRect(-10, -10, 20, 20);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
      ctx.strokeRect(-10, -10, 20, 20);
      ctx.restore();
    });

    // Collectible Cores
    (currentRoom.cores || []).forEach(c => {
      if (state.cores.includes(c.id)) return;
      const bob = Math.sin(tSec * 2.8) * 5;
      ctx.save();
      ctx.translate(c.x, c.y + bob);
      ctx.shadowColor = '#f5c451'; ctx.shadowBlur = 22;
      ctx.fillStyle = '#f5c451';
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fffbeb'; ctx.lineWidth = 2;
      ctx.rotate(tSec * 1.4);
      ctx.strokeRect(-14, -14, 28, 28);
      ctx.restore();
    });

    // Collectible Shards
    (currentRoom.shards || []).forEach(sh => {
      if (state.shards.includes(sh.id)) return;
      const bob = Math.cos(tSec * 3.5) * 4;
      ctx.save();
      ctx.translate(sh.x, sh.y + bob);
      ctx.shadowColor = '#5eead4'; ctx.shadowBlur = 16;
      ctx.fillStyle = '#5eead4';
      ctx.beginPath();
      ctx.moveTo(0, -12); ctx.lineTo(9, 0); ctx.lineTo(0, 12); ctx.lineTo(-9, 0); ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Player Scarf Trail
    P.trail.forEach((pt, idx) => {
      const alpha = (1 - idx / P.trail.length) * 0.35;
      const heavyAura = P.vy >= 560;
      ctx.fillStyle = heavyAura ? `rgba(245, 196, 81, ${alpha})` : `rgba(94, 234, 212, ${alpha})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, Math.max(2, 7 - idx * 0.6), 0, Math.PI * 2);
      ctx.fill();
    });

    // Player Character (Observatory Star-Keeper)
    ctx.save();
    const px = P.x + P.w / 2, py = P.y + P.h;
    ctx.translate(px, py);
    ctx.scale(P.squashX, P.squashY);
    const isHeavyFalling = !P.onGround && P.vy >= 560;
    if (isHeavyFalling) {
      ctx.shadowColor = '#f5c451'; ctx.shadowBlur = 20;
    }
    // Cloak body
    ctx.fillStyle = isHeavyFalling ? '#fef08a' : '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(-P.w / 2, -P.h, P.w, P.h, [9, 9, 4, 4]);
    ctx.fill();
    // Visor & glowing eye
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-P.w / 2 + 3, -P.h + 6, P.w - 6, 8);
    ctx.fillStyle = isHeavyFalling ? '#f5c451' : '#5eead4';
    const eyeX = P.facing > 0 ? 2 : -6;
    ctx.fillRect(eyeX, -P.h + 8, 4, 4);
    // Crescent antenna
    ctx.strokeStyle = '#f5c451'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -P.h - 4, 4, 0.2, Math.PI * 1.4); ctx.stroke();
    ctx.restore();

    // Shockwaves & Particles
    shockwaves.forEach(sw => {
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = Math.max(0, sw.alpha);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    });
    particles.forEach(pt => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });

    // Room entry fade
    if (roomFade > 0) {
      ctx.fillStyle = `rgba(6, 9, 19, ${roomFade.toFixed(2)})`;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();
  }

  /* =========================================================
     10. RESPONSIVE CANVAS SIZING & MAIN LOOP
     ========================================================= */
  function resizeCanvas() {
    const compact = playing && coarsePointer.matches && landscape.matches && window.innerHeight <= 520;
    app.classList.toggle('compact-landscape', compact);
    const stage = document.getElementById('stage-wrap');
    const pad = compact ? 0 : window.innerWidth <= 720 ? 8 : 28;
    const availW = Math.max(1, stage.clientWidth - pad);
    const availH = Math.max(1, stage.clientHeight - pad);
    const scale = Math.min(availW / W, availH / H);
    canvas.style.width = `${Math.floor(W * scale)}px`;
    canvas.style.height = `${Math.floor(H * scale)}px`;
  }
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(resizeCanvas).observe(document.getElementById('stage-wrap'));
  }

  let rafId = null;
  let lastTime = 0;
  const step = 1 / 120;
  let accumulator = 0;
  function loop(now) {
    accumulator = Math.min(0.075, accumulator + Math.max(0, (now - lastTime) / 1000));
    lastTime = now;
    if (playing && !paused) {
      while (accumulator >= step && !paused) {
        updatePhysics(step);
        accumulator -= step;
      }
      render(now);
    } else {
      accumulator = 0;
    }
    rafId = requestAnimationFrame(loop);
  }

  /* =========================================================
     11. INPUT BINDINGS (Keyboard + Touch + UI Buttons)
     ========================================================= */
  const touchResets = [];
  function clearInput() {
    for (const key of Object.keys(keys)) keys[key] = false;
    touchResets.forEach(reset => reset());
    document.querySelectorAll('.t-btn.pressed').forEach(button => button.classList.remove('pressed'));
  }
  window.addEventListener('blur', clearInput);
  window.addEventListener('pagehide', clearInput);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearInput(); });

  window.addEventListener('keydown', e => {
    if (e.code === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open').forEach(element => closeModal(element.id));
      if (immersive) {
        immersive = false;
        app.classList.remove('immersive');
        updateFullscreen();
      }
      return;
    }
    if (!playing || e.target.matches?.('textarea,input,select,[contenteditable=true]')) return;
    if (paused && !['KeyM','KeyH'].includes(e.code)) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'KeyZ') {
      if (!keys.jump) keys.jumpJust = true;
      keys.jump = true;
    }
    if (e.code === 'KeyE' || e.code === 'ArrowDown' || e.code === 'KeyS') keys.actJust = true;
    if (e.code === 'KeyR' && !paused) enterRoom(state.roomId);
    if (e.code === 'KeyM') {
      const m = document.getElementById('modal-map');
      if (m.classList.contains('open')) closeModal('modal-map'); else openModal('modal-map');
    }
    if (e.code === 'KeyH') {
      const h = document.getElementById('modal-hint');
      if (h.classList.contains('open')) closeModal('modal-hint'); else openModal('modal-hint');
    }
  });

  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'KeyZ') keys.jump = false;
  });

  function bindTouch(id, onDown, onUp) {
    const el = document.getElementById(id);
    let pointer = null;
    touchResets.push(() => { pointer = null; });
    el.addEventListener('pointerdown', event => {
      if (pointer !== null || !playing || paused || event.button !== 0) return;
      event.preventDefault();
      pointer = event.pointerId;
      el.setPointerCapture?.(pointer);
      sound.init();
      el.classList.add('pressed');
      onDown();
    });
    for (const type of ['pointerup','pointercancel','lostpointercapture']) {
      el.addEventListener(type, event => {
        if (event.pointerId !== pointer) return;
        pointer = null;
        el.classList.remove('pressed');
        onUp();
      });
    }
  }
  bindTouch('tc-left', () => { keys.left = true; }, () => { keys.left = false; });
  bindTouch('tc-right', () => { keys.right = true; }, () => { keys.right = false; });
  bindTouch('tc-jump', () => { if (!keys.jump) keys.jumpJust = true; keys.jump = true; }, () => { keys.jump = false; });
  bindTouch('tc-act', () => { keys.actJust = true; }, () => {});

  function startGame(resetNew) {
    sound.init();
    if (resetNew) resetExploration();
    state.started = true;
    clearInput();
    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('hud').style.display = 'flex';
    document.getElementById('key-bar').style.display = 'flex';
    playing = true;
    paused = false;
    enterRoom(state.roomId);
    applySettingsUI();
    updateFullscreen();
  }

  document.getElementById('btn-start').addEventListener('click', () => {
    if (hasSavedGame && !window.confirm(previewText[state.lang].confirm)) return;
    startGame(hasSavedGame);
  });
  document.getElementById('btn-continue').addEventListener('click', () => startGame(false));
  document.getElementById('btn-title-settings').addEventListener('click', () => openModal('modal-settings'));
  document.getElementById('btn-hint').addEventListener('click', () => openModal('modal-hint'));
  document.getElementById('btn-map').addEventListener('click', () => openModal('modal-map'));
  document.getElementById('btn-settings').addEventListener('click', () => openModal('modal-settings'));
  document.getElementById('btn-reset').addEventListener('click', () => { if (playing) enterRoom(state.roomId); });
  document.getElementById('btn-audio').addEventListener('click', () => {
    sound.init();
    state.sfxOn = !state.sfxOn;
    persistSave();
    applySettingsUI();
  });
  document.getElementById('btn-warp-hub').addEventListener('click', () => {
    if (!state.visited.includes('H1')) return;
    closeModal('modal-map');
    enterRoom('H1', undefined, undefined, true);
  });
  document.getElementById('btn-keep-exploring').addEventListener('click', () => {
    closeModal('modal-ending');
    enterRoom('H1', undefined, undefined, true);
  });
  document.getElementById('btn-back-title').addEventListener('click', () => {
    closeModal('modal-ending');
    playing = false;
    resizeCanvas();
    document.getElementById('hud').style.display = 'none';
    document.getElementById('key-bar').style.display = 'none';
    document.getElementById('touch-controls').classList.remove('visible');
    document.getElementById('btn-continue').style.display = 'inline-block';
    document.getElementById('title-screen').classList.remove('hidden');
  });

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      const language = btn.dataset.lang;
      if (routeLocale && language !== routeLocale) {
        location.assign(`/${language}/play/astrofall/`);
        return;
      }
      state.lang = language;
      persistSave();
      applyLanguage();
    });
  });

  // Settings toggles
  document.getElementById('set-sfx-on').addEventListener('click', () => { sound.init(); state.sfxOn = true; persistSave(); applySettingsUI(); });
  document.getElementById('set-sfx-off').addEventListener('click', () => { state.sfxOn = false; persistSave(); applySettingsUI(); });
  document.getElementById('set-bgm-on').addEventListener('click', () => { sound.init(); state.bgmOn = true; persistSave(); applySettingsUI(); });
  document.getElementById('set-bgm-off').addEventListener('click', () => { state.bgmOn = false; persistSave(); applySettingsUI(); });
  document.getElementById('set-touch-auto').addEventListener('click', () => { state.touchMode = 'auto'; persistSave(); applySettingsUI(); });
  document.getElementById('set-touch-on').addEventListener('click', () => { state.touchMode = 'on'; persistSave(); applySettingsUI(); });
  document.getElementById('set-touch-off').addEventListener('click', () => { state.touchMode = 'off'; persistSave(); applySettingsUI(); });
  document.getElementById('set-hand-std').addEventListener('click', () => { state.handSwap = false; persistSave(); applySettingsUI(); });
  document.getElementById('set-hand-swap').addEventListener('click', () => { state.handSwap = true; persistSave(); applySettingsUI(); });
  document.querySelectorAll('[data-size]').forEach(btn => {
    btn.addEventListener('click', () => { state.btnScale = parseFloat(btn.dataset.size); persistSave(); applySettingsUI(); });
  });

  // Export / Import / Reset Save
  document.getElementById('btn-export-save').addEventListener('click', () => {
    const bytes = new TextEncoder().encode(JSON.stringify(state));
    const code = btoa(String.fromCharCode(...bytes));
    const box = document.getElementById('save-code-box');
    box.value = code;
    box.select();
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(code).then(
        () => showToast(previewText[state.lang].copied),
        () => showToast(previewText[state.lang].copyManual)
      );
    } else {
      showToast(previewText[state.lang].copyManual);
    }
  });

  document.getElementById('btn-import-save').addEventListener('click', () => {
    const raw = document.getElementById('save-code-box').value.trim();
    try {
      if (!raw || raw.length > 24000) throw new Error('Invalid save length');
      const bytes = Uint8Array.from(atob(raw), char => char.charCodeAt(0));
      const parsed = JSON.parse(new TextDecoder('utf-8', { fatal:true }).decode(bytes));
      const next = normalizeSave(parsed);
      if (playing && !next.started) throw new Error('Expected an active save');
      state = next;
      if (languages.includes(routeLocale)) state.lang = routeLocale;
      persistSave();
      applyLanguage();
      applySettingsUI();
      if (playing) enterRoom(state.roomId);
      showToast(t('imported'));
    } catch (_) {
      showToast(t('badSave'));
    }
  });

  document.getElementById('btn-new-game').addEventListener('click', () => {
    if (!resetConfirmArm) {
      resetConfirmArm = true;
      document.getElementById('btn-new-game').textContent = t('resetConfirm');
      return;
    }
    resetConfirmArm = false;
    resetExploration();
    state.started = playing;
    persistSave();
    applyLanguage();
    applySettingsUI();
    if (playing) enterRoom('H0');
    showToast(t('resetDone'));
    closeModal('modal-settings');
  });

  /* =========================================================
     12. BOOT SEQUENCE WITH REAL PROGRESS LOADER
     ========================================================= */
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('load', async () => {
    const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
    const progress = document.getElementById('loader-progress');
    const bar = document.getElementById('loader-bar');
    const status = document.getElementById('loader-status');
    const stages = [
      () => { loadSaveFromStorage(); applyLanguage(); },
      () => { currentRoom = ROOMS[state.roomId]; currentCourse = prepareRoom(state.roomId); },
      () => { preCacheNeighbors(state.roomId); },
      () => { applySettingsUI(); resizeCanvas(); }
    ];
    for (const [index, stage] of stages.entries()) {
      await nextFrame();
      stage();
      const value = (index + 1) * 25;
      progress.setAttribute('aria-valuenow', value);
      bar.style.width = value + '%';
      status.textContent = t('loadSteps')[index] + ' ' + value + '%';
    }
    await nextFrame();
    document.getElementById('loader-screen').classList.add('hidden');
    document.getElementById('title-screen').classList.remove('hidden');
    document.getElementById('btn-continue').style.display = hasSavedGame ? 'inline-block' : 'none';
    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
  });
})();
