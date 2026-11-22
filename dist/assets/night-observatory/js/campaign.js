
(function () {
  'use strict';
  const NO = window.NO;
  const D = NO.DATA;
  const { rooms, story, txt, P, R, base, fragile, bridge, seal, bell, mirror, lamp, sensor, zone, anchor, mover, exit, sign } = D;
  const floor = 680;
  const near = (x, y = 580, w = 64, h = 100) => ({ x, y, w, h });
  const steps = (...ledges) => ledges.map(([x, y, width]) => P(x, y, width, 20));
  const hardLedges = x => steps([x - 320, 600, 90], [x - 230, 520, 90], [x - 145, 466, 95]);
  const build = (id, wing, name, layout) => {
    const { layoutName = 'hard', entry, geometry = [], objects = [], gate = {}, forward = near(1168), dialogue, note } = layout;
    const room = R(id, wing, name, {
      bg: wing,
      spawn: entry ?? { x: 110, y: floor },
      platforms: [...base(), ...geometry],
      hintKey: layoutName,
      hintTargets: ['seal','sensor','mirror','anchor','exit'],
      objects,
    });
    room.forward = forward;
    room.gate = gate;
    if (dialogue) room.chapter = dialogue;
    if (note) { story.signs[id] = note; room.note = true; }
    return room;
  };
  const hard = (id, x, req = 'hard') => seal(id, x, 664, req);
  const impact = (id, x, extra = {}) => ({
    geometry: hardLedges(x),
    objects: [hard(id, x)],
    gate: { seals: [id] },
    ...extra,
  });
  const light = (id, x, sensorX) => ({
    layoutName: 'mirror',
    geometry: steps([260, 590, 88], [348, 514, 86]),
    objects: [lamp(id + '_lamp', x, 120, 0, 1), mirror(id + '_mirror', x - 20, 580, '/'), sensor(id + '_sensor', sensorX, 560)],
    gate: { sensors: [id + '_sensor'] },
  });
  const invert = (id, x, start = 400, end = 1220) => ({
    layoutName: 'gravity',
    geometry: steps([170, 585, 92], [240, 506, 100]),
    objects: [zone(id + '_zone', start, 40, end - start, 640, -1), seal(id + '_ceiling', x, 40, 'hard')],
    gate: { seals: [id + '_ceiling'] },
    forward: near(end - 110, 40),
  });
  const spring = (x, y, w, strength = 1200) => P(x, y, w, 20, 'spring', { strength });
  const crack = (id, from, span, deck, exitX) => ({
    layoutName: 'crack',
    entry: { x: 110, y: deck },
    geometry: [
      P(40, deck, from - 40, 26),
      P(from + span, deck, 1240 - from - span, 26),
      fragile(from, deck, span, 22, { id, breakRank: 2 }),
      ...steps([from - 283, deck - 76, 94], [from - 191, deck - 155, 110], [from - 105, deck - 211, 70]),
    ],
    gate: { breaks: [id] },
    forward: near(exitX),
  });

  D.hintSets.spring = [
    txt('看右上方的出口，再找下方发亮的踏板。','Look at the exit above and find the luminous pad below.','Посмотри на верхний выход и найди светящуюся площадку.','上の出口と足元で光る踏み板を探そう。'),
    txt('落到弹射板上会向上弹起。重落还能让它弹得更高。','Landing on the spring launches you. A heavy drop adds height.','Площадка подбрасывает при приземлении. Сильный удар увеличивает высоту.','弾射板に着地すると跳ね上がる。重着地ならさらに高く飛べる。'),
    txt('跳上弹射板，在上升时朝出口的平台移动。','Hop onto the pad, then steer toward the exit ledge while rising.','Запрыгни на площадку и направь полёт к уступу с выходом.','弾射板に跳び乗り、上昇中に出口の足場へ移動しよう。')
  ];
  D.hintSets.crack = [
    txt('裂纹下面还有一层。','There is another level beneath the cracked glass.','Под треснувшим стеклом есть ещё один уровень.','ひび割れたガラスの下にもう一段ある。'),
    txt('这块厚玻璃需要重落，普通跳跃的落地不够。','The thick pane needs a heavy landing. Build height first.','Толстое стекло требует сильного удара. Сначала набери высоту.','厚いガラスには重着地が必要だ。先に高い所へ登ろう。'),
    txt('沿阶梯登上最靠近玻璃的高台，从边缘走下，落到裂纹上。','Climb the steps to the ledge by the glass, then step off and land on the crack.','Поднимись на уступ у стекла, шагни с края и упади на трещину.','ガラスに近い高台まで階段を登り、端からひびの上へ落ちよう。')
  ];
  D.hintSets.arrival = [
    txt('找有门框的出口。','Look for the framed door.','Найди выход с дверной рамой.','枠のある出口を探そう。'),
    txt('走近门，等互动提示亮起。','Approach until the interaction prompt appears.','Подойди и дождись подсказки взаимодействия.','近づいて操作の表示が出るのを待とう。'),
    txt('按 E、Enter 或触屏上的手形按钮进入。','Use E, Enter, or the hand button to go through.','Нажми E, Enter или кнопку с рукой на экране.','E、Enter、または画面の手のボタンで進もう。')
  ];

  const chapters = {
    arrival: txt('航标消失后，最后一艘船只留下一个坐标。你在坐标指向的岸边醒来。','After the beacon went dark, the last ship left a single coordinate. You wake on the shore it points to.','Когда маяк погас, последний корабль оставил одну координату. Ты просыпаешься на указанном берегу.','灯が消えたあと、最後の船は座標を一つ残した。あなたはその岸辺で目を覚ます。'),
    relay_tide: txt('井底的钟报出了与海浪相同的节拍。旧工坊的门开了，配重还在等待最后一次校准。','The bells below keep the same time as the waves. The old workshop is open, and its counterweights await one last calibration.','Колокола в колодце отбивают ритм волн. Старая мастерская открыта, и противовесы ждут последней настройки.','井戸の鐘が波と同じ拍を刻む。古い工房が開き、重りは最後の調整を待っている。'),
    relay_light: txt('月镜里有两道光。守夜人留下的标记指向较暗的一道，那条线刚好从云城屋檐外经过。','Two beams cross in the mirror. The watchman marked the dimmer one, which passes just beyond the roofs of the cloud city.','В зеркале пересекаются два луча. Страж отметил тусклый: он проходит мимо крыш облачного города.','月鏡に二本の光が交わる。夜番が印をつけた細い光は、雲の街の屋根をかすめて通る。'),
    relay_gravity: txt('坠星塔的指针一直朝上。你从旧钟楼的回声里听见船员的喊声：别找水平线，找下落的方向。','The tower needle points upward. A sailor’s call echoes from the old belfry: forget the horizon and find the direction of the fall.','Стрелка башни смотрит вверх. В колокольне звучит голос моряка: забудь горизонт, найди направление падения.','塔の針は上を指す。古い鐘楼に船員の声が響く。「水平線を見るな。落ちる先を探せ」。'),
    final_crossing: txt('三枚符印转动星图仪，照亮了一条通往下层的维修通道。航标的光束缺少一个能持续转动的支点。','The sigils turn the Orrery and light a service passage below. The beacon is missing the pivot that would keep its beam moving.','Печати поворачивают Планетарий и освещают нижний проход. Маяку не хватает оси, чтобы луч продолжал двигаться.','三つの印章が星図儀を回し、下層の整備通路を照らす。航路標識には光を回し続ける軸が欠けている。'),
    dawn: txt('支点已经转起来了。海上还有人在等，云城的窗也亮着。你要决定，今晚让哪一道光出去。','The pivot turns again. Someone is waiting at sea and lights are on in the cloud city. Now choose which light to send into the night.','Ось снова вращается. Кто-то ждёт в море, а в облачном городе горят окна. Выбери, какой свет отправить в ночь.','軸が再び回りだした。海では誰かが待ち、雲の街には明かりがともる。今夜どんな光を送るかは、あなたが決める。'),
  };
  story.intro = [
    { speaker: 'conductor', text: chapters.arrival },
    { speaker: 'watchman', text: txt('我要找到那艘船，也想知道是谁关了灯。','I want to find that ship and learn who put out the light.','Я найду корабль и узнаю, кто погасил свет.','船を見つけたい。誰が灯を消したのかも知りたい。') },
    { speaker: 'conductor', text: txt('穿过前厅去守夜厅。三翼的符印会让星图仪再次转动。','Cross the porch to Nightwatch Hall. The three wing sigils will turn the Orrery again.','Пройди в зал стража. Три печати снова запустят Планетарий.','玄関を抜けて夜番の広間へ。三つの印章が星図儀を再び回す。') },
  ];

  const atrium = [
    build('arrival','hub',txt('雾岸','Fogbound Shore','Туманный берег','霧の岸'),{
      layoutName:'arrival', geometry:steps([360,615,180],[720,600,150]),
      note:chapters.arrival, forward:near(1050)
    }),
    build('archive_porch','hub',txt('星门前厅','Stargate Porch','Звёздное крыльцо','星門の玄関'),
      impact('porch_plate',650)),
    build('archive_rotunda','hub',txt('摆锤圆厅','Pendulum Rotunda','Круглый зал маятника','振り子の円堂'),{
      layoutName:'arrival', geometry:steps([380,590,145],[615,546,160],[860,560,195]),
      objects:[mover('rotunda_ferry',475,610,114,20,680,610,55,0)], forward:near(960,460)
    }),
  ];
  const tide = [
    build('relay_tide','tide',txt('潮钟中继站','Tide Bell Relay','Станция приливного колокола','潮鐘の中継所'),{
      layoutName:'arrival', dialogue:chapters.relay_tide, geometry:steps([380,590,100],[692,610,120]), forward:near(1050)
    }),
    build('archive_workshop','tide',txt('共振工坊','Resonance Workshop','Мастерская резонанса','共鳴工房'),
      impact('workshop_release',710,{
        geometry:[...hardLedges(710),bridge(810,557,180,20,{seals:['workshop_release']})]
      })),
    build('archive_glassworks','tide',txt('薄冰栈道','Glassworks Crossing','Переправа стекольни','薄氷の桟道'),{
      layoutName:'fragile',
      geometry:[...steps([235,606,104],[800,603,118]),fragile(363,580,347,20)],
      objects:[seal('glassworks_soft',540,564,'soft')],
      gate:{seals:['glassworks_soft']}
    }),
    build('archive_counterweight','tide',txt('配重机房','Counterweight Hall','Зал противовесов','釣り合い重りの機械室'),{
      ...impact('counterweight_drop',740),
      geometry:[...hardLedges(740),...steps([895,597,90],[960,520,110])],
      objects:[bell('counterweight_drop',740,664,20)]
    }),
  ];
  const moon = [
    build('relay_light','light',txt('月镜中继站','Moonmirror Relay','Станция лунных зеркал','月鏡の中継所'),{
      ...light('relay_light',460,825),dialogue:chapters.relay_light
    }),
    build('archive_lunar','light',txt('月相长廊','Lunar Gallery','Лунная галерея','月相の回廊'),{
      ...light('gallery',525,918),
      geometry:[...steps([300,613,100],[535,594,95]),bridge(630,500,220,20,{sensors:['gallery_sensor']})],
      forward:near(795,400)
    }),
    build('archive_prism','light',txt('密封棱镜阁','Sealed Prism Vault','Хранилище закрытой призмы','封印されたプリズム庫'),{
      layoutName:'mirror',
      geometry:steps([210,606,110],[430,490,120],[910,470,130]),
      objects:[lamp('prism_ray',360,120,0,1),mirror('prism_first',340,580,'/'),mirror('prism_second',800,580,'\\'),
        sensor('prism_receiver',783,350)],
      gate:{sensors:['prism_receiver']}
    }),
    build('archive_altar','light',txt('月蚀圣坛','Eclipse Altar','Алтарь затмения','月蝕の聖壇'),
      crack('eclipse_pane',560,145,500,830)),
  ];
  const stars = [
    build('relay_gravity','gravity',txt('天顶中继站','Zenith Relay','Зенитная станция','天頂の中継所'),{
      ...invert('zenith',560,370,1170),dialogue:chapters.relay_gravity
    }),
    build('archive_pendulum','gravity',txt('摆渡长厅','Pendulum Hall','Зал маятниковой переправы','振り子の渡り廊下'),{
      layoutName:'spring',
      geometry:[...steps([300,600,105],[650,445,215],[894,405,260]),spring(495,654,115,1200)],
      objects:[mover('pendulum_old_ferry',665,515,110,18,850,515,66,0)], forward:near(1020,305)
    }),
    build('archive_spire','gravity',txt('双级弹射塔','Twin Spring Spire','Башня двух трамплинов','二段弾射塔'),{
      layoutName:'spring',
      geometry:[spring(330,650,105,1130),P(560,480,160,22),spring(645,458,75,1120),P(805,230,295,24)],
      forward:near(980,130)
    }),
    build('archive_belfry','gravity',txt('星轨穹顶','Starlight Belfry','Звёздная колокольня','星軌の穹頂'),{
      layoutName:'spring',
      geometry:[spring(510,650,114,1200),...steps([620,490,80],[720,380,145],[955,484,194])],
      objects:[seal('belfry_resonance',1016,468,'hard')], gate:{seals:['belfry_resonance']}, forward:near(1140)
    }),
  ];
  const depth = [
    build('final_crossing','final',txt('星图仪下层','Orrery Undercroft','Подземелье планетария','星図儀の地下'),{
      layoutName:'arrival', dialogue:chapters.final_crossing, geometry:steps([400,580,115],[720,605,160]), forward:near(1040)
    }),
    build('archive_undercroft','final',txt('前厅地下秘室','Porch Undercroft','Тайник под крыльцом','玄関の地下秘室'),
      crack('undercroft_pane',510,165,484,960)),
    build('archive_abyss','final',txt('深渊星井','Abyssal Star Well','Бездонный звёздный колодец','深淵の星井戸'),
      invert('starwell',590,470,1220)),
    build('archive_harmonics','final',txt('星律之间','Harmonic Chamber','Зал звёздной гармонии','星律の間'),{
      layoutName:'combo',
      geometry:hardLedges(450),
      objects:[hard('harmonics_impact',450),lamp('harmonics_lamp',720,125,0,1),
        mirror('harmonics_mirror',700,580,'/'),sensor('harmonics_sensor',970,560)],
      gate:{seals:['harmonics_impact'],sensors:['harmonics_sensor']}
    }),
    build('archive_vault','final',txt('星渊密藏室','Hidden Star Vault','Тайник звёздной бездны','星淵の宝庫'),{
      layoutName:'spring',
      geometry:[...steps([302,603,94]),spring(540,650,118,1300),P(750,350,346,22)],
      forward:near(960,250)
    }),
    build('archive_crown','final',txt('天文穹顶','Crown Observatory','Купол обсерватории','天文台の大円蓋'),
      impact('crown_pivot',800)),
    build('dawn','final',txt('天光之前','Before Dawn','Перед рассветом','夜明けの前'),{
      layoutName:'arrival',dialogue:chapters.dawn,geometry:steps([338,618,135],[640,520,135],[830,555,220]),forward:near(990,455)
    }),
  ];

  const names = id => rooms[id].name;
  function join(sequence, previous, destination, grantSigil) {
    for (const room of sequence) rooms[room.id] = room;
    for (const [index, room] of sequence.entries()) {
      const back = sequence[index - 1]?.id ?? previous;
      const next = sequence[index + 1]?.id ?? destination;
      const f = room.forward;
      if (back) {
        const nearSpawn = room.spawn.y - 100;
        room.objects.push(exit(back, 40, nearSpawn, { w: 36, label: names(back) }));
      }
      room.objects.push(exit(next, f.x, f.y, {
        ...f, label: names(next), requires: room.gate,
        chapterReward: room.id.startsWith('archive_') ? room.id : undefined,
        grantSigil: next === destination ? grantSigil : undefined,
      }));
      if (room.note) room.objects.push(sign(room.id + '_note', 180, 620, room.id));
      delete room.forward;
      delete room.gate;
    }
  }
  function divert(from, to, newTarget) {
    const target = rooms[from].objects.find(o => o.type === 'exit' && o.to === to);
    target.to = newTarget;
    target.label = names(newTarget);
    delete target.grantSigil;
  }
  join(atrium,null,'hub');
  join(tide,'tide8','hub','tide');
  join(moon,'light8','hub','light');
  join(stars,'grav8','hub','gravity');
  join(depth,'final_orrery','final_ascent');
  divert('tide8','hub','relay_tide');
  divert('light8','hub','relay_light');
  divert('grav8','hub','relay_gravity');
  divert('final_orrery','final_ascent','final_crossing');
  divert('final_ascent','final_orrery','dawn');
  rooms.hub.objects.push(exit('archive_rotunda', 315, 580, { label: names('archive_rotunda') }));

  const oldIndex = D.main;
  D.main = [
    ...atrium.map(r => r.id), ...oldIndex.slice(0,10), ...tide.map(r => r.id),
    ...oldIndex.slice(10,18), ...moon.map(r => r.id),
    ...oldIndex.slice(18,26), ...stars.map(r => r.id),
    'final_gate','final_orrery',...depth.map(r => r.id),'final_ascent','final_choice'
  ];
  D.order = [...D.main, ...D.optional];
  D.firstRoom = 'arrival';
  D.restorations = D.main.filter(id => id.startsWith('archive_'));
  D.classicRooms = {
    H0:'archive_porch', H1:'archive_rotunda', E1:'archive_workshop', E2:'archive_glassworks',
    E3:'archive_counterweight', W1:'archive_lunar', W2:'archive_prism', W3:'archive_altar',
    N1:'archive_pendulum', N2:'archive_spire', N3:'archive_belfry', S1:'archive_undercroft',
    S2:'archive_abyss', S3:'archive_harmonics', S4:'archive_vault', H2:'archive_crown'
  };
})();
