(function () {
  'use strict';
  const NO = window.NO = window.NO || {};
  const T = 40, W = 1280, H = 720, GY = 680;

  // ---------- geometry helpers ----------
  function P(x, y, w, h, type, extra) {
    return Object.assign({ x, y, w, h, type: type || 'solid' }, extra || {});
  }
  function star(x, y, w, h, extra) { return P(x, y, w, h, 'starGlass', extra); }
  function fragile(x, y, w, h, extra) { return P(x, y, w, h, 'fragile', extra); }
  function bridge(x, y, w, h, requires, extra) { return P(x, y, w, h, 'bridge', Object.assign({ requires }, extra || {})); }

  function base(w, h, floors) {
    w = w || W; h = h || H;
    const p = [P(0, 0, 40, h), P(w - 40, 0, 40, h), P(0, 0, w, 40)];
    if (!floors) floors = [[0, w]];
    for (const f of floors) p.push(P(f[0], h - 40, f[1], 40));
    return p;
  }

  function R(id, wing, name, opts) {
    opts = opts || {};
    const room = Object.assign({
      id, wing, name,
      w: W, h: H, bg: wing,
      spawn: { x: 100, y: GY },
      platforms: [],
      objects: [],
      hintKey: 'hard',
      hintTargets: [],
      intro: null
    }, opts);
    if (room.platforms.length === 0) room.platforms = base(room.w, room.h);
    return room;
  }

  function seal(id, x, y, req, extra) {
    return Object.assign({ type: 'seal', id, x, y, w: 76, h: 16, req: req || 'hard', latch: true, timer: 0, active: false }, extra || {});
  }
  function bell(id, x, y, duration, extra) {
    return seal(id, x, y, 'hard', Object.assign({ bell: true, latch: false, duration: duration || 8 }, extra || {}));
  }
  function exit(to, x, y, extra) {
    return Object.assign({ type: 'exit', id: 'exit_' + to + '_' + x + '_' + y, to, x, y, w: 64, h: 100 }, extra || {});
  }
  function echo(id, x, y, textKey, extra) {
    return Object.assign({ type: 'echo', id, x, y, w: 34, h: 34, textKey, taken: false }, extra || {});
  }
  function sign(id, x, y, textKey, extra) {
    return Object.assign({ type: 'sign', id, x, y, w: 34, h: 44, textKey }, extra || {});
  }
  function mirror(id, x, y, ori, extra) {
    return Object.assign({ type: 'mirror', id, x, y, w: 44, h: 44, ori: ori || '/' }, extra || {});
  }
  function lamp(id, x, y, dx, dy, extra) {
    return Object.assign({ type: 'lamp', id, x, y, dx, dy: dy == null ? 0 : dy, color: '#ffd9a0' }, extra || {});
  }
  function sensor(id, x, y, mode, extra) {
    return Object.assign({ type: 'sensor', id, x, y, w: 40, h: 40, mode: mode || 'lit', lit: false, active: false, hold: 0, timer: 0 }, extra || {});
  }
  function zone(id, x, y, w, h, dir, extra) {
    return Object.assign({ type: 'zone', id, x, y, w, h, dir: dir || -1 }, extra || {});
  }
  function anchor(id, x, y, zoneId, extra) {
    return Object.assign({ type: 'anchor', id, x, y, w: 76, h: 18, zone: zoneId, req: 'hard', used: false }, extra || {});
  }
  function mover(id, x, y, w, h, bx, by, speed, phase) {
    return { type: 'mover', id, x, y, w, h, ox: x, oy: y, bx, by, speed: speed || 60, phase: phase || 0 };
  }
  function spike(x, y, w, h, dir) {
    return { type: 'spike', x, y, w, h, dir: dir || 'up' };
  }
  function deco(kind, x, y, extra) {
    return Object.assign({ type: 'deco', kind, x, y }, extra || {});
  }
  function txt(zh, en, ru, ja) { return { zh, en, ru, ja }; }

  // ---------- hint sets ----------
  const hintSets = {
    hard: [
      txt('先看地面：哪块圆盘在等一个很重的落地？', 'Look at the floor: which plate is waiting for a heavy landing?', 'Посмотри на пол: какая пластина ждёт тяжёлого приземления?', '床を見よう。重い着地を待っている円盤はどれ？'),
      txt('蓝色封印只认“重落”。从更高的地方落下，别按缓冲。', 'The blue seal only answers a heavy landing. Fall from higher and release the brace.', 'Синяя печать слушает только тяжёлое приземление. Падай с большей высоты и не держи торможение.', '青い封印は「重い着地」だけに応える。高い所から、ブレーキを離して落ちよう。'),
      txt('爬到高台，走到边缘，松开缓冲跳下去，让脚底砸在圆盘上。', 'Climb the high ledge, step off, release the brace and let your feet hit the plate.', 'Поднимись на высокий выступ, шагни с края, отпусти торможение и ударь ногами по пластине.', '高い足場に上がり、端からブレーキを離して飛び降り、円盤に足を打ちつけよう。')
    ],
    soft: [
      txt('有些表面怕重。先看看脚下是不是薄冰或旧玻璃。', 'Some surfaces are afraid of weight. Check whether the floor is thin ice or old glass.', 'Некоторые поверхности боятся веса. Проверь, не тонкий ли это лёд или старое стекло.', '重さに弱い床がある。薄氷や古いガラスではないか、足元を見よう。'),
      txt('按住缓冲再落地，冲量会被压到“轻落”。', 'Hold the brace as you land; your impact is pressed down to a soft landing.', 'Держи торможение при приземлении — импульс станет мягким.', '着地の瞬間にブレーキを押すと、衝撃が「軽い着地」になる。'),
      txt('从低处起跳，按住缓冲落到薄冰上；听到轻轻的一声就对了。', 'Hop from a low place, hold brace and settle onto the thin ice. A soft thud means it held.', 'Прыгни с низкого места, держи торможение и опустись на тонкий лёд. Тихий стук — значит, выдержал.', '低い所から跳び、ブレーキを押したまま薄氷へ。小さな音なら成功だ。')
    ],
    fragile: [
      txt('这块地听起来是空的。', 'This floor sounds hollow.', 'Этот пол звучит пусто.', 'この床は空っぽな音がする。'),
      txt('薄冰只接受轻落；重落会让它碎掉。', 'Thin ice only accepts a soft landing; a heavy one breaks it.', 'Тонкий лёд принимает только мягкое приземление; тяжёлое его ломает.', '薄氷は軽い着地だけを受け入れる。重いと割れる。'),
      txt('用短跳加缓冲逐块过去。最后需要重落时，找一块结实的石台。', 'Use short hops with brace, one piece at a time. When you need a heavy landing, find solid stone.', 'Короткие прыжки с торможением, по одной плите. Для тяжёлого приземления найди камень.', '短いジャンプとブレーキで一枚ずつ渡ろう。重い着地が必要な時は石の台へ。')
    ],
    bell: [
      txt('钟在等一个足够重的落地。', 'The bell is waiting for a heavy enough landing.', 'Колокол ждёт достаточно тяжёлого приземления.', '鐘は十分に重い着地を待っている。'),
      txt('重落敲钟，钟声会让某扇门短暂打开。', 'A heavy landing rings the bell; the sound opens a door for a short while.', 'Тяжёлое приземление звонит в колокол; звук ненадолго открывает дверь.', '重い着地で鐘を鳴らすと、音がしばらく扉を開ける。'),
      txt('先敲钟，再立刻沿最近的路线冲向那扇门。别在路上停。', 'Ring it, then take the shortest route to the door. Do not stop on the way.', 'Ударь в колокол и сразу беги к двери кратчайшим путём. Не останавливайся.', '鐘を鳴らしたら、最短ルートで扉へ。途中で止まらないこと。')
    ],
    light: [
      txt('星玻璃在光里变实，在影里消失。先找光源。', 'Star glass becomes solid in light and vanishes in shadow. Find the light first.', 'Звёздное стекло твердеет в свете и исчезает в тени. Сначала найди свет.', '星ガラスは光で実体になり、影で消える。まず光源を探そう。'),
      txt('转动镜子，让光束穿过星玻璃；被照亮的玻璃才能站人。', 'Turn the mirror so the beam crosses the star glass. Only lit glass can hold you.', 'Поверни зеркало так, чтобы луч прошёл сквозь звёздное стекло. Держит только освещённое.', '鏡を回して光を星ガラスへ通す。照らされたガラスだけが足場になる。'),
      txt('站到镜子旁按交互键旋转它，直到光点落在桥面上。', 'Stand by the mirror, press interact to rotate it until the light lands on the bridge.', 'Встань у зеркала и вращай его, пока свет не упадёт на мост.', '鏡のそばで調べるボタンを押し、光が橋に当たるまで回そう。')
    ],
    mirror: [
      txt('一面镜子可以改变整条光路。', 'One mirror can change the whole path of light.', 'Одно зеркало меняет весь путь света.', '鏡一枚で光の道が変わる。'),
      txt('把光从灯引到传感器，或者引到星玻璃上。', 'Guide the light from the lamp to a sensor, or onto star glass.', 'Направь свет от лампы к сенсору или на звёздное стекло.', 'ランプの光をセンサーか星ガラスへ導こう。'),
      txt('先转下面那面，再转上面那面；让光束拐两次弯。', 'Turn the lower mirror first, then the upper one; make the beam turn twice.', 'Сначала нижнее зеркало, потом верхнее; луч должен повернуть дважды.', '下の鏡、上の鏡の順に回して、光を二回曲げよう。')
    ],
    body: [
      txt('你站在光里时，身后会发生什么？', 'When you stand in the light, what happens behind you?', 'Когда ты стоишь в свете, что происходит позади?', '光の中に立つと、後ろで何が起きる？'),
      txt('你的身体会挡住光束。被影子盖住的星玻璃会消失。', 'Your body blocks the beam. Star glass covered by your shadow disappears.', 'Твоё тело перекрывает луч. Звёздное стекло в твоей тени исчезает.', '体が光を遮る。影に入った星ガラスは消える。'),
      txt('走进光束，让影子落在挡路的玻璃上，然后在光里继续往前走。', 'Step into the beam so your shadow falls on the blocking glass, then keep walking inside the light.', 'Войди в луч, чтобы тень упала на стекло, и иди дальше внутри света.', '光の中へ入り、影を邪魔なガラスに落とし、そのまま光の中を進もう。')
    ],
    sensor: [
      txt('这个水晶在等光，或者在等黑暗。', 'This crystal is waiting for light — or for darkness.', 'Этот кристалл ждёт свет — или тьму.', 'この水晶は光を、あるいは闇を待っている。'),
      txt('看它底座的颜色：亮色要光，暗色要影。', 'Read the base: a bright base wants light, a dark base wants shadow.', 'Посмотри на основание: светлое хочет света, тёмное — тени.', '台座の色を見よう。明るい台座は光、暗い台座は影を求める。'),
      txt('用镜子把光引过去，或者站进光路把光挡掉。', 'Use a mirror to bring the light, or stand in the beam to block it.', 'Зеркалом направь свет или встань в луч, чтобы перекрыть его.', '鏡で光を導くか、光路に入って遮ろう。')
    ],
    gravity: [
      txt('注意墙上的箭头：这个房间的“下”可能不在脚下。', 'Watch the arrows: in this room, “down” may not be under your feet.', 'Следи за стрелками: «низ» здесь может быть не под ногами.', '壁の矢印を見よう。この部屋の「下」は足元とは限らない。'),
      txt('走进重力场，你会朝箭头方向落下。跳跃永远朝反方向。', 'Enter a gravity field and you fall toward the arrow. Jumping always goes the other way.', 'В поле гравитации ты падаешь по стрелке. Прыжок всегда в обратную сторону.', '重力場に入ると矢印の方向へ落ちる。ジャンプはいつも逆方向。'),
      txt('先站上平台，再进入场；如果想重落，先朝反方向跳开，再让重力把你拉回来。', 'Stand on a platform, then enter the field. For a heavy landing, jump away first and let gravity pull you back.', 'Встань на платформу и войди в поле. Для тяжёлого приземления сначала прыгни в сторону, потом дай гравитации вернуть тебя.', '台に乗ってから場へ。重い着地なら逆へ跳び、重力に引き戻してもらおう。')
    ],
    anchor: [
      txt('这个锚点连着远处的一片重力。', 'This anchor is tied to a distant patch of gravity.', 'Этот якорь связан с дальним участком гравитации.', 'この錨は遠くの重力とつながっている。'),
      txt('用重落砸锚点，会把那片区域的重力翻过来。', 'A heavy landing on the anchor flips that region’s gravity.', 'Тяжёлое приземление на якорь переворачивает гравитацию области.', '重い着地で錨を打つと、その区域の重力が反転する。'),
      txt('先找高台，再砸锚点；然后立刻进入变向的区域。', 'Find a high ledge, hit the anchor, then enter the flipped region at once.', 'Найди высокий выступ, ударь по якорю и сразу войди в перевёрнутую зону.', '高い足場から錨を打ち、すぐ反転した区域へ入ろう。')
    ],
    combo: [
      txt('这一间不止一条规则。先分开看：力度、光路、方向。', 'This room uses more than one rule. Read them separately: impact, light, direction.', 'Здесь больше одного правила. Разбери их: импульс, свет, направление.', 'この部屋は複数の規則を使う。衝撃・光・向きに分けて見よう。'),
      txt('每一条规则都只解决一段路。先做能看见的那一段。', 'Each rule solves one stretch. Start with the stretch you can see.', 'Каждое правило решает свой отрезок. Начни с того, что видно.', 'それぞれの規則は道の一部を解く。見えている部分から始めよう。'),
      txt('先把光桥点亮，再翻重力去高处，最后用重落砸封印。', 'Light the bridge first, flip gravity to reach the height, then heavy-land on the seal.', 'Сначала зажги мост, потом переверни гравитацию, затем тяжёлое приземление на печать.', 'まず光の橋を灯し、重力を反転して高さへ行き、最後に重い着地で封印を打とう。')
    ],
    prism: [
      txt('三棱门有三个面：力度、路径、方向。', 'The Prism Door has three faces: impact, path, direction.', 'У Призматических врат три грани: импульс, путь, направление.', '三稜の門には三つの面がある。衝撃、光の道、向き。'),
      txt('三个面分别对应守夜厅里的重落封印、光束传感器和重力锚点。', 'They answer the heavy seal, the light sensor and the gravity anchor in the hall.', 'Они отвечают тяжёлой печати, световому сенсору и гравитационному якорю в зале.', '三つの面は、広間の重い封印、光センサー、重力の錨に対応している。'),
      txt('先点亮三个面，再回到高台上的门。门后是书房和一段回声。', 'Light all three faces, then return to the door on the high platform. A study and an echo wait behind it.', 'Зажги все три грани и вернись к двери на высоком помосте. За ней кабинет и эхо.', '三面を灯して高台の扉へ戻ろう。奥に書斎と響きがある。')
    ],
    final: [
      txt('星图仪在等三枚符印，也在等你把三条规则叠在一起。', 'The Orrery waits for three sigils — and for you to layer the three rules.', 'Планетарий ждёт три печати и то, как ты сложишь три правила.', '星図儀は三つの印章と、三つの規則を重ねる君を待っている。'),
      txt('光让路出现，重力改变你从哪边落，冲量决定机关听见多少。', 'Light makes the path, gravity changes where you fall from, impact decides what the mechanism hears.', 'Свет создаёт путь, гравитация меняет сторону падения, импульс решает, что услышит механизм.', '光が道を作り、重力が落ちる向きを変え、衝撃が機関に届く強さを決める。'),
      txt('先找光，再找方向，最后找落点。三条都对齐时，门会自己开。', 'Find the light, then the direction, then the landing point. When all three align, the door opens itself.', 'Найди свет, затем направление, затем точку приземления. Когда всё сойдётся, дверь откроется сама.', '光、向き、着地点の順に。三つが揃えば扉はひとりでに開く。')
    ]
  };

  // ---------- story ----------
  const story = {
    intro: [
      { speaker: 'conductor', text: txt('你回来了。海已经停了很久。', 'You came back. The sea has been still for a long time.', 'Ты вернулся. Море стоит уже давно.', 'お帰り。海はもう長いこと止まっている。') },
      { speaker: 'watchman', text: txt('航标灯为什么灭了？', 'Why is the beacon dark?', 'Почему маяк погас?', 'なぜ航路標識は消えているの？') },
      { speaker: 'conductor', text: txt('上一任守夜人亲手熄灭了它。他说，光会引来不该来的东西。', 'The last watchman put it out himself. He said the light would call something that should not come.', 'Последний страж погасил его сам. Он говорил, что свет призовёт то, что не должно прийти.', '前の夜番が自分で消した。光は来てはいけないものを呼ぶ、と言って。') },
      { speaker: 'conductor', text: txt('如果你想知道他为什么这么做，先找回三枚符印。', 'If you want to know why, find the three sigils first.', 'Если хочешь понять почему, сначала найди три печати.', '理由を知りたければ、まず三つの印章を探して。') }
    ],
    echoes: {
      study: { title: txt('第一夜', 'The First Night', 'Первая ночь', '最初の夜'), body: txt('他把航标调到最亮。云海下的船都看见了，云城的人也看见了。那一夜，所有人都以为天文台会永远亮着。', 'He set the beacon to its brightest. Every ship below the cloud sea saw it, and so did the cloud city. That night, everyone believed the observatory would shine forever.', 'Он поставил маяк на самый яркий свет. Его увидели все корабли под облачным морем — и город в облаках. В ту ночь все думали, что обсерватория будет сиять вечно.', '彼は航路標識を最大の明るさにした。雲海の下の船も、雲の街の人も見た。あの夜、誰もが天文台は永遠に灯ると思った。') },
      echo1: { title: txt('第二夜', 'The Second Night', 'Вторая ночь', '二日目の夜'), body: txt('光太亮了。云城的霜开始融化，屋脊滴水，孩子们第一次看见自己的影子。守夜人收到了第一封没有署名的信：请把灯关掉。', 'The light was too bright. The frost of the cloud city began to melt; roofs dripped, and children saw their shadows for the first time. The watchman received the first unsigned letter: put out the light.', 'Свет был слишком ярким. Иней облачного города начал таять, крыши потекли, дети впервые увидели свои тени. Страж получил первое письмо без подписи: погаси свет.', '光が強すぎた。雲の街の霜が溶け、屋根から雫が落ち、子どもたちは初めて自分の影を見た。夜番のもとに、差出人のない手紙が届いた。「灯を消してくれ」と。') },
      echo2: { title: txt('第三夜', 'The Third Night', 'Третья ночь', '三日目の夜'), body: txt('信越来越多。有的说船会撞上云城，有的说光会把冬天烧穿。他把信按日期排好，像排一排小小的墓碑。', 'More letters came. Some said ships would strike the cloud city; others said the light would burn through winter. He sorted them by date, like a row of small gravestones.', 'Писем становилось больше. Одни говорили, что корабли врежутся в облачный город; другие — что свет прожжёт зиму. Он разложил их по датам, как маленькие надгробия.', '手紙は増えた。船が雲の街にぶつかると言うもの、光が冬を焼き抜くと言うもの。彼は日付順に並べた。小さな墓標のように。') },
      echo3: { title: txt('第四夜', 'The Fourth Night', 'Четвёртая ночь', '四日目の夜'), body: txt('他在镜厅里看见自己老去，海面却仍然停着。那一刻他明白：航标灯照亮的不是海，是所有还愿意等的人。', 'In the mirror hall he watched himself age while the sea stood still. Then he understood: the beacon did not light the sea. It lit everyone who was still willing to wait.', 'В зеркальном зале он видел, как стареет, а море стояло. Тогда он понял: маяк освещал не море, а всех, кто ещё готов ждать.', '鏡の回廊で自分が老いるのを見た。海は止まったままだった。その時わかった。航路標識が照らしていたのは海ではなく、待つことを選んだ人たちだった。') },
      echo4: { title: txt('第五夜', 'The Fifth Night', 'Пятая ночь', '五日目の夜'), body: txt('他熄了灯。那一年，没有船回来，但云城没有塌。他在日志里写：我救了一座城，弄丢了一片海。', 'He put out the light. That year no ship returned, but the cloud city did not fall. He wrote in the log: I saved a city and lost a sea.', 'Он погасил свет. В тот год не вернулся ни один корабль, но облачный город устоял. Он записал: я спас город и потерял море.', '彼は灯を消した。その年、帰ってきた船はなかった。でも雲の街は落ちなかった。記録にはこう書いた。「街を救い、海を失った」。') },
      echo5: { title: txt('第六夜', 'The Sixth Night', 'Шестая ночь', '六日目の夜'), body: txt('他开始倒着走。从钟摆井走到坠星塔，再走回来。他以为只要把路走反，时间也会跟着倒流。', 'He began walking backwards. From the Pendulum Well to the Fallen Star Tower and back. He thought that if he reversed the path, time would follow.', 'Он начал ходить спиной вперёд. От Колодца маятника к Башне падающей звезды и обратно. Он думал, что если пройти путь назад, время пойдёт за ним.', '彼は逆さまに歩き始めた。振り子の井戸から堕ち星の塔へ、また戻る。道を逆に歩けば、時間もついてくると思った。') },
      echo6: { title: txt('最后一夜', 'The Last Night', 'Последняя ночь', '最後の夜'), body: txt('最后一班船没有回来。他在航标下坐了很久，把一枚小小的星形铜片放进星图仪，旁边刻着：如果还有人回来，让光动起来，不要定住。', 'The last ship did not return. He sat beneath the beacon for a long time and placed a small star-shaped brass plate into the Orrery. Beside it he engraved: if anyone returns, let the light move. Do not let it stand still.', 'Последний корабль не вернулся. Он долго сидел под маяком и вложил в Планетарий маленькую латунную звезду. Рядом вырезал: если кто-то вернётся, пусть свет движется. Не дай ему замереть.', '最後の船は帰らなかった。彼は航路標識の下に長く座り、小さな星形の真鍮片を星図儀に入れた。そばに刻んだ。「誰かが戻ったなら、光を動かしてくれ。止めるな」。') },
      hidden1: { title: txt('第八颗星', 'The Eighth Star', 'Восьмая звезда', '八つ目の星'), body: txt('星图上多了一颗没有名字的星。它的轨道很慢，扫过云海时，船只跟着它走，云城只在光的外缘停留。你终于明白：他当年缺的不是勇气，是一颗会移动的星。', 'A nameless star appeared on the chart. Its orbit was slow; ships followed it across the cloud sea, and the cloud city stayed at the edge of its light. You finally understand: what he lacked was not courage, but a star that could move.', 'На карте появилась звезда без имени. Её орбита была медленной; корабли шли за ней по облачному морю, а облачный город оставался на краю света. Ты понимаешь: ему не хватало не смелости, а движущейся звезды.', '星図に名前のない星が増えた。その軌道はゆっくりで、船はそれを追って雲海を渡り、雲の街は光の縁に留まった。ようやくわかる。彼に足りなかったのは勇気ではなく、動く星だった。') }
    },
    endings: {
      beacon: {
        title: txt('点亮航标', 'Light the Beacon', 'Зажечь маяк', '航路標識を灯す'),
        body: txt('你让光重新亮起。云海下的船一艘接一艘找到路，光也照进了云城，霜开始融化，屋脊滴水。人们开始撤离，但没有人再迷失。\n\n天文台成了一座真正的灯塔。你听见海面裂开第一道缝，像一声很长的呼吸。', 'You let the light rise again. One by one, ships below the cloud sea found their way. The light reached the cloud city too; frost began to melt and roofs dripped. People began to evacuate, but no one was lost again.\n\nThe observatory became a true lighthouse. You heard the sea crack open for the first time, like a long breath.', 'Ты снова зажёг свет. Корабли под облачным морем один за другим нашли путь. Свет дошёл и до облачного города; иней начал таять, крыши потекли. Люди стали уходить, но больше никто не терялся.\n\nОбсерватория стала настоящим маяком. Ты услышал, как море впервые треснуло, словно долгий вдох.', '光を再び灯した。雲海の下の船が一そうずつ道を見つけ、光は雲の街にも届いた。霜が溶け、屋根から雫が落ちる。人々は避難を始めたが、もう誰も迷わなかった。\n\n天文台は本当の灯台になった。海が初めて裂ける音が、長い息のように聞こえた。')
      },
      dark: {
        title: txt('守住长夜', 'Keep the Long Night', 'Сберечь долгую ночь', '長い夜を守る'),
        body: txt('你让航标继续沉睡。云城留在黑暗里，像一枚合上的贝壳。船没有再回来。\n\n你在守夜厅里听见风穿过空着的泊位。海面依旧停着，但这一次，是你选择的静止。', 'You let the beacon sleep. The cloud city stayed in the dark, like a closed shell. No ship returned.\n\nIn the hall you heard wind pass through empty berths. The sea was still, but this time the stillness was your choice.', 'Ты оставил маяк спать. Облачный город остался в темноте, как закрытая раковина. Корабли не вернулись.\n\nВ зале ты слышал, как ветер проходит сквозь пустые причалы. Море стояло, но теперь эта тишина была твоим выбором.', '航路標識を眠らせた。雲の街は暗闇に残り、閉じた貝のようだった。船は戻らなかった。\n\n広間では、風が空の停泊地を抜ける音がした。海は止まったままだ。でも今度は、君が選んだ静止だった。')
      },
      eighth: {
        title: txt('第八颗星', 'The Eighth Star', 'Восьмая звезда', '八つ目の星'),
        body: txt('你把八段回声嵌进星图仪，让光不再定住，而是缓慢扫过云海。船跟着移动的星走，云城只在光的外缘停留。\n\n第八颗星没有名字，但每一艘夜航船都认得它。海面开始呼吸，一涨一落，像有人在很远的地方轻轻数拍子。', 'You set the eight echoes into the Orrery and let the light move instead of standing still, sweeping slowly across the cloud sea. Ships followed the moving star; the cloud city stayed at the edge of its light.\n\nThe eighth star has no name, but every night ship knows it. The sea began to breathe, rising and falling, as if someone far away were counting time.', 'Ты вложил восемь эхов в Планетарий и позволил свету двигаться, медленно скользя по облачному морю. Корабли шли за движущейся звездой; облачный город оставался на краю света.\n\nУ восьмой звезды нет имени, но каждый ночной корабль её знает. Море начало дышать, поднимаясь и опускаясь, будто кто-то далеко отсчитывает такт.', '八つの響きを星図儀に嵌め、光を止めずにゆっくり雲海へ掃かせた。船は動く星を追い、雲の街は光の縁に留まった。\n\n八つ目の星に名前はない。でも夜航の船はみんな知っている。海が呼吸を始め、遠くで誰かが拍子を数えているようだった。')
      }
    },
    signs: {
      t1: txt('落地越重，蓝封印收到的冲量越大。', 'The heavier the landing, the more impact the blue seal receives.', 'Чем тяжелее приземление, тем больше импульса получает синяя печать.', '着地が重いほど、青い封印は多くの衝撃を受け取る。'),
      t2: txt('按住缓冲，落地会变轻。薄冰只接受轻落。', 'Hold brace to soften a landing. Thin ice only accepts a soft one.', 'Держи торможение, чтобы смягчить приземление. Тонкий лёд принимает только мягкое.', 'ブレーキを押すと着地が軽くなる。薄氷は軽い着地だけを受け入れる。'),
      l1: txt('星玻璃在光里变实。转动镜子，把光引过去。', 'Star glass becomes solid in light. Turn the mirror to guide the light.', 'Звёздное стекло твердеет в свете. Поверни зеркало, чтобы направить свет.', '星ガラスは光で実体になる。鏡を回して光を導こう。'),
      g1: txt('箭头指向“下”。跳跃永远朝反方向。', 'The arrow points to “down”. A jump always goes the other way.', 'Стрелка показывает «низ». Прыжок всегда в обратную сторону.', '矢印が「下」を指す。ジャンプはいつも逆方向。'),
      final: txt('光、方向、力度。三条都对齐时，门会自己开。', 'Light, direction, impact. When all three align, the door opens itself.', 'Свет, направление, импульс. Когда всё сойдётся, дверь откроется сама.', '光、向き、衝撃。三つが揃えば扉はひとりでに開く。')
    }
  };

  // ---------- rooms (initial build; more rooms are appended below) ----------
  const rooms = {};

  rooms.hub = R('hub', 'hub', txt('守夜厅', 'Nightwatch Hall', 'Зал ночного стража', '夜番の広間'), {
    w: 1600, h: 720,
    spawn: { x: 160, y: 680 },
    bg: 'hub',
    hintKey: 'prism',
    hintTargets: ['seal', 'sensor', 'anchor', 'mirror', 'exit'],
    platforms: [
      ...base(1600, 720),
      P(160, 440, 160, 24),
      P(125, 560, 70, 32),
      P(480, 620, 80, 18),
      P(520, 560, 80, 60),
      P(560, 520, 480, 40),
      P(1190, 620, 50, 60),
      P(1220, 560, 60, 60),
      P(1260, 520, 180, 40),
      P(1400, 620, 64, 20)
    ],
    objects: [
      // three wing doors
      exit('tide1', 210, 580, { label: txt('钟摆井', 'Pendulum Well', 'Колодец маятника', '振り子の井戸'), w: 72, h: 100 }),
      exit('light1', 740, 580, { label: txt('月镜回廊', 'Moonmirror Gallery', 'Галерея лунных зеркал', '月鏡の回廊'), w: 72, h: 100 }),
      exit('grav1', 1120, 580, { label: txt('坠星塔', 'Fallen Star Tower', 'Башня падающей звезды', '堕ち星の塔'), w: 72, h: 100 }),
      exit('tide7', 200, 340, {
        label: txt('钟摆井 · 捷径', 'Pendulum Well · Shortcut', 'Колодец маятника · Путь', '振り子の井戸 · 近道'),
        w: 70, h: 100, requires: { sigils: ['tide'] },
        lockedText: txt('第一枚符印之后，这条捷径才会亮。', 'This shortcut opens after the first sigil.', 'Этот путь откроется после первой печати.', '最初の印章のあとで、この近道は灯る。')
      }),
      exit('light7', 980, 420, {
        label: txt('月镜回廊 · 捷径', 'Moonmirror Gallery · Shortcut', 'Галерея зеркал · Путь', '月鏡の回廊 · 近道'),
        w: 60, h: 100, requires: { sigils: ['light'] },
        lockedText: txt('第二枚符印之后，这条捷径才会亮。', 'This shortcut opens after the second sigil.', 'Этот путь откроется после второй печати.', '二つ目の印章のあとで、この近道は灯る。')
      }),
      exit('grav7', 1400, 420, {
        label: txt('坠星塔 · 捷径', 'Fallen Star Tower · Shortcut', 'Башня звезды · Путь', '堕ち星の塔 · 近道'),
        w: 60, h: 100, requires: { sigils: ['gravity'] },
        lockedText: txt('第三枚符印之后，这条捷径才会亮。', 'This shortcut opens after the third sigil.', 'Этот путь откроется после третьей печати.', '三つ目の印章のあとで、この近道は灯る。')
      }),
      // practice and study
      exit('hub_practice', 70, 580, { label: txt('练习台', 'Practice Gallery', 'Тренировочная галерея', '稽古場'), w: 58, h: 100 }),
      // finale
      exit('final_gate', 1470, 540, {
        label: txt('星图仪', 'The Orrery', 'Планетарий', '星図儀'), w: 80, h: 140,
        requires: { allSigils: true }, lockedText: txt('星图仪还在等待三枚符印。', 'The Orrery is waiting for three sigils.', 'Планетарий ждёт три печати.', '星図儀は三つの印章を待っている。')
      }),
      // prism mechanisms
      seal('hub_s1', 280, 664, 'hard'),
      lamp('hub_lamp', 620, 70, 0, 1),
      mirror('hub_m1', 600, 480, '/', { fixedY: false }),
      sensor('hub_l1', 760, 460, 'lit', { w: 44, h: 44 }),
      anchor('hub_a1', 1450, 664, 'hub_z1'),
      zone('hub_z1', 1520, 300, 40, 380, 1),
      exit('hub_study', 850, 424, { requires: { seals: ['hub_s1'], sensors: ['hub_l1'], anchors: ['hub_a1'] }, lockedText: txt('三个面分别回应力度、光、重力。', 'Three faces answer impact, light and gravity.', 'Три грани отвечают на импульс, свет и гравитацию.', '三つの面は衝撃、光、重力に応える。'), label: txt('书房', 'The Study', 'Кабинет', '書斎'), w: 58, h: 96 }),
      exit('hidden1', 1314, 432, { requires: { echoCount: 7 }, lockedText: txt('七段回声之后，墙上才会出现第八颗星。', 'After seven echoes, the eighth star appears on the wall.', 'После семи эхов на стене появится восьмая звезда.', '七つの響きのあと、壁に八つ目の星が現れる。'), label: txt('第八颗星', 'The Eighth Star', 'Восьмая звезда', '八つ目の星'), w: 58, h: 88 }),
      sign('hub_sign', 420, 620, 't1')
    ]
  });

  rooms.hub_practice = R('hub_practice', 'hub', txt('练习台', 'Practice Gallery', 'Тренировочная галерея', '稽古場'), {
    spawn: { x: 90, y: 680 },
    bg: 'hub',
    hintKey: 'hard',
    hintTargets: ['seal', 'mirror', 'anchor'],
    platforms: [
      ...base(),
      P(220, 600, 100, 80),
      P(360, 500, 100, 180),
      P(520, 420, 160, 24),
      P(780, 300, 160, 24)
    ],
    objects: [
      exit('hub', 70, 580, { label: txt('守夜厅', 'Nightwatch Hall', 'Зал ночного стража', '夜番の広間'), w: 58, h: 100 }),
      seal('prac_s', 280, 664, 'hard'),
      lamp('prac_lamp', 560, 100, 0, 1),
      mirror('prac_m1', 540, 250, '\\'),
      star(700, 420, 200, 22),
      sign('prac_sign', 470, 620, 't1'),
      sign('prac_sign2', 820, 620, 'l1'),
      sign('prac_sign3', 1080, 620, 'g1'),
      zone('prac_z', 1000, 300, 200, 380, -1),
      anchor('prac_a', 960, 664, 'prac_z'),
      P(1000, 80, 220, 40)
    ]
  });

  rooms.tide1 = R('tide1', 'tide', txt('第一声钟', 'The First Bell', 'Первый колокол', '最初の鐘'), {
    spawn: { x: 90, y: 680 },
    bg: 'tide',
    hintKey: 'hard',
    hintTargets: ['seal', 'exit'],
    platforms: [
      ...base(),
      P(260, 600, 120, 80),
      P(420, 520, 80, 80),
      P(500, 440, 160, 24)
    ],
    objects: [
      exit('hub', 70, 580, { label: txt('守夜厅', 'Nightwatch Hall', 'Зал ночного стража', '夜番の広間'), w: 58, h: 100 }),
      seal('t1_s', 740, 664, 'hard'),
      exit('tide2', 1160, 580, { requires: { seals: ['t1_s'] }, label: txt('钟摆井', 'Pendulum Well', 'Колодец маятника', '振り子の井戸'), w: 60, h: 100 }),
      sign('t1_sign', 220, 620, 't1')
    ]
  });

  rooms.tide2 = R('tide2', 'tide', txt('轻与重', 'Soft and Heavy', 'Мягко и тяжело', '軽さと重さ'), {
    spawn: { x: 90, y: 680 },
    bg: 'tide',
    hintKey: 'soft',
    hintTargets: ['seal', 'exit'],
    platforms: [
      ...base(1280, 720, [[0, 480], [1120, 160]]),
      P(144, 573, 76, 18),
      P(220, 490, 76, 18),
      P(285, 408, 90, 24),
      bridge(480, 600, 340, 22, { seals: ['t2_hard'] }),
      fragile(860, 600, 240, 22),
      P(1100, 600, 40, 80)
    ],
    objects: [
      exit('tide1', 70, 580, { label: txt('第一声钟', 'The First Bell', 'Первый колокол', '最初の鐘'), w: 58, h: 100 }),
      seal('t2_hard', 385, 664, 'hard'),
      seal('t2_soft', 940, 586, 'soft'),
      exit('tide3', 1194, 580, { requires: { seals: ['t2_soft'] }, label: txt('钟绳', 'Bell Cord', 'Колокольная верёвка', '鐘の綱'), w: 44, h: 100 }),
      sign('t2_sign', 180, 620, 't2')
    ]
  });

  rooms.tide3 = R('tide3', 'tide', txt('钟绳', 'Bell Cord', 'Колокольная верёвка', '鐘の綱'), {
    spawn: { x: 90, y: 680 },
    bg: 'tide',
    hintKey: 'bell',
    hintTargets: ['seal', 'exit'],
    platforms: [
      ...base(1280, 720, [[0, 360], [980, 300]]),
      P(480, 470, 100, 24),
      P(560, 380, 160, 24),
      P(760, 480, 100, 20),
      P(820, 620, 140, 60)
    ],
    objects: [
      exit('tide2', 70, 580, { w: 58, h: 100 }),
      mover('t3_m', 420, 560, 130, 20, 780, 560, 80, 0),
      bell('t3_b', 850, 604, 8),
      exit('tide4', 1160, 580, { requires: { seals: ['t3_b'] }, w: 60, h: 100 }),
      spike(360, 660, 620, 20, 'up'),
      sign('t3_sign', 220, 620, 't2')
    ]
  });

  rooms.tide4 = R('tide4', 'tide', txt('薄冰', 'Thin Ice', 'Тонкий лёд', '薄氷'), {
    spawn: { x: 90, y: 680 },
    bg: 'tide',
    hintKey: 'fragile',
    hintTargets: ['seal', 'exit'],
    platforms: [
      ...base(1280, 720, [[0, 260], [1080, 200]]),
      fragile(280, 600, 220, 20),
      fragile(540, 560, 220, 20),
      fragile(800, 600, 220, 20),
      P(1000, 520, 80, 80),
      P(1080, 420, 160, 24)
    ],
    objects: [
      exit('tide3', 70, 580, { w: 58, h: 100 }),
      seal('t4_s', 1120, 664, 'hard'),
      exit('tide5', 1194, 580, { requires: { seals: ['t4_s'] }, w: 44, h: 100 }),
      sign('t4_sign', 180, 620, 't2')
    ]
  });

  rooms.tide5 = R('tide5', 'tide', txt('回声井', 'Echo Well', 'Колодец эха', '響きの井戸'), {
    w: 1280, h: 1080,
    spawn: { x: 90, y: 1040 },
    bg: 'tide',
    hintKey: 'hard',
    hintTargets: ['seal', 'exit'],
    platforms: [
      ...base(1280, 1080),
      P(200, 940, 140, 20),
      P(400, 840, 140, 20),
      P(600, 740, 140, 20),
      P(800, 640, 140, 20),
      P(1000, 540, 140, 20),
      P(1120, 440, 120, 20)
    ],
    objects: [
      exit('tide4', 70, 940, { w: 58, h: 100 }),
      seal('t5_s', 980, 1026, 'hard'),
      exit('tide6', 1194, 940, { requires: { seals: ['t5_s'] }, w: 44, h: 100 }),
      sign('t5_sign', 180, 980, 't1')
    ]
  });

  rooms.tide6 = R('tide6', 'tide', txt('双铃', 'Twin Bells', 'Два колокола', '双子の鐘'), {
    spawn: { x: 90, y: 680 },
    bg: 'tide',
    hintKey: 'bell',
    hintTargets: ['seal', 'exit'],
    platforms: [
      ...base(),
      P(180, 560, 80, 60),
      P(220, 500, 80, 60),
      P(220, 420, 160, 24),
      P(610, 575, 76, 20),
      P(678, 480, 92, 20)
    ],
    objects: [
      exit('tide5', 70, 580, { w: 58, h: 100 }),
      bell('t6_b1', 280, 664, 14),
      bell('t6_b2', 780, 664, 14),
      exit('tide7', 1180, 580, { requires: { seals: ['t6_b1', 't6_b2'] }, w: 60, h: 100 }),
      sign('t6_sign', 120, 620, 't2')
    ]
  });

  rooms.tide7 = R('tide7', 'tide', txt('守夜人的秤', 'The Watchman’s Scale', 'Весы стража', '夜番の秤'), {
    spawn: { x: 90, y: 680 },
    bg: 'tide',
    hintKey: 'hard',
    hintTargets: ['seal', 'exit'],
    platforms: [
      ...base(1280, 720, [[0, 400], [900, 380]]),
      P(295, 588, 102, 20),
      P(630, 610, 100, 20),
      P(900, 592, 90, 22),
      P(920, 500, 80, 80),
      P(980, 400, 80, 80),
      P(1040, 300, 160, 24),
      P(1120, 220, 80, 80),
      P(1120, 120, 120, 24),
      P(135, 595, 90, 20),
      P(40, 520, 100, 20),
      P(40, 400, 100, 20),
      P(40, 300, 100, 20)
    ],
    objects: [
      mover('t7_m', 410, 559, 150, 20, 772, 559, 68, 0),
      exit('tide6', 70, 580, { w: 58, h: 100 }),
      exit('echo1', 70, 440, { w: 58, h: 80 }),
      exit('echo2', 70, 320, { w: 58, h: 80 }),
      seal('t7_s', 1080, 286, 'hard'),
      exit('tide8', 1194, 580, { requires: { seals: ['t7_s'] }, w: 44, h: 100 }),
      sign('t7_sign', 180, 620, 't1')
    ]
  });

  rooms.tide8 = R('tide8', 'tide', txt('第一枚符印', 'First Sigil', 'Первая печать', '最初の印章'), {
    spawn: { x: 90, y: 680 },
    bg: 'tide',
    hintKey: 'soft',
    hintTargets: ['seal', 'exit'],
    platforms: [
      ...base(),
      fragile(260, 600, 160, 20),
      P(552, 599, 98, 18),
      P(653, 520, 112, 18),
      P(760, 440, 146, 24)
    ],
    objects: [
      exit('tide7', 70, 580, { w: 58, h: 100 }),
      seal('t8_soft', 300, 586, 'soft'),
      seal('t8_hard', 928, 664, 'hard'),
      exit('hub', 1180, 580, { requires: { seals: ['t8_soft', 't8_hard'] }, w: 60, h: 100, grantSigil: 'tide', label: txt('守夜厅', 'Nightwatch Hall', 'Зал ночного стража', '夜番の広間') }),
      sign('t8_sign', 180, 620, 't2')
    ]
  });

  rooms.light1 = R('light1', 'light', txt('灯与影', 'Lamp and Shadow', 'Лампа и тень', '灯と影'), {
    spawn: { x: 90, y: 680 },
    bg: 'light',
    hintKey: 'light',
    hintTargets: ['mirror', 'exit'],
    platforms: [
      ...base(1280, 720, [[0, 480], [880, 400]]),
      star(400, 600, 480, 20)
    ],
    objects: [
      exit('hub', 70, 580, { w: 58, h: 100, label: txt('守夜厅', 'Nightwatch Hall', 'Зал ночного стража', '夜番の広間') }),
      lamp('l1_l', 100, 580, 1, 0),
      mirror('l1_m', 420, 580, '/'),
      exit('light2', 1180, 580, { w: 60, h: 100 }),
      sign('l1_sign', 220, 620, 'l1')
    ]
  });

  rooms.light2 = R('light2', 'light', txt('自己的影子', 'Your Own Shadow', 'Своя тень', '自分の影'), {
    spawn: { x: 90, y: 680 },
    bg: 'light',
    hintKey: 'body',
    hintTargets: ['mirror', 'exit'],
    platforms: [
      ...base(),
      P(160, 520, 440, 20),
      P(120, 600, 80, 60),
      P(600, 480, 24, 200, 'starGlass')
    ],
    objects: [
      exit('light1', 59, 580, { w: 58, h: 100 }),
      lamp('l2_l', 80, 500, 1, 0),
      exit('light3', 1180, 580, { w: 60, h: 100 }),
      sign('l2_sign', 230, 480, 'l1')
    ]
  });

  rooms.light3 = R('light3', 'light', txt('双镜', 'Twin Mirrors', 'Два зеркала', '双子の鏡'), {
    spawn: { x: 90, y: 680 },
    bg: 'light',
    hintKey: 'mirror',
    hintTargets: ['mirror', 'sensor', 'exit'],
    platforms: [
      ...base(1280, 720, [[0, 400], [700, 580]]),
      P(40, 560, 80, 20),
      P(80, 460, 80, 20),
      P(60, 360, 120, 20),
      P(300, 360, 120, 20),
      P(680, 560, 80, 20),
      P(720, 460, 80, 20),
      P(660, 360, 120, 20),
      bridge(400, 560, 300, 20, { sensors: ['l3_s'] })
    ],
    objects: [
      exit('light2', 70, 580, { w: 58, h: 100 }),
      lamp('l3_l', 100, 100, 0, 1),
      mirror('l3_m1', 80, 300, '/'),
      mirror('l3_m2', 360, 300, '\\'),
      sensor('l3_s', 360, 120, 'lit'),
      exit('light4', 1180, 580, { w: 60, h: 100 }),
      sign('l3_sign', 180, 620, 'l1')
    ]
  });

  rooms.light4 = R('light4', 'light', txt('影门', 'Shadow Gate', 'Врата тени', '影の門'), {
    spawn: { x: 90, y: 680 },
    bg: 'light',
    hintKey: 'body',
    hintTargets: ['sensor', 'exit'],
    platforms: [
      ...base(),
      P(160, 520, 760, 20),
      P(120, 600, 80, 60)
    ],
    objects: [
      exit('light3', 59, 580, { w: 58, h: 100 }),
      lamp('l4_l', 80, 500, 1, 0),
      sensor('l4_s', 900, 500, 'dark', { hold: 6 }),
      exit('light5', 1180, 580, { requires: { sensors: ['l4_s'] }, w: 60, h: 100 }),
      sign('l4_sign', 180, 620, 'l1')
    ]
  });

  rooms.light5 = R('light5', 'light', txt('月桥', 'Moon Bridge', 'Лунный мост', '月の橋'), {
    spawn: { x: 90, y: 680 },
    bg: 'light',
    hintKey: 'light',
    hintTargets: ['mirror', 'sensor', 'exit'],
    platforms: [
      ...base(1280, 720, [[0, 400], [900, 380]]),
      P(45, 560, 82, 20), P(88, 460, 86, 20), P(60, 360, 120, 20),
      P(320, 600, 80, 80),
      bridge(400, 520, 500, 20, { sensors: ['l5_s'] })
    ],
    objects: [
      exit('light4', 70, 580, { w: 58, h: 100 }),
      lamp('l5_l', 100, 100, 0, 1),
      mirror('l5_m', 80, 300, '/'),
      sensor('l5_s', 800, 280, 'lit', { hold: 7 }),
      exit('light6', 1180, 580, { w: 60, h: 100 }),
      sign('l5_sign', 180, 620, 'l1')
    ]
  });

  rooms.light6 = R('light6', 'light', txt('三盏灯', 'Three Lamps', 'Три лампы', '三つの灯'), {
    spawn: { x: 90, y: 680 },
    bg: 'light',
    hintKey: 'mirror',
    hintTargets: ['mirror', 'sensor', 'exit'],
    platforms: [
      ...base(),
      P(40, 560, 80, 20), P(80, 460, 80, 20), P(60, 360, 120, 20),
      P(440, 560, 80, 20), P(480, 460, 80, 20), P(460, 360, 120, 20),
      P(840, 560, 80, 20), P(880, 460, 80, 20), P(860, 360, 120, 20)
    ],
    objects: [
      exit('light5', 70, 580, { w: 58, h: 100 }),
      lamp('l6_l1', 100, 100, 0, 1), mirror('l6_m1', 80, 300, '/'), sensor('l6_s1', 300, 280, 'lit'),
      lamp('l6_l2', 500, 100, 0, 1), mirror('l6_m2', 480, 300, '/'), sensor('l6_s2', 700, 280, 'lit'),
      lamp('l6_l3', 900, 100, 0, 1), mirror('l6_m3', 880, 300, '/'), sensor('l6_s3', 1100, 280, 'lit'),
      exit('light7', 1194, 580, { requires: { sensors: ['l6_s1', 'l6_s2', 'l6_s3'] }, w: 44, h: 100 }),
      sign('l6_sign', 180, 620, 'l1')
    ]
  });

  rooms.light7 = R('light7', 'light', txt('黑潮', 'Black Tide', 'Чёрный прилив', '黒潮'), {
    spawn: { x: 90, y: 680 },
    bg: 'light',
    hintKey: 'combo',
    hintTargets: ['mirror', 'sensor', 'seal', 'exit'],
    platforms: [
      ...base(1280, 720, [[0, 360], [980, 300]]),
      fragile(790, 520, 230, 20),
      P(820, 400, 160, 24),
      P(143, 572, 78, 20),
      P(40, 495, 100, 20),
      P(67, 385, 120, 20),
      P(256, 600, 80, 20),
      bridge(360, 520, 400, 20, { sensors: ['l7_s'] })
    ],
    objects: [
      exit('light6', 70, 580, { w: 58, h: 100 }),
      exit('echo3', 66, 415, { w: 58, h: 80 }),
      exit('echo4', 134, 305, { w: 50, h: 80 }),
      lamp('l7_l', 100, 100, 0, 1),
      mirror('l7_m', 80, 300, '/'),
      sensor('l7_s', 700, 280, 'lit', { hold: 10 }),
      seal('l7_s2', 1010, 664, 'hard'),
      exit('light8', 1180, 580, { requires: { seals: ['l7_s2'] }, w: 60, h: 100 }),
      sign('l7_sign', 180, 620, 'l1')
    ]
  });

  rooms.light8 = R('light8', 'light', txt('第二枚符印', 'Second Sigil', 'Вторая печать', '二つ目の印章'), {
    spawn: { x: 90, y: 680 },
    bg: 'light',
    hintKey: 'combo',
    hintTargets: ['mirror', 'sensor', 'seal', 'exit'],
    platforms: [
      ...base(1280, 720, [[0, 300], [900, 380]]),
      P(40, 560, 80, 20),
      P(80, 460, 80, 20),
      P(60, 360, 120, 20),
      P(200, 600, 75, 20),
      fragile(900, 520, 180, 20),
      P(960, 404, 120, 24),
      bridge(300, 520, 600, 20, { sensors: ['l8_s'] })
    ],
    objects: [
      exit('light7', 70, 580, { w: 58, h: 100 }),
      lamp('l8_l', 100, 100, 0, 1),
      mirror('l8_m', 80, 300, '/'),
      sensor('l8_s', 500, 280, 'lit'),
      seal('l8_s2', 1095, 664, 'hard'),
      exit('hub', 1194, 580, { requires: { sensors: ['l8_s'], seals: ['l8_s2'] }, w: 44, h: 100, grantSigil: 'light', label: txt('守夜厅', 'Nightwatch Hall', 'Зал ночного стража', '夜番の広間') }),
      sign('l8_sign', 180, 620, 'l1')
    ]
  });

  rooms.grav1 = R('grav1', 'gravity', txt('倒悬', 'Upside Down', 'Вверх дном', '逆さま'), {
    spawn: { x: 90, y: 680 },
    bg: 'gravity',
    hintKey: 'gravity',
    hintTargets: ['exit'],
    platforms: [...base()],
    objects: [
      exit('hub', 70, 580, { w: 58, h: 100, label: txt('守夜厅', 'Nightwatch Hall', 'Зал ночного стража', '夜番の広間') }),
      zone('g1_z', 400, 40, 600, 640, -1),
      exit('grav2', 900, 40, { w: 60, h: 100 }),
      sign('g1_sign', 240, 620, 'g1')
    ]
  });

  rooms.grav2 = R('grav2', 'gravity', txt('落向天空', 'Falling Skyward', 'Падение в небо', '空へ落ちる'), {
    spawn: { x: 90, y: 680 },
    bg: 'gravity',
    hintKey: 'gravity',
    hintTargets: ['seal', 'exit'],
    platforms: [...base()],
    objects: [
      exit('grav1', 70, 580, { w: 58, h: 100 }),
      zone('g2_z', 500, 40, 600, 640, -1),
      seal('g2_s', 500, 40, 'hard'),
      exit('grav3', 1000, 40, { requires: { seals: ['g2_s'] }, w: 60, h: 100 }),
      sign('g2_sign', 260, 620, 'g1')
    ]
  });

  rooms.grav3 = R('grav3', 'gravity', txt('双重力', 'Twin Gravity', 'Двойная гравитация', '二重の重力'), {
    spawn: { x: 90, y: 680 },
    bg: 'gravity',
    hintKey: 'gravity',
    hintTargets: ['seal', 'exit'],
    platforms: [
      ...base(1280, 720, [[0, 300], [900, 380]])
    ],
    objects: [
      exit('grav2', 70, 580, { w: 58, h: 100 }),
      mover('g3_m', 350, 560, 120, 20, 750, 560, 70, 0),
      zone('g3_z', 300, 40, 600, 640, -1),
      seal('g3_s', 320, 40, 'hard'),
      exit('grav4', 1160, 580, { requires: { seals: ['g3_s'] }, w: 60, h: 100 }),
      sign('g3_sign', 220, 620, 'g1')
    ]
  });

  rooms.grav4 = R('grav4', 'gravity', txt('锚点', 'The Anchor', 'Якорь', '錨'), {
    spawn: { x: 90, y: 680 },
    bg: 'gravity',
    hintKey: 'anchor',
    hintTargets: ['anchor', 'exit'],
    platforms: [
      ...base(),
      P(160, 440, 160, 24),
      P(200, 560, 80, 60)
    ],
    objects: [
      exit('grav3', 70, 580, { w: 58, h: 100 }),
      anchor('g4_a', 300, 664, 'g4_z'),
      zone('g4_z', 500, 40, 500, 640, 1),
      exit('grav5', 1000, 40, { requires: { anchors: ['g4_a'] }, w: 60, h: 100 }),
      sign('g4_sign', 180, 620, 't1')
    ]
  });

  rooms.grav5 = R('grav5', 'gravity', txt('坠星井', 'Falling Star Well', 'Колодец падающей звезды', '堕ち星の井戸'), {
    w: 1280, h: 1080,
    spawn: { x: 90, y: 1040 },
    bg: 'gravity',
    hintKey: 'gravity',
    hintTargets: ['seal', 'exit'],
    platforms: [...base(1280, 1080)],
    objects: [
      exit('grav4', 70, 940, { w: 58, h: 100 }),
      zone('g5_z', 300, 40, 600, 1000, -1),
      bell('g5_b', 300, 40, 12),
      exit('grav6', 1000, 40, { requires: { seals: ['g5_b'] }, w: 60, h: 100 }),
      sign('g5_sign', 180, 980, 'g1')
    ]
  });

  rooms.grav6 = R('grav6', 'gravity', txt('失重桥', 'Weightless Bridge', 'Невесомый мост', '無重力の橋'), {
    spawn: { x: 90, y: 680 },
    bg: 'gravity',
    hintKey: 'combo',
    hintTargets: ['mirror', 'exit'],
    platforms: [
      ...base(),
      P(540, 600, 80, 80),
      P(560, 540, 100, 20),
      star(600, 80, 400, 20)
    ],
    objects: [
      exit('grav5', 70, 580, { w: 58, h: 100 }),
      lamp('g6_l', 100, 500, 1, 0),
      mirror('g6_m', 600, 500, '\\'),
      zone('g6_z', 800, 40, 300, 640, -1),
      exit('grav7', 900, 80, { w: 60, h: 100 }),
      sign('g6_sign', 260, 620, 'l1')
    ]
  });

  rooms.grav7 = R('grav7', 'gravity', txt('星坠', 'Starfall', 'Звёздный дождь', '星降り'), {
    w: 1280, h: 1080,
    spawn: { x: 90, y: 1040 },
    bg: 'gravity',
    hintKey: 'combo',
    hintTargets: ['mirror', 'seal', 'exit'],
    platforms: [
      ...base(1280, 1080),
      star(300, 500, 700, 20),
      P(860, 940, 80, 20),
      P(900, 840, 80, 20),
      P(940, 740, 80, 20),
      P(900, 640, 80, 20),
      P(860, 540, 80, 20),
      P(900, 440, 80, 20),
      P(910, 360, 120, 20),
      P(45, 940, 100, 18),
      P(40, 820, 100, 20),
      P(40, 700, 100, 20)
    ],
    objects: [
      exit('grav6', 70, 956, { w: 58, h: 84 }),
      exit('echo5', 70, 856, { w: 58, h: 84 }),
      exit('echo6', 70, 740, { w: 58, h: 80 }),
      lamp('g7_l', 100, 100, 0, 1),
      mirror('g7_m1', 80, 300, '\\'),
      mirror('g7_m2', 950, 300, '\\'),
      zone('g7_z', 300, 40, 600, 1000, -1),
      seal('g7_s', 320, 40, 'hard'),
      exit('grav8', 1000, 40, { requires: { seals: ['g7_s'] }, w: 60, h: 100 }),
      sign('g7_sign', 180, 980, 'g1')
    ]
  });

  rooms.grav8 = R('grav8', 'gravity', txt('第三枚符印', 'Third Sigil', 'Третья печать', '三つ目の印章'), {
    w: 1280, h: 1080,
    spawn: { x: 90, y: 1040 },
    bg: 'gravity',
    hintKey: 'combo',
    hintTargets: ['mirror', 'seal', 'exit'],
    platforms: [
      ...base(1280, 1080),
      star(300, 500, 700, 20),
      P(860, 940, 80, 20),
      P(900, 840, 80, 20),
      P(940, 740, 80, 20),
      P(900, 640, 80, 20),
      P(860, 540, 80, 20),
      P(900, 440, 80, 20),
      P(910, 360, 120, 20)
    ],
    objects: [
      exit('grav7', 70, 940, { w: 58, h: 100 }),
      lamp('g8_l', 100, 100, 0, 1),
      mirror('g8_m1', 80, 300, '\\'),
      mirror('g8_m2', 950, 300, '\\'),
      zone('g8_z', 300, 40, 600, 1000, -1),
      seal('g8_s', 320, 40, 'hard'),
      exit('hub', 1000, 40, { requires: { seals: ['g8_s'] }, w: 60, h: 100, grantSigil: 'gravity', label: txt('守夜厅', 'Nightwatch Hall', 'Зал ночного стража', '夜番の広間') }),
      sign('g8_sign', 180, 980, 'g1')
    ]
  });

  rooms.final_gate = R('final_gate', 'final', txt('三棱门', 'The Prism Gate', 'Призматические врата', '三稜の門'), {
    spawn: { x: 90, y: 680 },
    bg: 'final',
    hintKey: 'final',
    hintTargets: ['seal', 'sensor', 'anchor', 'exit'],
    platforms: [
      ...base(),
      P(160, 440, 160, 24),
      P(200, 560, 80, 60),
      P(426, 567, 75, 20),
      P(491, 468, 86, 20),
      P(560, 360, 120, 20),
      P(870, 574, 78, 20),
      P(936, 478, 82, 20)
    ],
    objects: [
      exit('hub', 70, 580, { w: 58, h: 100, label: txt('守夜厅', 'Nightwatch Hall', 'Зал ночного стража', '夜番の広間') }),
      seal('f_s1', 280, 664, 'hard'),
      lamp('f_l', 600, 100, 0, 1),
      mirror('f_m', 580, 300, '/'),
      sensor('f_sen', 760, 280, 'lit'),
      anchor('f_a', 1000, 664, 'f_z'),
      zone('f_z', 1040, 290, 100, 390, 1),
      exit('final_orrery', 1178, 580, { requires: { seals: ['f_s1'], sensors: ['f_sen'], anchors: ['f_a'] }, w: 58, h: 100 }),
      sign('f_sign', 180, 620, 'final')
    ]
  });

  rooms.final_orrery = R('final_orrery', 'final', txt('星图仪', 'The Orrery', 'Планетарий', '星図儀'), {
    spawn: { x: 90, y: 680 },
    bg: 'final',
    hintKey: 'final',
    hintTargets: ['seal', 'sensor', 'exit'],
    platforms: [
      ...base(),
      P(160, 440, 160, 24),
      P(200, 560, 80, 60),
      P(426, 567, 75, 20),
      P(491, 468, 86, 20),
      P(560, 360, 120, 20)
    ],
    objects: [
      exit('final_gate', 70, 580, { w: 58, h: 100 }),
      seal('fo_s1', 280, 664, 'hard'),
      lamp('fo_l', 600, 100, 0, 1),
      mirror('fo_m', 580, 300, '/'),
      sensor('fo_sen', 760, 280, 'lit'),
      zone('fo_z', 900, 40, 300, 640, -1),
      seal('fo_s2', 900, 40, 'hard'),
      exit('final_ascent', 780, 540, { requires: { seals: ['fo_s1', 'fo_s2'], sensors: ['fo_sen'] }, w: 60, h: 140 }),
      sign('fo_sign', 180, 620, 'final')
    ]
  });

  rooms.final_ascent = R('final_ascent', 'final', txt('夜航', 'Night Voyage', 'Ночное плавание', '夜航'), {
    w: 1280, h: 1080,
    spawn: { x: 90, y: 1040 },
    bg: 'final',
    hintKey: 'final',
    hintTargets: ['exit'],
    platforms: [
      ...base(1280, 1080),
      P(200, 940, 140, 20),
      P(400, 840, 140, 20),
      P(600, 740, 140, 20),
      P(800, 640, 140, 20),
      P(1000, 540, 140, 20),
      P(1000, 440, 240, 20)
    ],
    objects: [
      exit('final_orrery', 70, 940, { w: 58, h: 100 }),
      exit('final_choice', 1000, 340, { w: 60, h: 100 }),
      sign('fa_sign', 180, 980, 'final')
    ]
  });

  rooms.final_choice = R('final_choice', 'final', txt('航标灯', 'The Beacon', 'Маяк', '航路標識'), {
    spawn: { x: 90, y: 680 },
    bg: 'final',
    hintKey: 'final',
    hintTargets: ['exit'],
    platforms: [...base()],
    objects: [
      exit('final_ascent', 70, 580, { w: 58, h: 100 }),
      exit(null, 250, 560, {
        w: 80, h: 120, ending: 'beacon',
        label: txt('点亮航标', 'Light the Beacon', 'Зажечь маяк', '航路標識を灯す')
      }),
      exit(null, 600, 560, {
        w: 80, h: 120, ending: 'dark',
        label: txt('守住长夜', 'Keep the Long Night', 'Сберечь долгую ночь', '長い夜を守る')
      }),
      exit(null, 950, 560, {
        w: 80, h: 120, ending: 'eighth', requires: { echoCount: 8 },
        lockedText: txt('第八颗星需要全部八段回声。', 'The Eighth Star needs all eight echoes.', 'Восьмой звезде нужны все восемь эхов.', '八つ目の星には八つの響きが必要だ。'),
        label: txt('第八颗星', 'The Eighth Star', 'Восьмая звезда', '八つ目の星')
      }),
      sign('fc_sign', 420, 620, 'final')
    ]
  });

  // ---------- optional rooms ----------
  rooms.hub_study = R('hub_study', 'hub', txt('守夜人的书房', 'The Watchman’s Study', 'Кабинет стража', '夜番の書斎'), {
    spawn: { x: 90, y: 680 },
    bg: 'hub',
    hintKey: 'light',
    hintTargets: ['echo'],
    platforms: [...base()],
    objects: [
      exit('hub', 70, 580, { w: 58, h: 100, label: txt('守夜厅', 'Nightwatch Hall', 'Зал ночного стража', '夜番の広間') }),
      echo('study', 600, 560, 'study'),
      sign('study_sign', 260, 620, 'l1'),
      deco('orrery', 900, 380, { r: 90 })
    ]
  });

  rooms.echo1 = R('echo1', 'tide', txt('回声：第一夜', 'Echo: First Night', 'Эхо: первая ночь', '響き：最初の夜'), {
    spawn: { x: 90, y: 680 },
    bg: 'tide',
    hintKey: 'hard',
    hintTargets: ['seal', 'echo', 'exit'],
    platforms: [
      ...base(),
      P(300, 400, 160, 24),
      P(340, 560, 80, 60)
    ],
    objects: [
      exit('tide7', 70, 580, { w: 58, h: 100 }),
      seal('e1_s', 420, 664, 'hard'),
      echo('echo1', 1000, 560, 'echo1', { gate: 'tide7' }),
      exit('tide7', 1120, 580, { requires: { seals: ['e1_s'] }, w: 58, h: 100 }),
      sign('e1_sign', 180, 620, 't1')
    ]
  });

  rooms.echo2 = R('echo2', 'tide', txt('回声：未寄出的信', 'Echo: Unsent Letter', 'Эхо: неотправленное письмо', '響き：出せなかった手紙'), {
    spawn: { x: 90, y: 680 },
    bg: 'tide',
    hintKey: 'soft',
    hintTargets: ['seal', 'echo', 'exit'],
    platforms: [
      ...base(),
      fragile(260, 600, 180, 20),
      P(552, 599, 98, 18),
      P(653, 520, 112, 18),
      P(760, 440, 146, 24)
    ],
    objects: [
      exit('tide7', 70, 580, { w: 58, h: 100 }),
      seal('e2_s', 300, 586, 'soft'),
      seal('e2_h', 928, 664, 'hard'),
      echo('echo2', 1100, 560, 'echo2', { gate: 'tide7' }),
      exit('tide7', 1180, 580, { requires: { seals: ['e2_s', 'e2_h'] }, w: 50, h: 100 }),
      sign('e2_sign', 180, 620, 't2')
    ]
  });

  rooms.echo3 = R('echo3', 'light', txt('回声：镜中的她', 'Echo: Her in the Mirror', 'Эхо: она в зеркале', '響き：鏡の中の彼女'), {
    spawn: { x: 90, y: 680 },
    bg: 'light',
    hintKey: 'mirror',
    hintTargets: ['mirror', 'echo', 'exit'],
    platforms: [
      ...base(1280, 720, [[0, 400], [800, 480]]),
      P(40, 560, 80, 20),
      P(80, 460, 80, 20),
      P(60, 360, 120, 20),
      bridge(400, 520, 400, 20, { sensors: ['e3_s'] })
    ],
    objects: [
      exit('light7', 70, 580, { w: 58, h: 100 }),
      lamp('e3_l', 100, 100, 0, 1),
      mirror('e3_m1', 80, 300, '/'),
      sensor('e3_s', 300, 280, 'lit'),
      echo('echo3', 900, 560, 'echo3'),
      exit('light7', 1120, 580, { w: 58, h: 100 }),
      sign('e3_sign', 180, 620, 'l1')
    ]
  });

  rooms.echo4 = R('echo4', 'light', txt('回声：熄灯之前', 'Echo: Before the Lights Went Out', 'Эхо: до того, как погас свет', '響き：灯が消える前に'), {
    spawn: { x: 90, y: 680 },
    bg: 'light',
    hintKey: 'body',
    hintTargets: ['echo', 'exit'],
    platforms: [
      ...base(),
      P(160, 520, 400, 20),
      P(120, 600, 80, 60),
      P(560, 480, 24, 200, 'starGlass')
    ],
    objects: [
      exit('light7', 59, 580, { w: 58, h: 100 }),
      lamp('e4_l', 80, 500, 1, 0),
      echo('echo4', 1000, 560, 'echo4'),
      exit('light7', 1120, 580, { w: 58, h: 100 }),
      sign('e4_sign', 240, 480, 'l1')
    ]
  });

  rooms.echo5 = R('echo5', 'gravity', txt('回声：倒着走的人', 'Echo: The One Who Walked Up', 'Эхо: тот, кто шёл вверх', '響き：逆さまに歩く人'), {
    spawn: { x: 90, y: 680 },
    bg: 'gravity',
    hintKey: 'gravity',
    hintTargets: ['seal', 'echo', 'exit'],
    platforms: [...base()],
    objects: [
      exit('grav7', 70, 580, { w: 58, h: 100 }),
      zone('e5_z', 400, 40, 500, 640, -1),
      seal('e5_s', 420, 40, 'hard'),
      echo('echo5', 1080, 100, 'echo5', { gate: 'grav7' }),
      exit('grav7', 1140, 100, { requires: { seals: ['e5_s'] }, w: 50, h: 100 }),
      sign('e5_sign', 240, 620, 'g1')
    ]
  });

  rooms.echo6 = R('echo6', 'gravity', txt('回声：最后一班船', 'Echo: The Last Ship', 'Эхо: последний корабль', '響き：最後の船'), {
    spawn: { x: 90, y: 680 },
    bg: 'gravity',
    hintKey: 'combo',
    hintTargets: ['mirror', 'echo', 'exit'],
    platforms: [
      ...base(),
      P(360, 540, 100, 20),
      star(350, 80, 300, 20)
    ],
    objects: [
      exit('grav7', 70, 580, { w: 58, h: 100 }),
      lamp('e6_l', 100, 500, 1, 0),
      mirror('e6_m', 400, 500, '\\'),
      zone('e6_z', 500, 40, 600, 640, -1),
      echo('echo6', 600, 100, 'echo6'),
      exit('grav7', 800, 100, { w: 60, h: 100 }),
      sign('e6_sign', 260, 620, 'l1')
    ]
  });

  rooms.hidden1 = R('hidden1', 'hub', txt('第八颗星', 'The Eighth Star', 'Восьмая звезда', '八つ目の星'), {
    spawn: { x: 90, y: 680 },
    bg: 'final',
    hintKey: 'final',
    hintTargets: ['seal', 'sensor', 'anchor', 'echo', 'exit'],
    platforms: [
      ...base(),
      P(160, 440, 160, 24),
      P(200, 560, 80, 60),
      P(426, 567, 75, 20),
      P(491, 468, 86, 20),
      P(560, 360, 120, 20),
      P(870, 574, 78, 20),
      P(936, 478, 82, 20)
    ],
    objects: [
      exit('hub', 70, 580, { w: 58, h: 100 }),
      seal('h1_s', 280, 664, 'hard'),
      lamp('h1_l', 600, 100, 0, 1),
      mirror('h1_m', 580, 300, '/'),
      sensor('h1_sen', 760, 280, 'lit'),
      anchor('h1_a', 1000, 664, 'h1_z'),
      zone('h1_z', 1040, 290, 100, 390, 1),
      echo('hidden1', 1190, 565, 'hidden1', { gate: 'hub' }),
      exit('hub', 1180, 580, { requires: { seals: ['h1_s'], sensors: ['h1_sen'], anchors: ['h1_a'] }, w: 60, h: 100 }),
      sign('h1_sign', 180, 620, 'final')
    ]
  });

  // ---------- exports ----------
  NO.DATA = {
    rooms,
    story,
    hintSets,
    order: Object.keys(rooms),
    main: [
      'hub', 'hub_practice',
      'tide1', 'tide2', 'tide3', 'tide4', 'tide5', 'tide6', 'tide7', 'tide8',
      'light1', 'light2', 'light3', 'light4', 'light5', 'light6', 'light7', 'light8',
      'grav1', 'grav2', 'grav3', 'grav4', 'grav5', 'grav6', 'grav7', 'grav8',
      'final_gate', 'final_orrery', 'final_ascent', 'final_choice'
    ],
    optional: ['hub_study', 'echo1', 'echo2', 'echo3', 'echo4', 'echo5', 'echo6', 'hidden1'],
    wings: [
      { id: 'hub', name: txt('守夜厅', 'Nightwatch Hall', 'Зал ночного стража', '夜番の広間'), color: '#f2b56b' },
      { id: 'tide', name: txt('钟摆井', 'Pendulum Well', 'Колодец маятника', '振り子の井戸'), color: '#63e2d0' },
      { id: 'light', name: txt('月镜回廊', 'Moonmirror Gallery', 'Галерея лунных зеркал', '月鏡の回廊'), color: '#db93ac' },
      { id: 'gravity', name: txt('坠星塔', 'Fallen Star Tower', 'Башня падающей звезды', '堕ち星の塔'), color: '#9e8cf4' },
      { id: 'final', name: txt('星图仪', 'The Orrery', 'Планетарий', '星図儀'), color: '#f2b56b' }
    ],
    T, W, H, GY,
    P, star, fragile, bridge, base, R, seal, bell, exit, echo, sign, mirror, lamp, sensor, zone, anchor, mover, spike, deco, txt
  };
})();
