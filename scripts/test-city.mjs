import './register-ts.mjs';
import assert from 'node:assert/strict';
import * as T from 'three';
const {buildCareIsland,ISLAND_CENTERS,islandStation}=await import('../src/components/District/islandModel.ts');
const {BOARD_DATA}=await import('../src/game/board.ts');
const {COURTYARD_ROUTE}=await import('../src/game/cityLayout.ts');
const cross=(a,b,c)=>(b[0]-a[0])*(c[2]-a[2])-(b[2]-a[2])*(c[0]-a[0]);
for(let i=0;i<50;i++)for(let j=i+2;j<50;j++){if(i===0&&j===49)continue;const a=BOARD_DATA[i].position,b=BOARD_DATA[(i+1)%50].position,c=BOARD_DATA[j].position,d=BOARD_DATA[(j+1)%50].position;assert.ok(!(cross(a,b,c)*cross(a,b,d)<-1e-8&&cross(c,d,a)*cross(c,d,b)<-1e-8),'route cannot self-intersect');}
for(const quality of ['low','medium','high']){
 const model=buildCareIsland(false,quality);model.root.updateMatrixWorld(true);
 let buildings=0,batches=0,instances=0;model.root.traverse(o=>{if(o.name==='DayCareCenter')buildings++;if(o.isInstancedMesh){batches++;instances+=o.count;}});assert.equal(buildings,5);assert.ok(batches>5);assert.ok(instances>batches*2);
 for(const center of ISLAND_CENTERS){const group=model.root.getObjectByName(center.id);assert.ok(group);for(let i=0;i<10;i++){const world=new T.Vector3(...islandStation(center.start+i));const local=group.worldToLocal(world.clone());assert.ok(local.x>=-5&&local.x<=5&&local.z>=0&&local.z<=4.6,'all ten stops inside actual courtyard');assert.ok(Math.abs(local.x-COURTYARD_ROUTE[i][0])<1e-8);assert.ok(Math.abs(local.z-COURTYARD_ROUTE[i][1])<1e-8);assert.ok(local.z>1.65||Math.abs(local.x)>3,'route never goes through building');}}
 for(const tile of BOARD_DATA){const a=new T.Vector3(...tile.position),b=new T.Vector3(...BOARD_DATA[tile.next].position);assert.ok(a.distanceTo(b)>.5&&a.distanceTo(b)<6,'connected stop segment length');}
 const again=buildCareIsland(false,quality);assert.deepEqual(model.root.userData.decorations,again.root.userData.decorations);again.dispose();model.dispose();
 console.log(`PASS Phase 2/3: ${quality}; fixed courtyard loop; deterministic decorations; ${batches} static instance batches / ${instances} instances; five detailed buildings.`);
}
