import './register-ts.mjs';
import assert from 'node:assert/strict';
import * as T from 'three';
const {CHARACTER_IDS}=await import('../src/game/characters.ts');
const {createCharacterModel,CHARACTER_ASSETS}=await import('../src/components/Characters/model.ts');
const {createCharacterActor}=await import('../src/components/Characters/actor.ts');
const {characterResourceStats}=await import('../src/components/Characters/resources.ts');
const {CHARACTER_HEIGHT}=await import('../src/components/Characters/types.ts');
const {LocalGameSession}=await import('../src/game/session/LocalGameSession.ts');
const {initialGame,startGame}=await import('../src/game/rules/engine.ts');
const {decodeSave,encodeSave}=await import('../src/game/storage/saveCodec.ts');
const {BOARD_DATA}=await import('../src/game/board.ts');
const {LocalSaveRepository}=await import('../src/game/storage/LocalSaveRepository.ts');
const {MemoryStorage}=await import('../src/game/storage/StorageAdapter.ts');
const baseline=characterResourceStats().reduce((n,p)=>n+p.refs,0);
for(const quality of ['low','medium','high'])for(const characterId of CHARACTER_IDS){
 const model=createCharacterModel({characterId,color:'#D88C65',quality});model.root.updateMatrixWorld(true);
 const bounds=new T.Box3().setFromObject(model.root),size=bounds.getSize(new T.Vector3());assert.ok(Math.abs(size.y-CHARACTER_HEIGHT)<1e-5);assert.ok(Math.abs(bounds.min.y)<1e-5,'feet/base origin at zero');assert.ok(size.x>.4&&size.z>.2,'real volume, not a billboard');
 for(const name of ['Head','LeftArm','RightArm',characterId==='grandma'?'PinkCurls':'GreenRoundCap',characterId==='grandma'?'RedRoundGlasses':'MintMustache',characterId==='grandma'?'BubbleTea':'CoconutDrink']){
   let found=false;model.root.traverse(o=>{if(o.name.includes(name))found=true;});assert.ok(found,'independent detail '+name);
 }
 const geometryIds=new Set(),materialIds=new Set(),textureIds=new Set();let calls=0;
 model.root.traverse(o=>{if(o.isMesh){calls++;geometryIds.add(o.geometry.uuid);const m=o.material;materialIds.add(m.uuid);if(m.map)textureIds.add(m.map.uuid);}});assert.ok(calls<65,'static parts batch into bounded draw calls');assert.ok(textureIds.size>=1,'procedural clothing material');
 const before=JSON.stringify(model.root.getObjectByName('BodyMotion').position.toArray());model.update(.05,{motion:'walking',reducedMotion:false});assert.notEqual(JSON.stringify(model.root.getObjectByName('BodyMotion').position.toArray()),before);
 for(const motion of ['idle','charging','cheering','walking','landing'])for(let n=0;n<40;n++)model.update(1/60,{motion,reducedMotion:false});
 const eyes=[];model.root.traverse(o=>{if(o.name==='Eye')eyes.push(o);});assert.equal(eyes.length,2);let blink=false;for(let n=0;n<350;n++){model.update(1/60,{motion:'idle',reducedMotion:false});if(eyes[0].scale.y<.5)blink=true;}assert.ok(blink,'occasional blink');
 model.update(.016,{motion:'idle',reducedMotion:true});assert.equal(model.root.getObjectByName('BodyMotion').position.y,0);assert.equal(eyes[0].scale.y,1);
 model.root.traverse(o=>{if(o.isMesh){assert.ok(geometryIds.has(o.geometry.uuid));assert.ok(materialIds.has(o.material.uuid));if(o.material.map)assert.ok(textureIds.has(o.material.map.uuid));}});model.dispose();model.dispose();
}
const first=createCharacterModel({characterId:'grandma',color:'#D88C65'}),second=createCharacterModel({characterId:'grandma',color:'#89B5AD'});let geometry;first.root.traverse(o=>{if(o.isMesh&&!geometry)geometry=o.geometry;});let destroyed=0;geometry.addEventListener('dispose',()=>destroyed++);first.dispose();assert.equal(destroyed,0,'shared resources survive another actor disposal');second.update(.016,{motion:'walking',reducedMotion:false});second.dispose();assert.equal(destroyed,1);
const names=['甲','乙','丙','丁'],ids=['grandma','grandma','grandpa','grandma'];const game=startGame(initialGame(),names,ids);assert.deepEqual(game.players.map(p=>p.characterId),ids);assert.equal(new Set(game.players.map(p=>p.color)).size,4,'duplicate role has independent identity colors');assert.equal(startGame(initialGame(),names,['grandpa']).phase,'SETUP');
assert.deepEqual(JSON.parse(JSON.stringify(decodeSave(JSON.parse(encodeSave(game))).state.players)),game.players);
for(const version of [1,2,3]){const old=structuredClone(game);old.players.forEach(p=>delete p.characterId);old.players[0].position=version===1?39:49;const restored=decodeSave({version,state:old}).state;assert.deepEqual(restored.players.map(p=>p.characterId),['grandpa','grandma','grandpa','grandma']);assert.equal(restored.players[0].position,version===1?47:49);assert.equal(restored.players[0].money,10000);}
const invalid=structuredClone(game);invalid.players[0].characterId='unknown';assert.throws(()=>decodeSave({version:3,state:invalid}));
const rawStorage=new MemoryStorage(),repository=new LocalSaveRepository(rawStorage,'unknown-role'),raw=encodeSave(invalid);rawStorage.setItem(repository.autoKey,raw);const protectedSession=new LocalGameSession({id:'unknown-role',repository});protectedSession.dispatch({type:'START_GAME',names:['暫玩']});assert.equal(rawStorage.getItem(repository.autoKey),raw,'unknown role data is preserved, not overwritten');protectedSession.dispose();
const session=new LocalGameSession({id:'character-state',initialSnapshot:game});assert.equal(session.dispatch({type:'START_GAME',names,characterIds:['grandma','grandma','grandpa','grandma'],money:9999}).accepted,false);session.dispose();
const actor=createCharacterActor({characterId:'grandpa',color:'#D88C65',playerId:0});
const frame={delta:1/60,position:49,visualPosition:null,moving:false,active:true,phase:'WAITING_ROLL',dicePhase:'idle',reducedMotion:false,worldPosition:i=>BOARD_DATA[i].position};actor.update(frame);
const original=actor.root.position.clone();actor.update({...frame,phase:'ROLLING',dicePhase:'rolling'});assert.equal(actor.motion,'charging');assert.ok(actor.root.position.distanceTo(original)<1e-6);
actor.update({...frame,phase:'ROLLING',dicePhase:'revealing'});assert.equal(actor.motion,'cheering');
for(let n=0;n<100;n++)actor.update({...frame,phase:'MOVING',visualPosition:0,moving:true});assert.equal(actor.motion,'walking');const target=BOARD_DATA[0].position;assert.ok(Math.abs(actor.root.position.x-(target[0]-.325))<.01,'50 to 1 wrap follows next stop');
actor.update({...frame,position:0,phase:'EVENT',visualPosition:null,moving:false});
assert.equal(actor.motion,'landing','movement completion triggers a landing even when already on the final visual stop');
for(let n=0;n<100;n++)actor.update({...frame,position:0,phase:'EVENT',visualPosition:null,moving:false});assert.equal(actor.motion,'idle');
actor.update({...frame,position:6,phase:'EVENT',reducedMotion:true});assert.ok(Math.abs(actor.root.position.x-(BOARD_DATA[6].position[0]-.325))<1e-6,'skip/reduced reaches exact destination');assert.ok(Number.isFinite(actor.root.rotation.y));actor.dispose();
assert.equal(characterResourceStats().reduce((n,p)=>n+p.refs,0),baseline,'all procedural resources released');
// Exercise the replaceable GLB loader using an in-memory glTF asset, without network dependencies.
const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');const originalLoad=GLTFLoader.prototype.loadAsync;let loads=0,templateDisposals=0;
const fixture=()=>{const scene=new T.Group(),geometry=new T.BoxGeometry(.7,2,.5),material=new T.MeshStandardMaterial();geometry.addEventListener('dispose',()=>templateDisposals++);scene.add(new T.Mesh(geometry,material));return{scene,animations:[],scenes:[scene],cameras:[],asset:{version:'2.0'}};};
try{
 GLTFLoader.prototype.loadAsync=async()=>{loads++;return fixture();};CHARACTER_ASSETS.grandpa={kind:'gltf',url:'fixture.glb',rotationY:Math.PI};
 const a=createCharacterModel({characterId:'grandpa',color:'#D88C65'}),b=createCharacterModel({characterId:'grandpa',color:'#89B5AD'});
 for(let n=0;n<100&&a.root.userData.source!=='gltf';n++)await new Promise(r=>setTimeout(r,5));assert.equal(a.root.userData.source,'gltf');assert.equal(b.root.userData.source,'gltf');assert.equal(loads,1,'GLB template cache');a.dispose();await Promise.resolve();assert.equal(templateDisposals,0);b.dispose();await Promise.resolve();assert.equal(templateDisposals,1);
 GLTFLoader.prototype.loadAsync=async()=>{throw Error('missing asset');};const fallback=createCharacterModel({characterId:'grandpa',color:'#D88C65'});for(let n=0;n<100&&!fallback.root.userData.assetError;n++)await new Promise(r=>setTimeout(r,5));assert.ok(fallback.root.userData.assetError);assert.equal(fallback.root.userData.source,'procedural');fallback.dispose();
}finally{GLTFLoader.prototype.loadAsync=originalLoad;CHARACTER_ASSETS.grandpa={kind:'procedural'};}
assert.equal(characterResourceStats().reduce((n,p)=>n+p.refs,0),baseline);
console.log('PASS: real grandma/grandpa geometry, required accessories, normalized origin/height, all poses/blink, reduced motion, resource reuse/disposal, duplicate choices, v1-v3 saves, wrap/skip movement and cached GLB replacement/failure fallback.');
