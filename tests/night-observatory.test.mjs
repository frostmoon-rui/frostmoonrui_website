
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

function play(route) {
 const sandbox = {document:{addEventListener(){}},navigator:{},addEventListener(){}};
 sandbox.window = sandbox;
 vm.createContext(sandbox);
 for (const file of ['i18n','data','campaign','engine']) {
  const url = new URL(file+'.js',asset);
  vm.runInContext(readFileSync(url,'utf8'),sandbox,{filename:fileURLToPath(url)});
 }
 const {NO} = sandbox;
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
