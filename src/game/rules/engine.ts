import { BOARD_SIZE, MAP_ID, MAP_VERSION, RULES_VERSION } from '../mapDefinition';
import { BOARD_RULES } from './boardRules';
import { eventsForTile, ALL_GAME_EVENTS } from '../eventRegistry';
import type { GameSnapshot } from './model';
import type { GameEvent, Player } from '../types';

export function initialGame():GameSnapshot{return {mapId:MAP_ID,mapVersion:MAP_VERSION,rulesVersion:RULES_VERSION,revision:0,players:[],currentPlayerIndex:0,round:1,phase:'SETUP',diceValue:1,selectedEvent:null,eventResultText:null,eventLesson:undefined,eventOutcome:undefined};}
const changed=(s:GameSnapshot,patch:Partial<GameSnapshot>):GameSnapshot=>({...s,...patch,revision:s.revision+1});
export function startGame(s:GameSnapshot,names:string[]):GameSnapshot{
  if(!Array.isArray(names)||names.length<1||names.length>4||names.some(n=>typeof n!=='string'||n.length>100))return s;
  const colors=['#D88C65','#89B5AD','#D5B86A','#58463B'];
  const players=names.map((name,id)=>({id,name:name.trim()||`玩家 ${id+1}`,color:colors[id],position:0,money:10000,health:80,stress:20,learnedServices:[]}));
  return {...initialGame(),players,phase:'WAITING_ROLL',revision:s.revision+1};
}
export function rollDie(sample:number):number{
  if(!Number.isFinite(sample)||sample<0||sample>=1)throw new Error('隨機樣本必須介於 0（含）與 1（不含）');
  return Math.floor(sample*6)+1;
}
export function beginRoll(s:GameSnapshot,diceValue:number):GameSnapshot{
  if(s.phase!=='WAITING_ROLL'||!Number.isInteger(diceValue)||diceValue<1||diceValue>6)return s;
  return changed(s,{phase:'ROLLING',diceValue});
}
export const finishRoll=(s:GameSnapshot):GameSnapshot=>s.phase==='ROLLING'?changed(s,{phase:'MOVING'}):s;
export function movement(position:number,steps:number){
  if(!Number.isInteger(position)||position<0||position>=BOARD_SIZE||!Number.isInteger(steps)||steps<1||steps>6)throw new Error('移動參數無效');
  return {position:(position+steps)%BOARD_SIZE,startReward:position+steps>=BOARD_SIZE?1000:0};
}
export function selectLandingEvent(position:number,sample:number):GameEvent|null{
  if(!Number.isInteger(position)||!BOARD_RULES[position])throw new Error('落點無效');
  if(!Number.isFinite(sample)||sample<0||sample>=1)throw new Error('事件隨機樣本無效');
  if(position===0)return null;
  const candidates=eventsForTile(BOARD_RULES[position].eventIds);
  return candidates[Math.floor(sample*candidates.length)]??null;
}
export function completeMovement(s:GameSnapshot,sample:number):GameSnapshot{
  if(s.phase!=='MOVING'||!s.players[s.currentPlayerIndex])return s;
  const current=s.players[s.currentPlayerIndex],result=movement(current.position,s.diceValue);
  const players=s.players.map((p,i)=>i===s.currentPlayerIndex?{...p,position:result.position,money:p.money+result.startReward}:p);
  const event=selectLandingEvent(result.position,sample);
  return changed(s,{players,phase:'EVENT',selectedEvent:event,eventLesson:undefined,eventOutcome:event?undefined:{money:result.startReward,health:0,stress:0},eventResultText:event?null:result.position===0?'回到樂活起點，獲得 1,000 遊戲幣。這是桌遊獎勵，不是實際長照津貼。':`${BOARD_RULES[result.position].name}：這是教育／轉場停靠點，金錢、健康與壓力不變。可在回合間開啟知識圖鑑。`});
}
export function applyEventEffect(p:Player,effect:NonNullable<GameEvent['effect']>,event:GameEvent):Player{
  return {...p,money:Math.max(0,p.money+(effect.money??0)),health:Math.min(100,Math.max(0,p.health+(effect.health??0))),stress:Math.min(100,Math.max(0,p.stress+(effect.stress??0))),
    learnedServices:event.serviceKey?[...new Set([...(p.learnedServices??[]),event.serviceKey])]:(p.learnedServices??[]),
    completedActivities:event.id==='meal'||event.id==='respite'?[...new Set<'meal'|'respite'>([...(p.completedActivities??[]),event.id])]:(p.completedActivities??[])};
}
export function chooseEvent(s:GameSnapshot,eventId:string,optionIndex?:number):GameSnapshot{
  if(s.phase!=='EVENT'||s.selectedEvent?.id!==eventId||!s.players[s.currentPlayerIndex])return s;
  const event=ALL_GAME_EVENTS.find(e=>e.id===eventId);if(!event)return s;
  if(event.options&&(optionIndex===undefined||!Number.isInteger(optionIndex)||optionIndex<0||optionIndex>=event.options.length))return s;
  if(!event.options&&optionIndex!==undefined)return s;
  const option=event.options?.[optionIndex!],effect=option?.effect??event.effect??{},result=option?.result??event.result??'這次事件已完成。';
  const before=s.players[s.currentPlayerIndex],after=applyEventEffect(before,effect,event);
  return changed(s,{players:s.players.map((p,i)=>i===s.currentPlayerIndex?after:p),selectedEvent:null,eventResultText:result,eventLesson:event.lesson,eventOutcome:{money:after.money-before.money,health:after.health-before.health,stress:after.stress-before.stress}});
}
export function advanceTurn(s:GameSnapshot):GameSnapshot{
  if(s.phase!=='EVENT'||s.selectedEvent||s.players.length===0)return s;
  const index=(s.currentPlayerIndex+1)%s.players.length,round=s.round+(index===0?1:0);
  if(round>12)return changed(s,{phase:'RESULT',selectedEvent:null,eventResultText:null,eventOutcome:undefined});
  return changed(s,{currentPlayerIndex:index,round,phase:'WAITING_ROLL',selectedEvent:null,eventResultText:null,eventLesson:undefined,eventOutcome:undefined});
}
export const resetGame=(s:GameSnapshot):GameSnapshot=>({...initialGame(),revision:s.revision+1});
export const scorePlayer=(p:Pick<Player,'money'|'health'|'stress'>)=>p.money/100+p.health*2-p.stress*2;
export const rankPlayers=(players:Player[])=>[...players].sort((a,b)=>scorePlayer(b)-scorePlayer(a));
