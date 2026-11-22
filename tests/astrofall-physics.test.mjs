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
      hasCore: id => state.cores.includes(id)
    };
  })();`), globals);
}

test('the north route reaches Core III and returns through the floor without bouncing back', () => {
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
