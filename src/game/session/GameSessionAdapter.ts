import type { CommandResult, GameCommand, GameSnapshot } from '../rules/model';
export interface SessionInfo {id:string;kind:'local'|'online';mapId:string;mapVersion:number;rulesVersion:number}
export type SnapshotListener=(snapshot:GameSnapshot,previous:GameSnapshot)=>void;
export interface GameSessionAdapter {
  getInfo():SessionInfo;
  getSnapshot():GameSnapshot;
  subscribe(listener:SnapshotListener):()=>void;
  dispatch(command:GameCommand):CommandResult|Promise<CommandResult>;
  save():void|Promise<void>;
  load():void|Promise<void>;
  dispose():void;
}
