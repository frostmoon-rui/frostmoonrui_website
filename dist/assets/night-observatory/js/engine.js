(function () {
  'use strict';
  const NO = window.NO = window.NO || {};
  const VIEW_W = 1280, VIEW_H = 720;
  const GRAVITY = 2250;
  const MOVE_ACC = 3400;
  const MAX_SPEED = 300;
  const FRICTION = 3000;
  const AIR_CONTROL = 0.72;
  const JUMP_SPEED = 770;
  const TERMINAL = 1280;
  const COYOTE = 0.135;
  const JUMP_BUFFER = 0.15;
  const BRACE_MULT = 0.40;
  const HARD = 820;
  const FIRM = 470;
  const STEP = 6;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const approach = (v, target, d) => v < target ? Math.min(v + d, target) : Math.max(v - d, target);
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const dist2 = (a, b) => { const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; };
  const tierRank = (v) => v >= HARD ? 2 : v >= FIRM ? 1 : 0;
  const tierName = (r) => r === 2 ? 'hard' : r === 1 ? 'firm' : 'soft';
  const tierColor = (r) => r === 2 ? '#f2b56b' : r === 1 ? '#ece7da' : '#63e2d0';
  const hash = (n) => { let x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const rand = (seed, i) => hash(seed * 13.37 + i * 91.7);

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function exitFrame(e) {
    const w = Math.min(30, e.w / 2 - 3) * 2;
    const h = Math.min(76, e.h - 3);
    const inverted = e.y === 40;
    return { x: e.x + (e.w - w) / 2, y: inverted ? e.y : e.y + e.h - h, w, h, inverted };
  }

  function pill(ctx, x, y, w, h, fill, stroke) {
    roundRect(ctx, x, y, w, h, h / 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }

  // ---------------------------------------------------------------- Input
  class Input {
    constructor() {
      this.device = null;
      this.keys = new Set();
      this.just = new Set();
      this.released = new Set();
      this.joyX = 0;
      this.joyY = 0;
      this.touch = { jump: false, brace: false, interact: false };
      this.touchJust = new Set();
      this.pad = { axis: 0, jump: false, brace: false, interact: false };
      this.padPrev = { jump: false, brace: false, interact: false };
      this.padJust = new Set();
      this._bind();
    }
    _bind() {
      const prevent = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar'];
      window.addEventListener('keydown', (e) => {
        if (e.repeat || e.target?.matches?.('input, select, textarea, [contenteditable]')) return;
        if (prevent.indexOf(e.key) >= 0) e.preventDefault();
        const k = e.key.toLowerCase();
        if (['a','d','w','s','e','shift','enter',' ','space','arrowleft','arrowright','arrowup','arrowdown'].includes(k)) {
          this.useDevice('keyboard');
        }
        this.keys.add(k);
        this.just.add(k);
      }, { passive: false });
      window.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        this.keys.delete(k);
        this.released.add(k);
      });
      window.addEventListener('blur', () => this.clear());
      window.addEventListener('pagehide', () => this.clear());
      document.addEventListener('visibilitychange', () => { if (document.hidden) this.clear(); });
    }
    clear() {
      this.keys.clear();
      this.just.clear();
      this.released.clear();
      this.touchJust.clear();
      this.touch.jump = this.touch.brace = this.touch.interact = false;
      this.joyX = this.joyY = 0;
    }
    useDevice(device) {
      if (this.device === device) return;
      this.device = device;
      NO.ui?.checkOrientation?.();
      NO.lesson?.refresh();
    }
    pollGamepad() {
      const pads = navigator.getGamepads ? navigator.getGamepads() : null;
      const p = pads ? Array.from(pads).find(Boolean) : null;
      if (!p) {
        this.pad = { axis: 0, jump: false, brace: false, interact: false };
        this.padPrev = { jump: false, brace: false, interact: false };
        return;
      }
      const rawAxis = p.axes && p.axes.length ? p.axes[0] : 0;
      const axis = Math.abs(rawAxis) > 0.18 ? clamp(rawAxis, -1, 1) : 0;
      const btn = (i) => !!(p.buttons && p.buttons[i] && p.buttons[i].pressed);
      const jump = btn(0);
      const brace = btn(1) || btn(2) || btn(6);
      const interact = btn(3);
      if (jump && !this.padPrev.jump) this.padJust.add('jump');
      if (brace && !this.padPrev.brace) this.padJust.add('brace');
      if (interact && !this.padPrev.interact) this.padJust.add('interact');
      if ((axis && !this.pad.axis) || this.padJust.size) this.useDevice('gamepad');
      this.pad = { axis, jump, brace, interact };
      this.padPrev = { jump, brace, interact };
    }
    down(action) {
      switch (action) {
        case 'left': return this.keys.has('a') || this.keys.has('arrowleft') || this.joyX < -0.18 || this.pad.axis < -0.18;
        case 'right': return this.keys.has('d') || this.keys.has('arrowright') || this.joyX > 0.18 || this.pad.axis > 0.18;
        case 'jump': return this.keys.has(' ') || this.keys.has('space') || this.keys.has('w') || this.keys.has('arrowup') || this.touch.jump || this.pad.jump;
        case 'brace': return this.keys.has('s') || this.keys.has('arrowdown') || this.keys.has('shift') || this.touch.brace || this.pad.brace;
        case 'interact': return this.keys.has('e') || this.keys.has('enter') || this.touch.interact || this.pad.interact;
        default: return false;
      }
    }
    pressed(action) {
      switch (action) {
        case 'jump': return this.just.has(' ') || this.just.has('w') || this.just.has('arrowup') || this.touchJust.has('jump') || this.padJust.has('jump');
        case 'interact': return this.just.has('e') || this.just.has('enter') || this.touchJust.has('interact') || this.padJust.has('interact');
        case 'brace': return this.just.has('s') || this.just.has('arrowdown') || this.just.has('shift') || this.touchJust.has('brace') || this.padJust.has('brace');
        default: return false;
      }
    }
    axis() {
      let a = 0;
      if (this.keys.has('a') || this.keys.has('arrowleft') || this.joyX < -0.18 || this.pad.axis < -0.18) a -= 1;
      if (this.keys.has('d') || this.keys.has('arrowright') || this.joyX > 0.18 || this.pad.axis > 0.18) a += 1;
      if (this.joyX < -0.18) a = this.joyX;
      else if (this.joyX > 0.18) a = this.joyX;
      else if (Math.abs(this.pad.axis) > 0.18) a = this.pad.axis;
      return clamp(a, -1, 1);
    }
    pressVirtual(action) {
      this.touchJust.add(action);
      if (action === 'jump' || action === 'brace' || action === 'interact') this.touch[action] = true;
    }
    releaseVirtual(action) {
      if (action === 'jump' || action === 'brace' || action === 'interact') this.touch[action] = false;
    }
    setJoystick(x, y) { this.joyX = x; this.joyY = y; }
    endFrame() {
      this.just.clear();
      this.released.clear();
      this.touchJust.clear();
      this.padJust.clear();
    }
  }

  // ---------------------------------------------------------------- Player
  class Player {
    constructor(game, x, y) {
      this.game = game;
      this.w = 24;
      this.h = 40;
      this.x = x - this.w / 2;
      this.y = y - this.h;
      this.vx = 0;
      this.vy = 0;
      this.onGround = false;
      this.wasOnGround = false;
      this.gravitySign = 1;
      this.facing = 1;
      this.coyote = 0;
      this.jumpBuffer = 0;
      this.bracing = false;
      this.squash = 1;
      this.landSquash = 0;
      this.anim = 0;
      this.landingRect = null;
      this.groundObj = null;
      this.lastImpact = 0;
      this.lastTier = 0;
      this.justLanded = false;
      this.dead = false;
      this.visible = true;
      this.trail = [];
      this.trailTimer = 0;
    }
    get rect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
    get cx() { return this.x + this.w / 2; }
    get cy() { return this.y + this.h / 2; }
    get footY() { return this.gravitySign > 0 ? this.y + this.h : this.y; }
    update(dt) {
      if (this.dead) return;
      this.wasOnGround = this.onGround;
      this.justLanded = false;
      const input = this.game.input;
      const z = this.game.zoneAt(this.cx, this.cy);
      const gs = z ? z.dir : 1;
      if (gs !== this.gravitySign) {
        this.gravitySign = gs;
        this.vx *= 0.4;
        this.game.onGravityChange(this);
      }
      this.bracing = input.down('brace');
      const axis = input.axis();
      const max = MAX_SPEED * (this.bracing && this.onGround ? 0.62 : 1);
      if (Math.abs(axis) > 0.05) {
        this.vx += axis * MOVE_ACC * (this.onGround ? 1 : AIR_CONTROL) * dt;
        if (Math.abs(axis) > 0.2) this.facing = axis > 0 ? 1 : -1;
      } else {
        const f = FRICTION * (this.onGround ? 1 : 0.18) * dt;
        this.vx = approach(this.vx, 0, f);
      }
      this.vx = clamp(this.vx, -max, max);
      this.coyote = this.onGround ? COYOTE : Math.max(0, this.coyote - dt);
      if (input.pressed('jump')) this.jumpBuffer = JUMP_BUFFER;
      else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
      if (this.jumpBuffer > 0 && this.coyote > 0) {
        this.vy = -JUMP_SPEED * this.gravitySign;
        this.onGround = false;
        this.groundObj = null;
        this.jumpBuffer = 0;
        this.coyote = 0;
        this.squash = 0.86;
        this.game.sfx('jump');
        this.game.emitJump(this);
        NO.lesson?.jumped();
      }
      this.vy += GRAVITY * this.gravitySign * dt;
      if (this.vy * this.gravitySign > TERMINAL) this.vy = TERMINAL * this.gravitySign;
      const fallBefore = Math.abs(this.vy);
      const before = this.x;
      this.moveX(this.vx * dt);
      NO.lesson?.moved(this.x - before);
      this.moveY(this.vy * dt, fallBefore);
      this.anim += dt * (this.onGround ? Math.abs(this.vx) / 90 : 1.4);
      this.landSquash = Math.max(0, this.landSquash - dt * 5);
      this.squash = lerp(this.squash, 1, Math.min(1, dt * 10));
      if (this.y > this.game.room.h + 260 || this.y < -260 || this.x < -220 || this.x > this.game.room.w + 220) {
        this.game.kill('fall');
      }
      this.trailTimer -= dt;
      if (!this.onGround && Math.abs(this.vy) > 300 && this.trailTimer <= 0) {
        this.trailTimer = 0.055;
        this.trail.push({ x: this.cx, y: this.cy, life: 0.34 });
      }
      for (const t of this.trail) t.life -= dt;
      this.trail = this.trail.filter(t => t.life > 0);
    }
    sweep(axis, amount) {
      if (!amount) return null;
      const other = axis === 'x' ? 'y' : 'x';
      const size = axis === 'x' ? 'w' : 'h';
      const crossSize = axis === 'x' ? 'h' : 'w';
      const leading = this[axis] + (amount > 0 ? this[size] : 0);
      const target = leading + amount;
      let boundary = target;
      let hit = null;
      for (const r of this.game.solidRects()) {
        if (this[other] >= r[other] + r[crossSize] || this[other] + this[crossSize] <= r[other]) continue;
        const face = r[axis] + (amount < 0 ? r[size] : 0);
        const crossed = amount > 0 ? leading <= face && face < boundary : leading >= face && face > boundary;
        if (crossed) { boundary = face; hit = r; }
      }
      this[axis] = boundary - (amount > 0 ? this[size] : 0);
      return hit;
    }

    moveX(dx) {
      if (this.sweep('x', dx)) this.vx = 0;
    }

    moveY(dy, impact) {
      if (!dy) return;
      const hit = this.sweep('y', dy);
      if (hit) this.vy = 0;
      this.onGround = !!hit && dy * this.gravitySign > 0;
      this.groundObj = this.onGround ? hit.source : null;
      if (this.onGround) {
        this.landingRect = hit;
        this.lastImpact = impact;
        this.justLanded = !this.wasOnGround;
      }
    }

    clearEmbedding() {
      const solids = this.game.solidRects();
      const body = this.rect;
      const inside = solids.filter(rect => overlap(body, rect));
      if (!inside.length) return true;
      const candidates = inside.flatMap(rect => [
        { x: rect.x - this.w, y: this.y }, { x: rect.x + rect.w, y: this.y },
        { x: this.x, y: rect.y - this.h }, { x: this.x, y: rect.y + rect.h },
      ]);
      candidates.sort((a,b) => dist2(a,this) - dist2(b,this));
      for (const candidate of candidates) {
        const box = { ...candidate, w: this.w, h: this.h };
        if (box.x < 0 || box.x + box.w > this.game.room.w || box.y < 0) continue;
        if (solids.some(rect => overlap(box,rect))) continue;
        if (candidate.x !== this.x) this.vx = 0;
        if (candidate.y !== this.y) {
          this.vy = 0;
          this.onGround = false;
          this.groundObj = null;
        }
        this.x = candidate.x;
        this.y = candidate.y;
        return true;
      }
      return false;
    }

    predictedTier() {
      const v = Math.abs(this.vy) * (this.bracing ? BRACE_MULT : 1);
      return tierRank(v);
    }
  }

  // ---------------------------------------------------------------- Game
  class Game {
    constructor(canvas, state) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.state = state;
      this.input = new Input();
      this.settings = NO.settings || {};
      this.mode = 'title';
      this.room = null;
      this.player = null;
      this.cam = { x: 0, y: 0 };
      this.time = 0;
      this.roomTime = 0;
      this.titleTime = 0;
      this.particles = [];
      this.shake = 0;
      this.fade = 0;
      this.fading = null;
      this.pendingRoom = null;
      this.dead = false;
      this.deadTimer = 0;
      this.paused = false;
      this.transition = null;
      this.seals = {};
      this.sensors = {};
      this.mirrors = [];
      this.lamps = [];
      this.zones = [];
      this.anchors = [];
      this.echoes = [];
      this.exits = [];
      this.signs = [];
      this.movers = [];
      this.beams = [];
      this.prompt = null;
      this.roomStars = [];
      this.stars = this.makeStars(41);
      this._lastUiSecond = 0;
      this._solidCache = null;
      this._beamsDirty = true;
      this.hintPulse = 0;
      this.hintPulseTargets = [];
    }

    makeStars(seed) {
      const arr = [];
      for (let i = 0; i < 190; i++) {
        arr.push({
          x: rand(seed, i) * 1600,
          y: rand(seed + 7, i) * 620,
          r: 0.5 + rand(seed + 3, i) * 1.7,
          p: rand(seed + 11, i) * Math.PI * 2,
          s: 0.4 + rand(seed + 19, i) * 1.8
        });
      }
      return arr;
    }

    // ---- room lifecycle ----
    loadRoom(id, spawn, opts) {
      const src = NO.DATA.rooms[id];
      if (!src) { console.error('Unknown room', id); return; }
      const room = JSON.parse(JSON.stringify(src));
      room.platforms = room.platforms.map(p => Object.assign({}, p, { lit: false, broken: false }));
      this.room = room;
      this.roomTime = 0;
      this.seals = {};
      this.sensors = {};
      this.mirrors = [];
      this.lamps = [];
      this.zones = [];
      this.anchors = [];
      this.echoes = [];
      this.exits = [];
      this.signs = [];
      this.movers = [];
      this.beams = [];
      this.particles = [];
      this.prompt = null;
      this.shake = 0;
      this.dead = false;
      this.deadTimer = 0;
      this._solidCache = null;
      this._beamsDirty = true;
      this._exitState = {};
      this.hintPulse = 0;
      this.hintPulseTargets = [];
      for (const o of room.objects) {
        if (o.type === 'seal') this.seals[o.id] = o;
        else if (o.type === 'sensor') this.sensors[o.id] = o;
        else if (o.type === 'mirror') this.mirrors.push(o);
        else if (o.type === 'lamp') this.lamps.push(o);
        else if (o.type === 'zone') this.zones.push(o);
        else if (o.type === 'anchor') this.anchors.push(o);
        else if (o.type === 'echo') { o.taken = !!(this.state.echoes && this.state.echoes[o.id]); this.echoes.push(o); }
        else if (o.type === 'exit') this.exits.push(o);
        else if (o.type === 'sign') this.signs.push(o);
        else if (o.type === 'mover') this.movers.push(o);
      }
      const sp = spawn || room.spawn || { x: 100, y: room.h - 40 };
      this.player = new Player(this, sp.x, sp.y);
      this.player.gravitySign = 1;
      this.cam.x = clamp(this.player.cx - VIEW_W / 2, 0, Math.max(0, room.w - VIEW_W));
      this.cam.y = clamp(this.player.cy - VIEW_H / 2, 0, Math.max(0, room.h - VIEW_H));
      this.state.room = id;
      this.state.visited = this.state.visited || {};
      const firstVisit = !this.state.visited[id];
      this.state.visited[id] = true;
      this.state.lastSpawn = { x: sp.x, y: sp.y };
      this.fade = 1;
      this.fading = 'in';
      this.mode = 'play';
      if (NO.onRoomChange) NO.onRoomChange(room, firstVisit);
      if (NO.requestSave) NO.requestSave('room');
      if (opts && opts.silent) this.fade = 0;
    }

    startAt(id, spawn) {
      this.loadRoom(id, spawn);
      this.fade = 1;
      this.fading = 'in';
    }

    // ---- mechanisms ----
    get stateFlags() { return this.state.flags || (this.state.flags = {}); }

    zoneAt(x, y) {
      let found = null;
      for (const z of this.zones) {
        if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) found = z;
      }
      return found;
    }

    isRequiresMet(req) {
      if (!req) return true;
      if (req.allSigils) {
        const s = this.state.sigils || {};
        if (!(s.tide && s.light && s.gravity)) return false;
      }
      if (req.echoCount != null) {
        if (Object.keys(this.state.echoes || {}).length < req.echoCount) return false;
      }
      if (req.sigils) {
        for (const sig of req.sigils) if (!(this.state.sigils || {})[sig]) return false;
      }
      if (req.seals) for (const id of req.seals) { const s = this.seals[id]; if (!s || !s.active) return false; }
      if (req.sensors) for (const id of req.sensors) { const s = this.sensors[id]; if (!s || !s.active) return false; }
      if (req.anchors) for (const id of req.anchors) { const a = this.anchors.find(x => x.id === id); if (!a || !a.used) return false; }
      if (req.breaks && !req.breaks.every(id => this.room.platforms.some(p => p.id === id && p.broken))) return false;
      if (req.flags) for (const f of req.flags) { if (!this.stateFlags[f]) return false; }
      return true;
    }

    isPlatformSolid(p) {
      if (!p) return false;
      if (p.type === 'starGlass') return !!p.lit;
      if (p.type === 'fragile') return !p.broken;
      if (p.type === 'bridge') return this.isRequiresMet(p.requires);
      return p.type === 'solid' || p.type === 'spring';
    }

    solidRects() {
      if (this._solidCache) return this._solidCache;
      const out = [];
      for (const p of this.room.platforms) {
        if (this.isPlatformSolid(p)) out.push({ x: p.x, y: p.y, w: p.w, h: p.h, source: p, kind: p.type });
      }
      for (const m of this.movers) {
        out.push({ x: m.x, y: m.y, w: m.w, h: m.h, source: m, kind: 'mover' });
      }
      this._solidCache = out;
      return out;
    }

    updateMovers(dt) {
      this._solidCache = null;
      for (const m of this.movers) {
        m.phase += dt * m.speed / Math.max(1, Math.hypot(m.bx - m.ox, m.by - m.oy));
        const k = (1 - Math.cos(m.phase * Math.PI * 2)) / 2;
        const nx = lerp(m.ox, m.bx, k);
        const ny = lerp(m.oy, m.by, k);
        m.dx = nx - m.x;
        m.dy = ny - m.y;
        m.x = nx; m.y = ny;
      }
      if (this.player && this.player.onGround && this.player.groundObj) {
        const m = this.player.groundObj;
        if (m.type === 'mover') {
          this.player.x += m.dx || 0;
          this.player.y += m.dy || 0;
        }
      }
    }

    updateSeals(dt) {
      for (const s of Object.values(this.seals)) {
        if (s.latch) {
          s.active = !!s.active;
          s.timer = s.active ? 1 : 0;
        } else {
          if (s.timer > 0) {
            s.timer -= dt;
            if (s.timer < 0) s.timer = 0;
          }
          s.active = s.timer > 0;
        }
        s.pulse = Math.max(0, (s.pulse || 0) - dt * 3);
      }
    }

    updateSensors(dt) {
      for (const s of Object.values(this.sensors)) {
        if (s.hold > 0) {
          if (s.lit) s.timer = s.hold;
          else s.timer = Math.max(0, s.timer - dt);
          s.active = s.mode === 'lit' ? (s.lit || s.timer > 0) : (!s.lit || s.timer > 0);
        } else {
          s.timer = 0;
          s.active = s.mode === 'lit' ? !!s.lit : !s.lit;
        }
        s.pulse = Math.max(0, (s.pulse || 0) - dt * 3);
      }
    }

    updateExits() {
      for (const e of this.exits) {
        if (!e.requires || !Object.keys(e.requires).length) continue;
        const open = this.isRequiresMet(e.requires);
        if (open && this._exitState[e.id] === false) {
          this.sfx('door');
          this.emitDoor(e);
        }
        this._exitState[e.id] = open;
      }
    }

    computeBeams() {
      for (const p of this.room.platforms) if (p.type === 'starGlass') p.lit = false;
      for (const s of Object.values(this.sensors)) s.lit = false;
      for (const m of this.mirrors) m.hit = false;
      this.beams = [];
      const blockers = [];
      for (const p of this.room.platforms) {
        if (p.type === 'solid' || p.type === 'fragile' || p.type === 'bridge') {
          if (p.type === 'bridge' && !this.isRequiresMet(p.requires)) continue;
          blockers.push(p);
        }
      }
      for (const m of this.movers) blockers.push(m);
      for (const lamp of this.lamps) {
        let x = lamp.x, y = lamp.y;
        let dx = lamp.dx, dy = lamp.dy;
        const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
        const pts = [{ x, y }];
        let lastMirror = null;
        let mirrorCooldown = 0;
        for (let i = 0; i < 420; i++) {
          x += dx * STEP; y += dy * STEP;
          if (x < 0 || y < 0 || x > this.room.w || y > this.room.h) break;
          const pr = this.player ? this.player.rect : null;
          if (pr && x > pr.x + 3 && x < pr.x + pr.w - 3 && y > pr.y + 3 && y < pr.y + pr.h - 3) {
            pts.push({ x, y }); break;
          }
          // mirrors
          if (mirrorCooldown > 0) mirrorCooldown--;
          let hitMirror = null;
          for (const m of this.mirrors) {
            if (m === lastMirror && mirrorCooldown > 0) continue;
            if (x > m.x - 6 && x < m.x + m.w + 6 && y > m.y - 6 && y < m.y + m.h + 6) { hitMirror = m; break; }
          }
          if (hitMirror) {
            hitMirror.hit = true;
            pts.push({ x, y });
            if (hitMirror.ori === '/') { const ndx = -dy; dy = -dx; dx = ndx; }
            else { const ndx = dy; dy = dx; dx = ndx; }
            lastMirror = hitMirror; mirrorCooldown = 8;
            x += dx * 12; y += dy * 12;
            pts.push({ x, y });
            continue;
          }
          let blocked = false;
          for (const b of blockers) {
            if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) { blocked = true; break; }
          }
          if (blocked) { pts.push({ x, y }); break; }
          for (const s of Object.values(this.sensors)) {
            if (x >= s.x - 8 && x <= s.x + s.w + 8 && y >= s.y - 8 && y <= s.y + s.h + 8) s.lit = true;
          }
          for (const p of this.room.platforms) {
            if (p.type === 'starGlass' && x >= p.x - 4 && x <= p.x + p.w + 4 && y >= p.y - 4 && y <= p.y + p.h + 4) p.lit = true;
          }
          if (i % 2 === 0) pts.push({ x, y });
        }
        pts.push({ x, y });
        this.beams.push({ color: lamp.color || '#ffd9a0', pts });
      }
    }

    onGravityChange(player) {
      this.sfx('gravity');
      this.shake = Math.max(this.shake, 3);
      for (let i = 0; i < 14; i++) {
        this.particles.push(new Particle(player.cx, player.cy, (Math.random() - 0.5) * 90, -player.gravitySign * (40 + Math.random() * 120), 0.5, i % 2 ? '#9e8cf4' : '#63e2d0', 1.5 + Math.random() * 2, { drag: 0.96, alpha: 0.8 }));
      }
    }

    // ---- landing / triggers ----
    handleLanding(player, impact, rect) {
      const braced = player.bracing;
      let v = impact * (braced ? BRACE_MULT : 1);
      const rank = tierRank(v);
      player.lastTier = rank;
      if (impact >= 250) NO.ui?.showLanding?.(rank);
      NO.lesson?.landed(braced, rank);
      player.landSquash = rank === 2 ? 1 : rank === 1 ? 0.65 : 0.35;
      player.squash = rank === 2 ? 1.24 : rank === 1 ? 1.12 : 0.94;
      this.sfx(rank === 2 ? 'landHard' : rank === 1 ? 'landFirm' : 'landSoft');
      this.emitLand(player, rank);
      if (rank === 2) this.shake = Math.max(this.shake, 5);
      else if (rank === 1) this.shake = Math.max(this.shake, 2);
      if (rect?.source?.type === 'fragile' && rank >= (rect.source.breakRank ?? 1)) {
        rect.source.broken = true;
        this.emitBreak(rect.source);
        player.onGround = false;
        player.groundObj = null;
        this.sfx('break');
        this.shake = Math.max(this.shake, 6);
      }
      const pr = player.rect;
      const foot = {
        x: pr.x - 14,
        y: player.gravitySign > 0 ? pr.y + pr.h - 20 : pr.y - 8,
        w: pr.w + 28,
        h: 28
      };
      for (const s of Object.values(this.seals)) {
        if (s.active && s.latch) continue;
        if (!overlap(foot, s)) continue;
        if (!this.matchesTier(s.req, rank)) continue;
        s.active = true;
        s.pulse = 1;
        s.timer = s.latch ? 1 : (s.duration || 8);
        this.sfx(s.bell ? 'bell' : 'seal');
        this.emitSeal(s);
        if (s.bell) this.shake = Math.max(this.shake, 4);
      }
      for (const a of this.anchors) {
        if (!overlap(foot, a)) continue;
        if (!this.matchesTier(a.req || 'hard', rank)) continue;
        const z = this.zones.find(x => x.id === a.zone);
        if (z) {
          z.dir *= -1;
          this.sfx('anchor');
          this.emitAnchor(a, z);
          this.shake = Math.max(this.shake, 4);
        }
        a.used = true;
      }
      if (rect?.source?.type === 'spring') {
        player.vy = -Math.max(rect.source.strength, v * 1.3) * player.gravitySign;
        player.onGround = false;
        player.groundObj = null;
        player.coyote = 0;
        player.jumpBuffer = 0;
        this.sfx('spring');
        this.emitJump(player);
      }
      if (this.player) {
        this.player.onGround = player.onGround;
        this.player.groundObj = player.groundObj;
      }
    }

    matchesTier(req, rank) {
      if (!req || req === 'any') return true;
      if (req === 'soft') return rank === 0;
      if (req === 'firm') return rank === 1;
      if (req === 'hard') return rank === 2;
      if (req === 'notSoft') return rank > 0;
      if (req === 'notHard') return rank < 2;
      return true;
    }

    checkTriggers() {
      if (!this.player) return;
      const p = this.player;
      // echoes
      for (const e of this.echoes) {
        if (e.taken || !this.echoAvailable(e)) continue;
        if (overlap(p.rect, e)) this.collectEcho(e);
      }
      // interact prompt
      this.prompt = this.findInteractable();
      if (this.prompt && this.input.pressed('interact')) this.interact(this.prompt);
      if (NO.ui && NO.ui.setInteractAvailable) NO.ui.setInteractAvailable(!!this.prompt, this.prompt ? this.prompt.label : '');
    }

    echoAvailable(e) {
      if (e.requires && !this.isRequiresMet(e.requires)) return false;
      if (!e.gate) return true;
      const portal = this.exits.find(exit => exit.to === e.gate && exit.requires);
      return !!portal && this.isRequiresMet(portal.requires);
    }

    interactionClear(from, targetX, targetY) {
      const dx = targetX - from.cx;
      const dy = targetY - from.cy;
      const slices = Math.ceil(Math.hypot(dx, dy) / 4);
      const solids = this.solidRects();
      for (let i = 1; i <= slices; i++) {
        const x = from.cx + dx * i / slices;
        const y = from.cy + dy * i / slices;
        if (solids.some(r => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h)) return false;
      }
      return true;
    }

    findInteractable() {
      if (!this.player) return null;
      const p = this.player;
      const cx = p.cx, cy = p.cy;
      let best = null, bestD = 78 * 78;
      const consider = (obj, label, kind) => {
        const ox = obj.x + (obj.w || 40) / 2;
        const oy = obj.y + (obj.h || 40) / 2;
        const d = (ox - cx) * (ox - cx) + (oy - cy) * (oy - cy);
        if (d < bestD && this.interactionClear(p, ox, oy)) { bestD = d; best = { obj, label, kind }; }
      };
      for (const e of this.exits) {
        const target = e.to && NO.DATA.rooms[e.to];
        const label = NO.L(e.label) || (target ? NO.L(target.name) : NO.t('interact_hint'));
        consider(e, label, 'exit');
      }
      for (const s of this.signs) consider(s, NO.t('interact_hint'), 'sign');
      for (const m of this.mirrors) consider(m, NO.t('interact_hint'), 'mirror');
      return best;
    }

    interact(target) {
      if (!target) return;
      if (target.kind !== 'exit' || this.isRequiresMet(target.obj.requires)) NO.lesson?.interacted();
      if (target.kind === 'mirror') {
        const m = target.obj;
        m.ori = m.ori === '/' ? '\\' : '/';
        this.sfx('mirror');
        this._beamsDirty = true;
        this.computeBeams();
        this.emitMirror(m);
      } else if (target.kind === 'sign') {
        const text = NO.DATA.story.signs[target.obj.textKey];
        if (text && NO.ui) NO.ui.showDialogue([{ speaker: 'conductor', text }], () => {});
      } else if (target.kind === 'exit') {
        this.useExit(target.obj);
      }
    }

    useExit(exitObj) {
      if (this.fading) return;
      if (!this.isRequiresMet(exitObj.requires)) {
        const msg = exitObj.lockedText ? NO.L(exitObj.lockedText) : NO.t('exit_locked');
        if (NO.toast) NO.toast(msg);
        this.sfx('locked');
        return;
      }
      this.state.sigils = this.state.sigils || { tide: false, light: false, gravity: false };
      if (exitObj.grantSigil && !this.state.sigils[exitObj.grantSigil]) {
        this.state.sigils[exitObj.grantSigil] = true;
        if (NO.toast) NO.toast(NO.t('toast_sigil'));
        this.sfx('sigil');
        if (NO.ui) NO.ui.refreshHud();
        if (NO.requestSave) NO.requestSave('sigil');
      }
      if (exitObj.chapterReward && !this.stateFlags[exitObj.chapterReward]) {
        this.stateFlags[exitObj.chapterReward] = true;
        this.sfx('sigil');
        NO.ui?.showReward?.(NO.t('restore_reward', { room: NO.L(this.room.name) }));
        NO.requestSave?.('reward');
      }
      if (exitObj.ending) {
        if (NO.ui) NO.ui.showEnding(exitObj.ending, this);
        return;
      }
      if (exitObj.to) {
        if (NO.requestSave) NO.requestSave('exit');
        this.transitionTo(exitObj.to, exitObj.spawn);
      }
    }

    transitionTo(to, spawn) {
      if (this.fading) return;
      this.pendingRoom = { to, spawn };
      this.fading = 'out';
      this.fade = 0;
      this.player.vx = 0;
    }

    collectEcho(e) {
      if (e.taken) return;
      e.taken = true;
      this.state.echoes = this.state.echoes || {};
      this.state.echoes[e.id] = true;
      this.sfx('echo');
      this.emitEcho(e);
      if (NO.toast) NO.toast(NO.t('toast_echo'));
      if (NO.requestSave) NO.requestSave('echo');
      if (NO.ui) {
        NO.ui.refreshHud();
        const data = NO.DATA.story.echoes[e.textKey];
        if (data) NO.ui.showDialogue([{ speaker: 'echo', title: data.title, text: data.body }], () => {});
      }
    }

    kill(reason) {
      if (this.dead) return;
      this.dead = true;
      this.deadTimer = 0;
      this.sfx('death');
      this.shake = Math.max(this.shake, 8);
      if (this.player) {
        for (let i = 0; i < 18; i++) {
          this.particles.push(new Particle(this.player.cx, this.player.cy, (Math.random() - 0.5) * 220, (Math.random() - 0.5) * 220, 0.6, i % 2 ? '#db93ac' : '#63e2d0', 1 + Math.random() * 2.5, { drag: 0.94 }));
        }
      }
    }

    // ---- update ----
    update(dt) {
      dt = Math.min(dt, 0.05);
      this.input.pollGamepad();
      if (this.mode === 'title' || !this.room) {
        if (this.mode === 'title') this.titleTime += dt;
        this.input.endFrame();
        return;
      }
      if (this.paused) { this.input.endFrame(); return; }
      this.time += dt;
      this.roomTime += dt;
      this.shake = Math.max(0, this.shake - dt * 28);
      this.hintPulse = Math.max(0, this.hintPulse - dt);
      if (this.fading === 'out') {
        this.fade += dt * 3.4;
        if (this.fade >= 1) {
          this.fade = 1;
          const p = this.pendingRoom;
          this.pendingRoom = null;
          this.fading = null;
          if (p) this.loadRoom(p.to, p.spawn, { silent: true });
          this.fade = 1;
          this.fading = 'in';
        }
        this.updateParticles(dt);
        this.input.endFrame();
        return;
      }
      if (this.fading === 'in') {
        this.fade -= dt * 3.2;
        if (this.fade <= 0) { this.fade = 0; this.fading = null; }
      }
      if (this.dead) {
        this.deadTimer += dt;
        this.updateParticles(dt);
        if (this.deadTimer > 0.75) {
          this.dead = false;
          this.deadTimer = 0;
          this.loadRoom(this.state.room, this.room.spawn, { silent: true });
          this.fade = 1;
          this.fading = 'in';
        }
        this.input.endFrame();
        return;
      }
      this.updateMovers(dt);
      this.computeBeams();
      this.updateSensors(dt);
      this.updateSeals(dt);
      this.updateExits();
      this._solidCache = null;
      if (!this.player.clearEmbedding()) {
        this.kill('crush');
        this.input.endFrame();
        return;
      }
      this.player.update(dt);
      if (this.player.justLanded) {
        this.handleLanding(this.player, this.player.lastImpact, this.player.landingRect);
        this.player.justLanded = false;
      }
      this.checkTriggers();
      this.updateParticles(dt);
      this.updateCamera(dt);
      this.input.endFrame();
      if (NO.ui && NO.ui.updateHudTime) {
        this._lastUiSecond += dt;
        if (this._lastUiSecond > 0.5) { NO.ui.updateHudTime(this); this._lastUiSecond = 0; }
      }
      if (this.state.room && NO.requestSave && this.roomTime > 8) {
        this.roomTime = 0;
        NO.requestSave('auto');
      }
    }

    updateCamera(dt) {
      if (!this.room || !this.player) return;
      const tx = clamp(this.player.cx - VIEW_W / 2, 0, Math.max(0, this.room.w - VIEW_W));
      const ty = clamp(this.player.cy - VIEW_H / 2, 0, Math.max(0, this.room.h - VIEW_H));
      const k = Math.min(1, dt * 7);
      this.cam.x = lerp(this.cam.x, tx, k);
      this.cam.y = lerp(this.cam.y, ty, k);
    }

    updateParticles(dt) {
      for (const p of this.particles) p.update(dt);
      this.particles = this.particles.filter(p => p.life > 0);
    }

    // ---- effects ----
    emitJump(p) {
      for (let i = 0; i < 5; i++) this.particles.push(new Particle(p.cx + (Math.random() - 0.5) * 14, p.footY, (Math.random() - 0.5) * 40, -p.gravitySign * (10 + Math.random() * 30), 0.28, '#aeb7c8', 1 + Math.random() * 1.5, { drag: 0.94 }));
    }
    emitLand(p, rank) {
      const n = rank === 2 ? 22 : rank === 1 ? 12 : 7;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (rank === 2 ? 120 : rank === 1 ? 70 : 35) * (0.4 + Math.random());
        this.particles.push(new Particle(p.cx, p.footY, Math.cos(a) * sp, Math.sin(a) * sp - p.gravitySign * 20, 0.35 + Math.random() * 0.3, rank === 2 ? '#f2b56b' : rank === 1 ? '#ece7da' : '#63e2d0', 1 + Math.random() * 2.2, { drag: 0.93, gravity: 120 * p.gravitySign }));
      }
    }
    emitBreak(p) {
      for (let i = 0; i < 16; i++) this.particles.push(new Particle(p.x + p.w / 2, p.y + p.h / 2, (Math.random() - 0.5) * 180, (Math.random() - 0.5) * 160, 0.6, '#9fe8e0', 1 + Math.random() * 2, { drag: 0.95, gravity: 260 }));
    }
    emitSeal(s) {
      for (let i = 0; i < 16; i++) {
        const a = Math.random() * Math.PI * 2;
        this.particles.push(new Particle(s.x + s.w / 2, s.y + s.h / 2, Math.cos(a) * 80, Math.sin(a) * 80, 0.5, '#f2b56b', 1 + Math.random() * 2, { drag: 0.94 }));
      }
    }
    emitDoor(d) {
      for (let i = 0; i < 14; i++) this.particles.push(new Particle(d.x + d.w / 2, d.y + d.h / 2, (Math.random() - 0.5) * 70, (Math.random() - 0.5) * 70, 0.5, '#63e2d0', 1 + Math.random() * 1.8, { drag: 0.95 }));
    }
    emitAnchor(a, z) {
      for (let i = 0; i < 20; i++) this.particles.push(new Particle(z.x + Math.random() * z.w, z.y + Math.random() * z.h, 0, (z.dir > 0 ? 1 : -1) * (40 + Math.random() * 90), 0.7, '#9e8cf4', 1 + Math.random() * 2, { drag: 0.97 }));
    }
    emitMirror(m) {
      for (let i = 0; i < 8; i++) this.particles.push(new Particle(m.x + m.w / 2, m.y + m.h / 2, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50, 0.35, '#db93ac', 1 + Math.random(), { drag: 0.94 }));
    }
    emitEcho(e) {
      for (let i = 0; i < 24; i++) {
        const a = Math.random() * Math.PI * 2;
        this.particles.push(new Particle(e.x + e.w / 2, e.y + e.h / 2, Math.cos(a) * 90, Math.sin(a) * 90, 0.7, i % 2 ? '#db93ac' : '#f2b56b', 1 + Math.random() * 2, { drag: 0.96 }));
      }
    }

    sfx(name) {
      if (NO.audio) NO.audio.play(name);
      if (NO.onSoundCue && ['bell', 'door', 'seal', 'gravity', 'anchor', 'echo', 'break', 'death'].indexOf(name) >= 0) {
        NO.onSoundCue(name);
      }
    }

    pulseHint() {
      this.hintPulse = 5.5;
      this.hintPulseTargets = [];
      if (!this.room) return;
      for (const o of this.room.objects) {
        if (['seal', 'sensor', 'mirror', 'anchor', 'exit'].includes(o.type)) this.hintPulseTargets.push(o);
      }
      this.sfx('ui');
    }

    // ---- render ----
    render() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, VIEW_W, VIEW_H);
      if (this.mode === 'title') {
        this.renderTitle(ctx);
        return;
      }
      if (!this.room) return;
      this.drawBackground(ctx, this.room.bg, this.cam, this.time);
      ctx.save();
      let sx = 0, sy = 0;
      if (this.shake > 0 && !this.settings.reduceMotion) {
        const sm = (this.settings.shake == null ? 60 : this.settings.shake) / 100;
        sx = (Math.random() - 0.5) * this.shake * sm;
        sy = (Math.random() - 0.5) * this.shake * sm;
      }
      ctx.translate(-this.cam.x + sx, -this.cam.y + sy);
      this.drawRoomFrame(ctx);
      this.drawZones(ctx);
      this.drawBeams(ctx);
      this.drawPlatforms(ctx);
      this.drawObjects(ctx);
      if (this.player && !this.dead) this.drawPlayer(ctx, this.player);
      this.drawParticles(ctx);
      this.drawHintPulse(ctx);
      this.drawPrompts(ctx);
      ctx.restore();
      this.drawFade(ctx);
      if (this.dead) {
        ctx.fillStyle = 'rgba(0,0,0,' + Math.min(0.55, this.deadTimer * 1.4) + ')';
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }
    }

    drawFade(ctx) {
      if (this.fade > 0) {
        ctx.fillStyle = 'rgba(2,4,9,' + this.fade + ')';
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }
    }

    // ---- title ----
    renderTitle(ctx) {
      const t = this.titleTime;
      this.drawBackground(ctx, 'hub', { x: 280 + Math.sin(t * 0.035) * 80, y: 0 }, t);
      ctx.save();
      ctx.translate(VIEW_W * 0.66, VIEW_H * 0.53);
      this.drawOrrery(ctx, 250, t * 0.12, 0.42, true);
      ctx.restore();
      // distant silhouette of the watchman
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.translate(VIEW_W * 0.68, VIEW_H * 0.87);
      ctx.fillStyle = '#05080f';
      ctx.beginPath();
      ctx.moveTo(-16, 0); ctx.lineTo(-11, -52); ctx.lineTo(-4, -62); ctx.lineTo(0, -82); ctx.lineTo(5, -62); ctx.lineTo(13, -52); ctx.lineTo(18, 0);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      // stars passing
      for (let i = 0; i < 18; i++) {
        const x = ((i * 191 + t * 7) % (VIEW_W + 200)) - 100;
        const y = 80 + (i * 73) % 460;
        ctx.globalAlpha = 0.15 + (i % 5) * 0.04;
        ctx.fillStyle = i % 3 ? '#ece7da' : '#f2b56b';
        ctx.fillRect(x, y, 1.4, 1.4);
      }
      ctx.globalAlpha = 1;
    }

    // ---- background ----
    drawBackground(ctx, theme, cam, t) {
      const palette = {
        hub: ['#10233d', '#091426', '#1a3050', '#f2b56b'],
        tide: ['#0b242a', '#07131a', '#12363a', '#63e2d0'],
        light: ['#251735', '#100d1e', '#352040', '#db93ac'],
        gravity: ['#1a1436', '#0b091b', '#291e50', '#9e8cf4'],
        final: ['#2a1810', '#0b0809', '#3a2418', '#f2b56b'],
        title: ['#10233d', '#091426', '#1a3050', '#f2b56b']
      }[theme] || ['#10233d', '#091426', '#1a3050', '#f2b56b'];
      const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      g.addColorStop(0, palette[0]);
      g.addColorStop(0.55, palette[1]);
      g.addColorStop(1, '#03060c');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);

      // stars
      const px = cam.x * 0.05;
      for (const s of this.stars) {
        const x = ((s.x - px) % 1600 + 1600) % 1600 - 160;
        const tw = 0.5 + 0.5 * Math.sin(t * s.s + s.p);
        ctx.globalAlpha = 0.18 + tw * 0.55;
        ctx.fillStyle = s.r > 1.5 ? '#f2b56b' : '#dfe8f6';
        ctx.beginPath();
        ctx.arc(x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // moon
      const mx = 980 - cam.x * 0.02, my = 130;
      const mg = ctx.createRadialGradient(mx, my, 10, mx, my, 150);
      mg.addColorStop(0, 'rgba(244,238,226,.95)');
      mg.addColorStop(0.18, 'rgba(236,231,218,.72)');
      mg.addColorStop(0.4, 'rgba(242,181,107,.12)');
      mg.addColorStop(1, 'rgba(242,181,107,0)');
      ctx.fillStyle = mg;
      ctx.beginPath(); ctx.arc(mx, my, 150, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(236,231,218,.86)';
      ctx.beginPath(); ctx.arc(mx, my, 62, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(120,130,150,.12)';
      ctx.beginPath(); ctx.arc(mx - 18, my - 12, 12, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(mx + 20, my + 18, 8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(mx + 8, my - 25, 6, 0, Math.PI * 2); ctx.fill();

      // cloud sea
      this.drawCloudSea(ctx, cam, t, theme, palette[3]);

      // theme architecture
      ctx.save();
      const px2 = cam.x * 0.16;
      ctx.translate(-px2, 0);
      if (theme === 'hub' || theme === 'title') {
        this.drawDome(ctx, 160, 700, 380, t);
        this.drawTower(ctx, 980, 700, 220, 500);
        this.drawPendulum(ctx, 460, 220, 90, t);
      } else if (theme === 'tide') {
        this.drawPipes(ctx, t);
        this.drawPendulum(ctx, 300, 180, 120, t);
        this.drawGears(ctx, 1050, 420, 120, t);
      } else if (theme === 'light') {
        this.drawMirrorHall(ctx, t);
      } else if (theme === 'gravity') {
        this.drawFloatingRocks(ctx, t);
        this.drawTowerArches(ctx, t);
      } else if (theme === 'final') {
        ctx.save();
        ctx.translate(760, 360);
        this.drawOrrery(ctx, 300, t * 0.17, 0.55, false);
        ctx.restore();
        this.drawPillars(ctx, t);
      }
      ctx.restore();

      this.drawWallDetails(ctx, theme, cam, t, palette[3]);
      this.drawAtmosphere(ctx, theme, t, palette[3]);

      // foreground mist
      const fg = ctx.createLinearGradient(0, VIEW_H - 170, 0, VIEW_H);
      fg.addColorStop(0, 'rgba(3,6,12,0)');
      fg.addColorStop(1, 'rgba(3,6,12,.72)');
      ctx.fillStyle = fg;
      ctx.fillRect(0, VIEW_H - 170, VIEW_W, 170);
    }

    drawAtmosphere(ctx, theme, t, accent) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const g = ctx.createRadialGradient(VIEW_W * 0.64, 100, 20, VIEW_W * 0.64, 100, 880);
      g.addColorStop(0, accent + '20');
      g.addColorStop(0.35, accent + '0c');
      g.addColorStop(1, accent + '00');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      const g2 = ctx.createRadialGradient(VIEW_W * 0.2, 580, 20, VIEW_W * 0.2, 580, 520);
      g2.addColorStop(0, 'rgba(90,140,190,.055)');
      g2.addColorStop(1, 'rgba(90,140,190,0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.restore();
      // low moving mist
      for (let i = 0; i < 3; i++) {
        const y = 545 + i * 38;
        ctx.beginPath();
        ctx.moveTo(-20, y);
        for (let x = -20; x <= VIEW_W + 20; x += 24) {
          ctx.lineTo(x, y + Math.sin(x * 0.007 + t * (0.13 + i * 0.03) + i * 2) * (12 + i * 4));
        }
        ctx.lineTo(VIEW_W + 20, VIEW_H); ctx.lineTo(-20, VIEW_H); ctx.closePath();
        ctx.fillStyle = accent + (i === 0 ? '0c' : i === 1 ? '08' : '05');
        ctx.fill();
      }
    }

    drawWallDetails(ctx, theme, cam, t, accent) {
      const roomW = this.room ? this.room.w : VIEW_W;
      const px = cam.x * 0.10;
      ctx.save();
      // distant wall panels and star-chart glass
      for (let x = 100; x < roomW; x += 236) {
        const xx = x - px;
        if (xx < -220 || xx > VIEW_W + 120) continue;
        ctx.strokeStyle = 'rgba(236,231,218,.045)';
        ctx.lineWidth = 1;
        roundRect(ctx, xx, 90, 150, 470, 16);
        ctx.stroke();
        ctx.fillStyle = 'rgba(236,231,218,.012)';
        ctx.fill();
        ctx.strokeStyle = accent + '18';
        ctx.beginPath();
        ctx.moveTo(xx + 18, 470);
        ctx.lineTo(xx + 94, 220);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(xx + 118, 330, 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(242,181,107,.10)';
        for (let k = 0; k < 4; k++) {
          ctx.fillRect(xx + 20 + k * 26, 120 + (k % 2) * 12, 1, 1);
        }
      }
      // background ledges and columns (non-collidable architecture)
      for (let i = 0; i < 7; i++) {
        const bx = 120 + ((i * 233 + 90) % Math.max(200, roomW - 240)) - px;
        const by = 190 + ((i * 97) % 330);
        const bw = 90 + (i % 3) * 54;
        ctx.fillStyle = 'rgba(6,10,18,.34)';
        roundRect(ctx, bx, by, bw, 12, 2); ctx.fill();
        ctx.fillStyle = accent + '12';
        ctx.fillRect(bx + 3, by, bw - 6, 1);
        if (i % 2 === 0) {
          ctx.strokeStyle = 'rgba(236,231,218,.035)';
          ctx.beginPath(); ctx.moveTo(bx + 12, by + 12); ctx.lineTo(bx + 12, by + 54); ctx.stroke();
        }
      }
      // distant columns
      ctx.strokeStyle = 'rgba(236,231,218,.028)';
      ctx.lineWidth = 2;
      for (let x = 210; x < roomW; x += 330) {
        const xx = x - px * 1.4;
        ctx.beginPath(); ctx.moveTo(xx, 90); ctx.lineTo(xx, 620); ctx.stroke();
        ctx.beginPath(); ctx.arc(xx, 90, 18, Math.PI, 0); ctx.stroke();
      }
      // rose-window star chart
      ctx.save();
      ctx.translate(roomW * 0.52 - px * 0.7, 300);
      ctx.strokeStyle = accent + '12';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, 150, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 110, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * 110, Math.sin(a) * 110); ctx.lineTo(Math.cos(a) * 150, Math.sin(a) * 150); ctx.stroke();
      }
      ctx.fillStyle = accent + '20';
      for (let i = 0; i < 10; i++) {
        const a = i * 2.399;
        const rr = 20 + (i * 31) % 100;
        ctx.beginPath(); ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, 1, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      // horizontal brass rails
      ctx.strokeStyle = 'rgba(242,181,107,.10)';
      ctx.lineWidth = 1;
      for (const y of [72, 610]) {
        ctx.beginPath();
        ctx.moveTo(-20, y); ctx.lineTo(VIEW_W + 20, y);
        ctx.stroke();
      }
      // hanging lamps
      for (let x = 320; x < roomW; x += 430) {
        const xx = x - cam.x * 0.18;
        if (xx < -80 || xx > VIEW_W + 80) continue;
        const sway = Math.sin(t * 0.55 + x * 0.01) * 4;
        ctx.strokeStyle = 'rgba(242,181,107,.16)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xx, 40); ctx.lineTo(xx + sway, 136); ctx.stroke();
        const g = ctx.createRadialGradient(xx + sway, 144, 2, xx + sway, 144, 52);
        g.addColorStop(0, 'rgba(255,225,170,.38)');
        g.addColorStop(0.3, 'rgba(242,181,107,.11)');
        g.addColorStop(1, 'rgba(242,181,107,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(xx + sway, 144, 52, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,226,175,.6)';
        ctx.beginPath(); ctx.arc(xx + sway, 144, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(242,181,107,.25)';
        ctx.beginPath(); ctx.arc(xx + sway, 144, 7, 0, Math.PI * 2); ctx.stroke();
      }
      // low ambient light along the floor
      const lg = ctx.createLinearGradient(0, 560, 0, 720);
      lg.addColorStop(0, 'transparent');
      lg.addColorStop(1, accent + '10');
      ctx.fillStyle = lg;
      ctx.fillRect(0, 560, VIEW_W, 160);
      ctx.restore();
    }

    drawCloudSea(ctx, cam, t, theme, accent) {
      const base = VIEW_H - 120;
      const layers = [
        { y: base + 20, amp: 22, speed: 0.11, alpha: 0.20, col: '#0e1c2c' },
        { y: base + 52, amp: 30, speed: 0.07, alpha: 0.26, col: '#0a1420' },
        { y: base + 92, amp: 40, speed: 0.045, alpha: 0.34, col: '#060c15' }
      ];
      for (let li = 0; li < layers.length; li++) {
        const L = layers[li];
        ctx.beginPath();
        ctx.moveTo(0, VIEW_H);
        const off = cam.x * (0.03 + li * 0.02);
        for (let x = -40; x <= VIEW_W + 40; x += 20) {
          const xx = x + off;
          const y = L.y + Math.sin(xx * 0.006 + t * L.speed + li) * L.amp + Math.sin(xx * 0.013 - t * L.speed * 0.7) * L.amp * 0.35;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(VIEW_W, VIEW_H);
        ctx.closePath();
        ctx.fillStyle = L.col;
        ctx.globalAlpha = L.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // accent reflection
      const rg = ctx.createLinearGradient(0, base, 0, VIEW_H);
      rg.addColorStop(0, 'transparent');
      rg.addColorStop(1, accent + '14');
      ctx.fillStyle = rg;
      ctx.fillRect(0, base, VIEW_W, VIEW_H - base);
    }

    drawDome(ctx, x, y, r, t) {
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeStyle = 'rgba(242,181,107,.22)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * 0.72, Math.PI, 0); ctx.stroke();
      for (let i = 0; i < 7; i++) {
        const a = Math.PI + (i / 6) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(5,9,16,.8)';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.6, Math.PI, 0); ctx.fill();
      ctx.restore();
    }

    drawTower(ctx, x, y, w, h) {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = 'rgba(4,8,15,.85)';
      ctx.fillRect(-w / 2, -h, w, h);
      ctx.fillStyle = 'rgba(242,181,107,.15)';
      ctx.fillRect(-w / 2 + 14, -h + 20, 4, h - 40);
      ctx.fillRect(w / 2 - 18, -h + 20, 4, h - 40);
      ctx.beginPath();
      ctx.moveTo(-w / 2 - 18, -h);
      ctx.lineTo(0, -h - 90);
      ctx.lineTo(w / 2 + 18, -h);
      ctx.closePath(); ctx.fillStyle = 'rgba(4,8,15,.9)'; ctx.fill();
      ctx.restore();
    }

    drawPendulum(ctx, x, y, len, t) {
      const a = Math.sin(t * 0.7) * 0.12;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.strokeStyle = 'rgba(242,181,107,.38)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, len); ctx.stroke();
      ctx.fillStyle = 'rgba(242,181,107,.28)';
      ctx.beginPath(); ctx.arc(0, len, 16, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(242,181,107,.55)';
      ctx.stroke();
      ctx.restore();
    }

    drawGears(ctx, x, y, r, t) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * 0.12);
      ctx.strokeStyle = 'rgba(99,226,208,.12)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        ctx.lineTo(Math.cos(a) * (r + 10), Math.sin(a) * (r + 10));
        ctx.stroke();
      }
      ctx.restore();
    }

    drawPipes(ctx, t) {
      ctx.save();
      ctx.strokeStyle = 'rgba(99,226,208,.18)';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(0, 300); ctx.lineTo(220, 300); ctx.lineTo(260, 340); ctx.lineTo(260, 640);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(242,181,107,.18)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(1100, 80); ctx.lineTo(1100, 260); ctx.lineTo(1040, 320); ctx.lineTo(1040, 640);
      ctx.stroke();
      ctx.restore();
    }

    drawMirrorHall(ctx, t) {
      ctx.save();
      for (let i = 0; i < 4; i++) {
        const x = 180 + i * 300;
        ctx.strokeStyle = 'rgba(219,147,172,.24)';
        ctx.lineWidth = 2;
        roundRect(ctx, x, 100, 90, 460, 44);
        ctx.stroke();
        ctx.fillStyle = 'rgba(219,147,172,.07)';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 12, 300 + Math.sin(t * 0.4 + i) * 12);
        ctx.lineTo(x + 78, 260 + Math.cos(t * 0.3 + i) * 12);
        ctx.strokeStyle = 'rgba(236,231,218,.12)';
        ctx.stroke();
      }
      ctx.restore();
    }

    drawFloatingRocks(ctx, t) {
      ctx.save();
      for (let i = 0; i < 7; i++) {
        const x = 120 + i * 180;
        const y = 300 + Math.sin(t * 0.3 + i * 1.7) * 40 - (i % 3) * 60;
        const w = 40 + (i % 4) * 18;
        ctx.fillStyle = 'rgba(10,12,26,.85)';
        ctx.beginPath();
        ctx.moveTo(x - w / 2, y);
        ctx.lineTo(x - w / 4, y - 16);
        ctx.lineTo(x + w / 2, y - 8);
        ctx.lineTo(x + w / 3, y + 14);
        ctx.lineTo(x - w / 3, y + 10);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    drawTowerArches(ctx, t) {
      ctx.save();
      ctx.strokeStyle = 'rgba(158,140,244,.22)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        const x = 300 + i * 340;
        ctx.beginPath();
        ctx.moveTo(x, 700); ctx.lineTo(x, 260);
        ctx.arc(x + 70, 260, 70, Math.PI, 0);
        ctx.lineTo(x + 140, 700);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawPillars(ctx, t) {
      ctx.save();
      ctx.fillStyle = 'rgba(4,6,10,.7)';
      for (let i = 0; i < 5; i++) {
        const x = 120 + i * 260;
        ctx.fillRect(x, 120, 40, 600);
        ctx.fillRect(x - 12, 110, 64, 18);
      }
      ctx.restore();
    }

    drawOrrery(ctx, r, rot, alpha, title) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.rotate(rot);
      const rings = [{ r: r, c: 'rgba(242,181,107,.35)', w: 2 }, { r: r * 0.73, c: 'rgba(99,226,208,.25)', w: 1.5 }, { r: r * 0.46, c: 'rgba(219,147,172,.25)', w: 1 }];
      for (const ring of rings) {
        ctx.strokeStyle = ring.c; ctx.lineWidth = ring.w;
        ctx.beginPath(); ctx.ellipse(0, 0, ring.r, ring.r * 0.42, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(242,181,107,.5)';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.07, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 5; i++) {
        const a = rot * (1 + i * 0.2) + i * 1.7;
        const rr = r * (0.46 + (i % 3) * 0.14);
        const x = Math.cos(a) * rr, y = Math.sin(a) * rr * 0.42;
        ctx.fillStyle = i % 2 ? '#63e2d0' : '#f2b56b';
        ctx.globalAlpha = alpha * (0.5 + (i % 3) * 0.15);
        ctx.beginPath(); ctx.arc(x, y, 3 + (i % 2) * 1.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    // ---- world rendering ----
    drawRoomFrame(ctx) {
      if (!this.room) return;
      const r = this.room;
      ctx.save();
      ctx.strokeStyle = 'rgba(242,181,107,.16)';
      ctx.lineWidth = 1.5;
      const a = 30, m = 12;
      // corner brackets
      for (const [x, y, sx, sy] of [[m, m, 1, 1], [r.w - m, m, -1, 1], [m, r.h - m, 1, -1], [r.w - m, r.h - m, -1, -1]]) {
        ctx.beginPath();
        ctx.moveTo(x, y + sy * a);
        ctx.lineTo(x, y);
        ctx.lineTo(x + sx * a, y);
        ctx.stroke();
      }
      // faint room rule lines
      ctx.strokeStyle = 'rgba(236,231,218,.035)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 58); ctx.lineTo(r.w - 40, 58);
      ctx.stroke();
      ctx.restore();
    }

    drawZones(ctx) {
      for (const z of this.zones) {
        const up = z.dir < 0;
        ctx.save();
        const g = ctx.createLinearGradient(0, z.y, 0, z.y + z.h);
        g.addColorStop(0, up ? 'rgba(158,140,244,.13)' : 'rgba(99,226,208,.10)');
        g.addColorStop(0.5, up ? 'rgba(158,140,244,.05)' : 'rgba(99,226,208,.04)');
        g.addColorStop(1, up ? 'rgba(158,140,244,.22)' : 'rgba(99,226,208,.16)');
        ctx.fillStyle = g;
        ctx.fillRect(z.x, z.y, z.w, z.h);
        ctx.strokeStyle = up ? 'rgba(180,164,255,.55)' : 'rgba(99,226,208,.48)';
        ctx.setLineDash([5, 9]);
        ctx.lineWidth = 1.2;
        ctx.strokeRect(z.x + 1, z.y + 1, z.w - 2, z.h - 2);
        ctx.setLineDash([]);
        // large direction glyph
        ctx.save();
        ctx.translate(z.x + z.w / 2, z.y + 54);
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = up ? '#b4a4ff' : '#63e2d0';
        const dir = up ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(0, dir * 16);
        ctx.lineTo(-11, dir * 2);
        ctx.lineTo(-4, dir * 2);
        ctx.lineTo(-4, -dir * 14);
        ctx.lineTo(4, -dir * 14);
        ctx.lineTo(4, dir * 2);
        ctx.lineTo(11, dir * 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        for (let i = 0; i < 5; i++) {
          const x = z.x + 24 + (i * 71) % Math.max(1, z.w - 48);
          const y = z.y + 80 + ((this.time * 22 + i * 97) % Math.max(1, z.h - 120));
          const a = 0.13 + 0.08 * Math.sin(this.time * 2 + i);
          ctx.globalAlpha = a;
          ctx.fillStyle = up ? '#9e8cf4' : '#63e2d0';
          ctx.beginPath();
          const yy = up ? y : z.y + z.h - (y - z.y);
          ctx.moveTo(x, yy - 7 * (up ? 1 : -1));
          ctx.lineTo(x - 6, yy + 5 * (up ? 1 : -1));
          ctx.lineTo(x + 6, yy + 5 * (up ? 1 : -1));
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
    }

    drawBeams(ctx) {
      if (!this.beams.length) return;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const b of this.beams) {
        if (b.pts.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(b.pts[0].x, b.pts[0].y);
        for (let i = 1; i < b.pts.length; i++) ctx.lineTo(b.pts[i].x, b.pts[i].y);
        ctx.strokeStyle = b.color; ctx.globalAlpha = 0.08; ctx.lineWidth = 18; ctx.stroke();
        ctx.globalAlpha = 0.20; ctx.lineWidth = 7; ctx.stroke();
        ctx.globalAlpha = 0.55; ctx.lineWidth = 1.4; ctx.strokeStyle = '#fff6df'; ctx.stroke();
      }
      ctx.restore();
    }

    drawPlatforms(ctx) {
      for (const p of this.room.platforms) {
        if (p.type === 'starGlass') this.drawStarGlass(ctx, p);
        else if (p.type === 'fragile') this.drawFragile(ctx, p);
        else if (p.type === 'bridge') this.drawBridge(ctx, p);
        else if (p.type === 'spring') this.drawSpring(ctx, p);
        else this.drawSolid(ctx, p);
      }
      for (const m of this.movers) this.drawMover(ctx, m);
    }

    drawSpring(ctx, p) {
      ctx.save();
      ctx.shadowColor = '#63e2d0';
      ctx.shadowBlur = 14;
      roundRect(ctx, p.x, p.y, p.w, p.h, 8);
      ctx.fillStyle = '#193d43';
      ctx.fill();
      ctx.strokeStyle = '#63e2d0';
      ctx.lineWidth = 2;
      ctx.stroke();
      const x = p.x + p.w/2;
      ctx.beginPath();
      ctx.moveTo(x-12,p.y+14);
      ctx.lineTo(x,p.y+5);
      ctx.lineTo(x+12,p.y+14);
      ctx.stroke();
      ctx.restore();
    }

    drawSolid(ctx, p) {
      ctx.save();
      // soft shadow under the piece
      ctx.fillStyle = 'rgba(0,0,0,.30)';
      roundRect(ctx, p.x + 3, p.y + 5, p.w, p.h, 4); ctx.fill();
      // warm rim-light above the piece
      const rim = ctx.createLinearGradient(0, p.y - 20, 0, p.y + 2);
      rim.addColorStop(0, 'rgba(242,181,107,0)');
      rim.addColorStop(1, 'rgba(242,181,107,.10)');
      ctx.fillStyle = rim;
      ctx.fillRect(p.x, p.y - 20, p.w, 22);
      // body
      const g = ctx.createLinearGradient(0, p.y, 0, p.y + Math.max(20, p.h));
      g.addColorStop(0, '#20344d');
      g.addColorStop(0.18, '#16283e');
      g.addColorStop(1, '#0c1727');
      ctx.fillStyle = g;
      roundRect(ctx, p.x, p.y, p.w, p.h, 3); ctx.fill();
      ctx.strokeStyle = 'rgba(236,231,218,.22)';
      ctx.lineWidth = 1;
      ctx.stroke();
      // lit top edge
      ctx.fillStyle = 'rgba(242,181,107,.62)';
      ctx.fillRect(p.x + 2, p.y, Math.max(0, p.w - 4), 2);
      ctx.fillStyle = 'rgba(255,241,218,.32)';
      ctx.fillRect(p.x + 6, p.y + 2, Math.max(0, p.w - 12), 1);
      // teal underglow
      ctx.fillStyle = 'rgba(99,226,208,.10)';
      ctx.fillRect(p.x + 2, p.y + p.h - 1, Math.max(0, p.w - 4), 1);
      // seams / rivets
      if (p.h > 28) {
        ctx.fillStyle = 'rgba(255,255,255,.035)';
        for (let x = p.x + 24; x < p.x + p.w - 12; x += 52) ctx.fillRect(x, p.y + 11, 1, Math.max(0, p.h - 20));
      }
      if (p.w > 110 && p.h <= 44) {
        ctx.fillStyle = 'rgba(242,181,107,.30)';
        for (let x = p.x + 18; x < p.x + p.w - 10; x += 38) ctx.fillRect(x, p.y + 5, 2, 2);
        ctx.fillStyle = 'rgba(236,231,218,.08)';
        for (let x = p.x + 30; x < p.x + p.w - 10; x += 76) ctx.fillRect(x, p.y + 8, 1, Math.max(0, p.h - 14));
      }
      ctx.restore();
    }

    drawStarGlass(ctx, p) {
      ctx.save();
      if (p.lit) {
        ctx.shadowColor = 'rgba(99,226,208,.75)';
        ctx.shadowBlur = 24;
        ctx.fillStyle = 'rgba(99,226,208,.24)';
        roundRect(ctx, p.x, p.y, p.w, p.h, 4); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(170,255,245,.95)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(220,255,250,.36)';
        ctx.lineWidth = 1;
        for (let x = p.x + 14; x < p.x + p.w - 6; x += 28) {
          ctx.beginPath(); ctx.moveTo(x, p.y + 3); ctx.lineTo(x + 11, p.y + p.h - 3); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(220,255,250,.35)';
        ctx.fillRect(p.x + 2, p.y, Math.max(0, p.w - 4), 1);
      } else {
        ctx.setLineDash([5, 7]);
        ctx.strokeStyle = 'rgba(99,226,208,.52)';
        ctx.lineWidth = 1.2;
        roundRect(ctx, p.x, p.y, p.w, p.h, 4); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(99,226,208,.07)';
        roundRect(ctx, p.x, p.y, p.w, p.h, 4); ctx.fill();
        ctx.strokeStyle = 'rgba(99,226,208,.16)';
        ctx.lineWidth = 1;
        for (let x = p.x + 12; x < p.x + p.w - 4; x += 32) {
          ctx.beginPath(); ctx.moveTo(x, p.y + 2); ctx.lineTo(x + 10, p.y + p.h - 2); ctx.stroke();
        }
      }
      ctx.restore();
    }

    drawFragile(ctx, p) {
      if (p.broken) {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = 'rgba(159,232,224,.14)';
        for (let i = 0; i < 7; i++) {
          const x = p.x + (i / 6) * p.w;
          ctx.beginPath();
          ctx.moveTo(x, p.y + p.h); ctx.lineTo(x + 5, p.y + p.h + 10); ctx.lineTo(x + 10, p.y + p.h); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
        return;
      }
      ctx.shadowColor = 'rgba(159,232,224,.25)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = 'rgba(190,240,235,.18)';
      roundRect(ctx, p.x, p.y, p.w, p.h, 3); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(190,255,248,.72)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(220,255,250,.38)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const x = p.x + 16 + i * (p.w / 5.2);
        ctx.beginPath();
        ctx.moveTo(x, p.y + 2); ctx.lineTo(x + 9, p.y + p.h - 2); ctx.lineTo(x + 4, p.y + p.h + 3);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,.22)';
      ctx.fillRect(p.x + 2, p.y, Math.max(0, p.w - 4), 1);
    }

    drawBridge(ctx, p) {
      const open = this.isRequiresMet(p.requires);
      ctx.save();
      if (!open) {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = 'rgba(242,181,107,.3)';
        ctx.fillRect(p.x, p.y + p.h / 2 - 2, 18, 4);
        ctx.fillRect(p.x + p.w - 18, p.y + p.h / 2 - 2, 18, 4);
        ctx.restore();
        return;
      }
      ctx.shadowColor = 'rgba(242,181,107,.20)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = 'rgba(74,55,32,.96)';
      roundRect(ctx, p.x, p.y, p.w, p.h, 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(242,181,107,.55)';
      for (let x = p.x + 4; x < p.x + p.w - 4; x += 18) ctx.fillRect(x, p.y + 2, 12, 2);
      ctx.strokeStyle = 'rgba(242,181,107,.62)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = 'rgba(255,238,204,.25)';
      ctx.fillRect(p.x + 2, p.y + p.h - 2, Math.max(0, p.w - 4), 1);
      ctx.restore();
    }

    drawMover(ctx, m) {
      ctx.save();
      ctx.strokeStyle = 'rgba(242,181,107,.18)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(m.ox + m.w / 2, m.oy); ctx.lineTo(m.x + m.w / 2, m.y); ctx.stroke();
      ctx.fillStyle = '#26364e';
      roundRect(ctx, m.x, m.y, m.w, m.h, 3); ctx.fill();
      ctx.strokeStyle = 'rgba(242,181,107,.85)'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.fillStyle = 'rgba(242,181,107,.62)';
      ctx.fillRect(m.x + 3, m.y, m.w - 6, 2);
      ctx.fillStyle = 'rgba(99,226,208,.16)';
      ctx.fillRect(m.x + 3, m.y + m.h - 2, m.w - 6, 1);
      ctx.fillStyle = 'rgba(255,240,210,.18)';
      for (let x = m.x + 14; x < m.x + m.w - 6; x += 26) ctx.fillRect(x, m.y + 5, 1, 2);
      ctx.restore();
    }

    drawObjects(ctx) {
      for (const o of this.room.objects) {
        if (o.type === 'seal') this.drawSeal(ctx, o);
        else if (o.type === 'bell') this.drawSeal(ctx, o);
        else if (o.type === 'sensor') this.drawSensor(ctx, o);
        else if (o.type === 'mirror') this.drawMirror(ctx, o);
        else if (o.type === 'lamp') this.drawLamp(ctx, o);
        else if (o.type === 'anchor') this.drawAnchor(ctx, o);
        else if (o.type === 'echo') this.drawEcho(ctx, o);
        else if (o.type === 'sign') this.drawSign(ctx, o);
        else if (o.type === 'exit') this.drawExit(ctx, o);
        else if (o.type === 'spike') this.drawSpike(ctx, o);
        else if (o.type === 'deco') this.drawDeco(ctx, o);
      }
    }

    drawSeal(ctx, s) {
      const active = s.active;
      const medium = s.req === 'firm' || s.req === 'notSoft';
      const col = s.req === 'soft' ? '#63e2d0' : medium ? '#ece7da' : s.req === 'any' ? '#9e8cf4' : '#f2b56b';
      const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
      const pulse = s.pulse || 0;
      ctx.save();
      if (active) {
        const g = ctx.createRadialGradient(cx, cy - 8, 2, cx, cy - 8, 70);
        g.addColorStop(0, 'rgba(242,181,107,.28)');
        g.addColorStop(0.4, 'rgba(242,181,107,.08)');
        g.addColorStop(1, 'rgba(242,181,107,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy - 8, 70, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = col;
        ctx.fillRect(cx - 1, cy - 92, 2, 84);
        ctx.globalAlpha = 1;
      }
      // plate
      ctx.fillStyle = active ? 'rgba(242,181,107,.26)' : 'rgba(10,20,32,.94)';
      roundRect(ctx, s.x, s.y, s.w, s.h, 6); ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = active ? 1.8 : 1.2;
      ctx.stroke();
      // floating ring / three crescents
      ctx.strokeStyle = active ? col : 'rgba(236,231,218,.30)';
      ctx.lineWidth = active ? 2 : 1.2;
      ctx.beginPath(); ctx.arc(cx, cy - 14, 22, 0, Math.PI * 2); ctx.stroke();
      const n = s.req === 'any' ? 0 : s.req === 'soft' ? 1 : medium ? 2 : 3;
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / 3);
        ctx.fillStyle = i < n ? col : 'rgba(236,231,218,.12)';
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * 15, cy - 14 + Math.sin(a) * 9, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
      // core
      ctx.fillStyle = active ? '#fff7e8' : 'rgba(236,231,218,.5)';
      ctx.beginPath(); ctx.arc(cx, cy - 14, 2.2, 0, Math.PI * 2); ctx.fill();
      if (s.bell) {
        ctx.fillStyle = active ? '#f2b56b' : 'rgba(236,231,218,.45)';
        ctx.beginPath();
        ctx.moveTo(cx - 11, cy - 52); ctx.quadraticCurveTo(cx, cy - 76, cx + 11, cy - 52);
        ctx.lineTo(cx + 7, cy - 44); ctx.lineTo(cx - 7, cy - 44); ctx.closePath(); ctx.fill();
        ctx.fillRect(cx - 2, cy - 80, 4, 9);
        ctx.fillStyle = 'rgba(255,238,210,.55)';
        ctx.beginPath(); ctx.arc(cx, cy - 42, 2, 0, Math.PI * 2); ctx.fill();
      }
      if (active) {
        ctx.globalAlpha = 0.35 + 0.2 * Math.sin(this.time * 4 + cx);
        ctx.strokeStyle = col;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy - 14, 30 + pulse * 10, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    }

    drawSensor(ctx, s) {
      const active = s.active;
      const col = s.mode === 'lit' ? '#63e2d0' : '#db93ac';
      const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
      ctx.save();
      if (active) {
        const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 48);
        g.addColorStop(0, s.mode === 'lit' ? 'rgba(99,226,208,.35)' : 'rgba(219,147,172,.30)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, 48, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = active ? col : 'rgba(236,231,218,.42)';
      ctx.lineWidth = active ? 2 : 1.3;
      ctx.beginPath();
      ctx.moveTo(cx, s.y + 1); ctx.lineTo(s.x + s.w - 2, cy); ctx.lineTo(cx, s.y + s.h - 1); ctx.lineTo(s.x + 2, cy); ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = active ? col : 'rgba(14,24,38,.92)';
      ctx.globalAlpha = active ? 0.62 : 0.9;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = active ? '#fff' : 'rgba(236,231,218,.55)';
      ctx.beginPath(); ctx.arc(cx, cy, active ? 3 : 2, 0, Math.PI * 2); ctx.fill();
      // mode mark
      ctx.fillStyle = active ? 'rgba(5,10,18,.8)' : 'rgba(236,231,218,.35)';
      ctx.font = '8px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.mode === 'lit' ? '☀' : '☾', cx, s.y - 6);
      ctx.restore();
    }

    drawMirror(ctx, m) {
      const cx = m.x + m.w / 2, cy = m.y + m.h / 2;
      ctx.save();
      if (m.hit) {
        const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 46);
        g.addColorStop(0, 'rgba(255,235,245,.30)');
        g.addColorStop(1, 'rgba(219,147,172,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, 46, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(10,17,29,.95)';
      ctx.fillRect(cx - 2, m.y + m.h - 4, 4, 26);
      ctx.strokeStyle = 'rgba(219,147,172,.62)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, m.w / 2, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = m.hit ? 'rgba(255,225,240,.32)' : 'rgba(219,147,172,.14)';
      ctx.beginPath(); ctx.arc(cx, cy, m.w / 2 - 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = m.hit ? '#fff0f4' : 'rgba(255,238,245,.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (m.ori === '/') { ctx.moveTo(m.x + 7, m.y + m.h - 7); ctx.lineTo(m.x + m.w - 7, m.y + 7); }
      else { ctx.moveTo(m.x + 7, m.y + 7); ctx.lineTo(m.x + m.w - 7, m.y + m.h - 7); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.beginPath(); ctx.arc(cx - 5, cy - 6, 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    drawLamp(ctx, l) {
      ctx.save();
      const g = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, 64);
      g.addColorStop(0, 'rgba(255,235,190,.50)');
      g.addColorStop(0.25, 'rgba(242,181,107,.16)');
      g.addColorStop(1, 'rgba(242,181,107,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(l.x, l.y, 64, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,235,190,.85)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(l.x, l.y, 8, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#fff3cf';
      ctx.beginPath(); ctx.arc(l.x, l.y, 4.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(242,181,107,.48)';
      ctx.beginPath(); ctx.arc(l.x, l.y, 13, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    drawAnchor(ctx, a) {
      const active = a.used;
      const cx = a.x + a.w / 2, cy = a.y + a.h / 2;
      ctx.save();
      if (active) {
        const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 54);
        g.addColorStop(0, 'rgba(180,164,255,.35)');
        g.addColorStop(1, 'rgba(158,140,244,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, 54, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = active ? '#c8bcff' : 'rgba(236,231,218,.45)';
      ctx.lineWidth = active ? 2 : 1.4;
      ctx.beginPath(); ctx.arc(cx, cy - 8, 18, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy - 8, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = active ? 'rgba(158,140,244,.34)' : 'rgba(10,18,30,.9)';
      ctx.beginPath(); ctx.arc(cx, cy - 8, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = active ? '#e1dbff' : 'rgba(236,231,218,.45)';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 34); ctx.lineTo(cx - 6, cy - 22); ctx.lineTo(cx + 6, cy - 22); ctx.closePath(); ctx.fill();
      ctx.fillStyle = active ? 'rgba(225,219,255,.9)' : 'rgba(236,231,218,.4)';
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('↕', cx, cy + 15);
      ctx.restore();
    }

    drawEcho(ctx, e) {
      if (e.taken) return;
      const bob = Math.sin(this.time * 2 + e.x * 0.01) * 4;
      ctx.save();
      if (!this.echoAvailable(e)) ctx.globalAlpha = 0.28;
      ctx.translate(e.x + e.w / 2, e.y + e.h / 2 + bob);
      const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 42);
      g.addColorStop(0, 'rgba(255,225,240,.34)');
      g.addColorStop(1, 'rgba(219,147,172,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.fill();
      ctx.shadowColor = '#db93ac'; ctx.shadowBlur = 22;
      ctx.fillStyle = 'rgba(255,210,232,.42)';
      ctx.beginPath();
      ctx.moveTo(0, -18); ctx.lineTo(12, -4); ctx.lineTo(0, 18); ctx.lineTo(-12, -4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,235,245,.95)'; ctx.lineWidth = 1.4; ctx.stroke();
      ctx.fillStyle = '#fff7fb';
      ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    drawSign(ctx, s) {
      ctx.save();
      ctx.fillStyle = 'rgba(10,17,29,.9)';
      roundRect(ctx, s.x, s.y, s.w, s.h, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(242,181,107,.28)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = 'rgba(242,181,107,.45)';
      ctx.fillRect(s.x + 7, s.y + 9, s.w - 14, 1);
      ctx.fillRect(s.x + 7, s.y + 15, s.w - 20, 1);
      ctx.fillRect(s.x + 7, s.y + 21, s.w - 12, 1);
      ctx.restore();
    }

    drawExit(ctx, e) {
      const open = this.isRequiresMet(e.requires);
      const focused = this.prompt?.obj === e;
      const frame = exitFrame(e);
      const accent = open ? '#63e2d0' : '#e9b579';
      const halfWidth = frame.w / 2;
      const height = frame.h;
      ctx.save();
      ctx.translate(frame.x + halfWidth, frame.inverted ? frame.y : frame.y + frame.h);
      ctx.scale(1, frame.inverted ? -1 : 1);

      if (focused && open) {
        const glow = ctx.createLinearGradient(0, -height, 0, 0);
        glow.addColorStop(0, 'rgba(99,226,208,.12)');
        glow.addColorStop(1, 'rgba(99,226,208,0)');
        roundRect(ctx, -halfWidth, -height, halfWidth * 2, height, 9);
        ctx.fillStyle = glow;
        ctx.fill();
      }
      ctx.strokeStyle = accent;
      ctx.lineWidth = focused ? 2.6 : 1.5;
      ctx.globalAlpha = focused ? 1 : 0.68;
      ctx.beginPath();
      ctx.moveTo(-halfWidth, -3);
      ctx.lineTo(-halfWidth, -height + 11);
      ctx.quadraticCurveTo(-halfWidth, -height, -halfWidth + 11, -height);
      ctx.lineTo(halfWidth - 11, -height);
      ctx.quadraticCurveTo(halfWidth, -height, halfWidth, -height + 11);
      ctx.lineTo(halfWidth, -3);
      ctx.stroke();
      ctx.fillStyle = accent;
      roundRect(ctx, -halfWidth, -4, halfWidth * 2, 4, 2);
      ctx.fill();

      const cy = -height / 2;
      if (open) {
        ctx.beginPath();
        ctx.moveTo(0, cy - 6); ctx.lineTo(5, cy); ctx.lineTo(0, cy + 6);
        ctx.lineTo(-5, cy); ctx.closePath(); ctx.fill();
      } else {
        roundRect(ctx, -5, cy - 1, 10, 8, 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, cy - 1, 3.5, Math.PI, 0);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawSpike(ctx, s) {
      ctx.save();
      ctx.fillStyle = 'rgba(219,147,172,.32)';
      ctx.strokeStyle = 'rgba(219,147,172,.55)';
      ctx.lineWidth = 1;
      if (s.dir === 'up' || s.dir === 'down') {
        const n = Math.max(1, Math.floor(s.w / 18));
        for (let i = 0; i < n; i++) {
          const x = s.x + i * (s.w / n);
          const y = s.dir === 'up' ? s.y + s.h : s.y;
          const d = s.dir === 'up' ? -1 : 1;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s.w / n / 2, y + d * s.h); ctx.lineTo(x + s.w / n, y); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      } else {
        const n = Math.max(1, Math.floor(s.h / 18));
        for (let i = 0; i < n; i++) {
          const y = s.y + i * (s.h / n);
          const x = s.dir === 'left' ? s.x + s.w : s.x;
          const d = s.dir === 'left' ? -1 : 1;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + d * s.w, y + s.h / n / 2); ctx.lineTo(x, y + s.h / n); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      }
      ctx.restore();
    }

    drawDeco(ctx, d) {
      if (d.kind === 'orrery') this.drawOrrery(ctx, d.r || 80, this.time * 0.2, 0.5, false);
    }

    drawPlayer(ctx, p) {
      // trail
      for (const t of p.trail) {
        ctx.globalAlpha = (t.life / 0.34) * 0.18;
        ctx.fillStyle = '#63e2d0';
        ctx.beginPath(); ctx.arc(t.x, t.y, 6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // lantern light pool
      const glowX = p.cx + p.facing * 15, glowY = p.cy + 4 * p.gravitySign;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const lg = ctx.createRadialGradient(glowX, glowY, 2, glowX, glowY, 138);
      lg.addColorStop(0, 'rgba(255,232,188,.30)');
      lg.addColorStop(0.22, 'rgba(242,181,107,.13)');
      lg.addColorStop(0.6, 'rgba(242,181,107,.045)');
      lg.addColorStop(1, 'rgba(242,181,107,0)');
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.arc(glowX, glowY, 138, 0, Math.PI * 2); ctx.fill();
      // small reflection on the floor
      const fy = p.gravitySign > 0 ? p.footY + 2 : p.footY - 2;
      const fg = ctx.createRadialGradient(p.cx, fy, 2, p.cx, fy, 76);
      fg.addColorStop(0, 'rgba(242,181,107,.20)');
      fg.addColorStop(1, 'rgba(242,181,107,0)');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.ellipse(p.cx, fy, 76, 14, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(p.cx, p.cy);
      ctx.scale(p.facing, p.gravitySign);
      const sq = p.squash;
      ctx.scale(1 / Math.sqrt(sq), sq);
      const bob = p.onGround && Math.abs(p.vx) > 10 ? Math.sin(p.anim * 12) * 1.2 : Math.sin(this.time * 2.4) * 0.8;
      // coat
      ctx.fillStyle = '#142338';
      ctx.strokeStyle = 'rgba(236,231,218,.48)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-9, -10 + bob);
      ctx.quadraticCurveTo(-14, 6, -12, 18);
      ctx.lineTo(12, 18);
      ctx.quadraticCurveTo(15, 2, 8, -10 + bob);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // scarf
      ctx.fillStyle = '#e6a0b8';
      ctx.globalAlpha = 0.95;
      ctx.fillRect(-8, -10 + bob, 16, 3);
      ctx.beginPath(); ctx.moveTo(8, -9 + bob); ctx.lineTo(17, -4 + bob); ctx.lineTo(15, 0 + bob); ctx.lineTo(6, -7 + bob); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
      // head
      ctx.fillStyle = '#171f2e';
      ctx.beginPath(); ctx.arc(0, -18 + bob, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ece7da';
      ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.arc(2, -19 + bob, 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      // legs
      const swing = p.onGround ? Math.sin(p.anim * 12) * 4 : 0;
      ctx.strokeStyle = '#0d1929'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-4, 15); ctx.lineTo(-5 + swing, 23); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5, 15); ctx.lineTo(6 - swing, 23); ctx.stroke();
      // arm + lantern
      ctx.strokeStyle = '#0d1929'; ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.moveTo(8, -4 + bob); ctx.lineTo(15, 3 + bob); ctx.stroke();
      ctx.fillStyle = 'rgba(242,181,107,.9)';
      ctx.beginPath(); ctx.arc(16, 4 + bob, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(242,181,107,.7)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(16, 4 + bob, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();

      // impact gauge
      this.drawImpactGauge(ctx, p);
    }

    drawImpactGauge(ctx, p) {
      if (p.onGround && p.landSquash <= 0) return;
      const tier = p.predictedTier();
      const col = tierColor(tier);
      const cx = p.cx, cy = p.footY + (p.gravitySign > 0 ? -2 : 2);
      ctx.save();
      ctx.globalAlpha = 0.8;
      for (let i = 0; i < 3; i++) {
        const active = i <= tier;
        ctx.strokeStyle = active ? col : 'rgba(236,231,218,.16)';
        ctx.lineWidth = active ? 2 : 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 20 + i * 5, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
      }
      if (p.bracing) {
        ctx.fillStyle = 'rgba(99,226,208,.18)';
        ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    drawParticles(ctx) {
      for (const p of this.particles) p.draw(ctx);
    }

    drawHintPulse(ctx) {
      if (this.hintPulse <= 0 || !this.hintPulseTargets.length) return;
      const a = Math.min(1, this.hintPulse) * (0.45 + 0.25 * Math.sin(this.time * 7));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = '#f2b56b';
      ctx.lineWidth = 1.4;
      for (const o of this.hintPulseTargets) {
        const w = o.w || 40, h = o.h || 40;
        const cx = o.x + w / 2, cy = o.y + h / 2;
        const r = Math.max(w, h) / 2 + 14 + Math.sin(this.time * 4 + o.x) * 4;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    }

    drawPrompts(ctx) {
      if (!this.prompt) return;
      const o = this.prompt.obj;
      const label = this.prompt.label || '';
      const center = o.x + (o.w || 40) / 2;
      const y = o.y === 40 && o.type === 'exit' ? o.y + o.h + 28 : o.y - 4;
      ctx.save();
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const w = Math.max(58, ctx.measureText(label).width + 32);
      const x = clamp(center, this.cam.x + w/2 + 8, this.cam.x + VIEW_W - w/2 - 8);
      pill(ctx, x - w / 2, y - 18, w, 24, 'rgba(6,10,18,.88)', 'rgba(242,181,107,.45)');
      ctx.fillStyle = '#f2b56b';
      ctx.fillText('E', x - w / 2 + 12, y - 2);
      ctx.fillStyle = 'rgba(236,231,218,.9)';
      ctx.fillText(label, x + 8, y - 2);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- Particle
  class Particle {
    constructor(x, y, vx, vy, life, color, size, opts) {
      this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.life = life; this.maxLife = life;
      this.color = color; this.size = size; this.opts = opts || {};
    }
    update(dt) {
      this.life -= dt;
      const drag = this.opts.drag == null ? 1 : this.opts.drag;
      this.vx *= Math.pow(drag, dt * 60);
      this.vy *= Math.pow(drag, dt * 60);
      this.vy += (this.opts.gravity || 0) * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }
    draw(ctx) {
      const a = clamp(this.life / this.maxLife, 0, 1);
      ctx.globalAlpha = a * (this.opts.alpha == null ? 1 : this.opts.alpha);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * (0.6 + a * 0.4), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  NO.util = { clamp, lerp, approach, overlap, dist2, tierRank, tierName, tierColor, roundRect, pill, exitFrame, VIEW_W, VIEW_H };
  NO.Input = Input;
  NO.Player = Player;
  NO.Game = Game;
  NO.Particle = Particle;
})();
