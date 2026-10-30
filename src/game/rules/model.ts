import type { GameEvent, Player } from '../types';
import type { CharacterId } from '../characters';
export type GamePhase='SETUP'|'WAITING_ROLL'|'ROLLING'|'MOVING'|'EVENT'|'RESULT';
export interface GameSnapshot {
  mapId:string;mapVersion:number;rulesVersion:number;revision:number;
  players:Player[];currentPlayerIndex:number;round:number;phase:GamePhase;diceValue:number;
  selectedEvent:GameEvent|null;eventResultText:string|null;eventLesson?:string;
  eventOutcome?:{money:number;health:number;stress:number};
}
// Intents only. A command never contains a dice result, balance, world coordinate or destination.
export type GameCommand=(
  {type:'START_GAME';names:string[];characterIds?:CharacterId[]}|{type:'ROLL_DICE'}|{type:'COMPLETE_ROLL'}|{type:'COMPLETE_MOVEMENT'}|
  {type:'CHOOSE_EVENT';eventId:string;optionIndex?:number}|{type:'ADVANCE_TURN'}|{type:'RESET_GAME'}
) & {expectedRevision?:number};
export interface CommandResult {accepted:boolean;revision:number;reason?:string}
