(function () {
  'use strict';
  const NO = window.NO = window.NO || {};

  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.musicBus = null;
      this.sfxBus = null;
      this.ambientBus = null;
      this.noise = null;
      this.started = false;
      this.mode = 'title';
      this.target = { music: 0.55, sfx: 0.8, ambient: 0.55 };
      this.vol = { music: 0.65, sfx: 0.8, ambient: 0.55 };
      this.nextNote = 0;
      this.noteIndex = 0;
      this.ambientNodes = null;
      this._musicGain = null;
      this._ambientGain = null;
      this._modeGain = { music: 0.7, ambient: 0.7 };
      this._lastMode = '';
    }

    ensure() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return true;
      }
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        const ctx = this.ctx = new AC();
        this.master = ctx.createGain();
        this.master.gain.value = 0.9;
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -18;
        comp.knee.value = 24;
        comp.ratio.value = 3;
        comp.attack.value = 0.01;
        comp.release.value = 0.25;
        this.master.connect(comp);
        comp.connect(ctx.destination);
        this.musicBus = ctx.createGain();
        this.sfxBus = ctx.createGain();
        this.ambientBus = ctx.createGain();
        this.musicBus.connect(this.master);
        this.sfxBus.connect(this.master);
        this.ambientBus.connect(this.master);
        this._musicGain = this.musicBus.gain;
        this._ambientGain = this.ambientBus.gain;
        this.noise = this.makeNoise(3);
        this.startAmbient();
        this.nextNote = ctx.currentTime + 0.6;
        this.started = true;
        this.applyVolumes();
        this.setMode(this.mode, true);
        return true;
      } catch (e) {
        console.warn('Audio unavailable', e);
        return false;
      }
    }

    makeNoise(seconds) {
      const ctx = this.ctx;
      const len = Math.floor(ctx.sampleRate * seconds);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      }
      return buf;
    }

    startAmbient() {
      const ctx = this.ctx;
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 420;
      lp.Q.value = 0.6;
      const g = ctx.createGain();
      g.gain.value = 0.16;
      src.connect(lp); lp.connect(g); g.connect(this.ambientBus);
      src.start();
      const src2 = ctx.createBufferSource();
      src2.buffer = this.noise;
      src2.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1200;
      bp.Q.value = 0.8;
      const g2 = ctx.createGain();
      g2.gain.value = 0.035;
      src2.connect(bp); bp.connect(g2); g2.connect(this.ambientBus);
      src2.start();
      const drone = ctx.createOscillator();
      drone.type = 'sine';
      drone.frequency.value = 55;
      const dg = ctx.createGain();
      dg.gain.value = 0.045;
      drone.connect(dg); dg.connect(this.ambientBus);
      drone.start();
      this.ambientNodes = { src, lp, g, src2, bp, g2, drone, dg };
    }

    applyVolumes() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      this.musicBus.gain.setTargetAtTime(this.vol.music, t, 0.2);
      this.sfxBus.gain.setTargetAtTime(this.vol.sfx, t, 0.1);
      this.ambientBus.gain.setTargetAtTime(this.vol.ambient, t, 0.3);
    }

    setSettings(settings) {
      this.vol.music = (settings.music == null ? 65 : settings.music) / 100;
      this.vol.sfx = (settings.sfx == null ? 80 : settings.sfx) / 100;
      this.vol.ambient = (settings.ambient == null ? 55 : settings.ambient) / 100;
      if (this.ctx) this.applyVolumes();
    }

    setMode(mode, immediate) {
      this.mode = mode || 'hub';
      if (!this.ctx) return;
      if (this._lastMode === this.mode && !immediate) return;
      this._lastMode = this.mode;
      const ctx = this.ctx;
      const t = ctx.currentTime;
      const musicTargets = { title: 0.42, hub: 0.55, tide: 0.62, light: 0.58, gravity: 0.66, final: 0.74 };
      const ambTargets = { title: 0.50, hub: 0.55, tide: 0.65, light: 0.48, gravity: 0.60, final: 0.70 };
      const mg = musicTargets[this.mode] == null ? 0.55 : musicTargets[this.mode];
      const ag = ambTargets[this.mode] == null ? 0.55 : ambTargets[this.mode];
      this.musicBus.gain.setTargetAtTime(this.vol.music * mg, t, immediate ? 0.05 : 1.2);
      this.ambientBus.gain.setTargetAtTime(this.vol.ambient * ag, t, immediate ? 0.05 : 1.0);
      if (this.ambientNodes) {
        const f = this.mode === 'gravity' ? 300 : this.mode === 'light' ? 620 : this.mode === 'tide' ? 380 : 430;
        this.ambientNodes.lp.frequency.setTargetAtTime(f, t, 1.5);
        this.ambientNodes.drone.frequency.setTargetAtTime(this.mode === 'gravity' ? 41 : this.mode === 'light' ? 82 : 55, t, 1.5);
      }
    }

    update(dt) {
      if (!this.ctx) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;
      if (this.mode === 'title' || this.mode === 'hub' || this.mode === 'tide' || this.mode === 'light' || this.mode === 'gravity' || this.mode === 'final') {
        if (now + 0.2 >= this.nextNote) {
          this.scheduleBar();
          this.nextNote = now + this.barLength();
        }
      }
      if (this.ambientNodes) {
        const lfo = 0.5 + 0.5 * Math.sin(now * 0.11);
        this.ambientNodes.g2.gain.setTargetAtTime(0.018 + lfo * 0.025, now, 1.2);
      }
    }

    barLength() {
      if (this.mode === 'gravity') return 3.4;
      if (this.mode === 'tide') return 3.0;
      if (this.mode === 'light') return 2.8;
      if (this.mode === 'final') return 2.6;
      return 3.2;
    }

    scheduleBar() {
      const ctx = this.ctx;
      const t = ctx.currentTime + 0.04;
      const scales = {
        title: [0, 3, 5, 7, 10],
        hub: [0, 2, 5, 7, 9],
        tide: [0, 3, 5, 7, 10],
        light: [0, 2, 4, 7, 9],
        gravity: [0, 1, 5, 7, 8],
        final: [0, 2, 5, 9, 10]
      };
      const roots = { title: 110, hub: 130.81, tide: 98, light: 146.83, gravity: 82.41, final: 110 };
      const scale = scales[this.mode] || scales.hub;
      const root = roots[this.mode] || 110;
      const idx = this.noteIndex++;
      // pad chord
      const chord = [0, 2, 4].map((n, i) => root * Math.pow(2, (scale[(idx + n) % scale.length] + (i === 2 ? 12 : 0)) / 12));
      for (let i = 0; i < chord.length; i++) {
        this.tone(chord[i], this.barLength() * 1.05, 'sine', 0.018 + i * 0.004, t, null, this.musicBus);
        this.tone(chord[i] * 2, this.barLength() * 0.8, 'triangle', 0.006, t + 0.1, null, this.musicBus);
      }
      // melody
      const note = root * 2 * Math.pow(2, scale[(idx * 3) % scale.length] / 12);
      this.tone(note, 1.4, 'sine', 0.022, t + 0.45, null, this.musicBus);
      if (idx % 2 === 1) this.tone(note * 1.5, 1.1, 'triangle', 0.012, t + 1.2, null, this.musicBus);
      if (idx % 3 === 0) this.tone(root / 2, this.barLength(), 'sine', 0.025, t, null, this.musicBus);
    }

    tone(freq, dur, type, gain, when, slide, bus) {
      if (!this.ctx) return null;
      const ctx = this.ctx;
      const t = when == null ? ctx.currentTime : when;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(Math.max(20, freq), t);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + Math.min(0.04, dur * 0.2));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g);
      g.connect(bus || this.sfxBus);
      osc.start(t);
      osc.stop(t + dur + 0.05);
      return { osc, g };
    }

    noiseBurst(dur, freq, gain, when, type) {
      if (!this.ctx) return;
      const ctx = this.ctx;
      const t = when == null ? ctx.currentTime : when;
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const f = ctx.createBiquadFilter();
      f.type = type || 'lowpass';
      f.frequency.setValueAtTime(freq, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(80, freq * 0.25), t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(this.sfxBus);
      src.start(t);
      src.stop(t + dur + 0.03);
    }

    play(name) {
      if (!this.ctx) return;
      const ctx = this.ctx;
      const t = ctx.currentTime;
      switch (name) {
        case 'jump':
          this.tone(240, 0.13, 'sine', 0.035, t, 520);
          this.noiseBurst(0.08, 900, 0.015, t, 'highpass');
          break;
        case 'landSoft':
          this.noiseBurst(0.09, 380, 0.055, t);
          this.tone(120, 0.08, 'sine', 0.03, t, 80);
          break;
        case 'landFirm':
          this.noiseBurst(0.12, 620, 0.09, t);
          this.tone(110, 0.14, 'triangle', 0.05, t, 70);
          break;
        case 'landHard':
          this.noiseBurst(0.26, 1100, 0.16, t);
          this.tone(72, 0.28, 'sine', 0.10, t, 42);
          this.tone(240, 0.18, 'triangle', 0.04, t, 120);
          break;
        case 'break':
          this.noiseBurst(0.3, 2400, 0.10, t, 'highpass');
          this.tone(520, 0.15, 'triangle', 0.035, t, 160);
          break;
        case 'seal':
          [523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, 0.9, 'sine', 0.035, t + i * 0.06));
          break;
        case 'bell':
          [440, 660, 880, 1320].forEach((f, i) => this.tone(f, 2.4 - i * 0.2, 'sine', 0.035 - i * 0.006, t + i * 0.02));
          this.tone(220, 2.8, 'sine', 0.04, t);
          break;
        case 'door':
          this.tone(90, 0.55, 'sawtooth', 0.025, t, 55);
          this.noiseBurst(0.4, 300, 0.04, t);
          break;
        case 'mirror':
          this.tone(880, 0.05, 'square', 0.02, t, 1200);
          break;
        case 'gravity':
          this.tone(260, 0.55, 'sine', 0.05, t, 110);
          this.noiseBurst(0.45, 800, 0.05, t, 'bandpass');
          break;
        case 'anchor':
          this.tone(65, 0.35, 'sine', 0.08, t, 40);
          [330, 495].forEach((f, i) => this.tone(f, 0.7, 'triangle', 0.025, t + 0.04 + i * 0.02));
          break;
        case 'echo':
          [880, 1108.73, 1318.51, 1760].forEach((f, i) => this.tone(f, 1.2 - i * 0.12, 'sine', 0.028, t + i * 0.05));
          break;
        case 'death':
          this.tone(80, 0.6, 'sine', 0.08, t, 36);
          this.noiseBurst(0.5, 500, 0.06, t);
          break;
        case 'sigil':
          [261.63, 329.63, 392, 523.25].forEach((f, i) => this.tone(f, 1.8, 'sine', 0.03, t + i * 0.08));
          break;
        case 'locked':
          this.tone(180, 0.12, 'square', 0.02, t, 130);
          break;
        case 'ui':
          this.tone(640, 0.04, 'sine', 0.012, t, 900);
          break;
        default:
          break;
      }
    }
  }

  NO.AudioEngine = AudioEngine;
  NO.audio = new AudioEngine();
})();
