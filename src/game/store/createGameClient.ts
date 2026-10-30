import { create } from 'zustand';
import type { GameSnapshot } from '../rules/model';
import type { GameSessionAdapter } from '../session/GameSessionAdapter';
import { MAP_ID, MAP_VERSION, RULES_VERSION } from '../mapDefinition';
export interface GameActions {
  sessionId:string;startGame:(names:string[])=>void;rollDice:()=>void;movePlayer:(revision?:number)=>void;
  completeRoll:(revision:number)=>void;
  chooseEvent:(eventId:string,optionIndex?:number,revision?:number)=>void;advanceFromResult:()=>void;resetGame:()=>void;
}
export type GameClientState=GameSnapshot&GameActions;
function compatible(adapter:GameSessionAdapter){const info=adapter.getInfo();if(info.mapId!==MAP_ID||info.mapVersion!==MAP_VERSION||info.rulesVersion!==RULES_VERSION)throw new Error('Session 與城市地圖版本不相容');}
export function createGameClient(initialAdapter:GameSessionAdapter){
  compatible(initialAdapter);let adapter=initialAdapter;
  const useStore=create<GameClientState>(()=>({...adapter.getSnapshot(),sessionId:adapter.getInfo().id,
    startGame:names=>{void adapter.dispatch({type:'START_GAME',names});},
    rollDice:()=>{void adapter.dispatch({type:'ROLL_DICE',expectedRevision:adapter.getSnapshot().revision});},
    completeRoll:revision=>{void adapter.dispatch({type:'COMPLETE_ROLL',expectedRevision:revision});},
    movePlayer:revision=>{void adapter.dispatch({type:'COMPLETE_MOVEMENT',expectedRevision:revision??adapter.getSnapshot().revision});},
    chooseEvent:(eventId,optionIndex,revision)=>{void adapter.dispatch({type:'CHOOSE_EVENT',eventId,optionIndex,expectedRevision:revision??adapter.getSnapshot().revision});},
    advanceFromResult:()=>{void adapter.dispatch({type:'ADVANCE_TURN',expectedRevision:adapter.getSnapshot().revision});},
    resetGame:()=>{void adapter.dispatch({type:'RESET_GAME'});},
  }));
  const listen=()=>adapter.subscribe(snapshot=>useStore.setState({...snapshot,sessionId:adapter.getInfo().id}));
  let unsubscribe=listen();
  return {useStore,getAdapter:()=>adapter,
    setAdapter(next:GameSessionAdapter){compatible(next);if(next===adapter)return;unsubscribe();adapter.dispose();adapter=next;useStore.setState({...adapter.getSnapshot(),sessionId:adapter.getInfo().id});unsubscribe=listen();},
    dispose(){unsubscribe();adapter.dispose();},
  };
}
