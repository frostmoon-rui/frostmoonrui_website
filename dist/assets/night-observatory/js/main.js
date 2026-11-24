(function () {
  'use strict';
  const NO = window.NO = window.NO || {};
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const localPreview = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if (!localPreview) for (const option of ['test', 'room', 'dev', 'clean', 'nosw', 'nointro']) params.delete(option);

  // ------------------------------------------------------------ save manager
  class SaveManager {
    constructor() {
      this.prefix = 'nightObservatory.save.';
      this.settingsKey = 'nightObservatory.settings';
      this.activeKey = 'nightObservatory.activeSlot';
      this.storageOk = this.testStorage();
    }
    testStorage() {
      try {
        const k = '__no_test__';
        localStorage.setItem(k, '1');
        localStorage.removeItem(k);
        return true;
      } catch (e) { return false; }
    }
    defaultSettings() {
      return {
        lang: document.documentElement.dataset.locale || NO.detectLang(),
        music: 65,
        sfx: 80,
        ambient: 55,
        shake: 60,
        reduceMotion: false,
        highContrast: false,
        subtitles: true,
        hints: true,
        controlSide: 'right',
        buttonSize: 100,
        showTouch: 'auto',
        tutorialMode: 'auto',
        tutorialCompleted: {}
      };
    }
    loadSettings() {
      const def = this.defaultSettings();
      if (!this.storageOk) return def;
      try {
        const raw = localStorage.getItem(this.settingsKey);
        if (!raw) return def;
        return Object.assign(def, JSON.parse(raw));
      } catch (e) { return def; }
    }
    saveSettings(s) {
      if (!this.storageOk) return;
      try { localStorage.setItem(this.settingsKey, JSON.stringify(s)); } catch (e) {}
    }
    newState(slot) {
      const now = Date.now();
      const room = NO.DATA.firstRoom;
      return {
        version: 2,
        layoutVersion: NO.DATA.layoutVersion,
        slot,
        room,
        spawn: null,
        lastSpawn: { ...NO.DATA.rooms[room].spawn },
        sigils: { tide: false, light: false, gravity: false },
        echoes: {},
        endings: {},
        flags: {},
        ending: null,
        playtime: 0,
        visited: {},
        createdAt: now,
        updatedAt: now
      };
    }
    migrate(s) {
      if (s && Object.hasOwn(NO.DATA.classicRooms, s.roomId) && (s.started === true || s.version === 1 || s.version == null)) {
        const room = NO.DATA.classicRooms[s.roomId];
        const visited = Object.fromEntries((Array.isArray(s.visited) ? s.visited : [])
          .filter(id => Object.hasOwn(NO.DATA.classicRooms, id)).map(id => [NO.DATA.classicRooms[id], true]));
        return { ...this.newState(1), room, visited, flags: { introSeen: true, importedClassic: true } };
      }
      if (!s || typeof s !== 'object' || !Object.hasOwn(NO.DATA.rooms, s.room)) throw new Error('Unknown save room');
      const base = this.newState([1, 2, 3].includes(s.slot) ? s.slot : 1);
      const out = { ...base, room: s.room };
      const rooms = Object.values(NO.DATA.rooms);
      const echoIds = rooms.flatMap(room => room.objects.filter(o => o.type === 'echo').map(o => o.id));
      const flags = (data, keys) => Object.fromEntries(keys.filter(key => data?.[key] === true).map(key => [key, true]));
      out.sigils = { ...base.sigils, ...flags(s.sigils, Object.keys(base.sigils)) };
      out.echoes = flags(s.echoes, echoIds);
      out.endings = flags(s.endings, Object.keys(NO.DATA.story.endings));
      out.flags = flags(s.flags, ['introSeen','importedClassic',...NO.DATA.restorations]);
      out.visited = { ...base.visited, ...flags(s.visited, Object.keys(NO.DATA.rooms)) };
      out.ending = Object.hasOwn(NO.DATA.story.endings, s.ending) ? s.ending : null;
      for (const key of ['playtime', 'createdAt', 'updatedAt']) {
        if (typeof s[key] === 'number' && Number.isFinite(s[key]) && s[key] >= 0) out[key] = s[key];
      }
      const room = NO.DATA.rooms[s.room];
      for (const key of ['spawn', 'lastSpawn']) {
        const pt = s.layoutVersion === NO.DATA.layoutVersion ? s[key] : null;
        if (pt && Number.isFinite(pt.x) && Number.isFinite(pt.y) &&
            pt.x >= 40 && pt.x <= room.w - 40 && pt.y >= 40 && pt.y <= room.h - 40) {
          out[key] = { x: pt.x, y: pt.y };
        } else if (key === 'lastSpawn') out[key] = { ...room.spawn };
      }
      return out;
    }
    importClassic() {
      if (!this.storageOk) return;
      try {
        const marker = 'nightObservatory.classicMigration';
        if (localStorage.getItem(marker)) return;
        const raw = localStorage.getItem('astrofall_observatory_save_v2') || localStorage.getItem('astrofall_observatory_save_v1');
        if (!raw) return;
        const state = this.migrate(JSON.parse(raw));
        const free = this.list().findIndex(slot => slot === null);
        if (free < 0 || !state.flags.importedClassic || !this.save(free + 1, state)) return;
        if (!this.getActive()) this.setActive(free + 1);
        localStorage.setItem(marker, '1');
      } catch (_) {}
    }
    load(slot) {
      if (!this.storageOk) return null;
      try {
        const raw = localStorage.getItem(this.prefix + slot);
        if (!raw) return null;
        return this.migrate(JSON.parse(raw));
      } catch (e) { return null; }
    }
    save(slot, state) {
      if (!this.storageOk) return false;
      try {
        state.slot = slot;
        state.updatedAt = Date.now();
        localStorage.setItem(this.prefix + slot, JSON.stringify(state));
        return true;
      } catch (e) { return false; }
    }
    list() {
      const out = [];
      for (let i = 1; i <= 3; i++) out.push(this.load(i));
      return out;
    }
    remove(slot) {
      if (!this.storageOk) return;
      try { localStorage.removeItem(this.prefix + slot); } catch (e) {}
    }
    getActive() {
      try { return parseInt(localStorage.getItem(this.activeKey) || '0', 10) || 0; } catch (e) { return 0; }
    }
    setActive(slot) {
      try { localStorage.setItem(this.activeKey, String(slot)); } catch (e) {}
    }
    firstFreeSlot() {
      for (let i = 1; i <= 3; i++) if (!this.load(i)) return i;
      return 1;
    }
    exportText(state) {
      return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    }
    importText(text) {
      text = String(text || '').trim();
      if (text.length > 64000) throw new Error('Save is too large');
      let json = null;
      try { json = JSON.parse(text); } catch (e) {}
      if (!json) {
        try { json = JSON.parse(decodeURIComponent(escape(atob(text)))); } catch (e) {}
      }
      if (!json || !json.room && !json.roomId) throw new Error('bad save');
      return this.migrate(json);
    }
    resetAll() {
      for (let i = 1; i <= 3; i++) this.remove(i);
      try { localStorage.removeItem(this.settingsKey); localStorage.removeItem(this.activeKey); } catch (e) {}
    }
  }

  NO.SaveManager = SaveManager;
  NO.save = new SaveManager();
  NO.save.importClassic();
  NO.settings = NO.save.loadSettings();
  const localeRoutes = document.documentElement.dataset.localeRouting === 'path';
  const requestedLang = params.get('lang');
  const routeLang = localeRoutes && document.documentElement.dataset.locale;
  NO.settings.lang = NO.LANGS.includes(requestedLang) ? requestedLang : routeLang || NO.settings.lang || NO.detectLang();
  NO.setLang(NO.settings.lang);
  function registerGameWorker() {
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0 && !params.has('nosw')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  NO.syncGameLocale = function () {
    document.documentElement.dataset.locale = NO.lang;
    const article = $('game-article');
    if (article) {
      const url = new URL(article.href);
      url.pathname = '/' + NO.lang + '/notes/astrofall-playtest/';
      article.href = url.href;
      article.hreflang = document.documentElement.lang;
    }
    if (!localeRoutes) return;
    const url = new URL(location.href);
    if (NO.lang !== 'en' || url.pathname !== '/play/astrofall/') {
      url.pathname = '/' + NO.lang + '/play/astrofall/';
    }
    if (url.searchParams.has('lang')) url.searchParams.delete('lang');
    const manifest = document.querySelector('link[rel="manifest"]');
    if (manifest) manifest.href = url.pathname + 'manifest.webmanifest';
    if (url.href !== location.href) {
      const moved = url.pathname !== location.pathname;
      history.replaceState(history.state, '', url);
      if (moved && NO.boot?.done) registerGameWorker();
    }
  };
  NO.isTouch = params.get('touch') === '1' || (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) && window.matchMedia('(pointer: coarse)').matches;

  const canvas = $('game');
  NO.state = NO.save.newState(NO.save.getActive() || 1);
  NO.game = new NO.Game(canvas, NO.state);
  NO.ui = new NO.UI();
  NO.lesson = new NO.ControlLesson(NO.game, NO.settings, {
    defaultDevice: NO.ui.shouldShowTouch() ? 'touch' : 'keyboard',
    save: () => NO.save.saveSettings(NO.settings),
    show: step => NO.ui.renderControlLesson(step),
    reward: message => NO.ui.showReward(message),
  });
  NO.boot = { progress: 0, done: false, startedAt: performance.now() };
  NO.testMode = params.get('test') === '1';
  NO.debugMode = params.get('dev') === '1';
  let pendingSave = null;

  function saveState(reason) {
    if (!NO.state) return;
    if (NO.testMode && !pendingSave) return;
    if (!NO.save.storageOk) {
      if (!saveState._warned) { saveState._warned = true; NO.ui.toast(NO.t('save_failed')); }
      return;
    }
    const slot = NO.state.slot || NO.save.getActive() || 1;
    NO.save.setActive(slot);
    NO.save.save(slot, NO.state);
    if (NO.ui) NO.ui.setAutosave();
  }

  function debouncedSave(reason) {
    clearTimeout(pendingSave);
    pendingSave = setTimeout(() => saveState(reason), 180);
  }

  NO.requestSave = (reason) => {
    if (reason === 'room' || reason === 'reward' || reason === 'sigil' || reason === 'echo' || reason === 'ending' || reason === 'choice') saveState(reason);
    else debouncedSave(reason);
  };
  NO.onRoomChange = (room, firstVisit) => {
    if (NO.ui) NO.ui.onRoomChange(room);
    NO.lesson.roomChanged();
    if (NO.audio) NO.audio.setMode(room.bg || 'hub');
    if (firstVisit && room.chapter && !NO.testMode) {
      NO.ui.showDialogue([{ speaker: 'conductor', text: room.chapter }], () => {});
    }
  };
  NO.toast = (msg) => { if (NO.ui) NO.ui.toast(msg); };
  NO.onSoundCue = (name) => { if (NO.ui) NO.ui.showSubtitle(name); };

  // ------------------------------------------------------------ actions
  NO.actions = {
    continueGame() {
      let slot = NO.save.getActive();
      let state = slot ? NO.save.load(slot) : null;
      if (!state) {
        const list = NO.save.list();
        const idx = list.findIndex(Boolean);
        if (idx >= 0) { slot = idx + 1; state = list[idx]; }
      }
      if (!state) { NO.actions.newGame(NO.save.firstFreeSlot()); return; }
      NO.actions.startFromSlot(slot);
    },
    startFromSlot(slot) {
      const state = NO.save.load(slot);
      if (!state) { NO.actions.newGame(slot); return; }
      NO.save.setActive(slot);
      NO.state = state;
      NO.game.state = state;
      NO.game.paused = false;
      NO.ui.hideAllOverlays();
      $('title').classList.add('hidden');
      $('slots').classList.add('hidden');
      NO.ui.setPlaying(true);
      const safeRoom = NO.DATA.rooms[state.room] ? state.room : 'hub';
      NO.game.loadRoom(safeRoom, state.spawn || NO.DATA.rooms[safeRoom].spawn, { silent: true });
      NO.game.fade = 1; NO.game.fading = 'in';
      if (NO.audio) { NO.audio.ensure(); NO.audio.setMode(NO.DATA.rooms[state.room] ? NO.DATA.rooms[state.room].bg : 'hub'); }
      if ((state.playtime || 0) < 2 && !state.flags.introSeen && !params.get('nointro')) {
        NO.actions.showIntro();
      }
    },
    newGame(slot) {
      slot = slot || NO.save.firstFreeSlot();
      const state = NO.save.newState(slot);
      NO.save.setActive(slot);
      NO.save.save(slot, state);
      NO.state = state;
      NO.game.state = state;
      NO.game.paused = false;
      NO.ui.hideAllOverlays();
      $('title').classList.add('hidden');
      $('slots').classList.add('hidden');
      NO.ui.setPlaying(true);
      NO.game.loadRoom(state.room, null, { silent: true });
      NO.game.fade = 1; NO.game.fading = 'in';
      if (NO.audio) { NO.audio.ensure(); NO.audio.setMode('hub'); }
      if (!params.get('nointro')) NO.actions.showIntro();
    },
    showIntro() {
      NO.game.paused = true;
      NO.ui.showOpening(() => {
        NO.state.flags.introSeen = true;
        NO.save.save(NO.state.slot || 1, NO.state);
        NO.ui.showDialogue(NO.DATA.story.intro, () => {
          NO.state.flags.introSeen = true;
          NO.save.save(NO.state.slot || 1, NO.state);
        });
      });
    },
    returnToTitle() {
      saveState('title');
      NO.game.mode = 'title';
      NO.game.paused = false;
      NO.game.dead = false;
      NO.ui.setPlaying(false);
      NO.ui.showTitle();
      if (NO.audio) NO.audio.setMode('title');
    },
    exportSave() {
      if (!NO.save.storageOk) { NO.ui.toast(NO.t('save_failed')); return; }
      const slot = NO.state.slot || NO.save.getActive() || 1;
      NO.save.save(slot, NO.state);
      const text = NO.save.exportText(NO.state);
      const blob = new Blob([text], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'night-observatory-save-' + slot + '.nosave';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
      NO.ui.toast(NO.t('exported'));
    },
    restoreSave(text) {
      try {
        const state = NO.save.importText(text);
        const free = NO.save.list().findIndex(slot => slot === null);
        const slot = free < 0 ? state.slot : free + 1;
        if (free < 0 && !confirm(NO.t('confirm_overwrite'))) return;
        if (!NO.save.save(slot, state)) { NO.ui.toast(NO.t('save_failed')); return; }
        NO.save.setActive(slot);
        NO.ui.toast(NO.t('imported'));
        setTimeout(() => location.reload(), 500);
      } catch (_) {
        NO.ui.toast(NO.t('import_failed'));
      }
    },
    importSave() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.nosave,.json,text/plain';
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        if (file.size > 64000) { NO.ui.toast(NO.t('import_failed')); return; }
        try { NO.actions.restoreSave(await file.text()); }
        catch (_) { NO.ui.toast(NO.t('import_failed')); }
      });
      input.click();
    },
    continueExplore() {
      NO.ui.closeEnding();
      NO.game.mode = 'play';
      NO.game.paused = false;
      NO.game.loadRoom('hub', NO.DATA.rooms.hub.spawn, { silent: true });
      NO.ui.setPlaying(true);
      NO.ui.refreshHud();
      NO.save.save(NO.state.slot || 1, NO.state);
    }
  };

  // ------------------------------------------------------------ boot
  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
  function raf() { return new Promise(r => requestAnimationFrame(r)); }

  async function boot() {
    NO.ui.showLoading();
    NO.ui.updateLoading(0.04, NO.t('load_1'), '4%', NO.t('load_tip_1'));
    await wait(120);
    const steps = [
      { p: 0.16, key: 'load_1', tip: 'load_tip_1' },
      { p: 0.32, key: 'load_2', tip: 'load_tip_2' },
      { p: 0.50, key: 'load_3', tip: 'load_tip_3' },
      { p: 0.66, key: 'load_4', tip: 'load_tip_4' },
      { p: 0.82, key: 'load_5', tip: 'load_tip_5' },
      { p: 0.94, key: 'load_6', tip: 'load_tip_1' }
    ];
    for (let i = 0; i < steps.length; i++) {
      NO.boot.step = i;
      NO.ui.updateLoading(steps[i].p, NO.t(steps[i].key), Math.round(steps[i].p * 100) + '%', NO.t(steps[i].tip));
      await wait(170 + (i % 2) * 70);
    }
    try {
      if (document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, wait(700)]);
    } catch (e) {}
    await Promise.race([raf(), wait(220)]);
    await Promise.race([raf(), wait(220)]);
    NO.ui.updateLoading(1, NO.t('load_6'), '100%', NO.t('load_tip_3'));
    await wait(220);
    NO.boot.progress = 1;
    NO.boot.done = true;
    $('loading').classList.add('hidden');
    NO.game.mode = 'title';
    NO.ui.showTitle();
    NO.audio.setSettings(NO.settings);
    NO.audio.setMode('title');
    registerGameWorker();
    if (NO.debugMode) $('debug').classList.remove('hidden');
    if (NO.testMode) runTests();
    else {
      const room = params.get('room');
      if (room && NO.DATA.rooms[room]) {
        NO.testMode = true;
        NO.state = NO.save.newState(1);
        NO.game.state = NO.state;
        NO.ui.hideAllOverlays();
        $('title').classList.add('hidden');
        NO.ui.setPlaying(!params.get('clean'));
        NO.game.loadRoom(room, null, { silent: true });
        NO.game.fade = 0;
        if (params.get('clean') === '1') {
          $('hud').classList.add('hidden');
          $('touch').classList.add('hidden');
        }
      }
    }
  }

  // ------------------------------------------------------------ first gesture / audio
  let audioStarted = false;
  function unlockAudio() {
    if (audioStarted) return;
    audioStarted = true;
    NO.audio.ensure();
    NO.audio.setSettings(NO.settings);
    NO.audio.setMode(NO.game.mode === 'title' ? 'title' : (NO.state.room && NO.DATA.rooms[NO.state.room] ? NO.DATA.rooms[NO.state.room].bg : 'hub'));
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  }
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);

  // ------------------------------------------------------------ loop
  let last = performance.now();
  let fps = 60, fpsAcc = 0, fpsFrames = 0;
  let carry = 0;
  const physicsStep = 1 / 60;
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    if (!NO.boot.done) {
      NO.ui.drawLoader(Math.min(0.98, 0.03 + (now - NO.boot.startedAt) / 3200), now / 1000);
      requestAnimationFrame(loop);
      return;
    }
    carry += dt;
    while (carry >= physicsStep) {
      NO.game.update(physicsStep);
      if (NO.game.mode === 'play' && !NO.game.paused && !NO.game.dead) {
        NO.state.playtime = (NO.state.playtime || 0) + physicsStep;
      }
      carry -= physicsStep;
    }
    NO.game.render();
    NO.audio.update(dt);
    if (NO.debugMode) {
      fpsAcc += dt; fpsFrames++;
      if (fpsAcc > 0.5) { fps = Math.round(fpsFrames / fpsAcc); fpsAcc = 0; fpsFrames = 0; }
      const p = NO.game.player;
      $('debug').textContent = [
        'FPS ' + fps,
        'room ' + (NO.game.room ? NO.game.room.id : '-'),
        'player ' + (p ? p.x.toFixed(0) + ',' + p.y.toFixed(0) : '-') + '  vy=' + (p ? p.vy.toFixed(0) : '-') + '  g=' + (p ? p.gravitySign : '-'),
        'tier ' + (p ? NO.util.tierName(p.predictedTier()) : '-') + '  ground=' + (p ? p.onGround : '-'),
        'seals ' + Object.values(NO.game.seals || {}).filter(s => s.active).map(s => s.id).join(',')
      ].join('\n');
    }
    requestAnimationFrame(loop);
  }

  // ------------------------------------------------------------ tests
  function runTests() {
    const out = [];
    let fail = 0;
    const ok = (cond, msg) => { out.push((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fail++; };
    const rooms = NO.DATA.rooms;
    const ids = Object.keys(rooms);
    ok(ids.length === 60, 'total room count is 60 (' + ids.length + ')');
    ok(NO.DATA.main.length === 52, 'main room count is 52 (' + NO.DATA.main.length + ')');
    ok(NO.DATA.optional.length === 8, 'optional room count is 8 (' + NO.DATA.optional.length + ')');
    for (const id of NO.DATA.main) ok(!!rooms[id], 'main room exists: ' + id);
    for (const id of NO.DATA.optional) ok(!!rooms[id], 'optional room exists: ' + id);
    for (const id of ids) {
      const r = rooms[id];
      ok(r.id === id, 'room id matches: ' + id);
      ok(!!r.name && !!r.name.zh && !!r.name.en, 'room name bilingual: ' + id);
      ok(!!r.spawn, 'spawn exists: ' + id);
      ok(Array.isArray(r.platforms) && r.platforms.length > 0, 'platforms exist: ' + id);
      for (const o of r.objects) {
        if (o.type === 'exit') {
          for (const sid of (o.requires && o.requires.seals) || []) ok(!!r.objects.find(x => x.id === sid), id + ' door seal exists: ' + sid);
          for (const sid of (o.requires && o.requires.sensors) || []) ok(!!r.objects.find(x => x.id === sid), id + ' door sensor exists: ' + sid);
          for (const sid of (o.requires && o.requires.anchors) || []) ok(!!r.objects.find(x => x.id === sid), id + ' door anchor exists: ' + sid);
        }
        if (o.type === 'exit' && o.to) ok(!!rooms[o.to], id + ' exit target exists: ' + o.to);
        if (o.type === 'anchor') ok(!!r.objects.find(x => x.id === o.zone), id + ' anchor zone exists: ' + o.zone);
        if (o.type === 'seal' && !o.req) ok(false, id + ' seal req missing: ' + o.id);
      }
      const hints = r.hints || NO.DATA.hintSets[r.hintKey];
      ok(!!hints && hints.length >= 3, 'three hint layers: ' + id);
    }
    // reachability
    const seen = new Set(['hub']);
    const queue = ['hub'];
    while (queue.length) {
      const id = queue.shift();
      const r = rooms[id];
      if (!r) continue;
      for (const o of r.objects) {
        if (o.type === 'exit' && o.to && !seen.has(o.to)) { seen.add(o.to); queue.push(o.to); }
      }
    }
    for (const id of ids) {
      if (id === 'hub') continue;
      ok(seen.has(id), 'reachable from hub: ' + id);
    }
    // save roundtrip
    const st = NO.save.newState(3);
    st.room = 'tide1';
    st.echoes.echo1 = true;
    const text = NO.save.exportText(st);
    let okImport = false;
    try { const st2 = NO.save.importText(text); okImport = st2.room === 'tide1' && st2.echoes.echo1 === true; } catch (e) {}
    ok(okImport, 'save export/import roundtrip');
    // physics smoke test
    try {
      const old = NO.game.room;
      NO.game.loadRoom('tide1', null, { silent: true });
      const p = NO.game.player;
      p.x = 740; p.y = 400; p.vy = 900; p.onGround = false;
      for (let i = 0; i < 40; i++) { NO.game.update(1 / 60); }
      ok(true, 'physics smoke test (no exception)');
      ok(NO.game.seals.t1_s && NO.game.seals.t1_s.active, 'tide1 seal activates on heavy landing');
      NO.game.room = old;
      NO.game.mode = 'title';
      NO.game.paused = false;
    } catch (e) {
      ok(false, 'physics smoke test: ' + e.message);
    }
    // --- mechanic tests ---
    const savedMode = NO.game.mode;
    const savedPaused = NO.game.paused;
    const savedRoom = NO.game.room;
    function testRoom(id, fn) {
      try {
        NO.game.loadRoom(id, null, { silent: true });
        NO.game.mode = 'play';
        NO.game.paused = false;
        fn(NO.game);
      } catch (e) {
        ok(false, 'room test ' + id + ': ' + e.message);
      }
    }
    testRoom('hub', g => {
      g.computeBeams();
      ok(!g.sensors.hub_l1.lit, 'hub light sensor starts dark');
      g.mirrors.find(m => m.id === 'hub_m1').ori = '\\';
      g.computeBeams();
      ok(g.sensors.hub_l1.lit, 'hub sensor lights after mirror turn');
    });
    testRoom('light1', g => {
      g.computeBeams();
      const glass = g.room.platforms.find(p => p.type === 'starGlass');
      ok(!glass.lit, 'light1 bridge starts dark');
      g.mirrors[0].ori = '\\';
      g.computeBeams();
      ok(glass.lit && g.isPlatformSolid(glass), 'light1 bridge solidifies in light');
    });
    testRoom('light3', g => {
      g.mirrors.find(m => m.id === 'l3_m1').ori = '\\';
      g.mirrors.find(m => m.id === 'l3_m2').ori = '/';
      g.computeBeams();
      g.updateSensors(0.016);
      ok(g.sensors.l3_s.active, 'light3 sensor activates with two mirrors');
      const br = g.room.platforms.find(p => p.type === 'bridge');
      ok(br && g.isRequiresMet(br.requires), 'light3 bridge opens');
    });
    testRoom('light5', g => {
      g.mirrors[0].ori = '\\';
      g.computeBeams();
      g.updateSensors(0.016);
      ok(g.sensors.l5_s.active, 'light5 timed sensor activates');
      const br = g.room.platforms.find(p => p.type === 'bridge');
      ok(br && g.isRequiresMet(br.requires), 'light5 timed bridge opens');
    });
    testRoom('grav2', g => {
      const p = g.player;
      p.x = 500 - 12; p.y = 640; p.vy = 0; p.onGround = false;
      for (let i = 0; i < 90; i++) g.update(1 / 60);
      ok(g.seals.g2_s.active, 'grav2 ceiling seal activates from a long fall');
    });
    testRoom('grav4', g => {
      const p = g.player;
      p.x = 300 - 12; p.y = 590; p.vy = 950; p.onGround = false;
      for (let i = 0; i < 30; i++) g.update(1 / 60);
      const z = g.zones.find(z => z.id === 'g4_z');
      ok(g.anchors.find(a => a.id === 'g4_a').used, 'grav4 anchor is struck');
      ok(z && z.dir === -1, 'grav4 anchor flips gravity zone');
    });
    testRoom('tide4', g => {
      const fp = g.room.platforms.find(p => p.type === 'fragile');
      const p = g.player;
      p.x = fp.x + 10; p.y = fp.y - p.h; p.vy = 900;
      g.handleLanding(p, 1000, { source: fp, x: fp.x, y: fp.y, w: fp.w, h: fp.h });
      ok(fp.broken, 'fragile platform breaks on a heavy landing');
    });
    testRoom('tide3', g => {
      const p = g.player;
      p.x = 850 - 12; p.y = 500; p.vy = 900; p.onGround = false;
      for (let i = 0; i < 40; i++) g.update(1 / 60);
      ok(g.seals.t3_b.active, 'tide3 bell rings on a heavy landing');
      ok(g.isRequiresMet(g.exits.find(e => e.to === 'tide4').requires), 'tide3 door opens after bell');
    });
    testRoom('final_choice', g => {
      const e = g.exits.find(x => x.ending === 'eighth');
      ok(!!e, 'final choice has an eighth-star ending');
      const backup = NO.state.echoes;
      NO.state.echoes = {};
      ok(!g.isRequiresMet(e.requires), 'eighth-star ending is locked without echoes');
      NO.state.echoes = { a: 1, b: 1, c: 1, d: 1, e: 1, f: 1, g: 1, h: 1 };
      ok(g.isRequiresMet(e.requires), 'eighth-star ending unlocks with eight echoes');
      NO.state.echoes = backup;
    });
    testRoom('tide1', g => {
      const ex = g.exits.find(x => x.to === 'tide2');
      ok(!!ex && !!ex.requires && (ex.requires.seals || []).indexOf('t1_s') >= 0, 'tide2 exit is locked behind tide1 door');
    });
    testRoom('hub', g => {
      const shortcut = g.exits.find(x => x.to === 'tide7');
      NO.state.sigils = { tide: false, light: false, gravity: false };
      ok(!g.isRequiresMet(shortcut.requires), 'tide shortcut locked before sigil');
      NO.state.sigils.tide = true;
      ok(g.isRequiresMet(shortcut.requires), 'tide shortcut opens with sigil');
      const finale = g.exits.find(x => x.to === 'final_gate');
      NO.state.sigils = { tide: true, light: true, gravity: true };
      ok(g.isRequiresMet(finale.requires), 'finale opens with three sigils');
      NO.state.sigils = { tide: true, light: true, gravity: false };
      ok(!g.isRequiresMet(finale.requires), 'finale stays locked with two sigils');
      NO.state.sigils = { tide: true, light: true, gravity: true };
    });
    NO.game.loadRoom('hub', null, { silent: true });
    NO.game.mode = savedMode;
    NO.game.paused = savedPaused;
    NO.game.room = savedRoom;
    out.push('');
    out.push(fail ? ('RESULT FAIL ' + fail) : 'RESULT PASS');
    const pre = $('test-results');
    pre.textContent = out.join('\n');
    pre.classList.remove('hidden');
    document.title = (fail ? 'FAIL ' : 'PASS ') + 'Night Observatory Tests';
    console.log(out.join('\n'));
  }
  NO.runTests = runTests;

  // expose for CDP/debug
  window.NO = NO;

  boot();
  requestAnimationFrame(loop);
})();
