import { readFileSync } from 'node:fs';
import vm from 'node:vm';

export function loadGame(asset = new URL('../dist/assets/night-observatory/exploration/', import.meta.url), {expanded = true} = {}) {
  const elements = new Map();
  const events = {};
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      id, style:{setProperty(){}}, dataset:{}, classList:{add(){},remove(){},toggle(){},contains(){return false;}},
      addEventListener(type, callback) { events[id + ':' + type] = callback; },
      appendChild(){}, setAttribute(){}, getContext(){return {};},
    });
    return elements.get(id);
  };
  const sandbox = {
    document:{
      documentElement:element('html'), getElementById:element, createElement:()=>element(Symbol()),
      querySelector:()=>null, querySelectorAll:()=>[], addEventListener(){},
    },
    addEventListener(type, callback) {events['window:' + type] = callback;},
    matchMedia:()=>({matches:false,addEventListener(){}}),
    setTimeout(){},clearTimeout(){},innerWidth:960,innerHeight:540,navigator:{},performance:{now:()=>0},
    localStorage:{setItem(){},getItem(){return null;}},
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const name of ['labels','world','game']) {
    let source = readFileSync(new URL(name+'.js',asset),'utf8');
    if (name === 'game') source = source.replace(/\}\)\(\);\s*$/, `
      window.replay = {
        rooms:ROOMS, events: window.testEvents, enter: enterRoom,
        get player() { return P; },
        start: () => startGame(true),
        get state() { return state; },
        get toast() { return document.getElementById('toast').textContent; },
        get ending() { return document.getElementById('end-badge').textContent; },
        step(axis, jump = false, act = false) {
          Object.assign(keys,{left:axis < 0, right:axis > 0, jump, jumpJust:jump, actJust:act});
          if (!paused) updatePhysics(1/120);
        },
      };
    })();`);
    sandbox.testEvents = events;
    vm.runInContext(source,sandbox,{filename:name+'.js'});
    if (name === 'world' && !expanded) {
      const world = sandbox.ObservatoryWorld;
      sandbox.ObservatoryWorld = {makeRooms:()=>world.makeRooms({expanded:false})};
    }
  }
  return sandbox.replay;
}
