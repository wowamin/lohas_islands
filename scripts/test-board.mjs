import './register-ts.mjs';
import assert from 'node:assert/strict';
const {BOARD_DATA,BOARD_SIZE,LEGACY_TO_CURRENT}=await import('../src/game/board.ts');
const {LEGACY_BOARD_DATA}=await import('../src/game/legacyBoard.ts');
const {ALL_GAME_EVENTS,EDUCATION_EVENTS}=await import('../src/game/eventRegistry.ts');
const {CENTERS}=await import('../src/game/cityLayout.ts');
const {initialGame,startGame,beginRoll,finishRoll,completeMovement,chooseEvent,advanceTurn,movement,rollDie,scorePlayer}=await import('../src/game/rules/engine.ts');
const {decodeSave}=await import('../src/game/storage/saveCodec.ts');
assert.equal(BOARD_SIZE,50);assert.equal(BOARD_DATA.length,50);assert.equal(new Set(BOARD_DATA.map(t=>t.id)).size,50);
for(const c of CENTERS)assert.equal(BOARD_DATA.filter(t=>t.centerId===c.id).length,10);
for(const old of LEGACY_BOARD_DATA){const tile=BOARD_DATA[LEGACY_TO_CURRENT[old.id]];assert.equal(tile.legacyId,old.id);for(const key of ['name','type','eventIds','serviceKey'])assert.deepEqual(tile[key],old[key]);}
assert.equal(BOARD_DATA.filter(t=>t.legacyId===null).length,10);
for(const e of EDUCATION_EVENTS)for(const option of e.options)assert.deepEqual(option.effect,{});
assert.equal(new Set(BOARD_DATA.map(t=>t.position.join(','))).size,50);
for(const tile of BOARD_DATA){assert.equal(BOARD_DATA[tile.next].previous,tile.id);assert.equal(BOARD_DATA[tile.previous].next,tile.id);for(const id of tile.eventIds)assert.ok(ALL_GAME_EVENTS.some(e=>e.id===id));}
for(const tile of BOARD_DATA){const s=startGame(initialGame(),['甲','乙']);s.players[0].position=(tile.id+49)%50;const before=structuredClone(s);const landed=completeMovement({...s,phase:'MOVING',diceValue:1},0);assert.deepEqual(s,before,'rules must not mutate their input');assert.equal(landed.players[0].position,tile.id);if(tile.eventIds.length)assert.ok(tile.eventIds.includes(landed.selectedEvent.id));else if(tile.id!==0)assert.match(landed.eventResultText,/不變/);}
for(const count of [1,2,3,4]){let s=startGame(initialGame(),['甲','乙','丙','丁'].slice(0,count));for(let turn=0;turn<12*count;turn++){assert.equal(s.currentPlayerIndex,turn%count);s=beginRoll(s,6);s=finishRoll(s);s=completeMovement(s,0);if(s.selectedEvent)s=chooseEvent(s,s.selectedEvent.id,s.selectedEvent.options?0:undefined);s=advanceTurn(s);}assert.equal(s.phase,'RESULT');for(const p of s.players)assert.equal(p.position,22);}
assert.deepEqual(movement(48,4),{position:2,startReward:1000});assert.deepEqual(movement(49,1),{position:0,startReward:1000});assert.throws(()=>movement(50,1));assert.throws(()=>movement(0,7));
for(let i=1;i<=6;i++)assert.equal(rollDie((i-.5)/6),i);for(const bad of [-1,1,NaN,Infinity])assert.throws(()=>rollDie(bad));
assert.equal(scorePlayer({money:10000,health:80,stress:20}),220);
const original=startGame(initialGame(),['甲','乙']);
for(let p=0;p<40;p++){const raw={version:1,state:{...original,players:original.players.map((player,i)=>i===0?{...player,position:p}:player)}};const decoded=decodeSave(raw);assert.equal(decoded.state.players[0].position,LEGACY_TO_CURRENT[p]);assert.equal(decoded.state.players[0].money,10000);assert.equal(raw.state.players[0].position,p);assert.equal(decoded.state.mapVersion,1);}
for(const phase of ['ROLLING','MOVING','EVENT','RESULT']){const decoded=decodeSave({version:2,state:{...original,phase,selectedEvent:phase==='EVENT'?ALL_GAME_EVENTS[0]:null}});assert.equal(decoded.state.phase,phase==='ROLLING'?'MOVING':phase);}
assert.throws(()=>decodeSave({version:3,state:{...original,mapVersion:99}}));
console.log('PASS: versioned 50-stop map, original event mapping, pure immutable transitions, 1–4 players, complete circuits, 12 rounds, dice bounds and legacy map migration.');
