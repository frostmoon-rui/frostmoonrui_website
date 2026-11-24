(function () {
  'use strict';
  const D = window.NO.DATA;
  const { P, base, fragile, seal, bell, mirror, lamp, sensor, zone, mover, txt } = D;
  const floor = 680;
  const plans = {
    arrival: [['steps', 426, 66, 235]],
    archive_porch: [['firm', 515], ['steps', 810, 74, 140]],
    archive_rotunda: [['ferry', 465], ['firm', 1000]],
    hub: [['firm', 390], ['beam', 666, 764], ['soft', 1120]],
    hub_practice: [['soft', 312], ['drop', 655], ['beam', 940, 1120]],
    tide1: [['drop', 650]],
    tide2: [['soft', 442], ['steps', 664, 80, 202]],
    tide3: [['firm', 275], ['timer', 745]],
    tide4: [['soft', 980], ['firm', 425], ['steps', 657, 97, 91]],
    tide5: [['drop', 510], ['soft', 847]],
    tide6: [['steps', 299, 76, 157], ['timer', 575], ['timer', 915]],
    tide7: [['firm', 343], ['drop', 839]],
    tide8: [['soft', 253], ['drop', 605], ['firm', 1015]],
    relay_tide: [['steps', 237, 52, 149], ['beam', 530, 720], ['firm', 968]],
    archive_workshop: [['drop', 541], ['beam', 824, 1034]],
    archive_glassworks: [['soft', 378], ['firm', 682], ['soft', 1000]],
    archive_counterweight: [['ferry', 383], ['firm', 725], ['drop', 999]],
    light1: [['beam', 409, 655]],
    light2: [['shade', 505, 795], ['steps', 930, 60, 121]],
    light3: [['beam', 267, 456], ['shade', 763, 1011]],
    light4: [['shade', 369, 584], ['firm', 920]],
    light5: [['soft', 298], ['beam', 738, 1060]],
    light6: [['chain', 333, 862], ['steps', 603, 68, 136]],
    light7: [['beam', 325, 523], ['firm', 924]],
    light8: [['shade', 240, 405], ['drop', 815], ['beam', 1000, 1123]],
    relay_light: [['ferry', 310], ['shade', 638, 874]],
    archive_lunar: [['beam', 315, 582], ['soft', 758], ['firm', 1030]],
    archive_prism: [['shade', 283, 406], ['beam', 640, 826], ['firm', 992]],
    archive_altar: [['beam', 274, 419], ['soft', 533], ['drop', 1020]],
    grav1: [['inverter', 270], ['firm', 565]],
    grav2: [['ferry', 287], ['firm', 672], ['steps', 833, 86, 120]],
    grav3: [['steps', 250, 92, 94], ['drop', 777]],
    grav4: [['beam', 325, 550], ['ferry', 785]],
    grav5: [['ferry', 340], ['timer', 950]],
    grav6: [['firm', 255], ['ferry', 548], ['shade', 943, 1116]],
    grav7: [['ferry', 290], ['soft', 679], ['firm', 907]],
    grav8: [['firm', 255], ['drop', 643], ['shade', 947, 1090]],
    relay_gravity: [['ferry', 356], ['soft', 602], ['firm', 991]],
    archive_pendulum: [['ferry', 264], ['beam', 671, 803], ['firm', 970]],
    archive_spire: [['spring', 335], ['spring', 790], ['firm', 1060]],
    archive_belfry: [['drop', 472], ['timer', 850], ['firm', 1002]],
    final_gate: [['firm', 228], ['beam', 531, 707], ['drop', 1010]],
    final_orrery: [['beam', 220, 338], ['firm', 540], ['shade', 751, 909], ['soft', 1070]],
    final_crossing: [['steps', 267, 67, 117], ['ferry', 611], ['firm', 882]],
    archive_undercroft: [['soft', 270], ['crack', 673], ['firm', 985]],
    archive_abyss: [['ferry', 270], ['steps', 606, 100, 173], ['firm', 977]],
    archive_harmonics: [['shade', 270, 460], ['drop', 812], ['firm', 1050]],
    archive_vault: [['spring', 290], ['steps', 562, 101, 138], ['beam', 903, 1085]],
    archive_crown: [['firm', 236], ['drop', 551], ['soft', 742], ['timer', 990]],
    dawn: [['steps', 320, 67, 119], ['shade', 619, 840], ['firm', 1014]],
    final_ascent: [['spring', 262], ['ferry', 640], ['firm', 906]],
    final_choice: [['steps', 469, 47, 128], ['steps', 787, 60, 108]],
    hub_study: [['beam', 381, 574], ['steps', 747, 69, 166]],
    echo1: [['drop', 600]],
    echo2: [['soft', 318], ['drop', 818]],
    echo3: [['beam', 366, 543], ['firm', 813]],
    echo4: [['shade', 487, 726], ['soft', 857]],
    echo5: [['ferry', 295], ['firm', 716]],
    echo6: [['shade', 254, 411], ['beam', 708, 887]],
    hidden1: [['soft', 258], ['beam', 532, 680], ['drop', 1030]],
  };

  const words = {
    steps: txt('短台阶用一次普通跳越过。','Clear low steps with an ordinary jump.','Низкие ступени проходятся обычным прыжком.','低い段差は普通のジャンプで越えられる。'),
    firm: txt('走到银盘中央，原地跳一下，自然落下。', 'Stand on the silver plate, jump once and land without bracing.', 'Встань на серебряную плиту и прыгни на месте без торможения.', '銀の円盤の上で一度跳び、ブレーキを使わず着地する。'),
    soft: txt('在青盘上原地跳，下降时按住缓冲直到着地。', 'Jump in place on the blue plate and hold brace until you land.', 'Прыгни на синей плите и держи торможение до касания.', '青い円盤の上で跳び、接地までブレーキを押し続ける。'),
    drop: txt('从金盘左边爬上两层宽台阶，再走下右边缘，落在金盘上。','Climb the two wide steps left of the gold plate. Walk off the right edge and land on the plate.','Поднимись по двум широким ступеням слева от золотой плиты. Шагни с правого края на плиту.','金の円盤の左にある広い二段を上がり、右端から円盤へ落ちる。'),
    timer: txt('从高台落在铃盘上。铃会保持点亮一段时间，再走向下一机关或出口。','Drop from the upper step onto the bell. It stays lit while you move to the next device or exit.','Спрыгни с верхней ступени на колокол. Он светится некоторое время — иди дальше.','上段から鐘へ落ちる。しばらく光る間に次の仕掛けか出口へ進む。'),
    beam: txt('站在地面操作镜子一次，将光转向右侧接收器。','Turn the mirror once from the floor to send light to the receiver on the right.','Поверни зеркало с пола, направив луч к приёмнику справа.','床から鏡を一度回し、右の受光器に光を当てる。'),
    chain: txt('先把左镜转向右，再操作右镜把同一束光抬到上方接收器。两面镜都能站在地面操作。','Turn the first mirror right, then turn the second to send that same beam up to the receiver. Operate both from the floor.','Направь первое зеркало вправо, а второе — вверх к приёмнику. Оба доступны с пола.','左の鏡で右へ、右の鏡で同じ光を上の受光器へ。どちらも床から操作できる。'),
    shade: txt('站在地面操作镜子，让光束离开右侧接收器。','Turn the mirror from the floor to take the beam off the receiver on the right.','Поверни зеркало с пола, убрав луч с приёмника справа.','床から鏡を回し、右の受光器を影にする。'),
    ferry: txt('先跳上摆渡板。等它接近高处的圆盘再落下；也可以用旁边的宽台阶。','Ride the ferry to the raised plate, or reach it by the broad side steps.','Поднимись к высокой плите на платформе или по широким ступеням сбоку.','移動床で上の円盤へ。横の広い階段からでも届く。'),
    spring: txt('跳到弹板上会自动升空。高台在右侧，也能从远端台阶返回。','Land on the spring to launch. The high ledge is on the right; side steps offer another approach.','Пружина подбросит тебя к уступу справа. С другой стороны есть ступени.','跳ね台に乗ると浮き上がる。高台は右側。遠い側の段差からも戻れる。'),
    crack: txt('跳上裂纹玻璃，自然落地把它震开。下方有地板，踩碎后可以继续。','Jump onto the cracked glass and land without bracing to break it. There is a floor below.','Прыгни на треснувшее стекло без торможения, чтобы разбить его. Снизу есть пол.','ひびの入ったガラスにブレーキなしで着地して割る。下には床がある。'),
    inverter: txt('玻璃框内是重力试验区。从地面经过也能继续，入内后往侧边移就能回到地面。','The glass bay is a gravity experiment. The floor route stays open; move sideways to leave the bay.','Стеклянная камера — опыт с гравитацией. По полу можно пройти дальше, а из камеры выйти вбок.','ガラス枠は重力の実験区画。床を進めば通過でき、中からは横に出れば戻れる。'),
  };
  const generic = txt('寻找铜盘、铃盘与接收器。所需机关全部就绪后，门框会亮起。','Look for plates, bells and receivers. The frame lights up when its required devices are ready.','Найди плиты, колокола и приёмники. Выполни условия, и рама загорится.','円盤や鐘、受光器を探す。必要な仕掛けがそろうと扉の枠が光る。');
  const portalHint = txt('站到门框旁，看到去向提示后互动。','Stand beside a portal and interact when its destination appears.','Подойди к порталу и нажми действие, когда появится его название.','扉のそばで行き先が表示されたら調べる。');

  for (const [roomId, plan] of Object.entries(plans)) {
    const room = D.rooms[roomId];
    const portals = room.objects.filter(o => o.type === 'exit');
    const collectibles = room.objects.filter(o => o.type === 'echo');
    room.h = floor + 40;
    room.spawn = { x: 113, y: floor };
    room.platforms = base(room.w, room.h);
    room.objects = [];
    const requirements = { seals: [], sensors: [], breaks: [] };
    const routeTargets = [];

    const plate = (id, x, y, kind, timed = false) => {
      const item = timed ? bell(id, x - 50, y - 16, 16, { w: 100 })
        : seal(id, x - 50, y - 16, kind, { w: 100 });
      room.objects.push(item);
      requirements.seals.push(id);
      routeTargets.push(id);
    };

    plan.forEach(([kind, x, a, b], index) => {
      const id = roomId + '_station_' + (index + 1);
      if (kind === 'steps') {
        room.platforms.push(P(x, floor - a, b, a));
      } else if (kind === 'drop' || kind === 'timer') {
        room.platforms.push(P(x - 270, 603, 91, 18), P(x - 173, 518, 138, 18));
        routeTargets.push('@' + (x - 224) + ',603', '@' + (x - 101) + ',518');
        plate(id, x, floor, 'hard', kind === 'timer');
      } else if (kind === 'chain') {
        room.objects.push(lamp(id + '_lamp', x + 22, 210, 0, 1),
          mirror(id + '_mirror', x, 600, '/'), mirror(id + '_relay', a, 580, '\\'),
          sensor(id, a - 16, 470, 'lit'));
        requirements.sensors.push(id);
        routeTargets.push(id + '_mirror', id + '_relay', id);
      } else if (kind === 'beam' || kind === 'shade') {
        room.objects.push(lamp(id + '_lamp', x + 22, 210, 0, 1),
          mirror(id + '_mirror', x, 600, kind === 'beam' ? '/' : '\\'),
          sensor(id, a, 580, kind === 'beam' ? 'lit' : 'dark'));
        requirements.sensors.push(id);
        routeTargets.push(id + '_mirror', id);
      } else if (kind === 'ferry' || kind === 'spring') {
        const y = kind === 'ferry' ? 560 : 526;
        room.platforms.push(P(x + 50, y, 152, 18), P(x + 211, 604, 84, 18));
        if (kind === 'ferry') room.objects.push(mover(id + '_lift', x - 53, 612, 86, 18, x + 15, y + 2, 39, 0));
        else room.platforms.push(P(x - 47, 662, 72, 18, 'spring', { strength: 1100 }));
        routeTargets.push('@' + (x + 247) + ',604');
        plate(id, x + 121, y, 'any');
      } else if (kind === 'crack') {
        room.platforms.push(fragile(x - 65, 630, 130, 20, { id, breakRank: 1 }));
        requirements.breaks.push(id);
        routeTargets.push(id);
      } else if (kind === 'inverter') {
        room.platforms.push(P(x, 450, 170, 20));
        room.objects.push(zone(id, x, 445, 170, 184, -1));
      } else {
        plate(id, x, floor, kind === 'firm' ? 'notSoft' : 'soft');
      }
    });

    const forward = portals.length > 1 && (roomId.startsWith('echo') || roomId === 'hidden1')
      ? portals.at(-1) : (roomId === 'hub_study' || roomId === 'hub_practice') ? null :
      portals.findLast(o => o.to && !D.optional.includes(o.to));
    const hubPositions = { hub_practice: 56, tide1: 211, archive_rotunda: 328, light1: 505, grav1: 612,
      tide7: 803, light7: 916, grav7: 1033, hub_study: 1255, hidden1: 1365, final_gate: 1480 };
    for (const portal of portals) {
      const globalGate = Object.fromEntries(Object.entries(portal.requires || {})
        .filter(([key]) => ['allSigils', 'echoCount', 'sigils'].includes(key)));
      const puzzle = (roomId === 'hub' ? portal.to === 'hub_study' : roomId !== 'final_choice' && portal === forward);
      if (puzzle) {
        for (const [key, ids] of Object.entries(requirements)) if (ids.length) globalGate[key] = ids;
      }
      if (Object.keys(globalGate).length) portal.requires = globalGate;
      else delete portal.requires;
      if (puzzle && !globalGate.allSigils && !globalGate.echoCount) delete portal.lockedText;
      delete portal.spawn;
      portal.w = 62;
      portal.h = 86;
      portal.y = floor - portal.h;
      if (roomId === 'hub') portal.x = hubPositions[portal.to];
      else if (roomId === 'final_choice') portal.x = {beacon: 255, dark: 645, eighth: 1005}[portal.ending] ?? 53;
      else if (portal === forward) portal.x = 1150;
      else if (D.optional.includes(portal.to)) portal.x = 808 + portals.filter(o => D.optional.includes(o.to)).indexOf(portal) * 104;
      else if (portals.length === 1) portal.x = 53;
      else portal.x = 53 + portals.filter(o => o !== forward && !D.optional.includes(o.to)).indexOf(portal) * 95;
      if (roomId === 'arrival') portal.x = 1161;
      room.objects.push(portal);
    }
    for (const item of collectibles) {
      item.x = roomId === 'hub_study' ? 905 : 1080;
      item.y = floor - 42;
      if (roomId === 'hub_study') item.requires = requirements;
      if (roomId.startsWith('echo') && forward?.requires) item.gate = forward.to;
      room.objects.push(item);
    }

    const kinds = [...new Set(plan.map(([kind]) => kind))];
    room.hints = [portalHint, generic, Object.fromEntries(
      ['zh', 'en', 'ru', 'ja'].map(lang => [lang, kinds.map(kind => words[kind][lang]).join(' ')]))];
    room.hintKey = kinds.some(kind => ['shade', 'beam', 'chain'].includes(kind)) ? 'mirror'
      : kinds.includes('drop') || kinds.includes('timer') ? 'hard'
      : kinds.includes('soft') ? 'soft' : kinds.includes('spring') ? 'spring' : 'arrival';
    room.hintTargets = ['seal', 'sensor', 'mirror', 'exit'];
    const topic = kinds.find(kind => kind !== 'steps');
    room.course = { goals: routeTargets, forward: forward?.id,
      topic: { crack: 'crack', firm: 'firm', soft: 'soft', timer: 'heavy', drop: 'heavy', beam: 'mirror',
        shade: 'mirror', chain: 'chain', ferry: 'ferry', spring: 'spring', inverter: 'gravity_free' }[topic] ?? 'portal',
    };
  }

  D.layoutVersion = 3;
})();
