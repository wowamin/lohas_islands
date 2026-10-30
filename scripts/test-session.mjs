import './register-ts.mjs';
import assert from 'node:assert/strict';
const {LocalGameSession}=await import('../src/game/session/LocalGameSession.ts');
const {LocalSaveRepository}=await import('../src/game/storage/LocalSaveRepository.ts');
const {MemoryStorage}=await import('../src/game/storage/StorageAdapter.ts');
const {initialGame,startGame}=await import('../src/game/rules/engine.ts');
const {createGameClient}=await import('../src/game/store/createGameClient.ts');
const {SAVE_VERSION,decodeSave,RECENT_AUTO_KEY}=await import('../src/game/storage/saveCodec.ts');
function fakeClock(){let sequence=0;const tasks=new Map();return{set:f=>{tasks.set(++sequence,f);return sequence;},clear:id=>tasks.delete(id),flush(){const old=[...tasks.values()];tasks.clear();old.forEach(f=>f());},get count(){return tasks.size;}};}
const clock=fakeClock(),raw=new MemoryStorage(),notices=[];
const repoA=new LocalSaveRepository(raw,'visitor-a',n=>notices.push(n)),a=new LocalGameSession({id:'visitor-a',repository:repoA,random:()=>.49,scheduler:clock});
assert.ok(a.dispatch({type:'START_GAME',names:['甲','乙']}).accepted);
a.save();const before=structuredClone(a.getSnapshot());
assert.throws(()=>{a.getSnapshot().players[0].money=999999;});
assert.equal(a.dispatch({type:'ROLL_DICE',diceValue:6}).accepted,false);assert.deepEqual(a.getSnapshot(),before);
assert.equal(a.dispatch({type:'ROLL_DICE',expectedRevision:0}).accepted,false);
assert.ok(a.dispatch({type:'ROLL_DICE',expectedRevision:before.revision}).accepted);assert.equal(a.getSnapshot().diceValue,3);assert.equal(clock.count,1);assert.equal(a.dispatch({type:'ROLL_DICE'}).accepted,false);
clock.flush();assert.equal(a.getSnapshot().phase,'MOVING');const moving=a.getSnapshot();assert.equal(a.dispatch({type:'COMPLETE_MOVEMENT',position:49,money:999999}).accepted,false);assert.equal(a.getSnapshot(),moving);
a.dispatch({type:'COMPLETE_MOVEMENT',expectedRevision:moving.revision});assert.equal(a.getSnapshot().players[0].position,3);assert.equal(a.dispatch({type:'COMPLETE_MOVEMENT'}).accepted,false);
const event=a.getSnapshot().selectedEvent;assert.equal(a.dispatch({type:'CHOOSE_EVENT',eventId:event.id,optionIndex:99}).accepted,false);
assert.equal(a.dispatch({type:'CHOOSE_EVENT',eventId:event.id,optionIndex:0,effect:{money:999999}}).accepted,false);
a.dispatch({type:'CHOOSE_EVENT',eventId:event.id,optionIndex:0});assert.equal(a.getSnapshot().players[0].money,9700);assert.equal(a.dispatch({type:'CHOOSE_EVENT',eventId:event.id,optionIndex:0}).accepted,false);
a.dispatch({type:'ADVANCE_TURN'});assert.equal(a.getSnapshot().currentPlayerIndex,1);
a.load();assert.equal(a.getSnapshot().players[0].position,0);assert.equal(a.getSnapshot().currentPlayerIndex,0);assert.ok(a.getSnapshot().revision>before.revision);
const repoB=new LocalSaveRepository(raw,'visitor-b'),b=new LocalGameSession({id:'visitor-b',repository:repoB,random:()=>0,scheduler:fakeClock()});
assert.notEqual(repoA.autoKey,repoB.autoKey);const source=raw.getItem(repoA.autoKey);b.dispatch({type:'RESET_GAME'});b.dispatch({type:'START_GAME',names:['乙的旅程']});assert.equal(raw.getItem(repoA.autoKey),source);assert.equal(a.getSnapshot().players.length,2);assert.equal(b.getSnapshot().players.length,1);
const aReload=new LocalGameSession({id:'visitor-a',repository:new LocalSaveRepository(raw,'visitor-a')});assert.equal(aReload.getSnapshot().players.length,2,'reload uses own slot, not another tab latest pointer');
assert.equal(b.getSnapshot().players[0].name,'乙的旅程');
// Timer cancellation and listener lifecycle cannot leak into another session or a restart.
a.dispatch({type:'ROLL_DICE'});a.dispatch({type:'RESET_GAME'});a.dispatch({type:'START_GAME',names:['新甲','新乙']});clock.flush();assert.equal(a.getSnapshot().phase,'WAITING_ROLL');
let calls=0;const unsubscribe=a.subscribe(()=>calls++);a.dispatch({type:'RESET_GAME'});assert.equal(calls,1);unsubscribe();a.dispatch({type:'RESET_GAME'});assert.equal(calls,1);a.dispose();assert.equal(a.dispatch({type:'START_GAME',names:['甲']}).accepted,false);
// A replacement adapter works through the same Zustand projection used by the existing scene.
const first=new LocalGameSession({id:'first'}),client=createGameClient(first),second=new LocalGameSession({id:'second'});client.useStore.getState().startGame(['甲','乙']);assert.equal(client.useStore.getState().players.length,2);client.setAdapter(second);assert.equal(client.useStore.getState().sessionId,'second');client.useStore.getState().startGame(['新旅人']);assert.equal(second.getSnapshot().players.length,1);assert.equal(first.dispatch({type:'ROLL_DICE'}).accepted,false);client.dispose();
// Old source and backups survive migration; unsupported data blocks automatic writes.
for(const version of [1,2]){const storage=new MemoryStorage(),state=startGame(initialGame(),['舊甲','舊乙']);state.players[0].position=39;const key='long-care-game-save-v'+version,old=JSON.stringify({version,state});storage.setItem(key,old);const repository=new LocalSaveRepository(storage,'migration-'+version);const restored=repository.loadAuto();assert.equal(restored.players[0].position,version===1?47:39);assert.equal(storage.getItem(key),old);assert.equal(storage.getItem(key+'-backup-before-v3'),old);assert.equal(JSON.parse(storage.getItem(repository.autoKey)).version,SAVE_VERSION);}
const corrupt=new MemoryStorage(),badNotices=[],badRepo=new LocalSaveRepository(corrupt,'bad',n=>badNotices.push(n));const unknown=JSON.stringify({version:99,state:before});corrupt.setItem(badRepo.autoKey,unknown);assert.equal(badRepo.loadAuto(),null);badRepo.saveAuto(initialGame());assert.equal(corrupt.getItem(badRepo.autoKey),unknown);assert.ok(badNotices.at(-1).blocked);
const storageError={getItem(){throw Error('denied');},setItem(){throw Error('denied');},removeItem(){throw Error('denied');}};const noStorage=new LocalGameSession({id:'volatile',repository:new LocalSaveRepository(storageError,'volatile')});assert.ok(noStorage.dispatch({type:'START_GAME',names:['旅人']}).accepted);noStorage.dispose();
const m=new MemoryStorage(),manualRepo=new LocalSaveRepository(m,'manual'),legacy=startGame(initialGame(),['甲','乙']);legacy.players[0].position=39;m.setItem('lohas-manual-save-v1',JSON.stringify({version:1,state:legacy}));assert.equal(manualRepo.loadManual().players[0].position,47);assert.ok(m.getItem('lohas-manual-save-v1-backup-before-v3'));
const incompatible=new MemoryStorage(),incompatibleRepo=new LocalSaveRepository(incompatible,'future');const future=JSON.stringify({version:3,state:{...before,mapVersion:999}});incompatible.setItem(incompatibleRepo.autoKey,future);assert.equal(incompatibleRepo.loadAuto(),null);incompatibleRepo.saveAuto(initialGame());assert.equal(incompatible.getItem(incompatibleRepo.autoKey),future);
assert.throws(()=>decodeSave({version:3,state:{...before,players:[{...before.players[0],position:50},before.players[1]]}}));
assert.ok(raw.getItem(RECENT_AUTO_KEY));b.dispose();aReload.dispose();
console.log('PASS: LocalGameSession commands, canonical effects, stale/forged command rejection, immutable snapshots, independent slots, reload, manual saves, migration/backups, storage failure and adapter replacement.');
