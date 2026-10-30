// Reuse the TypeScript loader and original regressions before testing new features.
await import('./test-game.mjs');
const {default:assert}=await import('node:assert/strict');
const {budgetLimit,estimate}=await import('../src/game/education/calculator.ts');
const {MODULES,QUESTIONS,SERVICES}=await import('../src/game/education/content.ts');
const {useLearning}=await import('../src/game/education/store.ts');
const {useGameStore}=await import('../src/game/store/useGameStore.ts');
const {saveSnapshot,loadSnapshot}=await import('../src/game/save.ts');
assert.equal(MODULES.length,6);
assert.equal(new Set(SERVICES.map(s=>s.code)).size,SERVICES.length);
for(const q of QUESTIONS){assert.ok(MODULES.some(m=>m.id===q.module));assert.ok(q.correct>=0&&q.correct<q.choices.length);}
assert.equal(budgetLimit(2,'care',1,1),10020);
assert.equal(budgetLimit(8,'care',1,1),36180);
assert.equal(budgetLimit(7,'respite',1,1),48510);
assert.equal(budgetLimit(6,'respite',1,1),32340);
assert.equal(budgetLimit(4,'equipment',1,2),60000);
assert.equal(budgetLimit(4,'transport',4,1),2400);
assert.deepEqual(estimate(12000,10020,.16),{total:12000,covered:10020,copay:1603,excess:1980,selfPay:3583,subsidy:8417,remaining:0});
assert.equal(estimate(195,10020,.05).copay,9,'fractional burden must floor');
assert.equal(estimate(20000,10020,0).selfPay,9980,'first category still pays excess');
assert.equal(estimate(0,10020,.16).remaining,10020);
assert.throws(()=>estimate(NaN,10020,.16));
assert.throws(()=>budgetLimit(1,'care',1,1));
useGameStore.getState().startGame(['甲','乙','丙','丁']);
const before=JSON.stringify(useGameStore.getState());
for(const q of QUESTIONS){useLearning.getState().answer(q.id,(q.correct+1)%q.choices.length);useLearning.getState().answer(q.id,q.correct);}
useLearning.getState().markRead('A');useLearning.getState().markRead('A');
assert.equal(useLearning.getState().read.length,1);
assert.equal(useLearning.getState().mistakes.length,6);
assert.equal(JSON.stringify(useGameStore.getState()),before,'learning must not mutate game');
saveSnapshot();useGameStore.setState({round:7,currentPlayerIndex:3});loadSnapshot();
assert.equal(useGameStore.getState().round,1);assert.equal(useGameStore.getState().players.length,4);
const slot=localStorage.getItem('lohas-manual-save-v2');
localStorage.setItem('lohas-manual-save-v2',JSON.stringify({version:1,state:{phase:'WAITING_ROLL',players:[]}}));assert.throws(loadSnapshot);
localStorage.setItem('lohas-manual-save-v2',slot);
const oldManualState=JSON.parse(slot).state;oldManualState.players[0].position=39;
const oldManual=JSON.stringify({version:1,state:oldManualState});
localStorage.removeItem('lohas-manual-save-v2');localStorage.setItem('lohas-manual-save-v1',oldManual);loadSnapshot();
assert.equal(useGameStore.getState().players[0].position,47);
assert.equal(localStorage.getItem('lohas-manual-save-v1'),oldManual);
assert.equal(localStorage.getItem('lohas-manual-save-v1-backup-before-50'),oldManual);
localStorage.setItem('lohas-manual-save-v2',slot);
useGameStore.setState({phase:'MOVING'});assert.throws(saveSnapshot);
const moving={...useGameStore.getState(),phase:'MOVING'};
localStorage.setItem('long-care-game-save-v2',JSON.stringify({state:moving,version:2}));await useGameStore.persist.rehydrate();
assert.equal(useGameStore.getState().phase,'MOVING');
for(let i=0;i<4;i++){useGameStore.setState({phase:'EVENT',selectedEvent:null,eventResultText:'完成'});useGameStore.getState().advanceFromResult();assert.equal(useGameStore.getState().currentPlayerIndex,(i+1)%4);}
assert.equal(useGameStore.getState().round,2);
console.log('PASS: education isolation; questions and review; budget boundaries and flooring; four-player order; manual save validation; moving save recovery.');
