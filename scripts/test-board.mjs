import './register-ts.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {BOARD_DATA,BOARD_SIZE,FINISH_INDEX,LEGACY_TO_CURRENT}=await import('../src/game/board.ts');
const {FIFTY_TO_CURRENT,MAP_VERSION,REGIONS}=await import('../src/game/mapDefinition.ts');
const {ALL_GAME_EVENTS,EDUCATION_EVENTS}=await import('../src/game/eventRegistry.ts');
const {JOURNEY_EVENTS,JOURNEY_SCENARIOS}=await import('../src/game/journeyEvents.ts');
const {initialGame,startGame,beginRoll,finishRoll,completeMovement,chooseEvent,advanceTurn,movement,rollDie,scorePlayer,resetGame}=await import('../src/game/rules/engine.ts');
const {decodeSave,encodeSave,SAVE_VERSION}=await import('../src/game/storage/saveCodec.ts');
const baseline=JSON.parse(readFileSync('docs/board-50-baseline.json','utf8'));
const exported=JSON.parse(readFileSync('public/city-route-80.json','utf8'));
assert.deepEqual(exported.tiles,JSON.parse(JSON.stringify(BOARD_DATA)),'exported route matches authority');
assert.equal(BOARD_SIZE,80);assert.equal(BOARD_DATA.length,80);assert.equal(new Set(BOARD_DATA.map(t=>t.id)).size,80);
assert.deepEqual(REGIONS.map(r=>BOARD_DATA.filter(t=>t.centerId===r.id).length),[10,13,13,13,13,13,5]);
assert.equal(new Set(BOARD_DATA.map(t=>t.position.join(','))).size,80);
assert.equal(JOURNEY_EVENTS.length,30);assert.equal(new Set(ALL_GAME_EVENTS.map(e=>e.id)).size,ALL_GAME_EVENTS.length);
for(const old of baseline.tiles){const tile=BOARD_DATA[FIFTY_TO_CURRENT[old.id]];assert.equal(tile.old50Id,old.id);for(const key of ['name','type','serviceKey','legacyId'])assert.deepEqual(tile[key],old[key]);if(old.eventIds.length)assert.deepEqual(tile.eventIds,old.eventIds);else{assert.equal(tile.eventIds.length,1);assert.deepEqual(ALL_GAME_EVENTS.find(e=>e.id===tile.eventIds[0]).effect,{});}}
for(const event of baseline.events)assert.deepEqual(ALL_GAME_EVENTS.find(e=>e.id===event.id),event,'original effects and lessons unchanged');
for(const e of EDUCATION_EVENTS)for(const option of e.options)assert.deepEqual(option.effect,{});
for(const s of JOURNEY_SCENARIOS){assert.deepEqual(BOARD_DATA[s.index].eventIds,[s.id]);assert.ok(s.description&&s.lesson&&s.action);}
for(const tile of BOARD_DATA){
 assert.equal(tile.index,tile.id);assert.equal(tile.displayNumber,tile.id+1);assert.equal(tile.previous,Math.max(0,tile.id-1));assert.equal(tile.next,Math.min(79,tile.id+1));assert.ok(tile.position.every(Number.isFinite));assert.ok(Number.isFinite(tile.rotation));
 assert.ok(tile.eventIds.length>0,'every stop has an explicit event reference');for(const id of tile.eventIds)assert.ok(ALL_GAME_EVENTS.some(e=>e.id===id));
 if(tile.id===0)continue;
 const s=startGame(initialGame(),['甲','乙']);s.players[0].position=tile.id-1;const before=structuredClone(s);const landed=completeMovement({...s,phase:'MOVING',diceValue:1},0);assert.deepEqual(s,before);assert.equal(landed.players[0].position,tile.id);
 assert.equal(completeMovement(landed,0),landed);if(tile.old50Id!==null&&tile.old50Id%10===9){assert.equal(landed.selectedEvent,null);assert.match(landed.eventResultText,/不變/);assert.deepEqual(landed.eventOutcome,{money:0,health:0,stress:0});assert.deepEqual(landed.players[0].learnedServices,s.players[0].learnedServices);}else assert.ok(tile.eventIds.includes(landed.selectedEvent.id));
}
const resolve=s=>s.selectedEvent?chooseEvent(s,s.selectedEvent.id,s.selectedEvent.options?0:undefined):s;
for(const count of [1,2,3,4])for(const die of [1,2,3,4,5,6]){
 let s=startGame(initialGame(),['甲','乙','丙','丁'].slice(0,count)),turn=0;
 while(s.phase!=='RESULT'&&turn<80*count){assert.equal(s.currentPlayerIndex,turn%count);s=beginRoll(s,die);s=finishRoll(s);s=completeMovement(s,0);s=resolve(s);s=advanceTurn(s);turn++;}
 assert.equal(s.phase,'RESULT');assert.equal(turn%count,0);assert.ok(s.players.every(p=>p.position===79&&p.reachedFinish));assert.equal(beginRoll(s,1),s);assert.equal(advanceTurn(s),s);assert.equal(completeMovement(s,0),s);assert.equal(resetGame(s).phase,'SETUP');
}
// First, middle and last player finishing all permit only the remainder of this round.
for(const firstFinisher of [0,1,2,3]){
 let s=startGame(initialGame(),['甲','乙','丙','丁']);s.currentPlayerIndex=firstFinisher;s.players[firstFinisher].position=78;
 s=completeMovement({...s,phase:'MOVING',diceValue:6},0);assert.equal(s.selectedEvent.id,'journey-finish');assert.equal(advanceTurn(s),s,'finish review is required');s=resolve(s);const done=s;assert.equal(chooseEvent(s,'journey-finish',0),done);s=advanceTurn(s);
 for(let i=firstFinisher+1;i<4;i++){assert.equal(s.currentPlayerIndex,i);assert.equal(s.phase,'WAITING_ROLL');s=advanceTurn(resolve(completeMovement(finishRoll(beginRoll(s,1)),0)));}
 assert.equal(s.phase,'RESULT');assert.equal(s.players.filter(p=>p.reachedFinish).length,1);
}
assert.equal(advanceTurn({...startGame(initialGame(),['甲']),round:12,phase:'EVENT'}).phase,'WAITING_ROLL','round 12 no longer ends game');
for(let p=0;p<80;p++)for(let die=1;die<=6;die++)assert.deepEqual(movement(p,die),{position:Math.min(79,p+die),startReward:0});
for(const p of [-1,80,NaN])assert.throws(()=>movement(p,1));assert.throws(()=>movement(0,7));
for(let i=1;i<=6;i++)assert.equal(rollDie((i-.5)/6),i);for(const bad of [-1,1,NaN,Infinity])assert.throws(()=>rollDie(bad));
assert.equal(scorePlayer({money:10000,health:80,stress:20}),220);
const original=startGame(initialGame(),['甲','乙']);
const legacyState=()=>({...structuredClone(original),mapId:'lohas-city-50',mapVersion:1,rulesVersion:1});
for(const version of [1,2,3])for(let p=0;p<(version===1?40:50);p++){
 const s=legacyState();s.players[0].position=p;const raw={version,state:s};const copy=structuredClone(raw);const decoded=decodeSave(raw);assert.equal(decoded.state.players[0].position,version===1?LEGACY_TO_CURRENT[p]:FIFTY_TO_CURRENT[p]);assert.equal(decoded.state.players[0].money,10000);assert.deepEqual(raw,copy);assert.equal(decoded.state.mapVersion,MAP_VERSION);assert.ok(decoded.migrated);
}
for(const phase of ['ROLLING','MOVING','EVENT','RESULT']){const s=legacyState();s.phase=phase;s.players[0].position=9;s.diceValue=3;s.selectedEvent=phase==='EVENT'?ALL_GAME_EVENTS[0]:null;const decoded=decodeSave({version:3,state:s}).state;assert.equal(decoded.phase,phase==='ROLLING'?'MOVING':phase);if(phase==='ROLLING'||phase==='MOVING'){assert.equal(decoded.pendingMoveTarget,FIFTY_TO_CURRENT[12]);assert.equal(completeMovement(decoded,0).players[0].position,FIFTY_TO_CURRENT[12]);}if(phase==='EVENT')assert.equal(decoded.selectedEvent.id,s.selectedEvent.id);}
for(const phase of ['WAITING_ROLL','ROLLING','MOVING','EVENT','RESULT']){const s={...structuredClone(original),round:30,phase};const decoded=decodeSave(JSON.parse(encodeSave(s)));assert.equal(decoded.migrated,false);assert.equal(decoded.state.round,30);assert.equal(decoded.state.phase,phase==='ROLLING'?'MOVING':phase);}
assert.throws(()=>decodeSave({version:SAVE_VERSION,state:{...original,mapVersion:99}}));
assert.equal(FINISH_INDEX,79);
console.log('PASS: 80 stops, preserved 50-stop content/effects, 30 scenarios, all dice and 1–4 player journeys, finish review/round/duplicate guards, v1–v4 saves.');
