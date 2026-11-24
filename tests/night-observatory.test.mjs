
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

const asset = new URL('../dist/assets/night-observatory/js/',import.meta.url);
const paths = JSON.parse(readFileSync(new URL('fixtures/night-observatory-route.json',import.meta.url),'utf8'));
const foyer = ['arrival','archive_porch','archive_rotunda','hub-practice','hub_practice:hub'];
const tideArchive = ['relay_tide','archive_workshop','archive_glassworks','archive_counterweight'];
const lightArchive = ['relay_light','archive_lunar','archive_prism','archive_altar'];
const gravityArchive = ['relay_gravity','archive_pendulum','archive_spire','archive_belfry'];
const finale = ['hub-final','final_gate','final_orrery','final_crossing','archive_undercroft',
 'archive_abyss','archive_harmonics','archive_vault','archive_crown','dawn','final_ascent'];
const normalRoute = [
 ...foyer,'hub-tide',
 ...Array.from({length:8},(_,i)=>'tide'+(i+1)),...tideArchive,
 'hub-light', ...Array.from({length:8},(_,i)=>'light'+(i+1)),...lightArchive,
 'hub-gravity', ...Array.from({length:8},(_,i)=>'grav'+(i+1)),...gravityArchive,
 ...finale,
];
const secretRoute = [
 ...foyer,'hub-study','hub_study','hub-tide',
 ...Array.from({length:6},(_,i)=>'tide'+(i+1)),
 'tide7:echo1','echo1','tide7:echo2','echo2','tide7','tide8',...tideArchive,'hub-light',
 ...Array.from({length:6},(_,i)=>'light'+(i+1)),
 'light7:echo3','echo3','light7:echo4','echo4','light7','light8',...lightArchive,'hub-gravity',
 ...Array.from({length:6},(_,i)=>'grav'+(i+1)),
 'grav7:echo5','echo5','grav7:echo6','echo6','grav7','grav8',...gravityArchive,
 'hub-hidden','hidden1',...finale,'eighth',
];

function loadGameEngine() {
 const sandbox = {document:{addEventListener(){}},navigator:{},addEventListener(){}};
 sandbox.window = sandbox;
 vm.createContext(sandbox);
 for (const file of ['i18n','data','campaign','engine']) {
  const url = new URL(file+'.js',asset);
  vm.runInContext(readFileSync(url,'utf8'),sandbox,{filename:fileURLToPath(url)});
 }
 return sandbox.NO;
}

function play(route) {
 const NO = loadGameEngine();
 assert.equal(Object.keys(NO.DATA.rooms).length,60);
 assert.equal(new Set(NO.DATA.order).size,60);
 assert.ok(Object.values(NO.DATA.classicRooms).every(id=>Object.hasOwn(NO.DATA.rooms,id)));
 const state = {sigils:{},flags:{},echoes:{},visited:{}};
 const game = new NO.Game({getContext:()=>({})},state);
 let axis = 0, jump = false, brace = false, interact = false;
 NO.ui = {
  showEnding(ending) { state.ending = ending; game.paused = true; },
  refreshHud() {},
  showDialogue() {}
 };
 game.input = {
  pollGamepad() {},
  axis:()=>axis,
  pressed: key => key === 'jump' ? jump : key === 'interact' && interact,
  down: key => key === 'brace' && brace,
  endFrame() { jump = interact = false; }
 };
 const tick = () => game.update(1/60);
 game.startAt(NO.DATA.firstRoom);
 for (const segment of route) {
  const [room,next,controls] = paths[segment];
  axis = 0;
  jump = brace = interact = false;
  for (let i=0; i<50 && game.fading; i++) tick();
  assert.equal(game.room.id,room,segment);
  assert.equal(game.fading,null,segment);
  assert.equal(game.dead,false,segment);
  for (const key of controls) {
   axis = key % 3 - 1;
   jump = !!(Math.floor(key/3) & 1);
   brace = !!(Math.floor(key/3) & 2);
   interact = !!(Math.floor(key/3) & 4);
   for (let i=0; i<12; i++) {
    tick();
    assert.ok(!game.dead,segment+' fell before the exit');
    if (game.pendingRoom || state.ending) break;
   }
   if (game.pendingRoom || state.ending) break;
  }
  assert.equal(game.pendingRoom?.to ?? state.ending,next,segment+' did not reach the expected exit');
 }
 return state;
}

test('a fresh player solves all three wings and can choose either ordinary ending', () => {
 for (const ending of ['beacon','dark']) {
  const state = play([...normalRoute,ending]);
  assert.equal(state.ending,ending);
  assert.deepEqual(Object.keys(state.sigils).sort(),['gravity','light','tide']);
  assert.equal(Object.keys(state.visited).length,52);
  assert.equal(Object.keys(state.flags).length,16);
 }
});

test('a fresh player collects all eight echoes and reaches the hidden ending', () => {
 const state = play(secretRoute);
 assert.equal(state.ending,'eighth');
 assert.equal(Object.keys(state.echoes).length,8);
 assert.equal(Object.keys(state.visited).length,60);
 assert.equal(Object.keys(state.flags).length,16);
});

test('every room has separate, unobstructed portal frames and a safe spawn', () => {
 const NO = loadGameEngine();
 const {overlap,exitFrame} = NO.util;
 for (const room of Object.values(NO.DATA.rooms)) {
  const portals = room.objects.filter(object => object.type === 'exit');
  const fixed = room.platforms.filter(platform => ['solid','spring'].includes(platform.type));
  assert.ok(!room.objects.some(object => object.type === 'door'),room.id);
  const spawn = {x:room.spawn.x-12,y:room.spawn.y-40,w:24,h:40};
  assert.ok(!fixed.some(platform=>overlap(spawn,platform)),room.id+' spawn');
  for (const [index, portal] of portals.entries()) {
   const frame = exitFrame(portal);
   assert.ok(!fixed.some(platform=>overlap(frame,platform)),room.id+' '+portal.id+' intersects terrain');
   assert.ok(!portals.slice(index+1).some(other=>overlap(frame,exitFrame(other))),room.id+' '+portal.id+' overlaps another portal');
  }
  for (const echo of room.objects.filter(object => object.type === 'echo' && object.gate)) {
   assert.equal(portals.filter(portal => portal.to === echo.gate && portal.requires).length,1,echo.id);
  }
 }
});

test('a locked threshold remains walkable while travel and its echo stay gated', () => {
 const NO = loadGameEngine();
 const game = new NO.Game({getContext:()=>({})},{sigils:{},flags:{},echoes:{},visited:{}});
 game.loadRoom('echo2');
 game.fading = null;
 const exit = game.exits.find(portal => portal.requires);
 const echo = game.echoes[0];
 game.player.x = exit.x + exit.w/2 - game.player.w/2;
 game.player.y = 640;
 assert.ok(!game.solidRects().some(rect=>NO.util.overlap(game.player.rect,rect)));
 assert.equal(game.findInteractable().obj,exit);
 game.useExit(exit);
 assert.equal(game.pendingRoom,null);
 assert.equal(game.echoAvailable(echo),false);
 game.seals.e2_s.active = true;
 assert.equal(game.echoAvailable(echo),false);
 game.seals.e2_h.active = true;
 assert.equal(game.echoAvailable(echo),true);
 game.useExit(exit);
 assert.equal(game.pendingRoom.to,'tide7');
});

test('the player contacts the nearest surface and cannot interact through stone', () => {
 const NO = loadGameEngine();
 const game = new NO.Game({getContext:()=>({})},{sigils:{},flags:{},echoes:{},visited:{}});
 game.loadRoom('hub');
 const player = game.player;
 const near = {x:100,y:580,w:18,h:92};
 const far = {x:140,y:580,w:16,h:92};
 game._solidCache = [far,near];
 player.x = 60; player.y = 620;
 player.moveX(130);
 assert.equal(player.x,near.x-player.w);
 assert.equal(game.interactionClear(player,130,640),false);

 const lower = {x:40,y:660,w:84,h:18};
 const upper = {x:40,y:598,w:84,h:18};
 game._solidCache = [lower,upper];
 player.x = 70; player.y = 480; player.wasOnGround = false;
 player.moveY(155,900);
 assert.equal(player.y,upper.y-player.h);
 assert.equal(player.landingRect,upper);
 assert.equal(player.lastImpact,900);
 player.y = 613;
 assert.equal(player.clearEmbedding(),true);
 assert.ok(!game.solidRects().some(rect=>NO.util.overlap(player.rect,rect)));
});


test('control lessons require a demonstrated soft landing and track input devices separately', () => {
 const window = {NO:{t:(label)=>label}};
 vm.runInNewContext(readFileSync(new URL('tutorial.js',asset),'utf8'),{window});
 const settings = {tutorialMode:'auto',tutorialCompleted:{}};
 const game = {mode:'play',paused:false,room:{id:'arrival'},input:{device:'touch',axis:()=>1}};
 let visible, saves=0;
 const lesson = new window.NO.ControlLesson(game,settings,{
  defaultDevice:'keyboard',save:()=>saves++,show:step=>{visible=step;},reward:()=>{}
 });
 lesson.roomChanged();
 assert.equal(visible.device,'touch');
 lesson.moved(46);
 assert.equal(visible.step,'jump');
 lesson.landed(false,1);
 assert.equal(visible.step,'jump');
 lesson.jumped();
 lesson.landed(false,1);
 assert.equal(visible.step,'brace');
 lesson.jumped();
 lesson.landed(false,1);
 assert.equal(visible.step,'brace');
 lesson.jumped();
 lesson.landed(true,0);
 assert.equal(visible.step,'interact');
 lesson.interacted();
 assert.equal(visible,null);
 assert.ok(settings.tutorialCompleted.touch);
 assert.equal(saves,1);
 game.input.device='keyboard';
 lesson.refresh();
 assert.equal(visible.step,'move');
 assert.equal(visible.device,'keyboard');
 settings.tutorialMode='off';
 lesson.refresh();
 assert.equal(visible,null);
 lesson.replay();
 assert.equal(visible.device,'keyboard');
});
