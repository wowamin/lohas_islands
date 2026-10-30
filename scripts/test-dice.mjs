import './register-ts.mjs';
import assert from 'node:assert/strict';
import * as T from 'three';
const {DiceAnimationController,DICE_TIMING,diceHeight}=await import('../src/game/dice/DiceAnimationController.ts');
const {createIslandDice,DICE_NORMALS,DICE_PATTERNS,diceResultQuaternion}=await import('../src/components/District/diceModel.ts');
const {LocalGameSession}=await import('../src/game/session/LocalGameSession.ts');
const {initialGame,startGame}=await import('../src/game/rules/engine.ts');
const {decodeSave}=await import('../src/game/storage/saveCodec.ts');
const {chooseEvent}=await import('../src/game/rules/engine.ts');
const {ALL_GAME_EVENTS}=await import('../src/game/eventRegistry.ts');
function clock(){const tasks=new Map();let id=0;return{set(fn){tasks.set(++id,fn);return id;},clear(id){tasks.delete(id);},flush(){const callbacks=[...tasks.values()];tasks.clear();callbacks.forEach(fn=>fn());},get count(){return tasks.size;}};}
const die=createIslandDice(),geometryIds=new Set(),materialIds=new Set();
die.root.traverse(o=>{if(o.isMesh){geometryIds.add(o.geometry.uuid);materialIds.add(o.material.uuid);}});
assert.equal(die.body.children.filter(o=>o.name.startsWith('face-')).length,6);
for(let value=1;value<=6;value++){
  const normal=new T.Vector3(...DICE_NORMALS[value]);assert.ok(normal.clone().applyQuaternion(diceResultQuaternion(value)).distanceTo(new T.Vector3(0,1,0))<1e-6);
  assert.equal(normal.dot(new T.Vector3(...DICE_NORMALS[7-value])),-1,'opposite faces sum to 7');
  const face=die.body.getObjectByName('face-'+value);assert.equal(face.children.length,value);assert.equal(DICE_PATTERNS[value].length,value);
  for(const mode of ['standard','quick','reduced']){
    const controller=new DiceAnimationController(),timing=DICE_TIMING[mode];assert.ok(controller.start(value,'roll-'+value,1000,mode));assert.equal(controller.start(7,'duplicate',1001,mode),false);
    assert.equal(controller.sample(1000).phase,mode==='reduced'?'revealing':'rolling');
    assert.equal(controller.sample(1000+timing.roll).phase,'revealing');assert.equal(controller.sample(1000+timing.roll+timing.reveal).phase,'moving');
    for(let elapsed=0;elapsed<=timing.roll+timing.reveal;elapsed+=10){const frame=controller.sample(1000+elapsed);assert.equal(frame.result,value);die.update(frame);assert.ok(Number.isFinite(die.body.position.y));}
    die.update(controller.sample(1000+timing.roll+timing.reveal));assert.ok(normal.clone().applyQuaternion(die.body.quaternion).distanceTo(new T.Vector3(0,1,0))<1e-6,'precise final top face');
    if(mode==='reduced'){assert.equal(die.root.getObjectByName('DiceStars').visible,false);assert.equal(diceHeight(.4,true),0);}
    controller.skip();assert.equal(controller.sample(1001).phase,'moving');assert.equal(controller.sample(1001).progress,1);controller.reset();assert.equal(controller.sample(2000).phase,'idle');
  }
  const timer=clock();let randomCalls=0;const game=new LocalGameSession({id:'dice-'+value,scheduler:timer,random:()=>{randomCalls++;return (value-.5)/6;}});
  game.dispatch({type:'START_GAME',names:['旅人']});const before=game.getSnapshot();
  game.dispatch({type:'ROLL_DICE',expectedRevision:before.revision});const rolled=game.getSnapshot();assert.equal(rolled.diceValue,value);
  for(let n=0;n<30;n++)assert.equal(game.dispatch({type:'ROLL_DICE'}).accepted,false);assert.equal(randomCalls,1,'dice sample generated exactly once');
  assert.equal(game.dispatch({type:'COMPLETE_ROLL',diceValue:6}).accepted,false,'no client-supplied result');
  assert.equal(game.dispatch({type:'COMPLETE_ROLL',expectedRevision:before.revision}).accepted,false);
  assert.ok(game.dispatch({type:'COMPLETE_ROLL',expectedRevision:rolled.revision}).accepted);assert.equal(timer.count,0,'skip/complete cancels fallback timer');
  const moving=game.getSnapshot();assert.equal(game.dispatch({type:'COMPLETE_ROLL'}).accepted,false);timer.flush();assert.equal(game.getSnapshot(),moving);
  assert.equal(game.getSnapshot().players[0].position,0,'presentation alone does not move player');
  game.dispatch({type:'COMPLETE_MOVEMENT',expectedRevision:moving.revision});const landed=game.getSnapshot();assert.equal(landed.players[0].position,value);assert.equal(randomCalls,2,'only landing event selects another sample');
  for(let n=0;n<30;n++)game.dispatch({type:'COMPLETE_MOVEMENT'});assert.equal(game.getSnapshot(),landed,'landing/event exactly once');
  const event=landed.selectedEvent;game.dispatch({type:'CHOOSE_EVENT',eventId:event.id,optionIndex:event.options?0:undefined});const chosen=game.getSnapshot();game.dispatch({type:'CHOOSE_EVENT',eventId:event.id,optionIndex:event.options?0:undefined});assert.equal(game.getSnapshot(),chosen);
  game.dispatch({type:'ADVANCE_TURN',expectedRevision:chosen.revision});const next=game.getSnapshot();game.dispatch({type:'ADVANCE_TURN',expectedRevision:chosen.revision});assert.equal(game.getSnapshot(),next);assert.equal(next.round,2);game.dispose();
}
die.root.traverse(o=>{if(o.isMesh){assert.ok(geometryIds.has(o.geometry.uuid));assert.ok(materialIds.has(o.material.uuid));}});die.dispose();
const invalid=new DiceAnimationController();assert.equal(invalid.start(0,'bad',0,'standard'),false);assert.equal(invalid.start(7,'bad',0,'standard'),false);
const saved=startGame(initialGame(),['甲','乙']);saved.phase='ROLLING';saved.diceValue=6;const restored=decodeSave({version:3,state:saved}).state;assert.equal(restored.phase,'MOVING');assert.equal(restored.diceValue,6,'reload reuses authoritative result');
for(const event of ALL_GAME_EVENTS)for(const [index] of (event.options??[{}]).entries()){
 const state=startGame(initialGame(),['旅人']);state.phase='EVENT';state.selectedEvent=event;state.players[0]={...state.players[0],money:0,health:100,stress:0};
 const result=chooseEvent(state,event.id,event.options?index:undefined),p=result.players[0];assert.deepEqual(result.eventOutcome,{money:p.money,health:p.health-100,stress:p.stress},'reveal reports actual bounded delta');
 assert.deepEqual(decodeSave({version:3,state:result}).state.eventOutcome,result.eventOutcome,'revealed outcome survives reload without another choice');
}
console.log('PASS: six fixed faces/opposites, exact final orientations, reusable resources, standard/quick/reduced phases, skip, single dice sample, stale/forged/duplicate protection, one movement/event/turn, fallback cancellation and saved-roll recovery.');
