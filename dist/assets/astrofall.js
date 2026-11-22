(() => {
  'use strict';

  /* =========================================================
     1. LOCALIZATION (ZH / EN / RU / JA)
     ========================================================= */
  const I18N = {
    zh: {
      title: '星坠天文台',
      badge: '知识锁探索解谜 · 16 间互通星室',
      sub: '在安全的前厅领悟「坠落势能与共振」的法则，再用同一条规则改写光影、震碎秘道、放大弹射，揭开早已摆在眼前的隐秘捷径。',
      start: '开始探索', cont: '继续存档', settings: '设置与存档',
      cores: '星核', shards: '碎片', lunarPhase: '月光相位', starPhase: '星影相位',
      hint: '提示', map: '星图',
      kbMove: 'A/D 移动', kbJump: 'Space 跳跃', kbAct: 'E 互动', kbReset: 'R 重置房间', kbMap: 'M 星图',
      mapTitle: '天文台星图 (16 房间)', mapSub: '金色边框为当前位置 · ★ 星核 · ✦ 隐藏星尘碎片',
      warpHub: '返回大厅 (Hub)', close: '关闭',
      hintTitle: '分层观察提示', tier1: '第一层 · 观察什么', tier2: '第二层 · 规则联想', tier3: '第三层 · 具体做法',
      unlockHint: '点击展开',
      setTitle: '设置与存档管理', langLbl: '界面语言', sfxLbl: '机关与落地震动音效', bgmLbl: '深空环境背景音',
      touchLbl: '屏幕触控按键', handLbl: '左右手布局', sizeLbl: '触控按键尺寸',
      on: '开启', off: '关闭', mute: '静音', auto: '自动', show: '显示', hide: '隐藏',
      handStd: '左手方向', handSwap: '右手方向',
      saveLbl: '跨设备存档码（已自动保存在当前浏览器）', exportSave: '导出并复制', importSave: '导入存档', resetAll: '重置全部进度',
      copied: '存档码已生成并复制到剪贴板', imported: '存档已成功导入！', badSave: '存档码格式无效，请检查后重试',
      resetConfirm: '再点一次确认清空所有进度', resetDone: '已重置为全新存档',
      gotCore: '获得星核：', gotShard: '发现隐藏星尘碎片！',
      doorOpen: '共振能量灌满，远处的星门开启了！',
      phaseShift: '月相棱镜震鸣，光影实体已翻转！',
      needCores: '星象仪需要 4 枚星核才能启动前往穹顶的星桥。',
      astrolabeReady: '四枚星核已就位！按 E 登上星穹之顶。',
      endNormalBadge: '普通结局 · 星象重启',
      endNormalTitle: '星象仪重明',
      endNormalDesc: '四枚星核在穹顶深处重新咬合，沉睡多年的天文台再次对准了北天极。不过，前厅的裂纹玻璃与深渊密室里，似乎还藏着未被唤醒的星尘碎片……',
      endTrueBadge: '真结局 · 星穹共鸣',
      endTrueTitle: '完美的星穹共鸣',
      endTrueDesc: '你不仅修复了四枚星核，更凭借对坠落、光影与动量的彻底领悟，找回了全部 4 枚隐藏星尘碎片。整座天文台化作一座悬于夜空的共振琴弦，向深空奏出清晰的回音。',
      keepExploring: '继续自由探索', backTitle: '返回标题',
      loadSteps: ['初始化星图拓扑与 16 间星室...', '校准重力势能与共振引擎...', '合成深空 Web Audio 声场...', '预缓存邻近星室完成！']
    },
    en: {
      title: 'Astrofall Observatory',
      badge: 'KNOWLEDGE-GATED PLATFORMER · 16 ROOMS',
      sub: 'Discover the rule of falling resonance in a safe room, then bend the same rule to flip lunar light, shatter secret floors, and amplify momentum across 16 interconnected chambers.',
      start: 'Begin Journey', cont: 'Continue', settings: 'Settings & Save',
      cores: 'Cores', shards: 'Shards', lunarPhase: 'Lunar Phase', starPhase: 'Star Phase',
      hint: 'Hints', map: 'Map',
      kbMove: 'A/D Move', kbJump: 'Space Jump', kbAct: 'E Interact', kbReset: 'R Reset Room', kbMap: 'M Map',
      mapTitle: 'Observatory Map (16 Rooms)', mapSub: 'Gold frame: You · ★ Star Core · ✦ Hidden Shard',
      warpHub: 'Warp to Hub', close: 'Close',
      hintTitle: 'Tiered Hints', tier1: 'Tier 1 · What to Observe', tier2: 'Tier 2 · Rule Connection', tier3: 'Tier 3 · Direct Solution',
      unlockHint: 'Reveal',
      setTitle: 'Settings & Save Data', langLbl: 'Language', sfxLbl: 'Sound Effects', bgmLbl: 'Ambient Pad',
      touchLbl: 'Touch Controls', handLbl: 'Hand Layout', sizeLbl: 'Button Size',
      on: 'On', off: 'Off', mute: 'Mute', auto: 'Auto', show: 'Show', hide: 'Hide',
      handStd: 'Left D-Pad', handSwap: 'Right D-Pad',
      saveLbl: 'Cross-device Save Code (Auto-saved in browser)', exportSave: 'Export & Copy', importSave: 'Import Save', resetAll: 'Reset Progress',
      copied: 'Save code copied to clipboard!', imported: 'Save data imported!', badSave: 'Invalid save code.',
      resetConfirm: 'Click once more to confirm full reset', resetDone: 'Progress reset!',
      gotCore: 'Star Core Acquired: ', gotShard: 'Hidden Star Shard Found!',
      doorOpen: 'Resonance full! A distant gate unlocks.',
      phaseShift: 'The prism chimes—lunar and star matter swap!',
      needCores: 'The Astrolabe needs all 4 Star Cores to bridge to the Dome Apex.',
      astrolabeReady: 'All 4 Cores aligned! Press E to ascend to the Dome Apex.',
      endNormalBadge: 'ENDING · ASTROLABE REKINDLED',
      endNormalTitle: 'The Observatory Awakens',
      endNormalDesc: 'All four Star Cores lock into orbit, turning the dome back toward the night sky. Yet beneath cracked glass and high alcoves, hidden Stardust Shards still await.',
      endTrueBadge: 'TRUE ENDING · HARMONIC CONVERGENCE',
      endTrueTitle: 'Perfect Celestial Resonance',
      endTrueDesc: 'With all 4 Star Cores and all 4 hidden Stardust Shards recovered, the entire observatory rings like a glass harp across the cosmos.',
      keepExploring: 'Keep Exploring', backTitle: 'Title Screen',
      loadSteps: ['Mapping 16 interconnected chambers...', 'Calibrating impact resonance physics...', 'Synthesizing Web Audio soundscape...', 'Pre-caching neighboring rooms...']
    },
    ru: {
      title: 'Обсерватория Звездопада',
      badge: 'ПЛАТФОРМЕР-ГОЛОВОЛОМКА · 16 КОМНАТ',
      sub: 'Откройте правило силы падения в безопасном зале, а затем используйте его, чтобы менять свет, ломать скрытые полы и усиливать прыжки в 16 связанных комнатах.',
      start: 'Начать', cont: 'Продолжить', settings: 'Настройки',
      cores: 'Ядра', shards: 'Осколки', lunarPhase: 'Лунная фаза', starPhase: 'Звёздная фаза',
      hint: 'Подсказка', map: 'Карта',
      kbMove: 'A/D Ходьба', kbJump: 'Space Прыжок', kbAct: 'E Действие', kbReset: 'R Сброс', kbMap: 'M Карта',
      mapTitle: 'Карта обсерватории (16 комнат)', mapSub: 'Золотая рамка: вы · ★ Ядро · ✦ Скрытый осколок',
      warpHub: 'В главный зал', close: 'Закрыть',
      hintTitle: 'Пошаговые подсказки', tier1: 'Уровень 1 · Что заметить', tier2: 'Уровень 2 · Связь правил', tier3: 'Уровень 3 · Решение',
      unlockHint: 'Открыть',
      setTitle: 'Настройки и сохранения', langLbl: 'Язык', sfxLbl: 'Звуки механизмов', bgmLbl: 'Фоновый эмбиент',
      touchLbl: 'Сенсорные кнопки', handLbl: 'Раскладка рук', sizeLbl: 'Размер кнопок',
      on: 'Вкл', off: 'Выкл', mute: 'Тихо', auto: 'Авто', show: 'Показать', hide: 'Скрыть',
      handStd: 'Слева ход', handSwap: 'Справа ход',
      saveLbl: 'Код сохранения для переноса', exportSave: 'Экспорт', importSave: 'Импорт', resetAll: 'Сбросить всё',
      copied: 'Код сохранения скопирован!', imported: 'Сохранение загружено!', badSave: 'Неверный код сохранения.',
      resetConfirm: 'Нажмите ещё раз для сброса', resetDone: 'Прогресс сброшен!',
      gotCore: 'Получено ядро: ', gotShard: 'Найден скрытый осколок!',
      doorOpen: 'Резонанс полон — врата открыты!',
      phaseShift: 'Призма звенит — фазы света сменились!',
      needCores: 'Астролябии нужны все 4 звёздных ядра.',
      astrolabeReady: 'Все 4 ядра на месте! Нажмите E для подъёма.',
      endNormalBadge: 'ФИНАЛ · АСТРОЛЯБИЯ ОЖИЛА',
      endNormalTitle: 'Обсерватория пробудилась',
      endNormalDesc: 'Четыре ядра снова вращаются под куполом. Но в тайниках под треснувшим стеклом всё ещё скрыты звёздные осколки...',
      endTrueBadge: 'ИСТИННЫЙ ФИНАЛ · ГАРМОНИЯ',
      endTrueTitle: 'Идеальный звёздный резонанс',
      endTrueDesc: 'Собрав все 4 ядра и все 4 скрытых осколка, вы превратили обсерваторию в единый хрустальный инструмент, поющий в космос.',
      keepExploring: 'Продолжить', backTitle: 'В меню',
      loadSteps: ['Загрузка карты 16 комнат...', 'Калибровка физики падения...', 'Синтез звука Web Audio...', 'Кэширование соседних комнат...']
    },
    ja: {
      title: '星墜ちの天文台',
      badge: '知識ロック探索アクション · 全16室',
      sub: '安全な前室で「落下の衝撃と共鳴」の法則に気づき、同じ法則で光影を反転させ、隠し床を砕き、16の繋がった星室の謎を解き明かしましょう。',
      start: '探索を始める', cont: '続きから', settings: '設定・セーブ',
      cores: '星核', shards: '欠片', lunarPhase: '月光位相', starPhase: '星影位相',
      hint: 'ヒント', map: '星図',
      kbMove: 'A/D 移動', kbJump: 'Space ジャンプ', kbAct: 'E 調べる', kbReset: 'R 部屋リセット', kbMap: 'M 星図',
      mapTitle: '天文台星図 (全16室)', mapSub: '金枠：現在地 · ★ 星核 · ✦ 隠し星屑',
      warpHub: '大広間へ戻る', close: '閉じる',
      hintTitle: '段階ヒント', tier1: '第1段階 · 観察ポイント', tier2: '第2段階 · 法則の応用', tier3: '第3段階 · 具体的な解法',
      unlockHint: '表示する',
      setTitle: '設定・セーブ管理', langLbl: '言語', sfxLbl: '効果音', bgmLbl: '環境BGM',
      touchLbl: 'タッチ操作', handLbl: '左右配置', sizeLbl: 'ボタンサイズ',
      on: 'オン', off: 'オフ', mute: 'ミュート', auto: '自動', show: '表示', hide: '非表示',
      handStd: '左移動', handSwap: '右移動',
      saveLbl: 'セーブコード（ブラウザに自動保存）', exportSave: '書出し＆コピー', importSave: '読込み', resetAll: '進捗を初期化',
      copied: 'セーブコードをコピーしました', imported: 'セーブを読み込みました！', badSave: '無効なセーブコードです',
      resetConfirm: 'もう一度押すと全データを初期化します', resetDone: 'データを初期化しました',
      gotCore: '星核を入手：', gotShard: '隠された星屑の欠片を発見！',
      doorOpen: '共鳴エネルギー満タン！遠くの扉が開いた。',
      phaseShift: 'プリズムが響き、光影の実体が反転した！',
      needCores: '天球儀を起動するには4つの星核が必要です。',
      astrolabeReady: '4つの星核が揃いました！Eキーで穹頂へ。',
      endNormalBadge: 'エンディング · 天球儀再起動',
      endNormalTitle: '星図の再点灯',
      endNormalDesc: '4つの星核が噛み合い、天文台は再び夜空を映し出した。だが、ひび割れたガラスの奥にはまだ隠し欠片が眠っているようだ。',
      endTrueBadge: '真エンディング · 星穹の共鳴',
      endTrueTitle: '完全なる星穹共鳴',
      endTrueDesc: '4つの星核とすべての隠し星屑を集め切った天文台は、夜空へ澄んだ和音を響かせた。',
      keepExploring: '探索を続ける', backTitle: 'タイトルへ',
      loadSteps: ['16室の星図トポロジーを構築中...', '落下共鳴エンジンを校正中...', 'Web Audio環境音を合成中...', '隣接ルームを事前キャッシュ中...']
    }
  };

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
        if (this.bgmOn) this.startAmbient();
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
      const audio = this.ctx;
      const master = audio.createGain();
      master.gain.value = 0.07;
      master.connect(audio.destination);
      const bars = [
        { bass: 45, chord: [57, 64, 72, 76], melody: [76, null, 79, 81, null, 79, 76, null] },
        { bass: 41, chord: [53, 60, 69, 72], melody: [72, null, 76, 77, null, 76, 72, null] },
        { bass: 48, chord: [55, 60, 67, 76], melody: [79, null, 76, 74, null, 76, 79, null] },
        { bass: 43, chord: [55, 62, 67, 71], melody: [83, null, 81, 79, null, 74, 71, null] },
        { bass: 45, chord: [57, 64, 72, 76], melody: [76, null, 79, 81, null, 84, 83, null] },
        { bass: 41, chord: [53, 60, 69, 72], melody: [81, null, 77, 76, null, 72, 76, null] },
        { bass: 50, chord: [57, 62, 65, 69], melody: [77, null, 81, 86, null, 84, 81, null] },
        { bass: 43, chord: [55, 62, 67, 71], melody: [79, null, 74, 71, null, 74, 76, null] }
      ];
      const eighth = 60 / 112 / 2;
      let step = 0;
      let next = audio.currentTime + 0.06;

      const note = (pitch, time, duration, wave, volume) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = wave;
        osc.frequency.value = 440 * 2 ** ((pitch - 69) / 12);
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(volume, time + 0.024);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        osc.connect(gain);
        gain.connect(master);
        osc.start(time);
        osc.stop(time + duration);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      };

      const schedule = () => {
        if (audio.state !== 'running') return;
        if (next < audio.currentTime) next = audio.currentTime + 0.03;
        while (next < audio.currentTime + 0.16) {
          const bar = bars[Math.floor(step / 8)];
          const beat = step % 8;
          note(bar.chord[[0, 1, 2, 1, 3, 2, 1, 2][beat]], next, 0.32, 'sine', 0.15);
          if (beat === 0 || beat === 4) note(bar.bass, next, 0.51, 'sine', 0.24);
          if (bar.melody[beat] !== null) note(bar.melody[beat], next, 0.29, 'triangle', 0.15);
          step = (step + 1) % (bars.length * 8);
          next += eighth;
        }
      };
      this.bgmNodes = { master, timer: setInterval(schedule, 50) };
      schedule();
    }
    stopAmbient() {
      if (!this.bgmNodes) return;
      const { master, timer } = this.bgmNodes;
      clearInterval(timer);
      master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.025);
      setTimeout(() => master.disconnect(), 180);
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

  /* =========================================================
     3. 16-ROOM INTERCONNECTED WORLD DEFINITION (960 x 540)
     Physics reference:
       Jump height: ~96px | Flat jump width: ~175px
       Heavy impact: landVy >= 585 (drop >= ~125px, or jump off 60px ledge)
       Spring pad: normal jump bounce ~160px, heavy drop bounce ~235px
     ========================================================= */
  const W = 960, H = 540;

  function makeRooms() {
    return {
      /* --- H0 (1,2): START ROOM — Safe Discovery of Heavy Landing + Secret Cracked Glass + Return Spring Shortcut --- */
      H0: {
        id: 'H0', gx: 1, gy: 2, zone: 'hub',
        name: { zh: '星门前厅', en: 'Observatory Porch', ru: 'Порог обсерватории', ja: '星門の前室' },
        spawn: { x: 160, y: 450 },
        hints: {
          zh: [
            '右侧发光导管把地面上的铜金共振板和东侧大门连在了一起。普通跳跃踩上去时，能量条只亮了一半。',
            '落地时的速度越高，冲击能量越强。左侧阶梯能带你爬到高处。',
            '顺着左侧阶梯跳到最高平台，再纵身落到中央铜金共振板上（重落），即可充能打开东门。此外，左下角带裂纹的玻璃和右上角弹射垫在学会更多技巧后都值得回来一试！'
          ],
          en: [
            'A glowing conduit links the brass resonance plate to the east gate. A normal jump only fills it halfway.',
            'Higher falls create stronger landing impact. Climb the safe terraces on the left.',
            'Jump from the highest left terrace onto the brass plate to trigger a Heavy Landing and open the east gate. Remember the cracked glass floor and spring pad for later!'
          ],
          ru: [
            'Светящаяся линия соединяет медную плиту с восточной дверью. Обычный прыжок заряжает её лишь наполовину.',
            'Чем выше падение, тем сильнее удар. Поднимитесь по уступам слева.',
            'Спрыгните с верхней левой площадки прямо на медную плиту, чтобы открыть дверь. Позже вернитесь к треснувшему стеклу внизу!'
          ],
          ja: [
            '光の導線が床の共鳴板と東の扉を繋いでいます。普通のジャンプでは半分しか光りません。',
            '高い場所から落ちるほど衝撃が強くなります。左側の段差を登ってみましょう。',
            '左の一番高い足場から共鳴板へ落下（重着地）すると東の扉が開きます。ひび割れた床と弾射パッドも覚えておきましょう。'
          ]
        },
        stele: {
          x: 245, y: 468,
          text: {
            zh: '「高度即力量——从高处落下，唤醒脚下的共振。」',
            en: '"Height is resonance—fall from above to awaken the brass."',
            ru: '«Высота рождает резонанс — упади сверху, чтобы пробудить медь.»',
            ja: '「高さは共鳴なり——高みより落ち、足元の真鍮を呼び覚ませ。」'
          }
        },
        solids: [
          { x: 0, y: 0, w: 420, h: 30 }, { x: 540, y: 0, w: 420, h: 30 }, // top gap 420..540 -> W1
          { x: 0, y: 30, w: 30, h: 330 }, // left wall (bottom gap 360..510 gated by shortcut door d_w3_h0)
          { x: 930, y: 30, w: 30, h: 350 }, // right wall (gap 380..510 -> H1)
          { x: 0, y: 510, w: 120, h: 30 }, { x: 240, y: 510, w: 720, h: 30 }, // bottom gap 120..240 covered by cracked glass!
          // Safe staircase on the left
          { x: 30, y: 420, w: 110, h: 24 },
          { x: 110, y: 340, w: 120, h: 24 },
          { x: 200, y: 255, w: 145, h: 24 },
          // Upper balcony leading toward top exit W1 (reachable via heavy spring launch!)
          { x: 350, y: 125, w: 110, h: 22 },
          { x: 560, y: 200, w: 140, h: 22 }
        ],
        glass: [
          { id: 'g_h0_secret', x: 120, y: 510, w: 120, h: 26, persistent: true } // Secret drop to S1!
        ],
        plates: [
          { id: 'p_h0_door', x: 430, y: 498, w: 84, h: 12, req: 2, action: 'openDoor', target: 'd_h0_east' }
        ],
        doors: [
          { id: 'd_h0_east', x: 930, y: 380, w: 28, h: 130, open: false },
          { id: 'd_w3_h0', x: 0, y: 360, w: 28, h: 150, open: false } // Opened from W3!
        ],
        springs: [
          { x: 600, y: 496, w: 56, h: 14 }, // Jump from upper ledge onto this spring to reach upper balcony & W1!
          { x: 605, y: 186, w: 50, h: 14 }  // Second boost to reach top exit W1 (y=0)
        ],
        exits: [
          { dir: 'right', to: 'H1', tx: 54, ty: 455 },
          { dir: 'down', to: 'S1', tx: 180, ty: 56 },
          { dir: 'up', to: 'W1', tx: 565, ty: 455 },
          { dir: 'left', to: 'W3', tx: 880, ty: 455 }
        ]
      },

      /* --- H1 (2,2): CENTRAL HUB (Grand Rotunda) --- */
      H1: {
        id: 'H1', gx: 2, gy: 2, zone: 'hub',
        name: { zh: '天文台大厅', en: 'Grand Rotunda', ru: 'Главный зал', ja: '天文台大広間' },
        spawn: { x: 120, y: 455 },
        hints: {
          zh: [
            '这里是整座天文台的枢纽。向东是共振工坊，向上可去星轨钟楼，脚下中央还嵌着一块带裂纹的星尘玻璃。',
            '用重落震碎中央的裂纹玻璃可以直接坠入南部的深渊星井；集齐 4 枚星核后，可在中央星象仪按 E 登上穹顶。',
            '先向东进入「阶梯试炼」，或借右侧台阶跳上弹射垫前往北区的「摆渡长厅」。'
          ],
          en: [
            'This is the central hub. East leads to the Resonance Workshop, North to the Belfry, and a cracked glass panel lies in the center floor.',
            'Heavy-drop onto the center cracked glass to enter the Abyssal Well below. Collect 4 Star Cores to activate the central Astrolabe.',
            'Head East first, or use the spring pad on the mid-terrace to climb North into the Starlight Belfry.'
          ],
          ru: [
            'Главный зал. На востоке — мастерская, на севере — колокольня, а в центре пола — треснувшее стекло.',
            'Разбейте стекло в центре тяжёлым падением, чтобы спуститься вниз. Соберите 4 ядра для активации астролябии.',
            'Идите на восток или используйте батут, чтобы подняться на север.'
          ],
          ja: [
            '天文台の中央ハブです。東は共鳴工房、北は星軌鐘楼、中央の床にはひび割れたガラスがあります。',
            '中央のガラスを重着地で砕くと南の深淵へ降りられます。4つの星核を集めたら中央の天球儀でEキーを押しましょう。',
            'まずは東へ進むか、中央の弾射パッドを使って北へ昇ってみましょう。'
          ]
        },
        astrolabe: { x: 480, y: 360 },
        solids: [
          { x: 0, y: 0, w: 420, h: 30 }, { x: 540, y: 0, w: 420, h: 30 }, // top gap 420..540 -> N1
          { x: 0, y: 30, w: 30, h: 350 }, // left gap 380..510 -> H0
          { x: 930, y: 30, w: 30, h: 350 }, // right gap 380..510 -> E1
          { x: 0, y: 510, w: 420, h: 30 }, { x: 540, y: 510, w: 420, h: 30 }, // bottom gap 420..540 -> S2 (glass)
          // Hub terraces
          { x: 180, y: 420, w: 120, h: 22 },
          { x: 660, y: 420, w: 120, h: 22 },
          { x: 250, y: 320, w: 140, h: 22 },
          { x: 570, y: 320, w: 140, h: 22 },
          { x: 400, y: 205, w: 160, h: 22 }
        ],
        glass: [
          { id: 'g_h1_abyss', x: 420, y: 510, w: 120, h: 26, persistent: true }
        ],
        springs: [
          { x: 452, y: 191, w: 56, h: 14 }, // Launches cleanly up through top gap to N1!
          { x: 300, y: 306, w: 50, h: 14 }
        ],
        exits: [
          { dir: 'left', to: 'H0', tx: 880, ty: 455 },
          { dir: 'right', to: 'E1', tx: 54, ty: 455 },
          { dir: 'up', to: 'N1', tx: 375, ty: 455 },
          { dir: 'down', to: 'S2', tx: 480, ty: 56 }
        ]
      },

      /* --- E1 (3,2): ZONE 1-1 — Resonance Chaining & Falling Weight --- */
      E1: {
        id: 'E1', gx: 3, gy: 2, zone: 'east',
        name: { zh: '阶梯试炼', en: 'Resonance Terrace', ru: 'Терраса резонанса', ja: '階段の試練' },
        spawn: { x: 60, y: 455 },
        hints: {
          zh: [
            '右侧高台太高，直接跳不上去；但天花板上悬着一块连着金色导管的星钟重锤。',
            '左侧有一块铜金共振板，重落砸响它会震落悬锤，重锤落地后就能充当新的垫脚石。',
            '先跳到中层平台再重落砸中左侧共振板，等重锤落下后借它跳上东侧通道！'
          ],
          en: [
            'The eastern ledge is too high to jump directly, but a counterweight hangs from the ceiling wired to a brass plate.',
            'Heavy-drop onto the left resonance plate to shake the hanging weight loose.',
            'Jump from the middle platform onto the left brass plate, then use the fallen stone weight as a stepping block to reach the east exit.'
          ],
          ru: [
            'Восточный уступ слишком высок, но сверху висит противовес, связанный с плитой.',
            'Ударьте тяжёлым падением по левой плите, чтобы сбросить противовес.',
            'Спрыгните со средней платформы на левую плиту и используйте упавший блок как ступеньку.'
          ],
          ja: [
            '東の足場は高すぎますが、天井に導線で繋がった重りが吊るされています。',
            '左の共鳴板に重着地すると、重りが落ちて足場になります。',
            '中段の足場から左の共鳴板へ落ち、落ちてきた重りを使って東へ進みましょう。'
          ]
        },
        solids: [
          { x: 0, y: 0, w: 380, h: 30 }, { x: 500, y: 0, w: 460, h: 30 }, // top drop from N2
          { x: 0, y: 30, w: 30, h: 350 }, // left -> H1
          { x: 930, y: 30, w: 30, h: 250 }, { x: 930, y: 400, w: 30, h: 110 }, // right gap 280..400 -> E2
          { x: 0, y: 510, w: 960, h: 30 },
          { x: 740, y: 400, w: 190, h: 110 }, // high east ledge (110px above floor, needs weight!)
          { x: 120, y: 420, w: 110, h: 22 },
          { x: 250, y: 330, w: 130, h: 22 }
        ],
        plates: [
          { id: 'p_e1_wt', x: 390, y: 498, w: 84, h: 12, req: 2, action: 'dropWeight', target: 'wt_e1' }
        ],
        weights: [
          { id: 'wt_e1', x: 645, y: 120, w: 68, h: 52, restY: 458, dropped: false }
        ],
        exits: [
          { dir: 'left', to: 'H1', tx: 880, ty: 455 },
          { dir: 'right', to: 'E2', tx: 54, ty: 345 }
        ]
      },

      /* --- E2 (4,2): ZONE 1-2 — Fragile Glass Bridge (Light vs Heavy) + Shard #4 --- */
      E2: {
        id: 'E2', gx: 4, gy: 2, zone: 'east',
        name: { zh: '脆化栈道', en: 'Brittle Skywalk', ru: 'Хрупкий мост', ja: '脆化ガラスの桟橋' },
        spawn: { x: 60, y: 345 },
        hints: {
          zh: [
            '脚下的裂纹玻璃很特别：轻走或普通小跳不会碎，但从高处重落会瞬间将它震碎。',
            '通往「共振核心」的路在下方！故意从高台重落砸穿右侧底部玻璃就能下去。',
            '想拿顶部阁楼的星尘碎片，需要借右侧弹射垫上去后，轻跳/步行通过上层玻璃桥（不要从高处重砸它）。'
          ],
          en: [
            'Cracked glass holds steady under footsteps and normal hops, but shatters under a Heavy Landing.',
            'The path to the Resonance Core lies below! Drop from a high platform onto the bottom-right cracked glass to break through.',
            'For the hidden Shard in the upper attic, bounce up on the right spring and walk or low-hop gently across the upper glass.'
          ],
          ru: [
            'Треснувшее стекло выдерживает ходьбу и обычный прыжок, но разбивается от тяжёлого падения.',
            'Путь к ядру внизу! Спрыгните с высоты на нижнее правое стекло.',
            'Для осколка наверху подпрыгните на батуте и аккуратно пройдите по верхнему стеклу.'
          ],
          ja: [
            'ひび割れたガラスは歩行や通常ジャンプでは割れませんが、重着地で砕けます。',
            '下層へ行くには高い足場から右下のガラスへ重着地して突き破りましょう。',
            '上の隠し欠片は弾射パッドで昇った後、重着地しないよう慎重に渡って取ります。'
          ]
        },
        stele: {
          x: 110, y: 358,
          text: {
            zh: '「轻步可渡薄冰，重坠方开秘途。」',
            en: '"Tread lightly to cross; fall heavy to break through."',
            ru: '«Ступай легко, чтобы пройти; упади тяжело, чтобы пробить путь.»',
            ja: '「軽く歩めば橋となり、重く落ちれば道が開く。」'
          }
        },
        solids: [
          { x: 0, y: 0, w: 960, h: 30 },
          { x: 0, y: 30, w: 30, h: 250 }, { x: 0, y: 400, w: 30, h: 110 }, // left gap 280..400 -> E1
          { x: 930, y: 30, w: 30, h: 480 },
          { x: 0, y: 510, w: 690, h: 30 }, { x: 830, y: 510, w: 130, h: 30 }, // bottom gap 690..830 -> E3 (glass)
          { x: 30, y: 400, w: 170, h: 110 }, // entrance ledge
          { x: 420, y: 330, w: 160, h: 22 }, // high diving platform!
          { x: 720, y: 320, w: 160, h: 22 }, // platform right above bottom glass
          // Upper attic for Hidden Shard #4
          { x: 120, y: 170, w: 150, h: 22 },
          { x: 540, y: 170, w: 160, h: 22 },
          { x: 760, y: 190, w: 120, h: 22 }
        ],
        glass: [
          { id: 'g_e2_mid', x: 200, y: 400, w: 180, h: 22, persistent: false },
          { id: 'g_e2_attic', x: 270, y: 170, w: 270, h: 22, persistent: false }, // Cross lightly for Shard #4!
          { id: 'g_e2_floor', x: 690, y: 510, w: 140, h: 26, persistent: true }   // Smash heavily to enter E3!
        ],
        springs: [
          { x: 835, y: 306, w: 50, h: 14 }, // Bounce up to attic (y=190)
          { x: 290, y: 496, w: 54, h: 14 }  // Recovery spring from bottom floor back up
        ],
        shards: [
          { id: 'shard_4', x: 185, y: 130 }
        ],
        exits: [
          { dir: 'left', to: 'E1', tx: 880, ty: 345 },
          { dir: 'down', to: 'E3', tx: 760, ty: 56 }
        ]
      },

      /* --- E3 (4,3): ZONE 1-3 — Resonance Core Room (Core I) --- */
      E3: {
        id: 'E3', gx: 4, gy: 3, zone: 'east',
        name: { zh: '共振核心', en: 'Resonance Core', ru: 'Ядро резонанса', ja: '共鳴の中枢' },
        spawn: { x: 760, y: 60 },
        hints: {
          zh: [
            '星核Ⅰ被锁在左侧石室内，下方共振板需要重落才能打开内门与西侧捷径。',
            '先在右侧平台重落砸响右侧共振板，震落悬锤；再站上悬锤跳向高台，纵身重落砸中中央共振板！',
            '打开星核门后，左侧直通深渊交响室的捷径也会一并解锁。'
          ],
          en: [
            'Core I sits behind an inner gate wired to the center resonance plate.',
            'First heavy-drop onto the right plate to drop the counterweight. Use it to reach the high balcony, then dive onto the center plate!',
            'Opening the center gate unlocks both Core I and the western shortcut.'
          ],
          ru: [
            'Ядро I за дверью, подключённой к центральной плите.',
            'Сначала сбросьте противовес правой плитой, заберитесь выше и ударьте по центральной плите.',
            'Это откроет путь к Ядру I и короткий проход на запад.'
          ],
          ja: [
            '星核Ⅰは中央の共鳴板に繋がれた扉の奥にあります。',
            'まず右の共鳴板で重りを落とし、そこから高台へ登って中央の共鳴板へ重着地しましょう。',
            '扉が開くと星核Ⅰと西へのショートカットが同時に解放されます。'
          ]
        },
        solids: [
          { x: 0, y: 0, w: 690, h: 30 }, { x: 830, y: 0, w: 130, h: 30 }, // top from E2
          { x: 0, y: 30, w: 30, h: 350 }, // left gap 380..510 -> S3
          { x: 930, y: 30, w: 30, h: 480 },
          { x: 0, y: 510, w: 960, h: 30 },
          // Core chamber ceiling
          { x: 30, y: 350, w: 230, h: 24 },
          // Right dive ledge
          { x: 690, y: 310, w: 180, h: 22 },
          // High center balcony
          { x: 430, y: 215, w: 160, h: 22 },
          { x: 640, y: 170, w: 90, h: 22 }
        ],
        plates: [
          { id: 'p_e3_wt', x: 750, y: 498, w: 80, h: 12, req: 2, action: 'dropWeight', target: 'wt_e3' },
          { id: 'p_e3_door', x: 410, y: 498, w: 90, h: 12, req: 2, action: 'openDoor', target: 'd_e3_core' }
        ],
        weights: [
          { id: 'wt_e3', x: 575, y: 80, w: 64, h: 52, restY: 390, dropped: false } // lands on mid step? Let's rest on floor y=458 + spring!
        ],
        springs: [
          { x: 855, y: 496, w: 54, h: 14 }, // Bounce back up to right dive ledge & E2
          { x: 575, y: 390, w: 50, h: 14, onlyAfterWeight: 'wt_e3' } // wait: simpler -> place spring at x=645 y=496 that reaches y=310, and weight at y=458 lets you reach y=310 -> y=215!
        ],
        doors: [
          { id: 'd_e3_core', x: 235, y: 374, w: 24, h: 136, open: false }
        ],
        cores: [
          { id: 'core_1', name: { zh: '引力之核', en: 'Gravity Core', ru: 'Ядро гравитации', ja: '引力の星核' }, x: 135, y: 455 }
        ],
        exits: [
          { dir: 'up', to: 'E2', tx: 635, ty: 455 },
          { dir: 'left', to: 'S3', tx: 880, ty: 455 }
        ]
      },

      /* --- N1 (2,1): ZONE 3-1 — Moving Platform Momentum & Springs --- */
      N1: {
        id: 'N1', gx: 2, gy: 1, zone: 'north',
        name: { zh: '摆渡长厅', en: 'Pendulum Hall', ru: 'Зал маятника', ja: '渡り廊下の広間' },
        spawn: { x: 375, y: 455 },
        hints: {
          zh: [
            '在移动平台顺着前进方向起跳时，你会继承平台的惯性，飞得比平时远得多。',
            '向西可进入月相棱镜阁（双色长廊），向东可去双级弹射塔，正上方则是星轨穹顶。',
            '沿左侧台阶登上西侧高台，向右跳到中央弹射垫，再借力穿过天窗。'
          ],
          en: [
            'Jumping in the same direction a platform is moving transfers its horizontal momentum, letting you clear wide gaps.',
            'West leads to the Lunar Gallery, East to the Spring Tower, and straight up is the Starlight Dome.',
            'Climb the west steps, jump right to the central spring, then ride it through the skylight.'
          ],
          ru: [
            'Прыжок по ходу движения платформы передаёт импульс и увеличивает дальность.',
            'На запад — лунная галерея, на восток — башня батутов, вверх — купол.',
            'Поднимитесь по западным ступеням, прыгните вправо к центральному батуту и взлетите через верхний проход.'
          ],
          ja: [
            '移動足場の進行方向へジャンプすると慣性が乗り、普段より遠くへ跳べます。',
            '西は月相の回廊、東は弾射の塔、真上は星軌の穹頂へ繋がっています。',
            '左の段を登り、西の足場から中央の弾射パッドへ跳ぶと、天窓から上の部屋に入れます。'
          ]
        },
        stele: {
          x: 390, y: 468,
          text: {
            zh: '「顺势起跳可越星河；重落弹垫可触穹顶。」',
            en: '"Jump with the drift to cross the gulf; fall heavy on springs to touch the sky."',
            ru: '«Прыгай по ходу движения; падай тяжело на батут, чтобы достать небо.»',
            ja: '「流れに乗りて星河を越え、重く落ちて穹頂へ跳べ。」'
          }
        },
        solids: [
          { x: 0, y: 0, w: 420, h: 30 }, { x: 540, y: 0, w: 420, h: 30 }, // top -> N3
          { x: 0, y: 30, w: 30, h: 350 }, // left -> W1
          { x: 930, y: 30, w: 30, h: 350 }, // right -> N2
          { x: 0, y: 510, w: 420, h: 30 }, { x: 540, y: 510, w: 420, h: 30 }, // bottom -> H1
          { x: 30, y: 435, w: 140, h: 22 },
          { x: 175, y: 364, w: 85, h: 18 },
          { x: 780, y: 370, w: 150, h: 22 },
          { x: 240, y: 290, w: 140, h: 22 }, // dive platform for center spring!
          { x: 580, y: 240, w: 140, h: 22 }
        ],
        movers: [
          { x: 320, y: 428, w: 110, h: 20, x1: 220, x2: 610, y1: 428, y2: 428, speed: 155 }
        ],
        springs: [
          { x: 452, y: 496, w: 56, h: 14 }, // Wait: bottom gap is 420..540! Put spring on solid at x=452 y=260? Let's put a bridge platform at x=420 y=380? Better: solid floor bridge or side spring!
          { x: 452, y: 220, w: 56, h: 14 }  // Mounted on upper center bridge -> let's add that solid!
        ],
        exits: [
          { dir: 'down', to: 'H1', tx: 480, ty: 60 },
          { dir: 'left', to: 'W1', tx: 880, ty: 455 },
          { dir: 'right', to: 'N2', tx: 54, ty: 455 },
          { dir: 'up', to: 'N3', tx: 570, ty: 455 }
        ]
      },

      /* --- N2 (3,1): ZONE 3-2 — Dual Spring Tower + Hidden Shard #2 + Shortcut to E1 --- */
      N2: {
        id: 'N2', gx: 3, gy: 1, zone: 'north',
        name: { zh: '双级弹射塔', en: 'Twin-Spring Spire', ru: 'Башня батутов', ja: '二段弾射の塔' },
        spawn: { x: 60, y: 455 },
        hints: {
          zh: [
            '落到弹射垫上的速度越快，弹得越高。普通跳上去够不到顶层，但从高台砸下来就可以。',
            '先跳上左侧中台，再重落砸中底部弹射垫，一口气弹到右上高台！',
            '顶部平台藏着隐藏星尘碎片 #2；而右下角裂纹玻璃砸穿后，可直接速降至东区「阶梯试炼」。'
          ],
          en: [
            'Springs amplify your falling speed. A normal jump falls short, but diving from a ledge launches you much higher.',
            'Climb the left step, then drop heavily onto the bottom spring to reach the upper-right tier!',
            'Grab Hidden Shard #2 at the summit, or smash the bottom-right cracked glass for a shortcut down to East Zone.'
          ],
          ru: [
            'Батуты усиливают скорость падения. Прыгните с уступа, чтобы взлететь выше.',
            'Заберитесь на левый уступ и упадите на нижний батут, чтобы достичь верхнего яруса.',
            'Наверху спрятан Осколок #2, а стекло справа открывает спуск в восточную зону.'
          ],
          ja: [
            '弾射パッドは落下速度を増幅します。高い位置から落ちるほど高く跳ね上がります。',
            '左の段差から下の弾射パッドへ重着地して上層へ一気に飛び上がりましょう。',
            '頂上には隠し欠片#2があり、右下のガラスを砕くと東エリアへの近道になります。'
          ]
        },
        solids: [
          { x: 0, y: 0, w: 960, h: 30 },
          { x: 0, y: 30, w: 30, h: 350 }, // left -> N1
          { x: 930, y: 30, w: 30, h: 480 },
          { x: 0, y: 510, w: 380, h: 30 }, { x: 500, y: 510, w: 460, h: 30 }, // bottom gap 380..500 -> E1 (glass)
          { x: 80, y: 420, w: 120, h: 22 },
          { x: 160, y: 330, w: 130, h: 22 }, // dive ledge 1
          { x: 540, y: 270, w: 150, h: 22 }, // reached from heavy spring 1!
          { x: 240, y: 155, w: 170, h: 22 }  // summit for Shard #2!
        ],
        glass: [
          { id: 'g_n2_east', x: 380, y: 510, w: 120, h: 26, persistent: true }
        ],
        springs: [
          { x: 310, y: 496, w: 60, h: 14 }, // dive from (160,330) -> bounce ~230px up to y=270!
          { x: 585, y: 256, w: 54, h: 14 }  // bounce left-up to summit (240,155)!
        ],
        shards: [
          { id: 'shard_2', x: 325, y: 115 }
        ],
        exits: [
          { dir: 'left', to: 'N1', tx: 880, ty: 455 },
          { dir: 'down', to: 'E1', tx: 440, ty: 56 }
        ]
      },

      /* --- N3 (2,0): ZONE 3-3 — Starlight Dome (Core III) --- */
      N3: {
        id: 'N3', gx: 2, gy: 0, zone: 'north',
        name: { zh: '星轨穹顶', en: 'Starlight Belfry', ru: 'Звёздная колокольня', ja: '星軌の穹頂' },
        spawn: { x: 570, y: 455 },
        hints: {
          zh: [
            '星核Ⅲ在左侧封闭星室内，需要重落砸响高处的铜金共振板才能开门。',
            '从右侧台阶跳上弹射垫，升过高台后向左落在台上，再从左缘落向铜板。',
            '拿到星核Ⅲ后，直接从底部开口落回「摆渡长厅」即可。'
          ],
          en: [
            'Core III is locked on the left; its brass resonance plate sits on the mid-right ledge.',
            'Take the right-hand steps to the spring. Steer left once above the high perch, land, then drop off its left edge onto the plate.',
            'Once Core III is yours, drop back down to Pendulum Hall.'
          ],
          ru: [
            'Ядро III заперто слева, а его плита находится на среднем правом уступе.',
            'Поднимитесь по правым ступеням к батуту. Взлетев выше площадки, сместитесь влево, приземлитесь и сойдите с левого края на плиту.',
            'Собрав Ядро III, вернитесь вниз в Зал маятника.'
          ],
          ja: [
            '星核Ⅲは左の扉の奥にあり、共鳴板は右の中段に置かれています。',
            '右の段から弾射パッドへ。高台より上に出たら左へ着地し、その左端から共鳴板に落ちましょう。',
            '星核Ⅲを取ったら下の出口から戻れます。'
          ]
        },
        solids: [
          { x: 0, y: 0, w: 960, h: 30 },
          { x: 0, y: 30, w: 30, h: 480 },
          { x: 930, y: 30, w: 30, h: 480 },
          { x: 0, y: 510, w: 420, h: 30 }, { x: 540, y: 510, w: 420, h: 30 }, // bottom -> N1
          // Left Core III vault
          { x: 30, y: 350, w: 220, h: 24 },
          // Right side tower
          { x: 705, y: 465, w: 76, h: 18 },
          { x: 770, y: 400, w: 160, h: 22 },
          { x: 694, y: 200, w: 109, h: 22 }, // Leave clear space above the spring.
          { x: 560, y: 360, w: 140, h: 22 }  // plate ledge
        ],
        movers: [
          { x: 310, y: 390, w: 100, h: 20, x1: 270, x2: 520, y1: 390, y2: 390, speed: 150 }
        ],
        springs: [
          { x: 820, y: 386, w: 54, h: 14, minimum: 850 }
        ],
        plates: [
          { id: 'p_n3_core', x: 588, y: 348, w: 84, h: 12, req: 2, action: 'openDoor', target: 'd_n3_core' }
        ],
        doors: [
          { id: 'd_n3_core', x: 225, y: 374, w: 24, h: 136, open: false }
        ],
        cores: [
          { id: 'core_3', name: { zh: '动量之核', en: 'Momentum Core', ru: 'Ядро импульса', ja: '運動量の星核' }, x: 125, y: 475 }
        ],
        exits: [
          { dir: 'down', to: 'N1', tx: 590, ty: 65 }
        ]
      },

      /* --- W1 (1,1): ZONE 2-1 — Lunar/Star Phase Discovery --- */
      W1: {
        id: 'W1', gx: 1, gy: 1, zone: 'west',
        name: { zh: '双色长廊', en: 'Lunar Gallery', ru: 'Лунная галерея', ja: '二色の回廊' },
        spawn: { x: 860, y: 455 },
        hints: {
          zh: [
            '触碰发光的月相棱镜（菱形晶体）可以切换房间的光影相位：青蓝色月光台与紫金色星影台交替实体化。',
            '先在月光相位跳上青蓝平台，触碰空中的棱镜切换成星影相位，就能踩着紫金平台一路向西！',
            '底部开口直通起始房间「星门前厅」，是一条非常方便的回程捷径。'
          ],
          en: [
            'Touch the floating diamond Prism to flip the room between Lunar (cyan) and Star (violet) solid platforms.',
            'Climb the cyan Lunar ledges, hit the prism to solidify the violet Star bridge, and cross west.',
            'The bottom opening drops straight back into the Observatory Porch.'
          ],
          ru: [
            'Коснитесь кристалла-призмы, чтобы переключить твёрдые платформы между бирюзовой и фиолетовой фазами.',
            'Заберитесь по бирюзовым уступам, коснитесь призмы и пройдите по фиолетовому мосту на запад.',
            'Нижний проём ведёт прямо назад в стартовую комнату.'
          ],
          ja: [
            '浮かぶ菱形のプリズムに触れると、青（月光）と紫（星影）の足場の実体が入れ替わります。',
            '青の足場からプリズムに触れて紫の橋を実体化させ、西へ進みましょう。',
            '下の開口部は最初の「星門の前室」へ戻る近道です。'
          ]
        },
        stele: {
          x: 770, y: 468,
          text: {
            zh: '「月光凝青，星影凝紫——触碰棱镜，虚实易位。」',
            en: '"Cyan under Moon, Violet under Stars—touch the prism to invert matter."',
            ru: '«Бирюза при Луне, фиолет при Звёздах — коснись призмы.»',
            ja: '「月光は青を結び、星影は紫を結ぶ——プリズムに触れよ。」'
          }
        },
        initialPhase: 0,
        solids: [
          { x: 0, y: 0, w: 960, h: 30 },
          { x: 0, y: 30, w: 30, h: 250 }, { x: 0, y: 400, w: 30, h: 110 }, // left gap 280..400 -> W2
          { x: 930, y: 30, w: 30, h: 350 }, // right gap 380..510 -> N1
          { x: 0, y: 510, w: 420, h: 30 }, { x: 540, y: 510, w: 420, h: 30 }, // bottom gap 420..540 -> H0
          { x: 30, y: 400, w: 120, h: 110 }, // west exit ledge
          { x: 640, y: 430, w: 110, h: 22 }
        ],
        phaseSolids: [
          { x: 520, y: 350, w: 120, h: 22, phase: 0 }, // Lunar (cyan)
          { x: 340, y: 320, w: 140, h: 22, phase: 1 }, // Star (violet)
          { x: 170, y: 360, w: 130, h: 22, phase: 1 }  // Star (violet) -> leads to west exit!
        ],
        prisms: [
          { x: 575, y: 295 }
        ],
        exits: [
          { dir: 'right', to: 'N1', tx: 54, ty: 455 },
          { dir: 'left', to: 'W2', tx: 880, ty: 345 },
          { dir: 'down', to: 'H0', tx: 480, ty: 60 }
        ]
      },

      /* --- W2 (0,1): ZONE 2-2 — Remote Resonance Prism (THE AHA! RULE COMBINATION) --- */
      W2: {
        id: 'W2', gx: 0, gy: 1, zone: 'west',
        name: { zh: '棱镜回声室', en: 'Echo Prism Chamber', ru: 'Зал эха призм', ja: 'プリズム残響室' },
        spawn: { x: 860, y: 345 },
        hints: {
          zh: [
            '房间左上角的月相棱镜被玻璃墙围住了，你根本碰不到它——但一条金色导管把它和地面的铜金共振板连在了一起！',
            '还记得前厅学到的第一条规则吗？用「重落」砸响共振板，冲击波就能隔空震响被关住的棱镜！',
            '从入口平台跳下重落砸中底部共振板，翻转月相让左侧星影桥显现，即可前往南方的「月蚀圣坛」。'
          ],
          en: [
            'The Lunar Prism is sealed behind solid walls—you cannot touch it directly. Notice the golden conduit linking it to the floor plate!',
            'Use your very first rule: a Heavy Landing on the brass plate sends a shockwave to chime the sealed prism remotely!',
            'Drop from the right entrance ledge onto the brass plate to flip phase, solidify the violet bridge, and descend to the Lunar Altar.'
          ],
          ru: [
            'Призма запечатана за стеной, но золотая линия связывает её с плитой на полу!',
            'Примените первое правило: тяжёлое падение на плиту удалённо переключит призму.',
            'Спрыгните с правого входа на плиту, чтобы проявить фиолетовый мост к выходу вниз.'
          ],
          ja: [
            'プリズムは壁の中に閉じ込められていて触れませんが、床の共鳴板と導線で繋がっています。',
            '最初に覚えた法則を使いましょう。共鳴板へ重着地すれば、遠隔でプリズムを鳴らせます！',
            '右の足場から共鳴板へ落ちて位相を反転させ、現れた足場から南の聖壇へ降りましょう。'
          ]
        },
        initialPhase: 0,
        solids: [
          { x: 0, y: 0, w: 960, h: 30 },
          { x: 0, y: 30, w: 30, h: 480 },
          { x: 930, y: 30, w: 30, h: 250 }, { x: 930, y: 400, w: 30, h: 110 }, // right -> W1
          { x: 0, y: 510, w: 120, h: 30 }, { x: 240, y: 510, w: 720, h: 30 }, // bottom gap 120..240 -> W3
          { x: 760, y: 400, w: 170, h: 110 }, // entrance ledge (110px high -> perfect dive height!)
          // Sealed prism glass box (visual showcase of unreachable prism!)
          { x: 140, y: 90, w: 120, h: 16 }, { x: 140, y: 180, w: 120, h: 16 },
          { x: 140, y: 106, w: 16, h: 74 }, { x: 244, y: 106, w: 16, h: 74 },
          // Wall blocking direct walk to bottom-left exit unless phase flips!
          { x: 310, y: 360, w: 26, h: 150 },
          { x: 530, y: 453, w: 60, h: 18 }
        ],
        phaseSolids: [
          { x: 310, y: 240, w: 26, h: 120, phase: 0 }, // Cyan barrier blocking jump over wall in phase 0!
          { x: 420, y: 390, w: 120, h: 22, phase: 1 }, // Violet stepping stone in phase 1!
          { x: 190, y: 340, w: 110, h: 22, phase: 1 }  // Violet ledge over the wall in phase 1!
        ],
        plates: [
          { id: 'p_w2_phase', x: 590, y: 498, w: 88, h: 12, req: 2, action: 'togglePhase', target: 'prism_w2' }
        ],
        prisms: [
          { id: 'prism_w2', x: 200, y: 142, remoteOnly: true }
        ],
        springs: [
          { x: 690, y: 496, w: 50, h: 14 } // easy return to entrance ledge
        ],
        exits: [
          { dir: 'right', to: 'W1', tx: 54, ty: 345 },
          { dir: 'down', to: 'W3', tx: 180, ty: 56 }
        ]
      },

      /* --- W3 (0,2): ZONE 2-3 — Lunar Altar (Core II + Shortcut back to H0 + Secret Drop to S4) --- */
      W3: {
        id: 'W3', gx: 0, gy: 2, zone: 'west',
        name: { zh: '月蚀圣坛', en: 'Eclipse Altar', ru: 'Алтарь затмения', ja: '月蝕の聖壇' },
        spawn: { x: 180, y: 60 },
        hints: {
          zh: [
            '星核Ⅱ悬在中央月光高台之上；右下角共振板连着东侧通往起始房间「星门前厅」的捷径大门。',
            '利用左侧棱镜切换相位爬到星核Ⅱ，再重落砸响右下共振板，直接打通回家的近路！',
            '别忘了留意左下角地板上那块微微发亮的裂纹玻璃——重落砸穿它，会通往隐藏的星渊密藏室。'
          ],
          en: [
            'Core II rests on the central altar; the brass plate on the right unlocks a shortcut straight back to the starting room (H0).',
            'Use the prism to reach Core II, then heavy-drop on the right plate to open the eastern shortcut gate.',
            'Notice the cracked glass in the bottom-left floor—heavy-drop through it to uncover a secret vault!'
          ],
          ru: [
            'Ядро II на центральном алтаре, а плита справа открывает короткий путь назад в стартовую комнату.',
            'Переключите фазу призмой ради Ядра II, затем ударьте по правой плите.',
            'Треснувшее стекло внизу слева скрывает тайник!'
          ],
          ja: [
            '中央の祭壇に星核Ⅱがあり、右の共鳴板は最初の前室へ戻るショートカット扉に繋がっています。',
            'プリズムで足場を切り替えて星核Ⅱを取り、右の共鳴板へ重着地して近道を開けましょう。',
            '左下のひび割れたガラスを重着地で砕くと隠し部屋へ降りられます。'
          ]
        },
        initialPhase: 0,
        solids: [
          { x: 0, y: 0, w: 120, h: 30 }, { x: 240, y: 0, w: 720, h: 30 }, // top from W2
          { x: 0, y: 30, w: 30, h: 480 },
          { x: 930, y: 30, w: 30, h: 330 }, // right gap 360..510 -> H0 (gated by d_w3_h0 synced!)
          { x: 0, y: 510, w: 120, h: 30 }, { x: 240, y: 510, w: 720, h: 30 }, // bottom gap 120..240 -> S4 (glass)
          { x: 30, y: 370, w: 140, h: 22 },
          { x: 170, y: 433, w: 68, h: 18 },
          { x: 562, y: 427, w: 78, h: 18 },
          { x: 400, y: 260, w: 160, h: 24 }, // Core II altar
          { x: 640, y: 340, w: 130, h: 22 }  // dive ledge for shortcut plate
        ],
        phaseSolids: [
          { x: 220, y: 330, w: 130, h: 22, phase: 0 },
          { x: 260, y: 240, w: 120, h: 22, phase: 1 }
        ],
        prisms: [
          { x: 285, y: 295 }
        ],
        glass: [
          { id: 'g_w3_vault', x: 120, y: 510, w: 120, h: 26, persistent: true }
        ],
        plates: [
          { id: 'p_w3_short', x: 760, y: 498, w: 84, h: 12, req: 2, action: 'openDoor', target: 'd_w3_h0' }
        ],
        doors: [
          { id: 'd_w3_h0', x: 930, y: 360, w: 28, h: 150, open: false }
        ],
        cores: [
          { id: 'core_2', name: { zh: '月相之核', en: 'Lunar Core', ru: 'Лунное ядро', ja: '月相の星核' }, x: 480, y: 215 }
        ],
        exits: [
          { dir: 'right', to: 'H0', tx: 54, ty: 455 },
          { dir: 'down', to: 'S4', tx: 180, ty: 56 }
        ]
      },

      /* --- S1 (1,3): SECRET BASEMENT UNDER START ROOM (Hidden Shard #1) --- */
      S1: {
        id: 'S1', gx: 1, gy: 3, zone: 'south',
        name: { zh: '前厅地下秘室', en: 'Porch Undercroft', ru: 'Подземелье порога', ja: '前室の地下秘室' },
        spawn: { x: 180, y: 60 },
        hints: {
          zh: [
            '你砸穿了起始房间脚下的裂纹玻璃！这枚隐藏星尘碎片从一开始就在你脚下。',
            '向右可进入「静默深井」，向左可通往「星渊密藏室」。',
            '如果想回到上方的星门前厅，借左侧阶梯与弹射垫即可轻松回去。'
          ],
          en: [
            'You shattered the floor right beneath the starting room! Hidden Shard #1 was under your feet all along.',
            'East leads into the Silent Well; West connects to the Abyssal Vault.',
            'Use the spring pad on the left terrace to bounce right back up to the Porch.'
          ],
          ru: [
            'Вы пробили пол прямо под стартовой комнатой! Осколок #1 всё время был под ногами.',
            'На восток — Тихий колодец, на запад — Тайник бездны.',
            'Используйте батут слева, чтобы вернуться наверх.'
          ],
          ja: [
            '最初の部屋の床を突き破りました！隠し欠片#1はずっと足元にあったのです。',
            '東は静寂の井戸、西は星淵の秘蔵室へ繋がっています。',
            '左の弾射パッドを使えば上の前室へ戻れます。'
          ]
        },
        solids: [
          { x: 0, y: 0, w: 120, h: 30 }, { x: 240, y: 0, w: 720, h: 30 }, // top -> H0
          { x: 0, y: 30, w: 30, h: 350 }, // left -> S4
          { x: 930, y: 30, w: 30, h: 350 }, // right -> S2
          { x: 0, y: 510, w: 960, h: 30 },
          { x: 360, y: 370, w: 240, h: 24 }, // Shard #1 pedestal
          { x: 120, y: 240, w: 120, h: 22 }  // return ledge
        ],
        springs: [
          { x: 260, y: 496, w: 56, h: 14 },
          { x: 155, y: 226, w: 50, h: 14 } // shoots straight up to H0!
        ],
        shards: [
          { id: 'shard_1', x: 480, y: 325 }
        ],
        exits: [
          { dir: 'up', to: 'H0', tx: 275, ty: 455 },
          { dir: 'right', to: 'S2', tx: 54, ty: 455 },
          { dir: 'left', to: 'S4', tx: 880, ty: 455 }
        ]
      },

      /* --- S2 (2,3): ZONE 4-1 — Silent Well (Glass + Remote Phase) --- */
      S2: {
        id: 'S2', gx: 2, gy: 3, zone: 'south',
        name: { zh: '静默深井', en: 'Silent Well', ru: 'Тихий колодец', ja: '静寂の星井戸' },
        spawn: { x: 480, y: 60 },
        hints: {
          zh: [
            '右侧通道被月光屏障封锁，必须用重落砸响中央共振板翻转相位才能放行。',
            '站在左侧平台起跳，重落砸中中央共振板，屏障消失后即可向东进入「交响核心」。',
            '向西可连通「前厅地下秘室」，借顶部弹射垫也能直接回到天文台大厅。'
          ],
          en: [
            'A cyan Lunar barrier blocks the eastern exit. Heavy-drop onto the center brass plate to flip the room phase!',
            'Jump from the left ledge onto the center plate, then pass cleanly to the east.',
            'West connects to the Porch Undercroft, and the spring pads let you climb back to the Hub.'
          ],
          ru: [
            'Бирюзовый барьер блокирует выход на восток. Ударьте по центральной плите, чтобы сменить фазу.',
            'Спрыгните с левого уступа на плиту и пройдите на восток.',
            'На запад — подземелье порога, а батуты вернут вас в главный зал.'
          ],
          ja: [
            '東の出口は青の月光障壁で塞がれています。中央の共鳴板へ重着地して位相を反転させましょう。',
            '左の足場から中央の共鳴板へ飛び降りれば障壁が消えます。',
            '西は地下秘室、弾射パッドを使えば大広間へ戻れます。'
          ]
        },
        initialPhase: 0,
        solids: [
          { x: 0, y: 0, w: 420, h: 30 }, { x: 540, y: 0, w: 420, h: 30 }, // top -> H1
          { x: 0, y: 30, w: 30, h: 350 }, // left -> S1
          { x: 930, y: 30, w: 30, h: 350 }, // right -> S3
          { x: 0, y: 510, w: 960, h: 30 },
          { x: 140, y: 340, w: 150, h: 22 }, // dive ledge
          { x: 420, y: 230, w: 120, h: 22 }  // return spring ledge
        ],
        phaseSolids: [
          { x: 780, y: 350, w: 28, h: 160, phase: 0 }, // Blocks east exit in Lunar phase!
          { x: 640, y: 390, w: 110, h: 22, phase: 1 }  // Helps cross in Star phase
        ],
        plates: [
          { id: 'p_s2_phase', x: 436, y: 498, w: 88, h: 12, req: 2, action: 'togglePhase', target: 'prism_s2' }
        ],
        prisms: [
          { id: 'prism_s2', x: 840, y: 150, remoteOnly: true }
        ],
        springs: [
          { x: 310, y: 496, w: 54, h: 14 },
          { x: 455, y: 216, w: 50, h: 14 } // back up to H1!
        ],
        exits: [
          { dir: 'up', to: 'H1', tx: 365, ty: 455 },
          { dir: 'left', to: 'S1', tx: 880, ty: 455 },
          { dir: 'right', to: 'S3', tx: 54, ty: 455 }
        ]
      },

      /* --- S3 (3,3): ZONE 4-2 — Grand Synthesis Chamber (Core IV) --- */
      S3: {
        id: 'S3', gx: 3, gy: 3, zone: 'south',
        name: { zh: '交响核心', en: 'Harmonic Nexus', ru: 'Гармонический узел', ja: '交響の中枢' },
        spawn: { x: 60, y: 455 },
        hints: {
          zh: [
            '这里是三条规则的终极交响：移动平台惯性 + 弹射势能 + 重落远程共振。',
            '先踩上移动平台借惯性跳向右侧高台，重落砸响平台上的共振板，翻转月相让上层星影桥显现！',
            '顺着显现的星影桥与弹射垫直抵上方圣坛，取走最后一枚星核Ⅳ（星律之核）！'
          ],
          en: [
            'All three rules unite here: platform momentum, spring amplification, and remote resonance.',
            'Ride the moving platform to leap onto the right ledge and heavy-drop on the brass plate to solidify the violet upper path.',
            'Take the spring pad up to the violet bridge and claim Core IV!'
          ],
          ru: [
            'Здесь объединены все три правила: импульс, батут и удалённый резонанс.',
            'Прыгните с движущейся платформы на правый уступ и ударьте по плите, чтобы проявить фиолетовый путь.',
            'Поднимитесь на батуте к Ядру IV!'
          ],
          ja: [
            '移動慣性・弾射増幅・遠隔共鳴の3つの法則が交わる部屋です。',
            '移動足場から右へ飛び、共鳴板へ重着地して上層の紫の橋を実体化させましょう。',
            '弾射パッドで上へ跳び、星核Ⅳ（星律の星核）を手に入れましょう！'
          ]
        },
        initialPhase: 0,
        solids: [
          { x: 0, y: 0, w: 960, h: 30 },
          { x: 0, y: 30, w: 30, h: 350 }, // left -> S2
          { x: 930, y: 30, w: 30, h: 350 }, // right -> E3
          { x: 0, y: 510, w: 960, h: 30 },
          { x: 640, y: 350, w: 160, h: 22 }, // dive perch
          { x: 380, y: 170, w: 200, h: 24 }  // Core IV high altar
        ],
        phaseSolids: [
          { x: 630, y: 220, w: 90, h: 22, phase: 1 }, // Violet bridge to Core IV!
          { x: 200, y: 240, w: 130, h: 22, phase: 0 }
        ],
        movers: [
          { x: 240, y: 429, w: 110, h: 20, x1: 140, x2: 565, y1: 429, y2: 429, speed: 160 }
        ],
        springs: [
          { x: 825, y: 496, w: 56, h: 14, minimum: 730 }, // Launches to right perch y=350
          { x: 744, y: 336, w: 42, h: 14, minimum: 680 }  // Launches up to violet bridge y=220!
        ],
        plates: [
          { id: 'p_s3_phase', x: 560, y: 498, w: 88, h: 12, req: 2, action: 'togglePhase', target: 'prism_s3' }
        ],
        prisms: [
          { id: 'prism_s3', x: 480, y: 90, remoteOnly: true }
        ],
        cores: [
          { id: 'core_4', name: { zh: '星律之核', en: 'Harmonic Core', ru: 'Ядро гармонии', ja: '星律の星核' }, x: 480, y: 128 }
        ],
        exits: [
          { dir: 'left', to: 'S2', tx: 880, ty: 455 },
          { dir: 'right', to: 'E3', tx: 54, ty: 455 }
        ]
      },

      /* --- S4 (0,3): SECRET ABYSSAL VAULT (Hidden Shard #3) --- */
      S4: {
        id: 'S4', gx: 0, gy: 3, zone: 'south',
        name: { zh: '星渊密藏室', en: 'Abyssal Vault', ru: 'Тайник бездны', ja: '星淵の秘蔵室' },
        spawn: { x: 860, y: 455 },
        hints: {
          zh: [
            '星尘碎片 #3 藏在左侧光影高台之上，必须先用重落砸碎上方隔层或震响棱镜。',
            '爬上右侧高台，重落砸中中央共振板切换月相，再借弹射垫一跃而上拿走碎片！',
            '拿到后直接向东走出，即可返回地下秘室。'
          ],
          en: [
            'Hidden Shard #3 rests on the high violet altar on the left.',
            'Dive from the right platform onto the center plate to flip phase, then spring up to claim Shard #3!',
            'Exit east to return to the Porch Undercroft.'
          ],
          ru: [
            'Осколок #3 находится на высоком фиолетовом алтаре слева.',
            'Спрыгните справа на центральную плиту, чтобы сменить фазу, и взлетите на батуте.',
            'Выход на восток ведёт в подземелье порога.'
          ],
          ja: [
            '隠し欠片#3は左上の紫の祭壇にあります。',
            '右の高台から中央の共鳴板へ重着地して位相を切り替え、弾射パッドで飛び上がりましょう。',
            '東へ進めば地下秘室へ戻れます。'
          ]
        },
        initialPhase: 0,
        solids: [
          { x: 0, y: 0, w: 120, h: 30 }, { x: 240, y: 0, w: 720, h: 30 }, // top drop from W3
          { x: 0, y: 30, w: 30, h: 480 },
          { x: 930, y: 30, w: 30, h: 350 }, // right -> S1
          { x: 0, y: 510, w: 960, h: 30 },
          { x: 640, y: 350, w: 150, h: 22 }, // dive ledge
          { x: 110, y: 195, w: 150, h: 22 }  // Shard #3 altar
        ],
        phaseSolids: [
          { x: 310, y: 265, w: 140, h: 22, phase: 1 } // Violet stepping bridge
        ],
        plates: [
          { id: 'p_s4_phase', x: 480, y: 498, w: 88, h: 12, req: 2, action: 'togglePhase', target: 'prism_s4' }
        ],
        prisms: [
          { id: 'prism_s4', x: 185, y: 115, remoteOnly: true }
        ],
        springs: [
          { x: 720, y: 496, w: 54, h: 14 },
          { x: 355, y: 496, w: 54, h: 14 }
        ],
        shards: [
          { id: 'shard_3', x: 185, y: 150 }
        ],
        exits: [
          { dir: 'right', to: 'S1', tx: 54, ty: 455 }
        ]
      },

      /* --- H2 (3,0): FINALE — DOME APEX --- */
      H2: {
        id: 'H2', gx: 3, gy: 0, zone: 'finale',
        name: { zh: '星穹之顶', en: 'Dome Apex', ru: 'Вершина купола', ja: '星穹の頂' },
        spawn: { x: 160, y: 455 },
        hints: {
          zh: [
            '你已经集齐了四枚星核！爬上左侧观星台，纵身重落砸响中央的「终章共振祭坛」，唤醒整座天文台。',
            '这就是你在第一个房间学会的那条法则——如今它足以点亮整片夜空。',
            '从左侧高台跳下，重落砸中中央金色祭坛即可触发结局。'
          ],
          en: [
            'You have gathered all four Star Cores! Climb the left terrace and Heavy-Drop onto the Grand Resonance Altar.',
            'The very first rule you discovered now rekindles the entire night sky.',
            'Dive from the left balcony onto the golden center altar to trigger the finale.'
          ],
          ru: [
            'Все 4 ядра собраны! Поднимитесь на левый уступ и ударьте тяжёлым падением по центральному алтарю.',
            'Первое правило, которое вы открыли, пробудит всю обсерваторию.',
            'Спрыгните слева на золотую плиту в центре.'
          ],
          ja: [
            '4つの星核が揃いました！左の高台から中央の終章共鳴祭壇へ重着地し、天文台を目覚めさせましょう。',
            '最初の部屋で気づいたあの法則が、今や夜空全体を照らします。',
            '左の高台から中央の金色の祭壇へ飛び降りるとエンディングです。'
          ]
        },
        solids: [
          { x: 0, y: 0, w: 960, h: 30 },
          { x: 0, y: 30, w: 30, h: 480 },
          { x: 930, y: 30, w: 30, h: 480 },
          { x: 0, y: 510, w: 960, h: 30 },
          { x: 80, y: 420, w: 120, h: 22 },
          { x: 170, y: 330, w: 130, h: 22 },
          { x: 260, y: 248, w: 140, h: 22 }
        ],
        plates: [
          { id: 'p_finale', x: 430, y: 498, w: 100, h: 12, req: 2, action: 'finale', target: 'ending' }
        ],
        exits: []
      }
    };
  }

  // Patch N1 center bridge for spring pad so it doesn't float over bottom exit
  const ROOMS = makeRooms();
  const languages = ['zh','en','ru','ja'];
  const previewText = {
    zh: {returnToNotes:'返回公测文章', impact:'落地', grades:['轻落','中落','重落'], fullscreen:'横屏全屏', exitFullscreen:'退出全屏', rotate:'横过手机可获得更大的操作空间', glassLocked:'玻璃的铜扣连着工坊悬锤。', copied:'已复制存档码', copyManual:'存档码已生成，可从输入框复制。', confirm:'开始新探索会清空当前进度。确定继续？', saveCode:'存档码', preview:'开发试玩版 · 16 间星室', reset:'返回本房间入口', audio:'切换机关音效', left:'向左', right:'向右', jump:'跳跃', act:'互动'},
    en: {returnToNotes:'Back to the playtest article', impact:'Landing', grades:['Light','Medium','Heavy'], fullscreen:'Enter fullscreen', exitFullscreen:'Exit fullscreen', rotate:'Rotate your phone for more room to play', glassLocked:'The glass latch is wired to the Workshop counterweight.', copied:'Save code copied', copyManual:'Save code generated. Copy it from the field.', confirm:'Start over and clear your current exploration?', saveCode:'Save code', preview:'Development preview · 16 rooms', reset:'Return to room entrance', audio:'Toggle sound effects', left:'Left', right:'Right', jump:'Jump', act:'Interact'},
    ru: {returnToNotes:'Назад к статье о тестировании', impact:'Удар', grades:['Лёгкий','Средний','Тяжёлый'], fullscreen:'Во весь экран', exitFullscreen:'Выйти из полноэкранного режима', rotate:'Поверните телефон для удобной игры', glassLocked:'Защёлка стекла соединена с противовесом мастерской.', copied:'Код сохранения скопирован', copyManual:'Код создан. Скопируйте его из поля.', confirm:'Начать заново и стереть текущий прогресс?', saveCode:'Код сохранения', preview:'Версия для тестирования · 16 комнат', reset:'Вернуться ко входу в комнату', audio:'Переключить звуковые эффекты', left:'Влево', right:'Вправо', jump:'Прыжок', act:'Действие'},
    ja: {returnToNotes:'プレイテスト記事に戻る', impact:'着地', grades:['軽','中','重'], fullscreen:'全画面', exitFullscreen:'全画面を終了', rotate:'端末を横向きにすると操作しやすくなります', glassLocked:'ガラスの留め具は工房の重りにつながっています。', copied:'セーブコードをコピーしました', copyManual:'セーブコードを生成しました。入力欄からコピーできます。', confirm:'現在の進行状況を消して最初から遊びますか？', saveCode:'セーブコード', preview:'開発プレビュー · 全16室', reset:'部屋の入口に戻る', audio:'効果音の切り替え', left:'左', right:'右', jump:'ジャンプ', act:'調べる'}
  };

  // Separate the low practice ledge from the high drop, leaving a safe floor under both.
  ROOMS.H0.spawn = { x: 294, y: 482 };
  ROOMS.H0.solids.splice(6, 5,
    { x: 38, y: 432, w: 88, h: 18 },
    { x: 91, y: 352, w: 64, h: 18 },
    { x: 326, y: 431, w: 102, h: 18 },
    { x: 424, y: 354, w: 98, h: 18 },
    { x: 602, y: 210, w: 86, h: 18 }
  );
  ROOMS.H0.solids.push({ x: 672, y: 288, w: 132, h: 18 });
  ROOMS.H0.plates[0].x = 520;
  ROOMS.H0.plates[0].w = 102;
  ROOMS.H0.stele.x = 298;
  ROOMS.H0.glass[0].requiresWeight = 'wt_e1';
  ROOMS.H0.springs = [
    { x: 702, y: 496, w: 62, h: 14, minimum: 825 },
    { x: 618, y: 196, w: 55, h: 14, minimum: 825 }
  ];
  ROOMS.H0.hints = {
    zh:['观察铜板的刻度。走过去、原地跳、从高处落下时，刻度一样吗？','从矮台边缘走下，与从矮台上起跳再落下，可以落在同一块板上。','先跳上中间的两级台阶，再向右落到铜板。工坊悬锤落下后，可以回来试试左边的裂纹玻璃。'],
    en:['Watch the brass gauge. What changes when you walk onto it, hop, or drop from higher up?','Walking off a ledge and jumping off it can put you on the same plate at different speeds.','Climb the two center steps and drop right onto the plate. After releasing the Workshop counterweight, return to the cracked floor on the left.'],
    ru:['Посмотрите на шкалу медной плиты. Сравните обычный шаг, прыжок и падение с высоты.','С одной и той же площадки можно сойти или спрыгнуть на плиту с разной скоростью.','Поднимитесь по двум средним ступеням и упадите на плиту справа. Сбросив противовес в мастерской, вернитесь к треснувшему полу слева.'],
    ja:['真鍮板の目盛りに注目しましょう。歩く、小さく跳ぶ、高所から落ちると何が違うでしょう？','足場から歩いて降りる場合と跳んで降りる場合では、同じ板でも着地の速さが違います。','中央の二段を登り、右の板に落ちましょう。工房の重りを落としたら左のひび割れた床に戻れます。']
  };
  ROOMS.E1.solids.find(p => p.x === 120 && p.y === 420).y = 432;
  ROOMS.E1.solids.find(p => p.x === 250 && p.y === 330).y = 355;
  ROOMS.H1.astrolabe.y = 420;
  ROOMS.H1.solids.find(p => p.x === 180 && p.y === 420).y = 432;
  ROOMS.H1.solids.find(p => p.x === 660 && p.y === 420).y = 432;
  ROOMS.H1.solids.find(p => p.x === 250 && p.y === 320).y = 350;
  ROOMS.H1.solids.find(p => p.x === 570 && p.y === 320).y = 350;
  ROOMS.H1.solids.find(p => p.x === 400 && p.y === 205).y = 264;
  ROOMS.H1.springs[0].y = 250;
  ROOMS.H1.springs[0].minimum = 895;
  ROOMS.H1.springs[1].y = 336;


  ROOMS.N1.solids.push({ x: 420, y: 234, w: 120, h: 18 }); // Holds upper spring at y=220 cleanly!
  // Remove bottom-gap overlapping spring in N1, replace with solid floor spring at x=330
  ROOMS.N1.springs = [
    { x: 389, y: 496, w: 31, h: 14, minimum: 825 }, // Alternate route to the west ledge.
    { x: 452, y: 220, w: 56, h: 14, minimum: 850 } // Launches through the top gap to N3.
  ];
  // Fix E3 weight & spring layout so E3 is 100% smooth and climbable
  ROOMS.E3.weights = [
    { id: 'wt_e3', x: 585, y: 90, w: 72, h: 52, restY: 458, dropped: false }
  ];
  ROOMS.E3.springs = [
    { x: 850, y: 496, w: 56, h: 14 }, // back up to right dive ledge (690, 310) -> and E2
    { x: 700, y: 296, w: 48, h: 14 }  // on right dive ledge? Put on (690,310) at x=700 so player can bounce up to (640,170) & E2!
  ];
  ROOMS.E3.solids.push({ x: 545, y: 370, w: 90, h: 20 }); // mid step reachable from dropped weight at 458!

  /* =========================================================
     4. GAME STATE & SAVE SYSTEM
     ========================================================= */
  const SAVE_KEY = 'astrofall_observatory_save_v2';
  const LEGACY_SAVE_KEY = 'astrofall_observatory_save_v1';
  const savedLists = {
    visited: new Set(Object.keys(ROOMS)),
    openedDoors: allowedIds('doors'), brokenGlass: allowedIds('glass'),
    droppedWeights: allowedIds('weights'), cores: allowedIds('cores'), shards: allowedIds('shards')
  };
  function allowedIds(group) {
    return new Set(Object.values(ROOMS).flatMap(room => (room[group] || []).map(item => item.id)));
  }
  const defaultState = () => ({
    version: 2, started: false, roomId: 'H0', phases: {},
    visited: ['H0'],
    openedDoors: [],
    brokenGlass: [],
    droppedWeights: [],
    cores: [],
    shards: [],
    lang: document.documentElement.dataset.locale || 'zh',
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
    if (!input || !Object.hasOwn(ROOMS, input.roomId) || (input.version !== undefined && input.version !== 2)) {
      throw new Error('Invalid observatory save');
    }
    const result = defaultState();
    result.started = input.version === 2 ? input.started === true : true;
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
      const raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem(LEGACY_SAVE_KEY);
      if (raw) state = normalizeSave(JSON.parse(raw));
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
  let prismCooldown = 0;
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
  let resetConfirmArm = false;

  // Input
  const keys = { left: false, right: false, jumpJust: false, actJust: false };

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
    currentCourse = prepareRoom(roomId);
    lastImpact = null;
    state.roomId = roomId;
    if (!state.visited.includes(roomId)) state.visited.push(roomId);
    preCacheNeighbors(roomId);

    roomPhase = state.phases[roomId] ?? r.initialPhase ?? 0;
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
    prismCooldown = 0;
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
  const narrowViewport = matchMedia('(max-width: 860px)');
  let immersive = false;

  function updateFullscreen() {
    const active = immersive || document.fullscreenElement === app;
    fullscreenButton.setAttribute('aria-pressed', String(active));
    setLabel('btn-fullscreen', active ? previewText[state.lang].exitFullscreen : previewText[state.lang].fullscreen);
    const rotateHint = document.getElementById('rotate-hint');
    rotateHint.hidden = !playing || !coarsePointer.matches || landscape.matches ||
      !document.getElementById('touch-controls').classList.contains('visible');
    rotateHint.textContent = previewText[state.lang].rotate;
    resizeCanvas();
  }

  function setLabel(id, label) {
    const element = document.getElementById(id);
    element.setAttribute('aria-label', label);
    element.title = label;
  }

  fullscreenButton.addEventListener('click', async () => {
    clearInput();
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
    clearInput();
    if (!document.fullscreenElement) {
      try { screen.orientation?.unlock?.(); } catch (_) {}
    }
    updateFullscreen();
  });
  landscape.addEventListener('change', () => {
    clearInput();
    applySettingsUI();
  });
  coarsePointer.addEventListener('change', applySettingsUI);
  narrowViewport.addEventListener('change', applySettingsUI);

  function applyLanguage() {
    const extra = previewText[state.lang];
    document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : state.lang;
    const notesLink = document.querySelector('.test-notes-link');
    notesLink.textContent = extra.returnToNotes;
    notesLink.href = '/'+state.lang+'/notes/astrofall-playtest/';
    document.title = t('title') + (state.lang === 'en' ? '' : ' · Astrofall Observatory');
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
    document.getElementById('hud-shards-txt').textContent = `${t('shards')} ${state.shards.length}/4`;
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

  function applySettingsUI() {
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
    const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || narrowViewport.matches;
    const showTouch = playing && (state.touchMode === 'on' || (state.touchMode === 'auto' && isTouchDevice));
    if (!showTouch && tc.classList.contains('visible')) clearInput();
    tc.classList.toggle('visible', showTouch);
    tc.classList.toggle('swapped', state.handSwap);
    updateFullscreen();
    updateHUD();
  }

  function renderMapModal() {
    const grid = document.getElementById('map-grid');
    grid.innerHTML = '';
    const byPos = {};
    Object.values(ROOMS).forEach(r => { byPos[`${r.gx},${r.gy}`] = r; });
    for (let gy = 0; gy <= 3; gy++) {
      for (let gx = 0; gx <= 4; gx++) {
        const cell = document.createElement('div');
        const r = byPos[`${gx},${gy}`];
        if (!r) {
          cell.className = 'map-cell empty';
        } else {
          const vis = state.visited.includes(r.id);
          cell.className = 'map-cell' + (vis ? ' visited' : '') + (state.roomId === r.id ? ' current' : '');
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
          cell.appendChild(title);
          cell.appendChild(icons);
        }
        grid.appendChild(cell);
      }
    }
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
    paused = true;
    state.endingSeen = true;
    persistSave();
    const isTrue = state.shards.length >= 4;
    document.getElementById('end-badge').textContent = isTrue ? t('endTrueBadge') : t('endNormalBadge');
    document.getElementById('end-title').textContent = isTrue ? t('endTrueTitle') : t('endNormalTitle');
    document.getElementById('end-desc').textContent = isTrue ? t('endTrueDesc') : t('endNormalDesc');
    document.getElementById('end-stats').textContent = `★ ${t('cores')}: ${state.cores.length}/4  ·  ✦ ${t('shards')}: ${state.shards.length}/4  ·  ${state.visited.length}/16`;
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

  function getActiveSolids() {
    const list = [...currentCourse.solids];
    (currentRoom.phaseSolids || []).forEach(s => {
      if (s.phase === roomPhase) list.push({ ...s, kind: 'phase' });
    });
    (currentRoom.glass || []).forEach(g => {
      if (!roomBrokenGlass.has(g.id)) list.push({ ...g, kind: 'glass' });
    });
    (currentRoom.doors || []).forEach(d => {
      if (!state.openedDoors.includes(d.id)) list.push({ ...d, kind: 'door' });
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
        if (level >= pl.req && (ps.charge !== 2 || pl.action === 'togglePhase' || pl.action === 'finale')) {
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

  function updatePhysics(dt) {
    if (!currentRoom) return;
    if (roomFade > 0) roomFade = Math.max(0, roomFade - dt * 2.4);
    if (shakeTime > 0) shakeTime = Math.max(0, shakeTime - dt);
    if (prismCooldown > 0) prismCooldown = Math.max(0, prismCooldown - dt);

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
    if (P.onGround) P.coyote = 0.11;
    else P.coyote = Math.max(0, P.coyote - dt);

    P.jumpBuf = keys.jumpJust ? 0.12 : Math.max(0, P.jumpBuf - dt);
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
      if (aabb(P, s)) {
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

    // Touch Prisms
    (currentRoom.prisms || []).forEach(pr => {
      if (pr.remoteOnly || prismCooldown > 0) return;
      const box = { x: pr.x - 16, y: pr.y - 16, w: 32, h: 32 };
      if (aabb(P, box)) {
        prismCooldown = 0.65;
        flipRoomPhase();
      }
    });

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
    const interact = keys.actJust;
    keys.actJust = false;
    if (interact) {
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
          if (state.cores.length >= 4) {
            enterRoom('H2', 160, 455, true);
            return;
          } else {
            showToast(t('needCores'), 3200);
          }
        }
      }
    }

    // Room Transitions
    for (const ex of currentCourse.exits) {
      if (ex.dir === 'right' && P.x + P.w > W - 4) { enterRoom(ex.to, ex.tx, ex.ty, true); return; }
      if (ex.dir === 'left' && P.x < 4) { enterRoom(ex.to, ex.tx, ex.ty, true); return; }
      if (ex.dir === 'down' && P.y > H - 4) { enterRoom(ex.to, ex.tx, ex.ty, true); return; }
      if (ex.dir === 'up' && P.y + P.h < 8) { enterRoom(ex.to, ex.tx, ex.ty, true); return; }
    }

    // Out-of-bounds safety net
    if (P.y > H + 80 || P.y < -120 || P.x < -80 || P.x > W + 80) {
      P.x = currentRoom.spawn.x; P.y = currentRoom.spawn.y; P.vx = 0; P.vy = 0;
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
        ctx.fillText('▲ [E] ' + (ROOMS.H2.name[state.lang] || '星穹之顶'), ax, ay - 88);
      }
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
        ctx.fillText('[E]', st.x, st.y - 8);
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
      if (state.openedDoors.includes(d.id)) return;
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
  const stage = document.getElementById('stage-wrap');

  function resizeCanvas() {
    const scale = Math.max(0, Math.min((stage.clientWidth - 8) / W, (stage.clientHeight - 8) / H));
    canvas.style.width = Math.floor(W * scale) + 'px';
    canvas.style.height = Math.floor(H * scale) + 'px';
  }

  if (typeof ResizeObserver === 'function') new ResizeObserver(resizeCanvas).observe(stage);

  let rafId = null;
  let lastTime = null;
  let physicsTime = 0;
  const physicsStep = 1 / 60;
  function loop(now) {
    if (playing && !paused) {
      physicsTime += Math.min(0.05, (now - (lastTime ?? now)) / 1000);
      while (physicsTime >= physicsStep) {
        updatePhysics(physicsStep);
        physicsTime -= physicsStep;
      }
      render(now);
    } else {
      physicsTime = 0;
    }
    lastTime = now;
    rafId = requestAnimationFrame(loop);
  }

  /* =========================================================
     11. INPUT BINDINGS (Keyboard + Touch + UI Buttons)
     ========================================================= */
  const pressedKeys = new Set();
  const activePointers = new Map();
  const leftKeys = ['ArrowLeft', 'KeyA'];
  const rightKeys = ['ArrowRight', 'KeyD'];
  const jumpKeys = ['Space', 'ArrowUp', 'KeyW', 'KeyZ'];

  function updateDirections() {
    const controls = [...activePointers.values()];
    keys.left = leftKeys.some(code => pressedKeys.has(code)) || controls.some(el => el.id === 'tc-left');
    keys.right = rightKeys.some(code => pressedKeys.has(code)) || controls.some(el => el.id === 'tc-right');
  }

  function releasePointer(id) {
    const el = activePointers.get(id);
    if (!el) return;
    activePointers.delete(id);
    el.classList.remove('pressed');
    try {
      if (el.hasPointerCapture?.(id)) el.releasePointerCapture(id);
    } catch (_) {}
    updateDirections();
  }

  function clearInput() {
    pressedKeys.clear();
    for (const id of activePointers.keys()) releasePointer(id);
    for (const key of Object.keys(keys)) keys[key] = false;
    P.jumpBuf = 0;
  }

  window.addEventListener('blur', clearInput);
  window.addEventListener('pagehide', clearInput);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearInput(); });
  document.addEventListener('touchcancel', clearInput);
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    window.addEventListener(type, event => releasePointer(event.pointerId), true);
  }

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
    if (e.repeat) return;
    if (leftKeys.includes(e.code) || rightKeys.includes(e.code)) {
      pressedKeys.add(e.code);
      updateDirections();
    }
    if (jumpKeys.includes(e.code)) keys.jumpJust = true;
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
    if (pressedKeys.delete(e.code)) updateDirections();
  });

  for (const id of ['tc-left', 'tc-right', 'tc-jump', 'tc-act']) {
    const el = document.getElementById(id);
    el.addEventListener('pointerdown', event => {
      event.preventDefault();
      if (!playing || paused || event.button !== 0 || [...activePointers.values()].includes(el)) return;
      activePointers.set(event.pointerId, el);
      try { el.setPointerCapture(event.pointerId); } catch (_) {}
      sound.init();
      el.classList.add('pressed');
      if (id === 'tc-jump') keys.jumpJust = true;
      if (id === 'tc-act') keys.actJust = true;
      updateDirections();
    });
    // If capture fails in an embedded browser, sliding off cannot leave a direction held.
    el.addEventListener('pointerleave', event => {
      if (!el.hasPointerCapture?.(event.pointerId)) releasePointer(event.pointerId);
    });
  }
  for (const el of [canvas, document.getElementById('touch-controls'), document.getElementById('hud')]) {
    el.addEventListener('contextmenu', event => event.preventDefault());
  }

  function startGame(resetNew) {
    sound.init();
    if (resetNew) resetExploration();
    state.started = true;
    clearInput();
    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('hud').style.display = 'flex';
    document.getElementById('key-bar').style.display = 'flex';
    playing = true;
    app.classList.add('playing');
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
    enterRoom('H1', 120, 455, true);
  });
  document.getElementById('btn-keep-exploring').addEventListener('click', () => {
    closeModal('modal-ending');
    enterRoom('H1', 480, 455, true);
  });
  document.getElementById('btn-back-title').addEventListener('click', () => {
    closeModal('modal-ending');
    playing = false;
    app.classList.remove('playing');
    clearInput();
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
      state.lang = btn.dataset.lang;
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
