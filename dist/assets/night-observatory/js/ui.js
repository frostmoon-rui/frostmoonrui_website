(function () {
  'use strict';
  const NO = window.NO = window.NO || {};
  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  class UI {
    constructor() {
      this.el = {};
      this.slotMode = 'load';
      this.hintLayer = 0;
      this.currentHint = null;
      this.dialogueLines = [];
      this.dialogueIndex = 0;
      this.dialogueTyping = null;
      this.dialogueCallback = null;
      this.dialogueFull = '';
      this.settingsReturn = 'title';
      this.toastTimer = null;
      this.autoSaveTimer = null;
      this._bind();
      this.applyI18n();
      this.renderLanguagePills();
      this.applySettingsUI();
      this.checkOrientation();
    }

    // ---------- i18n ----------
    applyI18n() {
      for (const el of $$('[data-i18n]')) {
        const key = el.getAttribute('data-i18n');
        const val = NO.t(key);
        if (el.tagName === 'OPTION') el.textContent = val;
        else el.textContent = val;
      }
      const langSel = $('set-language');
      if (langSel) {
        langSel.innerHTML = '';
        for (const l of NO.LANGS) {
          const o = document.createElement('option');
          o.value = l;
          o.textContent = NO.LANG_NAMES[l];
          if (l === NO.lang) o.selected = true;
          langSel.appendChild(o);
        }
      }
      document.documentElement.lang = NO.lang === 'zh' ? 'zh-CN' : NO.lang;
    }

    renderLanguagePills() {
      const wrap = $('lang-switch');
      if (!wrap) return;
      wrap.innerHTML = '';
      for (const l of NO.LANGS) {
        const b = document.createElement('button');
        b.className = 'lang-pill' + (l === NO.lang ? ' active' : '');
        b.textContent = NO.LANG_NAMES[l];
        b.addEventListener('click', () => {
          NO.setLang(l);
          NO.settings.lang = l;
          if (NO.save) NO.save.saveSettings(NO.settings);
          this.applyI18n();
          this.renderLanguagePills();
          this.applySettingsUI();
          this.refreshHud();
          if (NO.onLanguageChange) NO.onLanguageChange();
        });
        wrap.appendChild(b);
      }
    }

    // ---------- loading ----------
    showLoading() {
      $('loading').classList.remove('hidden');
      $('title').classList.add('hidden');
      $('slots').classList.add('hidden');
      $('hud').classList.add('hidden');
    }

    updateLoading(progress, label, pct, tip) {
      progress = Math.max(0, Math.min(1, progress));
      $('load-bar').style.width = (progress * 100).toFixed(1) + '%';
      $('load-pct').textContent = pct == null ? Math.round(progress * 100) + '%' : pct;
      if (label) $('load-step').textContent = label;
      if (tip) $('load-tip').textContent = tip;
    }

    drawLoader(progress, t) {
      const c = $('orrery');
      if (!c) return;
      const ctx = c.getContext('2d');
      const w = c.width, h = c.height;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      const r = 105;
      // soft stars
      for (let i = 0; i < 36; i++) {
        const a = i * 2.399 + t * 0.08;
        const rr = 60 + (i * 37) % 130;
        ctx.globalAlpha = 0.15 + (i % 5) * 0.04;
        ctx.fillStyle = i % 3 ? '#ece7da' : '#f2b56b';
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 0.7 + (i % 3) * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // rings
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.12);
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = ['rgba(242,181,107,.34)', 'rgba(99,226,208,.26)', 'rgba(219,147,172,.20)'][i];
        ctx.lineWidth = i === 0 ? 1.5 : 1;
        ctx.beginPath();
        ctx.ellipse(0, 0, r - i * 24, (r - i * 24) * (0.34 + i * 0.05), i * 0.9 + t * 0.05, 0, Math.PI * 2);
        ctx.stroke();
      }
      // planets
      for (let i = 0; i < 5; i++) {
        const a = t * (0.18 + i * 0.045) + i * 1.7;
        const rr = r - (i % 3) * 24;
        ctx.fillStyle = i % 2 ? '#63e2d0' : '#f2b56b';
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr * 0.42, 2.2 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // moon
      const mg = ctx.createRadialGradient(0, 0, 2, 0, 0, 44);
      mg.addColorStop(0, 'rgba(255,247,230,.98)');
      mg.addColorStop(0.5, 'rgba(242,181,107,.68)');
      mg.addColorStop(1, 'rgba(242,181,107,0)');
      ctx.fillStyle = mg;
      ctx.beginPath(); ctx.arc(0, 0, 44, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f7f0e2';
      ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(120,130,150,.18)';
      ctx.beginPath(); ctx.arc(-6, -5, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(7, 6, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // progress arc
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = 'rgba(236,231,218,.10)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, r + 22, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#f2b56b';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = 'rgba(242,181,107,.6)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, r + 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.stroke();
      ctx.restore();
    }

    // ---------- title / slots ----------
    showTitle() {
      this.hideAllOverlays();
      $('loading').classList.add('hidden');
      $('title').classList.remove('hidden');
      $('hud').classList.add('hidden');
      $('touch').classList.add('hidden');
      this.updateContinueButton();
      this.renderLanguagePills();
      this.applyI18n();
    }

    updateContinueButton() {
      const btn = $('btn-continue');
      if (!btn) return;
      const slots = NO.save ? NO.save.list() : [];
      const has = slots.some(Boolean);
      btn.disabled = !has;
      btn.style.opacity = has ? '' : '.38';
      btn.style.pointerEvents = has ? '' : 'none';
    }

    openSlots(mode) {
      this.slotMode = mode || 'load';
      $('title').classList.add('hidden');
      $('slots').classList.remove('hidden');
      this.renderSlots();
    }

    renderSlots() {
      const wrap = $('slot-list');
      if (!wrap) return;
      const slots = NO.save ? NO.save.list() : [null, null, null];
      wrap.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const st = slots[i];
        const card = document.createElement('div');
        card.className = 'slot-card' + (st ? '' : ' empty');
        if (st) {
          const room = NO.DATA.rooms[st.room];
          const roomName = room ? NO.L(room.name) : (st.room || '');
          const sig = st.sigils || {};
          const sigCount = ['tide', 'light', 'gravity'].filter(k => sig[k]).length;
          const echoCount = Object.keys(st.echoes || {}).length;
          card.innerHTML = `
            <div>
              <div class="slot-title">${this.esc(NO.t('slot_title', { n: i + 1 }))}<span style="font-size:11px;color:var(--dim);font-family:var(--font-ui);letter-spacing:.08em">${this.esc(roomName)}</span></div>
              <div class="slot-meta">${this.esc(NO.t('slot_playtime'))} · ${NO.formatTime(st.playtime)}<br>${this.esc(NO.t('slot_sigils'))} ${sigCount}/3 · ${this.esc(NO.t('slot_echoes'))} ${echoCount}/8 · ${this.esc(NO.t('slot_updated'))} ${this.esc(this.formatDate(st.updatedAt))}</div>
              <div class="slot-icons">${['tide', 'light', 'gravity'].map((k, j) => `<span style="opacity:${sig[k] ? 1 : .25}">${['Ⅰ', 'Ⅱ', 'Ⅲ'][j]} ${this.esc(this.sigilName(k))}</span>`).join('')}${st.ending ? ` <span style="color:var(--rose)">✦ ${this.esc(this.endingName(st.ending))}</span>` : ''}</div>
            </div>
            <div class="slot-actions">
              <button class="btn small primary" data-act="play">${this.esc(NO.t('slot_continue'))}</button>
              <button class="btn small ghost" data-act="delete">${this.esc(NO.t('slot_delete'))}</button>
            </div>`;
        } else {
          card.innerHTML = `
            <div>
              <div class="slot-title">${this.esc(NO.t('slot_title', { n: i + 1 }))}<span style="font-size:11px;color:var(--dim);font-family:var(--font-ui);letter-spacing:.08em">${this.esc(NO.t('slot_empty'))}</span></div>
              <div class="slot-meta">${this.esc(NO.t('slot_new'))}</div>
            </div>
            <div class="slot-actions">
              <button class="btn small primary" data-act="new">${this.esc(NO.t('new_game'))}</button>
            </div>`;
        }
        card.querySelectorAll('[data-act]').forEach(btn => {
          btn.addEventListener('click', () => {
            const act = btn.getAttribute('data-act');
            if (act === 'play') {
              NO.actions.startFromSlot(i + 1);
            } else if (act === 'new') {
              if (st && !confirm(NO.t('confirm_overwrite'))) return;
              NO.actions.newGame(i + 1);
            } else if (act === 'delete') {
              if (!confirm(NO.t('confirm_delete'))) return;
              NO.save.remove(i + 1);
              this.renderSlots();
              this.updateContinueButton();
            }
          });
        });
        wrap.appendChild(card);
      }
    }

    formatDate(ts) {
      if (!ts) return '—';
      try { return new Date(ts).toLocaleDateString(); } catch (e) { return '—'; }
    }

    sigilName(k) {
      return NO.L(NO.DATA.wings.find(w => w.id === k) ? NO.DATA.wings.find(w => w.id === k).name : { zh: k, en: k, ru: k, ja: k });
    }

    endingName(id) {
      const e = NO.DATA.story.endings[id];
      return e ? NO.L(e.title) : id;
    }

    // ---------- hud ----------
    setPlaying(on) {
      $('app').classList.toggle('playing', on);
      $('app').classList.toggle('compact-touch', this.shouldShowTouch());
      if (!on) this.releaseControls?.();
      $('hud').classList.toggle('hidden', !on);
      $('touch').classList.toggle('hidden', !on || !this.shouldShowTouch());
      if (!on) $('touch').classList.add('hidden');
    }

    onRoomChange(room) {
      this.setPlaying(true);
      this.refreshHud();
      this.updateObjective();
      if (room && room.bg && NO.audio) NO.audio.setMode(room.bg === 'final' ? 'final' : room.bg);
    }

    refreshHud() {
      const st = NO.state;
      if (!st || !NO.DATA) return;
      const room = NO.DATA.rooms[st.room];
      if (room) {
        $('hud-room').textContent = NO.L(room.name);
        const wing = NO.DATA.wings.find(w => w.id === room.wing);
        if (room.wing === 'hub') {
          $('hud-wing').textContent = NO.L({ zh: '中庭 · ATRIUM', en: 'ATRIUM', ru: 'АТРИУМ', ja: 'アトリウム' });
        } else {
          $('hud-wing').textContent = wing ? NO.L(wing.name).toUpperCase() : '';
        }
      }
      const sig = st.sigils || {};
      $('hud-sigils').innerHTML = ['tide', 'light', 'gravity'].map((k) => {
        const on = sig[k] ? ' on' : '';
        const cls = k === 'tide' ? 'impact' : k === 'light' ? 'light' : 'gravity';
        return `<div class="sigil ${cls}${on}" title="${this.esc(this.sigilName(k))}">${k === 'tide' ? 'Ⅰ' : k === 'light' ? 'Ⅱ' : 'Ⅲ'}</div>`;
      }).join('');
      this.updateObjective();
    }

    updateObjective() {
      const el = $('hud-objective');
      if (!el) return;
      const st = NO.state;
      if (!st) { el.textContent = ''; return; }
      const echoCount = Object.keys(st.echoes || {}).length;
      const sig = st.sigils || {};
      const sigCount = ['tide', 'light', 'gravity'].filter(k => sig[k]).length;
      let text = '';
      if (st.room === 'hub') {
        if (sigCount < 3) text = NO.L({ zh: `三翼的符印 ${sigCount}/3 · 回声 ${echoCount}/8`, en: `Sigils ${sigCount}/3 · Echoes ${echoCount}/8`, ru: `Печати ${sigCount}/3 · Эхо ${echoCount}/8`, ja: `印章 ${sigCount}/3 · 響き ${echoCount}/8` });
        else text = NO.L({ zh: '星图仪的门已经打开。', en: 'The Orrery is open.', ru: 'Планетарий открыт.', ja: '星図儀が開いている。' });
      } else if (NO.DATA.rooms[st.room]) {
        const room = NO.DATA.rooms[st.room];
        if (room.wing === 'final') text = NO.L({ zh: '把光、方向、力度叠在一起。', en: 'Layer light, direction and impact.', ru: 'Сложи свет, направление и импульс.', ja: '光、向き、衝撃を重ねる。' });
        else if (room.wing === 'tide') text = NO.L({ zh: '重落给封印供能；缓冲让薄冰活下来。', en: 'Heavy landings power seals; brace keeps thin ice alive.', ru: 'Тяжёлые приземления питают печати; торможение спасает тонкий лёд.', ja: '重い着地は封印を灯し、ブレーキは薄氷を守る。' });
        else if (room.wing === 'light') text = NO.L({ zh: '光让星玻璃变实；影子让它消失。', en: 'Light solidifies star glass; shadow dissolves it.', ru: 'Свет уплотняет звёздное стекло; тень растворяет его.', ja: '光は星ガラスを実体にし、影はそれを溶かす。' });
        else if (room.wing === 'gravity') text = NO.L({ zh: '箭头指向“下”。跳跃永远朝反方向。', en: 'The arrow is “down”. Jump the other way.', ru: 'Стрелка — это «низ». Прыжок — в обратную сторону.', ja: '矢印が「下」。ジャンプは逆方向。' });
      }
      el.textContent = text;
    }

    updateHudTime(game) {
      // reserved for a timer display; the HUD intentionally stays quiet
    }

    setAutosave() {
      const el = $('autosave');
      if (!el) return;
      el.classList.remove('hidden');
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = setTimeout(() => el.classList.add('hidden'), 1300);
    }

    toast(msg) {
      const el = $('toast');
      if (!el) return;
      el.textContent = msg;
      el.classList.remove('hidden');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
    }

    showSubtitle(name) {
      if (!NO.settings || NO.settings.subtitles === false) return;
      const el = $('subtitle');
      if (!el) return;
      const key = 'cue_' + name;
      const text = NO.t(key);
      if (!text || text === key) return;
      el.textContent = '♪ ' + text;
      el.classList.remove('hidden');
      clearTimeout(this.subtitleTimer);
      this.subtitleTimer = setTimeout(() => el.classList.add('hidden'), 1900);
    }

    setInteractAvailable(on, label) {
      const btn = $('btn-touch-interact');
      if (!btn) return;
      btn.classList.toggle('hidden', !on || !this.shouldShowTouch());
      btn.setAttribute('aria-label', label || 'Interact');
    }

    // ---------- hint ----------
    openHint() {
      this.releaseControls?.();
      if (NO.settings && NO.settings.hints === false) { this.toast(NO.t('toast_hint_locked')); return; }
      const room = NO.DATA.rooms[NO.state.room];
      if (!room) return;
      this.hintResume = !!(NO.game && NO.game.mode === 'play' && !NO.game.paused);
      if (NO.game && NO.game.mode === 'play') NO.game.paused = true;
      this.currentHint = room.hints || NO.DATA.hintSets[room.hintKey] || NO.DATA.hintSets.hard;
      this.hintLayer = 0;
      $('hint-panel').classList.remove('hidden');
      this.renderHint();
      if (NO.audio) NO.audio.play('ui');
    }

    closeHint() {
      $('hint-panel').classList.add('hidden');
      this.currentHint = null;
      if (this.hintResume && NO.game && NO.game.mode === 'play') NO.game.paused = false;
      this.hintResume = false;
    }

    renderHint() {
      if (!this.currentHint) return;
      const layer = Math.min(this.hintLayer, this.currentHint.length - 1);
      const item = this.currentHint[layer];
      const body = $('hint-body');
      body.innerHTML = `<div class="hint-layer">${this.esc(['观察', '原理', '步骤'][layer] ? NO.L({ zh: ['观察', '原理', '步骤'][layer], en: ['OBSERVE', 'PRINCIPLE', 'STEPS'][layer], ru: ['НАБЛЮДЕНИЕ', 'ПРИНЦИП', 'ШАГИ'][layer], ja: ['観察', '原理', '手順'][layer] }) : '')} · ${layer + 1}/3</div>${this.esc(NO.L(item))}`;
      $('btn-hint-more').textContent = layer >= this.currentHint.length - 1 ? NO.t('done') : NO.t('hint_more');
      $('btn-hint-more').disabled = layer >= this.currentHint.length - 1;
      $('btn-hint-more').style.opacity = layer >= this.currentHint.length - 1 ? '.4' : '';
    }

    // ---------- dialogue ----------
    showDialogue(lines, onClose) {
      if (!lines || !lines.length) { if (onClose) onClose(); return; }
      this.dialogueLines = lines;
      this.dialogueIndex = 0;
      this.dialogueCallback = onClose || null;
      this.dialogueResume = NO.game && !NO.game.paused && NO.game.mode === 'play';
      if (NO.game && NO.game.mode === 'play') NO.game.paused = true;
      $('dialogue').classList.remove('hidden');
      this.renderDialogueLine();
    }

    renderDialogueLine() {
      const line = this.dialogueLines[this.dialogueIndex];
      if (!line) { this.closeDialogue(); return; }
      let speaker = '';
      if (line.title) speaker = NO.L(line.title);
      else if (line.speaker === 'conductor') speaker = NO.L({ zh: '指挥家', en: 'The Conductor', ru: 'Дирижёр', ja: '指揮者' });
      else if (line.speaker === 'watchman') speaker = NO.L({ zh: '守夜人', en: 'The Watchman', ru: 'Ночной страж', ja: '夜番' });
      else if (line.speaker === 'echo') speaker = NO.L({ zh: '回声', en: 'Echo', ru: 'Эхо', ja: '響き' });
      else speaker = NO.L({ zh: '指挥家', en: 'The Conductor', ru: 'Дирижёр', ja: '指揮者' });
      $('dialogue-speaker').textContent = speaker;
      const text = NO.L(line.text);
      this.dialogueFull = text;
      const el = $('dialogue-text');
      el.textContent = '';
      if (this.dialogueTyping) clearInterval(this.dialogueTyping);
      let i = 0;
      this.dialogueTyping = setInterval(() => {
        i += 2;
        el.textContent = text.slice(0, i);
        if (i >= text.length) {
          clearInterval(this.dialogueTyping);
          this.dialogueTyping = null;
          el.textContent = text;
        }
      }, 14);
      const dots = $('dialogue-dots');
      dots.innerHTML = this.dialogueLines.map((_, j) => `<i class="${j <= this.dialogueIndex ? 'on' : ''}"></i>`).join('');
    }

    advanceDialogue() {
      if (this.dialogueTyping) {
        clearInterval(this.dialogueTyping);
        this.dialogueTyping = null;
        $('dialogue-text').textContent = this.dialogueFull;
        return;
      }
      this.dialogueIndex++;
      if (this.dialogueIndex >= this.dialogueLines.length) this.closeDialogue();
      else this.renderDialogueLine();
    }

    closeDialogue() {
      if (this.dialogueTyping) { clearInterval(this.dialogueTyping); this.dialogueTyping = null; }
      $('dialogue').classList.add('hidden');
      const cb = this.dialogueCallback;
      this.dialogueCallback = null;
      this.dialogueLines = [];
      if (this.dialogueResume && NO.game && NO.game.mode === 'play' && !NO.game.dead) {
        NO.game.paused = false;
      }
      this.dialogueResume = false;
      if (cb) cb();
    }

    // ---------- settings ----------
    openSettings(from) {
      this.releaseControls?.();
      this.settingsReturn = from || 'title';
      if (from === 'pause') $('pause').classList.add('hidden');
      this.applySettingsUI();
      $('settings-screen').classList.remove('hidden');
    }

    closeSettings() {
      $('settings-screen').classList.add('hidden');
      if (this.settingsReturn === 'pause' && NO.game && NO.game.mode === 'play') {
        $('pause').classList.remove('hidden');
      }
    }

    applySettingsUI() {
      const s = NO.settings || {};
      const set = (id, v) => { const el = $(id); if (el) el.value = v; };
      const out = (id, v) => { const el = $(id); if (el) el.textContent = v; };
      set('set-music', s.music == null ? 65 : s.music); out('out-music', s.music == null ? 65 : s.music);
      set('set-sfx', s.sfx == null ? 80 : s.sfx); out('out-sfx', s.sfx == null ? 80 : s.sfx);
      set('set-ambient', s.ambient == null ? 55 : s.ambient); out('out-ambient', s.ambient == null ? 55 : s.ambient);
      set('set-shake', s.shake == null ? 60 : s.shake); out('out-shake', s.shake == null ? 60 : s.shake);
      set('set-buttons', s.buttonSize == null ? 100 : s.buttonSize); out('out-buttons', (s.buttonSize == null ? 100 : s.buttonSize) + '%');
      const reduce = $('set-reduce'); if (reduce) reduce.checked = !!s.reduceMotion;
      const contrast = $('set-contrast'); if (contrast) contrast.checked = !!s.highContrast;
      const subtitles = $('set-subtitles'); if (subtitles) subtitles.checked = s.subtitles !== false;
      const hints = $('set-hints'); if (hints) hints.checked = s.hints !== false;
      const side = $('set-side'); if (side) side.value = s.controlSide || 'right';
      const lang = $('set-language'); if (lang) lang.value = NO.lang;
      this.applySettingsClasses();
    }

    applySettingsClasses() {
      const s = NO.settings || {};
      document.body.classList.toggle('high-contrast', !!s.highContrast);
      document.body.classList.toggle('reduce-motion', !!s.reduceMotion);
      const scale = (s.buttonSize == null ? 100 : s.buttonSize) / 100;
      document.documentElement.style.setProperty('--btn-scale', scale);
      const touch = $('touch');
      if (touch) {
        touch.classList.toggle('left-handed', (s.controlSide || 'right') === 'left');
        touch.classList.toggle('hidden', !this.shouldShowTouch());
      }
    }

    readSettingsFromUI() {
      const s = NO.settings;
      s.music = parseInt($('set-music').value, 10);
      s.sfx = parseInt($('set-sfx').value, 10);
      s.ambient = parseInt($('set-ambient').value, 10);
      s.shake = parseInt($('set-shake').value, 10);
      s.buttonSize = parseInt($('set-buttons').value, 10);
      s.reduceMotion = $('set-reduce').checked;
      s.highContrast = $('set-contrast').checked;
      s.subtitles = $('set-subtitles').checked;
      s.hints = $('set-hints').checked;
      s.controlSide = $('set-side').value;
      const out = (id, v) => { const el = $(id); if (el) el.textContent = v; };
      out('out-music', s.music);
      out('out-sfx', s.sfx);
      out('out-ambient', s.ambient);
      out('out-shake', s.shake);
      out('out-buttons', s.buttonSize + '%');
      const nextLang = $('set-language').value;
      const langChanged = nextLang !== NO.lang;
      s.lang = nextLang;
      if (langChanged) {
        NO.setLang(s.lang);
        this.applyI18n();
        this.renderLanguagePills();
        this.refreshHud();
      }
      if (NO.save) NO.save.saveSettings(s);
      if (NO.audio) NO.audio.setSettings(s);
      this.applySettingsClasses();
      if (NO.game) NO.game.settings = s;
    }

    // ---------- map ----------
    openMap() {
      this.releaseControls?.();
      if (NO.game && NO.game.mode === 'play') { NO.game.paused = true; }
      $('pause').classList.add('hidden');
      $('map-screen').classList.remove('hidden');
      this.renderMap();
    }

    renderMap() {
      const body = $('map-body');
      if (!body) return;
      const st = NO.state;
      const visited = st.visited || {};
      const current = st.room;
      const echoes = st.echoes || {};
      body.innerHTML = '';
      for (const wing of NO.DATA.wings) {
        const rooms = Object.values(NO.DATA.rooms).filter(r => r.wing === wing.id && !r.hiddenRoom);
        if (!rooms.length) continue;
        const group = document.createElement('div');
        group.className = 'map-wing';
        const head = document.createElement('div');
        head.className = 'map-wing-head';
        head.innerHTML = `<div class="map-wing-name">${this.esc(NO.L(wing.name))}</div><div class="map-wing-sub">${wing.id.toUpperCase()}</div>`;
        group.appendChild(head);
        const grid = document.createElement('div');
        grid.className = 'map-rooms';
        for (const r of rooms) {
          const seen = !!visited[r.id];
          const optional = (NO.DATA.optional || []).includes(r.id);
          const el = document.createElement('div');
          el.className = 'map-room' + (seen ? ' visited' : ' unseen') + (r.id === current ? ' current' : '') + (optional ? ' optional' : '');
          el.textContent = NO.L(r.name);
          el.title = seen ? NO.L(r.name) : (NO.L({ zh: '未探索', en: 'Unexplored', ru: 'Не изучено', ja: '未探索' }));
          if (optional && seen) {
            const mark = document.createElement('span');
            mark.className = 'echo-mark';
            mark.textContent = '✦';
            el.appendChild(mark);
          }
          grid.appendChild(el);
        }
        group.appendChild(grid);
        body.appendChild(group);
      }
    }

    closeMap() {
      $('map-screen').classList.add('hidden');
      if (NO.game && NO.game.mode === 'play') NO.game.paused = false;
    }

    // ---------- pause ----------
    openPause() {
      this.releaseControls?.();
      if (!NO.game || NO.game.mode !== 'play') return;
      NO.game.paused = true;
      $('pause').classList.remove('hidden');
      $('touch').classList.add('hidden');
    }

    closePause() {
      $('pause').classList.add('hidden');
      if (NO.game && NO.game.mode === 'play' && !$('dialogue').classList.contains('hidden')) return;
      if (NO.game && NO.game.mode === 'play') NO.game.paused = false;
      this.setPlaying(true);
    }

    // ---------- ending ----------
    showEnding(id, game) {
      const data = NO.DATA.story.endings[id];
      if (!data) return;
      NO.state.ending = id;
      NO.state.endings = NO.state.endings || {};
      NO.state.endings[id] = true;
      if (NO.requestSave) NO.requestSave('ending');
      if (game) game.paused = true;
      $('hud').classList.add('hidden');
      $('touch').classList.add('hidden');
      $('ending-title').textContent = NO.L(data.title);
      $('ending-text').textContent = NO.L(data.body);
      const st = NO.state;
      const echoCount = Object.keys(st.echoes || {}).length;
      const sigCount = ['tide', 'light', 'gravity'].filter(k => (st.sigils || {})[k]).length;
      const endingCount = Object.keys(st.endings || {}).length;
      $('ending-stats').innerHTML = `
        <div><b>${NO.formatTime(st.playtime)}</b>${this.esc(NO.t('stat_time'))}</div>
        <div><b>${echoCount}/8</b>${this.esc(NO.t('stat_echoes'))}</div>
        <div><b>${sigCount}/3</b>${this.esc(NO.t('stat_sigils'))}</div>
        <div><b>${endingCount}/3</b>${this.esc(NO.t('stat_endings'))}</div>`;
      $('ending').classList.remove('hidden');
      if (NO.audio) NO.audio.setMode('final');
    }

    closeEnding() { $('ending').classList.add('hidden'); }

    // ---------- opening ----------
    showOpening(onDone) {
      $('opening').classList.remove('hidden');
      $('hud').classList.add('hidden');
      $('touch').classList.add('hidden');
      if (NO.game) NO.game.paused = true;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        $('opening').classList.add('hidden');
        if (NO.game) NO.game.paused = false;
        this.setPlaying(true);
        if (onDone) onDone();
      };
      $('btn-skip-opening').onclick = finish;
      setTimeout(finish, 5200);
    }

    // ---------- touch/orientation ----------
    shouldShowTouch() {
      if (NO.settings && NO.settings.showTouch === 'off') return false;
      if (NO.settings && NO.settings.showTouch === 'on') return true;
      return !!(NO.isTouch || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));
    }

    checkOrientation() {
      $('app').classList.toggle('compact-touch', this.shouldShowTouch());
      $('orientation').classList.add('hidden');
    }

    // ---------- helpers ----------
    esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    hideAllOverlays() {
      for (const id of ['slots', 'pause', 'settings-screen', 'map-screen', 'dialogue', 'opening', 'ending', 'orientation']) {
        const el = $(id);
        if (el) el.classList.add('hidden');
      }
      $('hint-panel').classList.add('hidden');
      $('toast').classList.add('hidden');
      $('subtitle').classList.add('hidden');
    }

    // ---------- bindings ----------
    _bind() {
      $('btn-continue').addEventListener('click', () => { if (NO.actions) NO.actions.continueGame(); });
      $('btn-new').addEventListener('click', () => this.openSlots('new'));
      $('btn-load').addEventListener('click', () => this.openSlots('load'));
      $('btn-settings').addEventListener('click', () => this.openSettings('title'));
      $('btn-about').addEventListener('click', () => {
        this.showDialogue([{ speaker: 'conductor', title: NO.t('about_title'), text: NO.t('about_text') }], () => {});
      });

      $$('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-close');
          if (id === 'hint-panel') this.closeHint();
          else if (id === 'settings-screen') this.closeSettings();
          else if (id === 'map-screen') this.closeMap();
          else if (id === 'slots') { $(id).classList.add('hidden'); this.showTitle(); }
          else $(id).classList.add('hidden');
        });
      });

      $('btn-hint').addEventListener('click', () => this.openHint());
      $('btn-map').addEventListener('click', () => this.openMap());
      $('btn-pause').addEventListener('click', () => this.openPause());
      $('btn-fullscreen').addEventListener('click', async () => {
        const app = $('app');
        this.releaseControls?.();
        if (document.fullscreenElement === app) { await document.exitFullscreen(); return; }
        if (app.classList.contains('immersive')) { app.classList.remove('immersive'); return; }
        try {
          if (!app.requestFullscreen) throw new Error('Fullscreen unavailable');
          await app.requestFullscreen();
          try { await screen.orientation?.lock?.('landscape'); } catch (_) {}
        } catch (_) { app.classList.add('immersive'); }
        this.checkOrientation();
      });
      $('btn-hint-more').addEventListener('click', () => {
        if (!this.currentHint) return;
        this.hintLayer = Math.min(this.currentHint.length - 1, this.hintLayer + 1);
        this.renderHint();
        if (NO.audio) NO.audio.play('ui');
      });
      $('btn-hint-show').addEventListener('click', () => {
        if (NO.game && NO.game.pulseHint) NO.game.pulseHint();
        if (NO.audio) NO.audio.play('ui');
      });

      $('btn-resume').addEventListener('click', () => this.closePause());
      $('btn-pause-hint').addEventListener('click', () => { this.closePause(); this.openHint(); });
      $('btn-pause-map').addEventListener('click', () => this.openMap());
      $('btn-pause-settings').addEventListener('click', () => this.openSettings('pause'));
      $('btn-save-export').addEventListener('click', () => { if (NO.actions) NO.actions.exportSave(); });
      $('btn-title').addEventListener('click', () => { if (NO.actions) NO.actions.returnToTitle(); });

      $('btn-settings-done').addEventListener('click', () => this.closeSettings());
      $('btn-import').addEventListener('click', () => NO.actions?.importSave());
      $('btn-import-code').addEventListener('click', () => NO.actions?.restoreSave($('save-code').value));
      $('btn-reset').addEventListener('click', () => {
        if (!confirm(NO.t('confirm_reset'))) return;
        if (NO.save) NO.save.resetAll();
        location.reload();
      });
      for (const id of ['set-music', 'set-sfx', 'set-ambient', 'set-shake', 'set-buttons']) {
        const el = $(id); if (el) el.addEventListener('input', () => this.readSettingsFromUI());
      }
      for (const id of ['set-reduce', 'set-contrast', 'set-subtitles', 'set-hints', 'set-side', 'set-language']) {
        const el = $(id); if (el) el.addEventListener('change', () => this.readSettingsFromUI());
      }

      $('dialogue-next').addEventListener('click', () => this.advanceDialogue());
      $('dialogue').addEventListener('click', (e) => { if (e.target.id === 'dialogue') this.closeDialogue(); });
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (!$('dialogue').classList.contains('hidden')) this.closeDialogue();
          else if (!$('hint-panel').classList.contains('hidden')) this.closeHint();
          else if (!$('map-screen').classList.contains('hidden')) this.closeMap();
          else if (!$('settings-screen').classList.contains('hidden')) this.closeSettings();
          else if (!$('pause').classList.contains('hidden')) this.closePause();
          else if (NO.game && NO.game.mode === 'play' && $('ending').classList.contains('hidden')) this.openPause();
        }
        if (e.key.toLowerCase() === 'h' && NO.game && NO.game.mode === 'play' && !NO.game.paused) this.openHint();
        if (e.key.toLowerCase() === 'm' && NO.game && NO.game.mode === 'play' && !NO.game.paused) this.openMap();
        if (e.key === ' ' && !$('dialogue').classList.contains('hidden')) { e.preventDefault(); this.advanceDialogue(); }
      });

      $('btn-ending-title').addEventListener('click', () => { if (NO.actions) NO.actions.returnToTitle(); });
      $('btn-ending-continue').addEventListener('click', () => { if (NO.actions) NO.actions.continueExplore(); });

      this._bindTouch();
      window.addEventListener('resize', () => this.checkOrientation());
      window.addEventListener('orientationchange', () => setTimeout(() => this.checkOrientation(), 200));
    }

    _bindTouch() {
      const joy = $('joystick');
      const knob = $('joystick-knob');
      if (!joy || !knob) return;
      const pointers = new Map();
      const input = () => NO.game?.input;
      const release = id => {
        const control = pointers.get(id);
        if (!control) return;
        pointers.delete(id);
        control.el.classList.remove('held');
        try {
          if (control.el.hasPointerCapture?.(id)) control.el.releasePointerCapture(id);
        } catch (_) {}
        if (control.action) input()?.releaseVirtual(control.action);
        else {
          knob.style.transform = '';
          input()?.setJoystick(0, 0);
        }
      };
      const clear = () => {
        for (const id of pointers.keys()) release(id);
        input()?.clear();
      };
      const move = event => {
        if (pointers.get(event.pointerId)?.el !== joy) return;
        const bounds = joy.getBoundingClientRect();
        const radius = bounds.width * 0.36;
        if (!radius) return;
        let x = event.clientX - bounds.left - bounds.width / 2;
        let y = event.clientY - bounds.top - bounds.height / 2;
        const distance = Math.hypot(x, y);
        if (distance > radius) { x *= radius / distance; y *= radius / distance; }
        knob.style.transform = `translate(${x}px,${y}px)`;
        input()?.setJoystick(x / radius, y / radius);
      };
      const bind = (el, action) => {
        el.addEventListener('pointerdown', event => {
          event.preventDefault();
          if (event.button !== 0 || NO.game?.paused || [...pointers.values()].some(c => c.el === el)) return;
          pointers.set(event.pointerId, { el, action });
          try { el.setPointerCapture(event.pointerId); } catch (_) {}
          el.classList.add('held');
          if (action) input()?.pressVirtual(action);
          else move(event);
        });
        el.addEventListener('pointerleave', event => {
          if (!el.hasPointerCapture?.(event.pointerId)) release(event.pointerId);
        });
      };
      bind(joy, null);
      bind($('btn-touch-jump'), 'jump');
      bind($('btn-touch-brace'), 'brace');
      bind($('btn-touch-interact'), 'interact');
      joy.addEventListener('pointermove', move);
      for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        window.addEventListener(event, e => release(e.pointerId), true);
      }
      for (const event of ['blur', 'pagehide', 'orientationchange', 'touchcancel']) window.addEventListener(event, clear);
      document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
      document.addEventListener('fullscreenchange', clear);
      $('touch').addEventListener('contextmenu', event => event.preventDefault());
      $('game').addEventListener('contextmenu', event => event.preventDefault());
      this.releaseControls = clear;
    }
  }

  NO.UI = UI;
})();
