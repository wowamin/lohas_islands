import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(candidate)) return { url: candidate.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url.endsWith('.ts')) return { format: 'module', source: ts.transpileModule(readFileSync(fileURLToPath(url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText, shortCircuit: true };
    return next(url, context);
  },
});
const saved = new Map();
globalThis.localStorage = { getItem: (key) => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value), removeItem: (key) => saved.delete(key) };
globalThis.window = { localStorage: globalThis.localStorage, matchMedia: () => ({ matches: true }) };
const { useGameStore: store } = await import('../src/game/store/useGameStore.ts');
const { BOARD_DATA } = await import('../src/game/board.ts');
const { CITY_CELLS } = await import('../src/game/city.ts');
assert.equal(CITY_CELLS.length, 40);
assert.equal(new Set(CITY_CELLS.map(p => p.join(','))).size, 40);
CITY_CELLS.forEach(([x,z], i) => { const [nx,nz] = CITY_CELLS[(i+1)%40]; assert.equal(Math.abs(nx-x)+Math.abs(nz-z), 1, 'city route must connect neighboring stations'); });
const { EVENT_CARDS } = await import('../src/game/events.ts');
const { missionSummary } = await import('../src/game/resources.ts');
const restart = () => store.getState().startGame(['甲', '乙']);
const moveTo = (position) => {
  restart();
  const players = store.getState().players.map((p, i) => i === 0 ? { ...p, position: (position + 39) % 40 } : p);
  store.setState({ players, phase: 'MOVING', diceValue: 1 });
  store.getState().movePlayer();
};
assert.equal(BOARD_DATA.length, 40);
for (const tile of BOARD_DATA) {
  for (const eventId of tile.eventIds) assert.ok(EVENT_CARDS.some((event) => event.id === eventId), `missing event ${eventId}`);
  moveTo(tile.id);
  assert.equal(store.getState().players[0].position, tile.id);
  if (tile.id !== 0) assert.ok(tile.eventIds.includes(store.getState().selectedEvent.id), `unrelated event at ${tile.name}`);
}
moveTo(13);
assert.equal(store.getState().selectedEvent.serviceKey, 'transport');
const transport = store.getState().selectedEvent.options[0];
store.getState().resolveEvent(transport.effect, transport.result);
assert.equal(store.getState().players[0].money, 9800);
assert.deepEqual(store.getState().players[0].learnedServices, ['transport']);
store.getState().resolveEvent(transport.effect, transport.result);
assert.equal(store.getState().players[0].money, 9800, 'double resolution must not charge twice');
store.getState().advanceFromResult();
assert.equal(store.getState().currentPlayerIndex, 1);
assert.equal(store.getState().phase, 'WAITING_ROLL');
store.getState().advanceFromResult();
assert.equal(store.getState().currentPlayerIndex, 1, 'cannot skip a waiting turn');
moveTo(2);
store.getState().resolveEvent({ health: 200, stress: -200, money: -50000 }, '共餐');
assert.deepEqual(store.getState().players[0].completedActivities, ['meal']);
assert.equal(store.getState().players[0].health, 100);
assert.equal(store.getState().players[0].stress, 0);
assert.equal(store.getState().players[0].money, 0);
moveTo(18);
store.getState().resolveEvent({}, '喘息');
assert.deepEqual(store.getState().players[0].completedActivities, ['respite']);
assert.equal(missionSummary(['respite'], 80, 20, [])[2].done, false, 'learning about respite is not arranging it');
moveTo(0);
assert.equal(store.getState().players[0].money, 11000);
assert.match(store.getState().eventResultText, /遊戲幣/);
store.setState({ round: 12, currentPlayerIndex: 1, phase: 'EVENT', selectedEvent: null });
store.getState().advanceFromResult();
assert.equal(store.getState().phase, 'RESULT');
restart();
const legacy = { ...store.getState(), phase: 'ROLLING', players: store.getState().players.map(({ learnedServices, completedActivities, ...player }) => player) };
localStorage.setItem('long-care-game-save-v1', JSON.stringify({ state: legacy, version: 1 }));
await store.persist.rehydrate();
assert.equal(store.getState().phase, 'WAITING_ROLL');
assert.equal(store.getState().players.length, 2);
assert.equal(missionSummary(store.getState().players[0].learnedServices).length, 4);
console.log('PASS: all 40 tile routes; transport effects; duplicate guards; task tracking; bounds; start reward; 12-round finish; legacy save and rolling recovery.');


// Geometry can be checked without a GPU: the island must not engulf its stations.
const { CITY_BASE, CITY_SURFACE, createCityBoxGeometry } = await import('../src/components/Three/cityGeometry.ts');
for (const layer of [CITY_BASE, CITY_SURFACE]) {
  const g = createCityBoxGeometry(layer.size, layer.radius);
  g.computeBoundingBox();
  const bounds = g.boundingBox;
  assert.ok(bounds.max.y + layer.y < .1, 'island surface must stay below sidewalks and buildings');
  assert.ok(Math.abs(bounds.max.y - bounds.min.y - layer.size[1]) < .0001, 'rounded island must retain its configured thickness');
  g.dispose();
}
const thin = createCityBoxGeometry([2,.14,2],.8);
thin.computeBoundingBox();
assert.ok(thin.boundingBox.max.y < .071, 'oversized corner radius must never inflate thin geometry');
thin.dispose();
console.log('PASS: island bounds; correct ground thickness; safe oversized corner radius.');

const { buildCareIsland, ISLAND_CENTERS, islandStation } = await import('../src/components/District/islandModel.ts');
const { DISTRICT_STOPS, buildCareDistrict } = await import('../src/components/District/model.ts');
const THREE = await import('three');
assert.equal(ISLAND_CENTERS.length, 5);
assert.equal(new Set(ISLAND_CENTERS.map(c=>c.title)).size, 5);
assert.equal(new Set(BOARD_DATA.map(t=>islandStation(t.id).join(','))).size,40);
for (let i=0;i<40;i++) {
  const a=new THREE.Vector3(...islandStation(i)),b=new THREE.Vector3(...islandStation((i+1)%40));
  assert.ok(a.distanceTo(b)>1&&a.distanceTo(b)<2,'island stations must form one evenly connected loop');
}
for(const stop of DISTRICT_STOPS) assert.ok(BOARD_DATA[stop.tileId], 'district exploration must map to a real original tile');
for(const create of [buildCareIsland,buildCareDistrict]) {
  const model=create(false);model.root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(model.root);
  assert.ok([box.min.x,box.min.y,box.min.z,box.max.x,box.max.y,box.max.z].every(Number.isFinite));
  assert.ok(box.max.y<4&&box.min.y>-.6,'campus and island geometry must remain at the designed ground height');
  let buildings=0;model.root.traverse(o=>{if(o.name==='DayCareCenter')buildings++;});
  assert.equal(buildings,create===buildCareIsland?5:1);
  model.dispose();
}
console.log('PASS: five distinct care centers; unique connected 40-stop island route; valid district links; finite scene bounds and architecture.');

const { createLightingRig, upgradeLightingMaterials } = await import('../src/components/District/lighting.ts');
for (const night of [false,true]) for(const layout of ['island','district']) {
  const scene=new THREE.Scene(),model=layout==='island'?buildCareIsland(night):buildCareDistrict(night);scene.add(model.root);
  const rig=createLightingRig(scene,night,layout);
  const original=model.root.getObjectByName('DayCareCenter').children[0].material;
  const restore=upgradeLightingMaterials(model.root,night);
  assert.ok(model.root.getObjectByName('DayCareCenter').children[0].material.isMeshStandardMaterial,'WebGL architecture must use physically lit materials');
  scene.updateMatrixWorld(true);rig.sun.shadow.updateMatrices(rig.sun);
  const bounds=new THREE.Box3().setFromObject(model.root),camera=rig.sun.shadow.camera;
  for(const x of[bounds.min.x,bounds.max.x])for(const y of[bounds.min.y,bounds.max.y])for(const z of[bounds.min.z,bounds.max.z]){
    const projected=new THREE.Vector3(x,y,z).project(camera);
    assert.ok(Math.abs(projected.x)<1&&Math.abs(projected.y)<1&&Math.abs(projected.z)<1,'sun shadow volume must cover the entire model');
  }
  let casters=0,points=0;scene.traverse(o=>{if(o.isLight&&o.castShadow)casters++;if(o.isPointLight)points++;});
  assert.equal(casters,1,'one shadow caster bounds GPU shadow cost');assert.ok(points<=3,'night lamps must have a bounded lighting cost');
  rig.setShadow(99);assert.ok(rig.sun.shadow.intensity<=.9);
  restore();assert.equal(model.root.getObjectByName('DayCareCenter').children[0].material,original,'material cleanup must restore scene ownership');
  rig.dispose();model.dispose();
}
console.log('PASS: day/night PBR materials; complete shadow coverage; bounded shadow casters and lamps; lighting/material cleanup.');
