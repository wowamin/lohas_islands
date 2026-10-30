await import('./test-game.mjs');
const {default:assert}=await import('node:assert/strict');
const {budgetLimit,estimate}=await import('../src/game/education/calculator.ts');
const {MODULES,QUESTIONS,SERVICES}=await import('../src/game/education/content.ts');
const {MemoryStorage}=await import('../src/game/storage/StorageAdapter.ts');
globalThis.localStorage=new MemoryStorage();globalThis.window={localStorage:globalThis.localStorage};
const {useLearning}=await import('../src/game/education/store.ts');
const {LocalGameSession}=await import('../src/game/session/LocalGameSession.ts');
const session=new LocalGameSession({id:'education'});session.dispatch({type:'START_GAME',names:['甲','乙','丙','丁']});
assert.equal(MODULES.length,6);assert.equal(new Set(SERVICES.map(s=>s.code)).size,SERVICES.length);
for(const q of QUESTIONS){assert.ok(MODULES.some(m=>m.id===q.module));assert.ok(q.correct>=0&&q.correct<q.choices.length);}
assert.equal(budgetLimit(2,'care',1,1),10020);assert.equal(budgetLimit(8,'care',1,1),36180);assert.equal(budgetLimit(7,'respite',1,1),48510);assert.equal(budgetLimit(6,'respite',1,1),32340);assert.equal(budgetLimit(4,'equipment',1,2),60000);assert.equal(budgetLimit(4,'transport',4,1),2400);
assert.deepEqual(estimate(12000,10020,.16),{total:12000,covered:10020,copay:1603,excess:1980,selfPay:3583,subsidy:8417,remaining:0});assert.equal(estimate(195,10020,.05).copay,9);assert.equal(estimate(20000,10020,0).selfPay,9980);assert.equal(estimate(0,10020,.16).remaining,10020);assert.throws(()=>estimate(NaN,10020,.16));assert.throws(()=>budgetLimit(1,'care',1,1));
const before=JSON.stringify(session.getSnapshot());
for(const q of QUESTIONS){useLearning.getState().answer(q.id,(q.correct+1)%q.choices.length);useLearning.getState().answer(q.id,q.correct);}useLearning.getState().markRead('A');useLearning.getState().markRead('A');
assert.equal(useLearning.getState().read.length,1);assert.equal(useLearning.getState().mistakes.length,6);assert.equal(JSON.stringify(session.getSnapshot()),before);session.dispose();
console.log('PASS: unchanged education modules, quiz and wrong-answer review, budget bounds and flooring, learning/game isolation.');
