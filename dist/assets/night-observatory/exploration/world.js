'use strict';

window.ObservatoryWorld = (() => {
  const W = 960, H = 540, floor = 510;
  const names = (zh, en, ru, ja) => ({zh, en, ru, ja});
  const rect = (x, y, w, h = 18) => ({x, y, w, h});
  const hints = {
    impact: names(
      ['铜板有两格。原地跳能点亮几格？','从踏台加一次跳跃，可以让你落得更快。','跳上铜板附近的踏台，再从踏台跳向铜板。'],
      ['How many marks light up if you hop on the brass plate?','Jumping off a ledge gives you more speed on the way down.','Climb the ledges, then jump onto the plate from above.'],
      ['Сколько делений загорается, если подпрыгнуть на плите?','Прыжок с уступа ускорит падение.','Поднимитесь по уступам и спрыгните на плиту.'],
      ['真鍮板の上で跳ぶと目盛りはいくつ光る？','足場から跳び降りると着地が強くなる。','足場を登り、上から真鍮板に跳び降りよう。']),
    phase: names(
      ['观察棱镜两侧，哪块墙只有轮廓？','实体会跟随棱镜变色。导线连着的铜板也能改变相位。','碰触可达的棱镜。若它被围住，从踏台跳上导线连接的铜板。'],
      ['Which wall is only an outline?','Solid surfaces follow the prism’s color. A wired plate can also change the phase.','Touch the prism, or jump onto the wired plate from a ledge if the prism is sealed.'],
      ['Какая стена видна только контуром?','Твёрдые поверхности меняются вместе с цветом призмы. Плита тоже может менять фазу.','Коснитесь призмы или, если она недоступна, спрыгните с уступа на соединённую плиту.'],
      ['輪郭だけの壁はどれ？','プリズムの色で実体が変わる。導線のついた板でも切り替えられる。','プリズムに触れよう。届かないときは足場から導線のついた板へ跳び降りよう。']),
    spring: names(
      ['弹簧可以把你送到跳不上去的高度。','弹簧会记住你落下时的冲力。','从踏台落向弹簧，再向目标平台移动。向上的门洞在天花板上。'],
      ['The spring can take you higher than a jump.','A harder landing makes the spring launch you higher.','Drop onto the spring from a ledge and steer toward the destination. Look for any opening in the ceiling.'],
      ['Пружина подбрасывает выше обычного прыжка.','При сильном ударе пружина подбрасывает выше.','Спрыгните на пружину с уступа и двигайтесь к цели. Ищите проём в потолке.'],
      ['バネなら普通のジャンプより高く飛べる。','強く着地するほどバネの跳ね返りも強くなる。','足場からバネに飛び降り、空中で着地点に向かおう。天井の開口部にも注目。']),
    mover: names(
      ['看蓝色平台往返一次，留意它离岸最近的位置。','同向起跳会借到平台的速度。','在近岸跳上平台，等它接近对岸，再沿平台运动方向跳走。'],
      ['Watch the blue platform make a round trip.','Jump with the platform’s motion to carry some of its speed.','Board near the bank and wait until the platform approaches the other side. Jump in its direction of travel.'],
      ['Проследите за полным циклом синей платформы.','При прыжке по ходу платформы часть её скорости сохраняется.','Запрыгните на платформу у берега и прыгните по её движению к другому берегу.'],
      ['青い足場が一往復するのを見てみよう。','足場と同じ進行方向へ跳ぶと勢いが残る。','岸の近くで乗り、対岸が近づいたら足場の進行方向へ跳ぼう。']),
    glass: names(
      ['裂纹玻璃承得住普通跳。','用给铜板充满能量的力度试试。','从错开的高踏台跳进玻璃中间。若铜扣还锁着，先放下工坊悬锤。'],
      ['The cracked glass can hold up to a normal hop.','Try the same impact that fully charges brass.','Jump into the middle of the glass from the offset ledge. If the latch is locked, release the Workshop counterweight first.'],
      ['Треснувшее стекло выдерживает обычный прыжок.','Попробуйте удар, который полностью заряжает плиту.','Спрыгните с уступа в центр стекла. Если защёлка закрыта, сначала сбросьте противовес.'],
      ['ひび割れた床は普通のジャンプに耐える。','真鍮板を満充電にしたときと同じ強さを試そう。','足場からガラスの中心に跳び降りよう。留め具が閉じていたら工房の重りを先に落とそう。']),
    hub: names(
      ['大厅的星象仪有四个空位。','沿不同方向的门洞找星核。','带着四枚星核回到星象仪，靠近并按互动键。'],
      ['The astrolabe has four empty sockets.','Follow openings in different directions to find the star cores.','Bring all four cores to the astrolabe, stand near it, and interact.'],
      ['У астролябии четыре пустых гнезда.','Ищите ядра за проходами в разных направлениях.','Соберите четыре ядра, подойдите к астролябии и взаимодействуйте с ней.'],
      ['天球儀には空のソケットが四つある。','別々の出口から星核を探そう。','四つの星核を集めたら、天球儀のそばで調べよう。']),
  };

  function makeRooms({expanded = true} = {}) {
    const rooms = {};
    const exits = {
      left: ['right', 890, 482], right: ['left', 48, 482],
      up: ['down', null, 60], down: ['up', null, 350]
    };
    function room(id, gx, gy, zone, name, clue) {
      const chamber = {id, gx, gy, zone, name, hints: hints[clue], spawn: {x: 75, y: 482},
        solids: [], exits: [], openings: {}, plates: [], doors: [], glass: [], weights: [],
        springs: [], prisms: [], phaseSolids: [], movers: [], cores: [], shards: []};
      rooms[id] = chamber;
      return chamber;
    }
    function connect(from, direction, to, span = [420, 540]) {
      const [back] = exits[direction];
      from.openings[direction] = span;
      to.openings[back] = span;
      // Keep the adventurer inside the opposite boundary after arrival.
      const spawn = incoming => {
        const [, x, y] = exits[incoming];
        return [x ?? (incoming === 'up' ? span[1] + 28 : span[0] - 65), incoming === 'up' ? 482 : y];
      };
      for (const [source, target, dir] of [[from, to, direction], [to, from, back]]) {
        const [tx, ty] = spawn(dir);
        source.exits.push({dir, to: target.id, tx, ty});
      }
    }
    function chain(direction, ...chambers) {
      chambers.slice(1).forEach((next, index) => connect(chambers[index], direction, next));
    }
    function gate(r, id, side = 'right') {
      const door = {id, ...rect(side === 'right' ? 930 : 0, 380, 30, 130)};
      r.doors.push(door);
      return door;
    }
    function plate(r, x, target, action = 'openDoor', y = floor, req = 2) {
      r.plates.push({id: r.id + '-plate-' + r.plates.length, ...rect(x, y - 12, 88, 12), req, action, target});
    }
    function glass(r, id, [start, end], requiresWeight) {
      r.glass.push({id, ...rect(start, floor, end - start, 30), persistent: true, requiresWeight});
    }
    function ascent(r, x, direction = 1) {
      r.solids.push(rect(x, 433, 100), rect(x + direction * 83, 356, 103),
        rect(x + direction * 166, 282, 110));
    }
    function climb(r, x, platformX, useStairs = true) {
      r.springs.push({...rect(x, 496, 58, 14), minimum: 835}, {...rect(platformX + 31, 250, 58, 14), minimum: 900});
      r.solids.push(rect(platformX, 264, 118));
      if (useStairs) r.solids.push(rect(platformX - 88, 349, 95), rect(platformX - 171, 430, 95));
    }
    function prism(r, x, y, remoteOnly = false) {
      const id = r.id + '-prism-' + r.prisms.length;
      r.prisms.push({id, x, y, remoteOnly});
      return id;
    }
    function barrier(r, x, phase = 0) {
      r.phaseSolids.push({phase, ...rect(x, 0, 24, floor)});
    }
    function stationaryBridge(r, start, end) {
      r.pit = [start, end];
      r.phaseSolids.push({phase: 1, ...rect(start, floor, end - start, 24)});
    }
    function ferry(r, start, end, speed, width = 98) {
      r.pit = [start, end];
      const left = start - 38;
      r.movers.push({x: left, x1: left, x2: end - width + 38, speed, ...rect(left, floor - 18, width)});
    }
    function core(r, x, y) { r.cores.push({id:r.id, x, y, name:r.name}); }
    function shard(r, x, y) { r.shards.push({id:r.id, x, y}); }

    const porch = room('H0', 3, 3, 'hub', names('星门前厅','Observatory Porch','Порог обсерватории','星門の前室'),'impact');
    const hub = room('H1', 4, 3, 'hub', names('天文台大厅','Grand Rotunda','Главный зал','天文台大広間'),'hub');
    const e1 = room('E1', 5, 3, 'east', names('铸铜工坊','Brass Workshop','Медная мастерская','真鍮工房'),'impact');
    const e2 = room('E2', 6, 3, 'east', names('双层水闸','Twin Sluices','Двойной шлюз','二重水門'),'impact');
    const e3 = room('E3', 7, 3, 'east', names('挂钟暗廊','Clock Gallery','Часовая галерея','時計回廊'),'spring');
    const e4 = room('E4', 8, 3, 'east', names('冷却井','Cooling Shaft','Шахта охлаждения','冷却井戸'),'spring');
    const e5 = room('E5', 9, 3, 'east', names('铜钟心室','Brass Bell Chamber','Зал медного колокола','真鍮の鐘室'),'impact');

    const w1 = room('W1', 3, 2, 'west', names('月光排练室','Moonlight Rehearsal','Лунная репетиционная','月光の稽古場'),'phase');
    const w2 = room('W2', 2, 2, 'west', names('褪色桥','Fading Bridge','Исчезающий мост','色褪せる橋'),'phase');
    const w3 = room('W3', 1, 2, 'west', names('封存棱镜','Sealed Prism','Запечатанная призма','封じられたプリズム'),'phase');
    const w4 = room('W4', 1, 1, 'west', names('月光留声室','Moonlight Recording Room','Лунная студия','月光の録音室'),'spring');
    const w5 = room('W5', 2, 1, 'west', names('月相档案馆','Lunar Archive','Лунный архив','月相の書庫'),'phase');

    const n1 = room('N1', 4, 2, 'north', names('摆渡长厅','Ferry Hall','Зал переправы','渡し舟の広間'),'mover');
    const n2 = room('N2', 5, 2, 'north', names('错车轨道','Passing Tracks','Встречные пути','行き違いの軌道'),'mover');
    const n3 = room('N3', 6, 2, 'north', names('落锤站台','Counterweight Station','Станция противовеса','落とし重りの駅'),'impact');
    const n4 = room('N4', 7, 2, 'north', names('铜轨回声','Echo of the Rails','Эхо рельсов','線路の残響'),'mover');
    const n5 = room('N5', 8, 2, 'north', names('星轨钟楼','Starlight Belfry','Звёздная колокольня','星軌の鐘楼'),'spring');

    const s1 = room('S1', 4, 4, 'south', names('回声井底','Echo Well','Колодец эха','こだまの井戸'),'spring');
    const s2 = room('S2', 5, 4, 'south', names('水下倒影','Stillwater Reflection','Отражение в тихой воде','静水の反射'),'phase');
    const s3 = room('S3', 6, 4, 'south', names('折光渡口','Refracted Crossing','Переправа преломления','屈折の渡し場'),'mover');
    const s4 = room('S4', 7, 4, 'south', names('无声玻璃库','Silent Glassworks','Тихая стекольня','静寂の硝子工房'),'glass');
    const s5 = room('S5', 8, 4, 'south', names('深井灯室','Deepwell Lantern','Фонарь глубин','深井戸の灯室'),'spring');
    const x1 = room('X1', 3, 4, 'south', names('前厅夹层','Porch Undercroft','Подвал у порога','前室の地下層'),'spring');
    const x2 = room('X2', 2, 4, 'south', names('第一道回声','First Echo','Первое эхо','最初のこだま'),'spring');
    const dome = room('H2', 4, 1, 'finale', names('星穹之顶','Crown of the Dome','Вершина купола','星の円蓋'),'impact');

    chain('right', porch, hub, e1, e2, e3, e4, e5);
    connect(porch, 'up', w1);
    chain('left', w1, w2, w3);
    connect(w3, 'up', w4);
    chain('right', w4, w5);
    connect(hub, 'up', n1);
    chain('right', n1, n2, n3, n4, n5);
    connect(e4, 'up', n5, [710, 830]);
    connect(hub, 'down', s1, [630, 750]);
    chain('right', s1, s2, s3, s4, s5);
    connect(porch, 'down', x1, [165, 285]);
    chain('left', x1, x2);
    chain('right', x1, s1);

    porch.spawn.x = 285;
    ascent(porch, 310);
    plate(porch, 625, gate(porch, 'porch-east').id);
    glass(porch, 'porch-glass', [165, 285], 'workshop-weight');
    porch.stele = {x:336, y:468, text:names(
      '跳到铜板上，看看它亮了几格。踏台就在前面。',
      'Jump onto the brass plate and watch its gauge. There are steps nearby.',
      'Прыгните на медную плиту и посмотрите на шкалу. Рядом есть уступы.',
      '真鍮板に跳び乗って目盛りを見てみよう。近くに足場がある。')};
    porch.solids.push(rect(70, 400, 92), rect(129, 318, 88));
    climb(porch, 545, 420, false);

    hub.astrolabe = {x: 400, y: 444};
    hub.stele = {x:237, y:468, text:names(
      '巡夜日志：星象仪熄了。工坊、月镜、钟楼和井底各有一枚备用星核。',
      'Night log: the astrolabe went dark. One spare core each in the workshop, archive, belfry and well.',
      'Дневник стража: астролябия погасла. По одному ядру осталось в мастерской, архиве, колокольне и колодце.',
      '夜番日誌：天球儀が消えた。工房、書庫、鐘楼、井戸に予備の星核が一つずつある。')};
    climb(hub, 550, 420);
    hub.solids.push(rect(765, 424, 106), rect(705, 343, 92));
    glass(hub, 'rotunda-glass', [630, 750]);

    ascent(e1, 215);
    e1.stele = {x:140, y:468, text:names(
      '那根导线不通往门。它接着头上的悬锤，还有前厅地板下的铜扣。',
      'That conduit leads to the counterweight overhead and a brass latch beneath the porch.',
      'Провод идёт к противовесу наверху и медной защёлке под порогом.',
      '導線は頭上の重りと、前室の床下にある真鍮の留め具につながっている。')};
    const workshopWeight = {id:'workshop-weight', ...rect(730, 111, 78, 60), restY:450};
    e1.weights.push(workshopWeight);
    plate(e1, 558, workshopWeight.id, 'dropWeight');
    gate(e1, 'workshop-east').requiresWeight = workshopWeight.id;
    // The weight itself is a step with room for a jump in either direction.
    e2.solids.push(rect(165, 446, 105), rect(245, 372, 110), rect(410, 438, 90),
      rect(475, 357, 100), rect(643, 409, 105));
    e2.doors.push({id:'sluice-mid', ...rect(394, 0, 24, floor)});
    plate(e2, 282, 'sluice-mid');
    plate(e2, 765, gate(e2, 'sluice-east').id);
    e3.solids.push(rect(318, 385, 126), rect(494, 330, 98), rect(645, 403, 112));
    e3.springs.push({...rect(249, 496, 64, 14), minimum:815});
    plate(e3, 499, gate(e3, 'clock-east').id, 'openDoor', 330, 1);
    e4.solids.push(rect(286, 435, 160), rect(416, 354, 115));
    climb(e4, 835, 710);
    ascent(e5, 340);
    e5.doors.push({id:'bell-door', ...rect(756, 0, 26, floor)});
    plate(e5, 653, 'bell-door');
    core(e5, 864, 490);

    // The first prism is in reach and toggles a single wall; the next two rooms reuse the same state.
    prism(w1, 645, 488); barrier(w1, 291);
    w1.spawn.x = 555;
    prism(w2, 815, 488); stationaryBridge(w2, 285, 695);
    const remote = prism(w3, 230, 126, true);
    barrier(w3, 332);
    w3.solids.push(rect(676, 430, 112), rect(599, 354, 100));
    plate(w3, 460, remote, 'togglePhase');
    climb(w3, 542, 420);
    w4.solids.push(rect(278, 430, 110), rect(170, 353, 118), rect(75, 276, 112));
    w4.springs.push(rect(110, 496, 70, 14));
    shard(w4, 130, 208);
    prism(w5, 160, 488);
    w5.phaseSolids.push({phase:0, ...rect(560, 0, 22, floor)}, {phase:1, ...rect(620, 354, 150)});
    w5.solids.push(rect(780, 435, 90));
    core(w5, 688, 332);

    ferry(n1, 600, 840, 139);
    n1.spawn.x = 342;
    ferry(n2, 254, 675, 160, 106);
    n2.movers[0].x2 = 409;
    n2.solids.push(rect(670, 443, 72, 67));
    ascent(n3, 170);
    const railWeight = {id:'rail-weight', ...rect(685, 106, 76, 62), restY:448};
    n3.weights.push(railWeight);
    plate(n3, 500, railWeight.id, 'dropWeight');
    gate(n3, 'rail-east').requiresWeight = railWeight.id;
    ferry(n4, 290, 672, 176, 115);
    n4.solids.push(rect(725, 433, 110), rect(805, 352, 102));
    shard(n4, 862, 331);
    n5.solids.push(rect(330, 410, 140), rect(467, 329, 125), rect(595, 260, 95));
    n5.springs.push(rect(296, 496, 75, 14));
    core(n5, 640, 238);
    glass(n5, 'belfry-shortcut', [710, 830]);
    n5.solids.push(rect(840, 418, 95), rect(775, 338, 93));

    climb(s1, 755, 630);
    s1.spawn.x = 392;
    prism(s2, 160, 488); barrier(s2, 552);
    s2.solids.push(rect(653, 432, 118), rect(747, 357, 108));
    ferry(s3, 270, 688, 155, 108);
    prism(s3, 758, 488); barrier(s3, 826);
    s4.solids.push(rect(175, 431, 107), rect(270, 355, 105), rect(630, 430, 112));
    s4.glass.push({id:'archive-window', ...rect(388, 433, 133, 26), persistent:true});
    // The glass hides a side alcove. The main corridor below it stays open in both directions.
    shard(s4, 463, 476);
    s4.doors.push({id:'archive-left', ...rect(382, 459, 15, 51), requiresGlass:'archive-window'},
      {id:'archive-right', ...rect(520, 459, 15, 51), requiresGlass:'archive-window'});
    s5.solids.push(rect(362, 393, 125), rect(508, 312, 128), rect(655, 232, 146));
    s5.springs.push(rect(324, 496, 70, 14), rect(525, 298, 64, 14));
    core(s5, 715, 211);
    climb(x1, 290, 165);
    x1.spawn.x = 415;
    x2.solids.push(rect(440, 425, 113), rect(320, 350, 112), rect(199, 277, 115));
    x2.springs.push(rect(522, 496, 62, 14), rect(215, 263, 55, 14));
    shard(x2, 246, 112);
    ascent(dome, 252);
    plate(dome, 593, null, 'finale');

    if (expanded) extendCampaign({rooms, room, names, rect, prism, plate});

    for (const r of Object.values(rooms)) {
      const cut = (span, limit, makeRect) => {
        if (!span) return [makeRect(0, limit)];
        const [low, high] = span;
        return [makeRect(0, low), makeRect(high, limit - high)];
      };
      r.solids.push(
        ...cut(r.openings.up, W, (x,w) => rect(x, 0, w, 30)),
        ...cut(r.openings.down || r.pit, W, (x,w) => rect(x, floor, w, H - floor)),
        rect(0, 30, 30, r.openings.left ? 350 : floor - 30),
        rect(W - 30, 30, 30, r.openings.right ? 350 : floor - 30)
      );
    }
    return rooms;
  }

  // A spoke forks after its entry and recombines before its seal. Each row
  // records the theme, parent room, puzzle order and geometry tuning.
  function extendCampaign({rooms, room, names, rect, prism, plate}) {
    const sectors = [
      ['H1', names('折返回廊','Return Galleries','Обратные галереи','帰還回廊'), ['memory','leap','relay','hammer','phase'], 0, 60],
      ['E1', names('余温熔炉','Ember Foundry','Угасшая литейная','余熱鋳造所'), ['hammer','phase','relay','beam','cross'], 1, 84],
      ['E3', names('摆锤档案','Pendulum Archive','Архив маятников','振り子の書庫'), ['beam','memory','spring','phase','relay'], 2, 92],
      ['W1', names('折月镜宫','Mirror of Moons','Лунные зеркала','月鏡殿'), ['phase','spring','memory','cross','beam'], 3, 88],
      ['W4', names('褪光花苑','Dusk Conservatory','Сумеречная оранжерея','薄暮の温室'), ['leap','relay','beam','hammer','memory'], 4, 96],
      ['N1', names('逆风飞桥','Headwind Viaduct','Виадук ветров','向かい風の高架橋'), ['spring','beam','phase','relay','cross'], 5, 88],
      ['N4', names('流星仪轨','Meteor Transit','Метеорная линия','流星の軌道'), ['leap','spring','relay','beam','hammer'], 6, 102],
      ['S1', names('潮汐空洞','Tidal Caverns','Пещеры прилива','潮汐洞窟'), ['relay','cross','hammer','memory','phase'], 7, 96],
      ['S4', names('晶盐深库','Crystal Vaults','Кристальный склад','結晶の奥倉'), ['hammer','beam','memory','leap','cross'], 8, 106],
      ['X1', names('无光抄本','Lightless Manuscripts','Рукописи без света','無光の写本庫'), ['memory','phase','spring','beam','cross'], 9, 99],
      ['H2', names('远日冠环','Aphelion Ring','Кольцо афелия','遠日点の環'), ['cross','hammer','phase','spring','relay'], 10, 110],
    ];
    const titles = {
      memory: names('循序','Inscription','Надпись','銘文'),
      leap: names('悬阶','Escarpment','Уступы','断崖'),
      relay: names('余响','Relay','Эстафета','継電器'),
      hammer: names('重锤','Hammer','Молот','重槌'),
      phase: names('相位','Refraction','Преломление','屈折'),
      beam: names('明灭','Eclipse','Затмение','蝕'),
      spring: names('弹道','Launch','Запуск','発射'),
      cross: names('合流','Confluence','Слияние','合流'),
    };
    const localized = (label, title) =>
      Object.fromEntries(Object.keys(label).map(lang => [lang, label[lang] + ' · ' + title[lang]]));
    const portal = (source, x, to, tx, needs = [], y = 480) => {
      (source.portals ??= []).push({x, y, to: to.id, tx, needs});
    };

    for (const [parent, label, courses, sector, gap] of sectors) {
      const ids = courses.map((_, stage) => 'A' + (sector + 1) + '-' + (stage + 1));
      const wing = courses.map((style, stage) => {
        const r = room(ids[stage], 2 + stage, 5 + sector, rooms[parent].zone,
          localized(label, titles[style]), 'hub');
        r.puzzle = {kind:style, switches:[], sequence:[], seconds:0};
        r.spawn.x = 63;
        designCourse(r, style, gap, sector, stage);
        return r;
      });
      const [entry, upper, lower, merge, seal] = wing;
      const parentX = {H1:183,E1:91,E3:752,W1:840,W4:475,N1:168,N4:142,S1:215,S4:805,X1:518,H2:791}[parent];
      portal(rooms[parent], parentX, entry, 63, parent === 'H2' ? ['A2-5','A4-5','A6-5','A8-5'] : []);
      for (const [i, r] of wing.entries()) {
        const back = [rooms[parent], entry, entry, upper, merge][i];
        portal(r, 76, back, i === 0 ? parentX - 30 : 62);
      }
      portal(entry, 760, upper, 63, [entry.id]);
      portal(entry, 874, lower, 63, [entry.id]);
      portal(upper, 874, merge, 63, [upper.id]);
      portal(lower, 874, merge, 63, [lower.id]);
      portal(merge, 226, lower, 63);
      portal(merge, 874, seal, 63, [upper.id, lower.id, merge.id]);
      portal(seal, 874, rooms.H1, 355, [seal.id]);
      seal.seal = true;
    }

    function designCourse(r, style, gap, sector, stage) {
      const puzzle = r.puzzle;
      const add = (x, y, rule, mark) => {
        const id = puzzle.switches.length + 1;
        puzzle.switches.push({id, x, y, ...rule, mark:mark ?? id});
        return id;
      };
      const platform = (x, y, w) => r.solids.push(rect(x,y,w));
      const stairs = (x, direction = 1) => {
        for (let i = 0; i < 3; i++) platform(x + i * 96 * direction, 443 - i * 64, 86 + (stage % 2) * 10);
      };
      const b = 280 + (sector % 4) * 24;
      if (style === 'memory') {
        stairs(b - 32);
        add(191,480); add(b + 235,286); add(718,480);
        puzzle.sequence = [[2,1,3],[3,2,1],[1,3,2]][sector === 7 ? 2 : (sector + stage) % 3];
        return;
      }
      if (style === 'leap' || style === 'beam') {
        r.pit = [b, b + gap * 3 + 48];
        const bridge = [b + gap - 58, b + gap * 2 - 30, b + gap * 3 - 16];
        for (const [index,x] of bridge.entries()) platform(x, index === 1 ? 401 : 458, 68);
        add(bridge[1] + 34,373);
        add(827,480);
        puzzle.sequence = [1,2];
        if (style === 'beam') puzzle.beam = {x:bridge[1] + 48,y:320,w:13,h:81,period:2.8 - sector * .065};
        return;
      }
      if (style === 'spring') {
        r.springs.push({...rect(b-91,496,65,14),minimum:825});
        platform(b + 6,327,96); platform(b + 203,412,91);
        platform(b + 321,358,72); platform(b + 431,414,83);
        add(b + 58,298); add(b + 355,330);
        puzzle.sequence = [1,2];
        return;
      }
      if (style === 'hammer' || style === 'cross') {
        stairs(b - 108);
        platform(b + 312,432,95);
        const center = b + 225;
        const id = add(center,480,{impact:true,phase:style === 'cross' ? 1 : undefined});
        plate(r, center - 44, id, 'campaign');
        add(b + 358,403,{phase:style === 'cross' ? 0 : undefined});
        if (style === 'cross') {
          prism(r,212,482);
          puzzle.sequence = [2,1];
        } else puzzle.sequence = [1,2];
        return;
      }
      if (style === 'phase') {
        prism(r,195,484); prism(r,709,484);
        platform(b - 53,440,96);
        r.phaseSolids.push({phase:1,...rect(b+54,370,133)});
        platform(b+193,432,115);
        add(b + 112,342,{phase:1});
        add(b + 241,402,{phase:0});
        puzzle.sequence = [1,2];
        return;
      }
      platform(b - 38,443,114); platform(b + 95,380,104); platform(b + 253,434,106);
      add(159,480); add(b + 142,352); add(802,480);
      puzzle.sequence = sector % 2 ? [1,2,3] : [3,2,1];
      puzzle.seconds = Math.max(8, 14 - sector * .4);
    }
  }

  return {makeRooms};
})();
