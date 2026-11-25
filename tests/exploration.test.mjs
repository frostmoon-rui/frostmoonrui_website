import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {loadGame} from './exploration-harness.mjs';

const routes = JSON.parse(readFileSync(new URL('fixtures/exploration-routes.json', import.meta.url), 'utf8'));
function replay(route) {
  const game = loadGame();
  game.start();
  for (const {name,id,to,warp,moves} of route) {
    assert.equal(game.state.roomId, id, name);
    if (warp) game.events['btn-warp-hub:click']();
    else for (const code of moves) {
      for (let frame = 0; frame < 12; frame++) {
        game.step(code % 3 - 1, frame === 0 && code >= 3 && code <= 5, frame === 0 && code === 7);
      }
    }
    assert.equal(game.state.roomId, to, name);
  }
  return game.state;
}

test('the four wings and optional detours are connected through playable passages', () => {
  const {rooms} = loadGame();
  assert.equal(Object.keys(rooms).length, 25);
  assert.equal(new Set(Object.values(rooms).map(({gx,gy}) => gy + ':' + gx)).size, 25);
  for (const room of Object.values(rooms)) {
    assert.ok(room.name.en && room.name.zh && room.name.ja && room.name.ru, room.id);
    for (const exit of room.exits) {
      assert.ok(rooms[exit.to].exits.some(back => back.to === room.id), room.id + ' to ' + exit.to);
      assert.ok(room.openings[exit.dir], room.id + ' ' + exit.dir);
    }
  }
});

test('a fresh save can reach the ordinary ending without opening the porch shortcut', () => {
  const state = replay(routes.ordinary);
  assert.equal(state.roomId, 'H2');
  assert.equal(state.endingSeen, true);
  assert.equal(state.cores.length, 4);
  assert.equal(state.shards.length, 3);
  assert.ok(!state.brokenGlass.includes('porch-glass'));
});

test('ordinary inputs explore all 25 rooms and reach the hidden ending', () => {
  const state = replay(routes.hidden);
  assert.equal(state.roomId, 'H2');
  assert.equal(state.endingSeen, true);
  assert.equal(state.visited.length, 25);
  assert.equal(state.cores.length, 4);
  assert.equal(state.shards.length, 4);
  assert.ok(state.brokenGlass.includes('porch-glass'));
  assert.ok(state.brokenGlass.includes('belfry-shortcut'));
});
