import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../dist/assets/astrofall.js', import.meta.url), 'utf8');
const noop = () => {};

function physics() {
  const elements = new Map();
  const element = () => ({
    classList: { add: noop, remove: noop, toggle: noop },
    style: { setProperty: noop }, dataset: {},
    addEventListener: noop, setAttribute: noop, getContext: () => ({})
  });
  const globals = {
    document: {
      documentElement: element(),
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, element());
        return elements.get(id);
      },
      addEventListener: noop, querySelectorAll: () => []
    },
    window: { addEventListener: noop },
    matchMedia: () => ({ matches: false, addEventListener: noop }),
    localStorage: { setItem: noop },
    setTimeout: noop, clearTimeout: noop
  };
  return runInNewContext(source.replace(/\}\)\(\);\s*$/, `
    return {
      enter: enterRoom,
      step(direction = 0, jump = false) {
        keys.left = direction < 0;
        keys.right = direction > 0;
        keys.jumpJust = jump;
        updatePhysics(1 / 60);
      },
      position: () => ({ x: P.x, feet: P.y + P.h, grounded: P.onGround, room: state.roomId }),
      opened: id => state.openedDoors.includes(id),
      hasCore: id => state.cores.includes(id),
      broke: id => state.brokenGlass.includes(id)
    };
  })();`), globals);
}

function route() {
  const game = physics();
  const ticks = (count, direction = 0) => {
    for (let i = 0; i < count; i++) game.step(direction);
  };
  const moveTo = target => {
    for (let i = 0; i < 280; i++) {
      const { x } = game.position();
      if (Math.abs(x - target) < 4.05) return;
      game.step(Math.sign(target - x));
    }
    assert.fail('Blocked approaching x=' + target + ': ' + JSON.stringify(game.position()));
  };
  const jumpAcross = (target, ledge) => {
    game.step(0, true);
    let above = false;
    for (let i = 0; i < 58; i++) {
      const { x, feet, grounded } = game.position();
      if (feet < ledge - 1) above = true;
      if (above && grounded) break;
      game.step(above && Math.abs(x - target) > 4 ? Math.sign(target - x) : 0);
    }
    assert.equal(game.position().feet, ledge);
  };

  return { game, ticks, moveTo, jumpAcross };
}

test('the north route reaches Core III and returns through the floor without bouncing back', () => {
  const { game, ticks, moveTo, jumpAcross } = route();
  game.enter('N1');
  ticks(3);
  moveTo(187);
  jumpAcross(146, 435);
  jumpAcross(209, 364);
  jumpAcross(267, 290);
  moveTo(374);
  game.step(0, true);
  for (let i = 0; i < 48 && game.position().room === 'N1'; i++) {
    const { x, feet } = game.position();
    game.step(feet < 234 && x < 471 ? 1 : 0);
  }
  ticks(60);
  assert.equal(game.position().room, 'N3');
  moveTo(684);
  jumpAcross(737, 465);
  moveTo(744);
  jumpAcross(796, 400);
  moveTo(822);
  for (let i = 0; i < 40 && game.position().feet > 196; i++) game.step();
  assert.ok(game.position().feet <= 196);
  moveTo(752);
  ticks(68);
  assert.equal(game.position().feet, 200);
  moveTo(624);
  ticks(38);
  assert.ok(game.opened('d_n3_core'));
  moveTo(550);
  game.step(-1, true);
  ticks(117, -1);
  assert.ok(game.hasCore('core_3'));
  moveTo(470);
  ticks(83);
  assert.equal(game.position().room, 'N1');
});

test('the west route crosses both phase switches and reaches Core II', () => {
  const { game, ticks, moveTo, jumpAcross } = route();
  game.enter('W2', 880, 345);
  ticks(30);
  moveTo(776);
  game.step(-1, true);
  moveTo(627);
  ticks(65);
  moveTo(603);
  jumpAcross(550, 453);
  jumpAcross(484, 390);
  moveTo(436);
  jumpAcross(315, 360);
  jumpAcross(267, 340);
  moveTo(133);
  ticks(130);
  assert.equal(game.position().room, 'W3');
  assert.equal(game.position().feet, 370);
  moveTo(141);
  jumpAcross(240, 330);
  game.step(1, true);
  for (let i = 0; i < 100; i++) {
    const { x, feet, grounded } = game.position();
    if (grounded && feet === 250) break;
    game.step(x < 284 || (feet < 250 && x < 340) ? 1 : 0);
  }
  assert.equal(game.position().feet, 250);
  moveTo(365);
  jumpAcross(466, 260);
  moveTo(475);
  assert.ok(game.hasCore('core_2'));
});

test('the Eclipse Altar glass shaft is open to a heavy drop from the left ledge', () => {
  const { game, ticks, moveTo } = route();
  game.enter('W3');
  ticks(60);
  assert.equal(game.position().feet, 370);
  moveTo(173);
  ticks(60);
  assert.ok(game.broke('g_w3_vault'));
  assert.equal(game.position().room, 'S4');
});
