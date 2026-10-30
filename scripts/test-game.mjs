import './test-board.mjs';
import './test-city.mjs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
const {useGameStore:store}=await import('../src/game/store/useGameStore.ts');
const {BOARD_DATA,LEGACY_TO_CURRENT}=await import('../src/game/board.ts');
const {missionSummary}=await import('../src/game/resources.ts');
const moveToLegacy=id=>{store.getState().startGame(['甲','乙']);const destination=LEGACY_TO_CURRENT[id];store.setState({players:store.getState().players.map((p,i)=>i===0?{...p,position:(destination+49)%50}:p),phase:'MOVING',diceValue:1});store.getState().movePlayer();};
moveToLegacy(13);const event=store.getState().selectedEvent,option=event.options[0];assert.equal(event.serviceKey,'transport');store.getState().resolveEvent(option.effect,option.result);assert.equal(store.getState().players[0].money,9800);assert.deepEqual(store.getState().players[0].learnedServices,['transport']);store.getState().resolveEvent(option.effect,option.result);assert.equal(store.getState().players[0].money,9800);store.getState().advanceFromResult();assert.equal(store.getState().currentPlayerIndex,1);store.getState().advanceFromResult();assert.equal(store.getState().currentPlayerIndex,1);
moveToLegacy(2);store.getState().resolveEvent({health:200,stress:-200,money:-50000},'共餐');assert.deepEqual(store.getState().players[0].completedActivities,['meal']);assert.equal(store.getState().players[0].health,100);assert.equal(store.getState().players[0].stress,0);assert.equal(store.getState().players[0].money,0);
moveToLegacy(18);store.getState().resolveEvent({},'喘息');assert.deepEqual(store.getState().players[0].completedActivities,['respite']);assert.equal(missionSummary(['respite'],80,20,[])[2].done,false);
store.setState({round:12,currentPlayerIndex:1,phase:'EVENT',selectedEvent:null});store.getState().advanceFromResult();assert.equal(store.getState().phase,'RESULT');
const {CITY_BASE,CITY_SURFACE,createCityBoxGeometry}=await import('../src/components/Three/cityGeometry.ts');
for(const layer of [CITY_BASE,CITY_SURFACE]){const g=createCityBoxGeometry(layer.size,layer.radius);g.computeBoundingBox();assert.ok(g.boundingBox.max.y+layer.y<.1);assert.ok(Math.abs(g.boundingBox.max.y-g.boundingBox.min.y-layer.size[1])<.0001);g.dispose();}
const thin=createCityBoxGeometry([2,.14,2],.8);thin.computeBoundingBox();assert.ok(thin.boundingBox.max.y<.071);thin.dispose();
const {buildCareIsland}=await import('../src/components/District/islandModel.ts');
const {buildCareDistrict,DISTRICT_STOPS}=await import('../src/components/District/model.ts');
for(const stop of DISTRICT_STOPS)assert.ok(BOARD_DATA[stop.tileId]);
const {createLightingRig,upgradeLightingMaterials}=await import('../src/components/District/lighting.ts');
for(const night of [false,true])for(const layout of ['island','district']){
 const scene=new THREE.Scene(),model=layout==='island'?buildCareIsland(night):buildCareDistrict(night);scene.add(model.root);
 const rig=createLightingRig(scene,night,layout),originals=[];model.root.traverse(o=>{if(o.isMesh)originals.push([o,o.material]);});const restore=upgradeLightingMaterials(model.root,night);assert.ok(originals.some(([o])=>o.material.isMeshStandardMaterial));
 scene.updateMatrixWorld(true);rig.sun.shadow.updateMatrices(rig.sun);const bounds=new THREE.Box3().setFromObject(model.root),camera=rig.sun.shadow.camera;
 for(const x of[bounds.min.x,bounds.max.x])for(const y of[bounds.min.y,bounds.max.y])for(const z of[bounds.min.z,bounds.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1&&Math.abs(p.z)<1,'shadow volume covers scene');}
 let casters=0,points=0;scene.traverse(o=>{if(o.isLight&&o.castShadow)casters++;if(o.isPointLight)points++;});assert.equal(casters,1);assert.ok(points<=3);assert.ok(rig.sun.shadow.mapSize.x<=1024);rig.setShadow(99);assert.ok(rig.sun.shadow.intensity<=.9);restore();for(const[o,m]of originals)assert.equal(o.material,m);rig.dispose();model.dispose();
}
console.log('PASS: original event effects, duplicate guards, tasks, bounds, 12-round result, scene thickness, district links, day/night materials and bounded shadows.');
