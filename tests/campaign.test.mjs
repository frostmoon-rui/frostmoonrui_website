import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadGame} from './exploration-harness.mjs';

const routes=JSON.parse(readFileSync(new URL('fixtures/campaign-routes.json',import.meta.url),'utf8'));
const oldRoutes=JSON.parse(readFileSync(new URL('fixtures/exploration-routes.json',import.meta.url),'utf8'));
function solve(game,id) {
  assert.equal(game.state.roomId,id);
  for(const code of routes[id]) for(let tick=0;tick<12;tick++){
    game.step(code%3-1,tick===0&&code%6>=3,tick===0&&code>=6);
  }
  assert.ok(game.state.puzzles.includes(id),id);
}
function walkThrough(game,to) {
  const from=game.state.roomId;
  const portal=game.rooms[from].portals.find(portal=>portal.to===to);
  assert.ok(portal,from+' → '+to);
  for(let tick=0;tick<1200&&game.state.roomId===from;tick++){
    const p=game.player;
    const dx=portal.x-p.x-p.w/2;
    const near=Math.abs(dx)<15;
    game.step(near?0:Math.sign(dx),false,near&&Math.abs(portal.y-p.y-p.h/2)<96);
    // A retreat may require crossing a bridge that had been used earlier.
    if (p.y>540) break;
  }
  assert.equal(game.state.roomId,to,from+' → '+to);
}

test('the 80-room map has 11 forked sectors and no orphaned or duplicated rooms',()=>{
  const {rooms}=loadGame();
  const roomsList=Object.values(rooms);
  assert.equal(roomsList.length,80);
  assert.equal(new Set(roomsList.map(room=>room.gx+':'+room.gy)).size,80);
  const explored=new Set(), pending=['H0'];
  while(pending.length){
    const id=pending.pop();
    if(explored.has(id)) continue;
    explored.add(id);
    const room=rooms[id];
    for(const edge of [...room.exits,...room.portals??[]]){
      assert.ok(rooms[edge.to],id+' → '+edge.to);
      for(const key of edge.needs??[]) assert.ok(rooms[key]?.puzzle,key);
      pending.push(edge.to);
    }
    if(id==='H1') pending.push('H2');
  }
  assert.equal(explored.size,80);
  assert.equal(roomsList.filter(room=>room.seal).length,11);
  assert.equal(new Set(roomsList.filter(room=>room.puzzle).map(room=>room.puzzle.kind)).size,8);
  for(const room of roomsList) for(const locale of ['zh','en','ru','ja']) assert.ok(room.name[locale],room.id);
});

test('every new circuit can be solved from its room entrance using movement and interaction',()=>{
  const game=loadGame();
  game.start();
  assert.equal(Object.keys(routes).length,55);
  for(const id of Object.keys(routes)){
    game.enter(id);
    solve(game,id);
  }
});

test('both branches replay in all eleven sectors and all 80 rooms contribute to the hidden ending',()=>{
  const game=loadGame();
  game.start();
  for(let sector=1;sector<=11;sector++){
    const room=stage=>'A'+sector+'-'+stage;
    game.enter(room(1));
    solve(game,room(1));
    walkThrough(game,room(2));
    solve(game,room(2));
    walkThrough(game,room(4));
    walkThrough(game,room(3));
    solve(game,room(3));
    walkThrough(game,room(4));
    solve(game,room(4));
    walkThrough(game,room(5));
    solve(game,room(5));
    walkThrough(game,'H1');
  }
  game.enter('H0');
  for(const {name,id,to,warp,moves} of oldRoutes.hidden){
    assert.equal(game.state.roomId,id,name);
    if(warp) game.events['btn-warp-hub:click']();
    else for(const code of moves) for(let tick=0;tick<12;tick++){
      game.step(code%3-1,tick===0&&code>=3&&code<=5,tick===0&&code===7);
    }
    assert.equal(game.state.roomId,to,name);
  }
  assert.equal(game.state.visited.length,80);
  assert.equal(game.state.endingSeen,true);
  assert.match(game.ending,/TRUE ENDING/);
});

test('a completed fork returns to the rotunda once its seal is restored',()=>{
  const game=loadGame();
  game.start();
  game.enter('A1-5',844);
  game.step(0,false,true);
  assert.equal(game.state.roomId,'A1-5');
  game.state.puzzles.push('A1-5');
  game.step(0,false,true);
  assert.equal(game.state.roomId,'H1');
});

test('the Mirror gate names unfinished branches and opens after both are solved',()=>{
  const game=loadGame();
  game.start();
  game.state.lang='zh';
  game.enter('A4-4');
  solve(game,'A4-4');
  game.enter('A4-4',844);
  game.step(0,false,true);
  assert.equal(game.state.roomId,'A4-4');
  assert.match(game.toast,/弹道.*循序.*走左侧/);
  walkThrough(game,'A4-3');
  solve(game,'A4-3');
  walkThrough(game,'A4-4');
  game.enter('A4-4',844);
  game.step(0,false,true);
  assert.match(game.toast,/弹道/);
  assert.doesNotMatch(game.toast,/循序/);
  walkThrough(game,'A4-2');
  game.enter('A4-2');
  solve(game,'A4-2');
  walkThrough(game,'A4-4');
  walkThrough(game,'A4-5');
});
