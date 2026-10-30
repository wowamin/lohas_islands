import './register-ts.mjs';
import assert from 'node:assert/strict';
const saved=new Map();
globalThis.localStorage={getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value),removeItem:key=>saved.delete(key)};
globalThis.window={localStorage,matchMedia:()=>({matches:true})};
const {BOARD_DATA,BOARD_SIZE,LEGACY_TO_CURRENT}=await import('../src/game/board.ts');
const {LEGACY_BOARD_DATA}=await import('../src/game/legacyBoard.ts');
const {ALL_GAME_EVENTS:EVENT_CARDS,EDUCATION_EVENTS}=await import('../src/game/eventRegistry.ts');
const {CENTERS}=await import('../src/game/cityLayout.ts');
const {useGameStore:store}=await import('../src/game/store/useGameStore.ts');
const {decodeSave,AUTO_KEY,gameStorage,useSaveStatus}=await import('../src/game/persistence.ts');
assert.equal(BOARD_SIZE,50);assert.equal(BOARD_DATA.length,50);
assert.equal(new Set(BOARD_DATA.map(t=>t.id)).size,50);
for(const c of CENTERS)assert.equal(BOARD_DATA.filter(t=>t.centerId===c.id).length,10);
for(const old of LEGACY_BOARD_DATA){const tile=BOARD_DATA[LEGACY_TO_CURRENT[old.id]];assert.equal(tile.legacyId,old.id);for(const key of ['name','type','eventIds','serviceKey'])assert.deepEqual(tile[key],old[key]);}
assert.equal(BOARD_DATA.filter(t=>t.legacyId===null).length,10);
for(const e of EDUCATION_EVENTS)for(const option of e.options)assert.deepEqual(option.effect,{},'knowledge opportunities cannot alter numeric balance');
assert.equal(new Set(BOARD_DATA.map(t=>t.position.join(','))).size,50);
for(const tile of BOARD_DATA){assert.equal(BOARD_DATA[tile.next].previous,tile.id);assert.equal(BOARD_DATA[tile.previous].next,tile.id);for(const id of tile.eventIds)assert.ok(EVENT_CARDS.some(e=>e.id===id));}
const start=(count=2)=>store.getState().startGame(['甲','乙','丙','丁'].slice(0,count));
for(const tile of BOARD_DATA){start();const players=store.getState().players.map((p,i)=>i===0?{...p,position:(tile.id+49)%50}:p);store.setState({players,phase:'MOVING',diceValue:1});store.getState().movePlayer();assert.equal(store.getState().players[0].position,tile.id);if(tile.eventIds.length)assert.ok(tile.eventIds.includes(store.getState().selectedEvent.id));else{assert.equal(store.getState().selectedEvent,null);if(tile.id!==0)assert.match(store.getState().eventResultText,/不變/);}}
for(const count of [2,3,4]){start(count);for(let i=0;i<count;i++){store.setState({phase:'EVENT',selectedEvent:null});store.getState().advanceFromResult();assert.equal(store.getState().currentPlayerIndex,(i+1)%count);}assert.equal(store.getState().round,2);}
for(const count of [2,3,4]){start(count);for(let turn=0;turn<12*count;turn++){store.setState({phase:'MOVING',diceValue:6});store.getState().movePlayer();const event=store.getState().selectedEvent;if(event){const option=event.options?.[0];store.getState().resolveEvent(option?.effect??event.effect??{},option?.result??event.result);}store.getState().advanceFromResult();}assert.equal(store.getState().phase,'RESULT');for(const p of store.getState().players)assert.equal(p.position,22,'each player completes one full 50-stop circuit plus 22 steps');}
start();store.setState({players:store.getState().players.map((p,i)=>i===0?{...p,position:48}:p),phase:'MOVING',diceValue:4});store.getState().movePlayer();assert.equal(store.getState().players[0].position,2);assert.equal(store.getState().players[0].money,11000);store.getState().movePlayer();assert.equal(store.getState().players[0].money,11000);
start();const original=JSON.parse(JSON.stringify(store.getState()));
for(let position=0;position<40;position++){const raw={version:1,state:{...original,players:original.players.map((p,i)=>i===0?{...p,position}:p)}};const decoded=decodeSave(raw);assert.equal(decoded.state.players[0].position,LEGACY_TO_CURRENT[position]);assert.equal(decoded.state.players[0].money,10000);assert.equal(raw.state.players[0].position,position);}
for(const phase of ['ROLLING','MOVING','EVENT','RESULT']){const decoded=decodeSave({version:1,state:{...original,phase,selectedEvent:phase==='EVENT'?EVENT_CARDS[0]:null}});assert.equal(decoded.state.phase,phase==='ROLLING'?'MOVING':phase);if(phase==='EVENT')assert.equal(decoded.state.selectedEvent.id,EVENT_CARDS[0].id);}
const legacyRaw=JSON.stringify({version:1,state:{...original,players:original.players.map((p,i)=>i===0?{...p,position:39}:p)}});localStorage.removeItem(AUTO_KEY);localStorage.setItem('long-care-game-save-v1',legacyRaw);await store.persist.rehydrate();assert.equal(store.getState().players[0].position,47);assert.equal(localStorage.getItem('long-care-game-save-v1'),legacyRaw);assert.equal(localStorage.getItem('long-care-game-save-v1-backup-before-50'),legacyRaw);assert.equal(JSON.parse(localStorage.getItem(AUTO_KEY)).version,2);
const unknown=JSON.stringify({version:99,state:original});localStorage.setItem(AUTO_KEY,unknown);assert.throws(()=>gameStorage.getItem(AUTO_KEY));store.getState().startGame(['甲','乙']);assert.equal(localStorage.getItem(AUTO_KEY),unknown);assert.ok(useSaveStatus.getState().blocked);useSaveStatus.setState({blocked:false,message:''});localStorage.removeItem(AUTO_KEY);
assert.throws(()=>decodeSave({version:2,state:{...original,players:[{...original.players[0],position:50},original.players[1]]}}));
console.log('PASS Phase 1: 50 unique tiles; five groups; 40 original event mappings; full circuit; 2–4 players; wrap reward; legacy position/event migration and backup; unknown save protection.');
