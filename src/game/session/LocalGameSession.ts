import type { GameSessionAdapter, SnapshotListener } from './GameSessionAdapter';
import type { GameSnapshot, GameCommand, CommandResult } from '../rules/model';
import { initialGame, startGame, rollDie, beginRoll, finishRoll, completeMovement, chooseEvent, advanceTurn, resetGame } from '../rules/engine';
import type { GameSaveRepository } from '../storage/LocalSaveRepository';
import { decodeSave, SAVE_VERSION } from '../storage/saveCodec';

export interface SessionScheduler {set(callback:()=>void,delay:number):unknown;clear(handle:unknown):void}
const scheduler:SessionScheduler={set:(callback,delay)=>setTimeout(callback,delay),clear:handle=>clearTimeout(handle as ReturnType<typeof setTimeout>)};
const commandKeys:Record<GameCommand['type'],string[]>={START_GAME:['names','characterIds'],ROLL_DICE:[],COMPLETE_ROLL:[],COMPLETE_MOVEMENT:[],CHOOSE_EVENT:['eventId','optionIndex'],ADVANCE_TURN:[],RESET_GAME:[]};
function immutable(snapshot:GameSnapshot):GameSnapshot{
  const copy=structuredClone(snapshot);
  const freeze=(value:unknown)=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);Object.values(value).forEach(freeze);}};freeze(copy);return copy;
}
export class LocalGameSession implements GameSessionAdapter {
  private current:GameSnapshot;private listeners=new Set<SnapshotListener>();private timer:unknown;
  private disposed=false;private repository?:GameSaveRepository;private random:()=>number;private clock:SessionScheduler;private id:string;
  constructor(options:{id:string;repository?:GameSaveRepository;initialSnapshot?:GameSnapshot;random?:()=>number;scheduler?:SessionScheduler}){
    this.id=options.id;this.repository=options.repository;this.random=options.random??Math.random;this.clock=options.scheduler??scheduler;
    const saved=options.initialSnapshot?decodeSave({version:SAVE_VERSION,state:options.initialSnapshot}).state:this.repository?.loadAuto();
    this.current=immutable(saved??initialGame());
  }
  getInfo(){return {id:this.id,kind:'local' as const,mapId:this.current.mapId,mapVersion:this.current.mapVersion,rulesVersion:this.current.rulesVersion};}
  getSnapshot(){return this.current;}
  subscribe(listener:SnapshotListener){this.listeners.add(listener);return()=>{this.listeners.delete(listener);};}
  private cancelTimer(){if(this.timer!==undefined){this.clock.clear(this.timer);this.timer=undefined;}}
  private commit(next:GameSnapshot){
    if(next===this.current)return false;
    const previous=this.current;this.current=immutable(next);this.repository?.saveAuto(this.current);
    for(const listener of this.listeners)listener(this.current,previous);return true;
  }
  dispatch(command:GameCommand):CommandResult{
    const reject=(reason:string)=>({accepted:false,revision:this.current.revision,reason});
    if(this.disposed)return reject('Session 已關閉');
    if(!command||!Object.hasOwn(commandKeys,command.type))return reject('未知操作');
    const keys=commandKeys[command.type];if(Object.keys(command).some(key=>!['type','expectedRevision',...keys].includes(key)))return reject('操作不能指定骰數、金錢或位置');
    if(command.expectedRevision!==undefined&&command.expectedRevision!==this.current.revision)return reject('操作版本已過期');
    let next=this.current;
    switch(command.type){
      case 'START_GAME':next=startGame(this.current,command.names,command.characterIds);if(next!==this.current)this.cancelTimer();break;
      case 'ROLL_DICE':{
        if(this.current.phase!=='WAITING_ROLL')return reject('目前不可擲骰');
        next=beginRoll(this.current,rollDie(this.random()));
        break;
      }
      case 'COMPLETE_MOVEMENT':if(this.current.phase==='MOVING')next=completeMovement(this.current,this.random());break;
      case 'COMPLETE_ROLL':next=finishRoll(this.current);if(next!==this.current)this.cancelTimer();break;
      case 'CHOOSE_EVENT':next=chooseEvent(this.current,command.eventId,command.optionIndex);break;
      case 'ADVANCE_TURN':next=advanceTurn(this.current);break;
      case 'RESET_GAME':this.cancelTimer();next=resetGame(this.current);break;
    }
    const accepted=this.commit(next);
    if(accepted&&command.type==='ROLL_DICE'){
      const revision=this.current.revision;
      this.timer=this.clock.set(()=>{this.timer=undefined;if(!this.disposed&&this.current.phase==='ROLLING'&&this.current.revision===revision)this.commit(finishRoll(this.current));},1700);
    }
    return {accepted,revision:this.current.revision,...(!accepted?{reason:'目前階段不接受此操作'}:{})};
  }
  save(){if(this.disposed||!this.repository)throw new Error('無法儲存此 Session');this.repository.saveManual(this.current);}
  load(){
    if(this.disposed||!this.repository||this.current.phase!=='WAITING_ROLL')throw new Error('目前不可讀檔');
    const saved=this.repository.loadManual();this.cancelTimer();this.commit({...saved,revision:Math.max(this.current.revision,saved.revision)+1});
  }
  dispose(){this.disposed=true;this.cancelTimer();this.listeners.clear();}
}
