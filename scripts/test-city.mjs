import './register-ts.mjs';
import './test-diorama.mjs';
import assert from 'node:assert/strict';
import * as T from 'three';
const {buildCareIsland,ISLAND_CENTERS,islandStation}=await import('../src/components/District/islandModel.ts');
const {BOARD_DATA}=await import('../src/game/board.ts');
const {COURTYARD_ROUTE}=await import('../src/game/cityLayout.ts');
const {CITY_ROUTE}=await import('../src/game/city.ts');
const cross=(a,b,c)=>(b[0]-a[0])*(c[2]-a[2])-(b[2]-a[2])*(c[0]-a[0]);
assert.equal(CITY_ROUTE.split(' ').length,80,'2D does not close route');
for(let i=0;i<79;i++)for(let j=i+2;j<79;j++){const a=BOARD_DATA[i].position,b=BOARD_DATA[i+1].position,c=BOARD_DATA[j].position,d=BOARD_DATA[j+1].position;assert.ok(!(cross(a,b,c)*cross(a,b,d)<-1e-8&&cross(c,d,a)*cross(c,d,b)<-1e-8),'route cannot self-intersect: '+i+','+j);}
for(const quality of ['low','medium','high']){
 const model=buildCareIsland(false,quality);model.root.updateMatrixWorld(true);
 assert.ok(model.root.userData.terrainDepth>=2.3);assert.equal(model.root.userData.stops.length,80);assert.ok(model.root.getObjectByName('CityRiver'));assert.ok(model.root.getObjectByName('RockFoundation'));
 const variants=new Set();model.root.traverse(o=>{if(o.name==='DayCareCenter'){variants.add(o.userData.variant);for(const feature of ['eaves','window-frames','glass','entrance','ramp','sign','roof-equipment','planting'])assert.ok(o.userData.features.includes(feature));}});assert.equal(variants.size,5,'five distinct building variants');
 assert.equal(new Set(ISLAND_CENTERS.map(c=>model.root.getObjectByName(c.id).userData.terraceHeight)).size,5,'five courtyard terrace elevations');
 for(const feature of ['river','stone-banks','arched-bridges','cherry-trees','layered-canopies','community-shops','bus-stop','pergolas'])assert.ok(model.root.userData.environmentFeatures.includes(feature));
 let buildings=0,batches=0,instances=0;model.root.traverse(o=>{if(o.name==='DayCareCenter')buildings++;if(o.isInstancedMesh){batches++;instances+=o.count;}});assert.equal(buildings,5);assert.ok(batches>5);assert.ok(instances>batches*2);
 for(const center of ISLAND_CENTERS){const group=model.root.getObjectByName(center.id);assert.ok(group);for(let i=0;i<13;i++){const world=new T.Vector3(...islandStation(center.start+i)),local=group.worldToLocal(world.clone());assert.ok(local.x>=-5&&local.x<=5&&local.z>=0&&local.z<=4.6);assert.ok(Math.abs(local.x-COURTYARD_ROUTE[i][0])<1e-8);assert.ok(Math.abs(local.z-COURTYARD_ROUTE[i][1])<1e-8);assert.ok(local.z>1.65||Math.abs(local.x)>3,'route never goes through building');}}
 for(const tile of BOARD_DATA.slice(0,-1)){const a=new T.Vector3(...tile.position),b=new T.Vector3(...BOARD_DATA[tile.next].position);assert.ok(a.distanceTo(b)>.5&&a.distanceTo(b)<6,'connected stop segment length '+tile.id);}
 for(const decoration of model.root.userData.decorations){assert.ok(Number.isFinite(decoration.x)&&Number.isFinite(decoration.z));}
 const again=buildCareIsland(false,quality);assert.deepEqual(model.root.userData.decorations,again.root.userData.decorations);again.dispose();model.dispose();
 console.log(`PASS: ${quality}; open 80-stop route, 13 stops per courtyard, five buildings; ${batches} instance batches / ${instances} instances.`);
}
