import { create } from 'zustand';
import { createJSONStorage } from 'zustand/middleware';
import { BOARD_SIZE, LEGACY_TO_CURRENT } from './cityLayout';
import { ALL_GAME_EVENTS as EVENT_CARDS } from './eventRegistry';
import type { Player, GameEvent } from './types';

export const SAVE_VERSION=2;
export const AUTO_KEY='long-care-game-save-v2';
export const LEGACY_AUTO_KEY='long-care-game-save-v1';
export type SavedGame={players:Player[];currentPlayerIndex:number;round:number;phase:'SETUP'|'WAITING_ROLL'|'ROLLING'|'MOVING'|'EVENT'|'RESULT';diceValue:number;selectedEvent:GameEvent|null;eventResultText:string|null;eventLesson?:string};
export const useSaveStatus=create<{message:string;blocked:boolean;dismiss:()=>void}>(set=>({message:'',blocked:false,dismiss:()=>set(s=>({message:s.blocked?s.message:''}))}));
const phases=['SETUP','WAITING_ROLL','ROLLING','MOVING','EVENT','RESULT'];
function integer(value:unknown,min:number,max:number){return typeof value==='number'&&Number.isInteger(value)&&value>=min&&value<=max;}
export function decodeSave(envelope:unknown):{version:number;state:SavedGame;migrated:boolean}{
  const input=envelope as {version?:unknown;state?:Partial<SavedGame>};
  if(input?.version!==1&&input?.version!==SAVE_VERSION)throw new Error('無法辨識存檔版本');
  const s=input.state,legacy=input.version===1,size=legacy?LEGACY_TO_CURRENT.length:BOARD_SIZE;
  if(!s||!Array.isArray(s.players)||s.players.length>4||!phases.includes(String(s.phase))||!integer(s.round,1,12)||!integer(s.diceValue,1,6)||!integer(s.currentPlayerIndex,0,Math.max(0,s.players.length-1))||(s.phase!=='SETUP'&&s.players.length<2))throw new Error('存檔狀態無效');
  const players=s.players.map((p,i)=>{
    if(!p||p.id!==i||typeof p.name!=='string'||p.name.length>100||!/^#[0-9a-f]{6}$/i.test(p.color)||!integer(p.position,0,size-1)||!Number.isFinite(p.money)||p.money<0||!Number.isFinite(p.health)||p.health<0||p.health>100||!Number.isFinite(p.stress)||p.stress<0||p.stress>100)throw new Error('玩家資料無效');
    if(p.learnedServices!==undefined&&(!Array.isArray(p.learnedServices)||p.learnedServices.some(k=>!['care','transport','equipment','respite','meal','community'].includes(k))))throw new Error('服務紀錄無效');
    if(p.completedActivities!==undefined&&(!Array.isArray(p.completedActivities)||p.completedActivities.some(k=>!['meal','respite'].includes(k))))throw new Error('任務紀錄無效');
    return {id:p.id,name:p.name,color:p.color,position:legacy?LEGACY_TO_CURRENT[p.position]:p.position,money:p.money,health:p.health,stress:p.stress,learnedServices:p.learnedServices,completedActivities:p.completedActivities};
  });
  const selectedEvent=s.selectedEvent?EVENT_CARDS.find(e=>e.id===s.selectedEvent?.id):null;
  if(s.selectedEvent&&!selectedEvent)throw new Error('未知事件');
  // MOVING has not committed the destination. Replay the same dice, never reroll.
  return {version:SAVE_VERSION,migrated:legacy,state:{players,currentPlayerIndex:s.currentPlayerIndex!,round:s.round!,diceValue:s.diceValue!,phase:s.phase==='ROLLING'?'MOVING':s.phase!,selectedEvent:selectedEvent??null,eventResultText:typeof s.eventResultText==='string'?s.eventResultText:null,eventLesson:typeof s.eventLesson==='string'?s.eventLesson:undefined}};
}
export function backUp(key:string,raw:string){
  const backup=key+'-backup-before-50';
  if(localStorage.getItem(backup)===null)localStorage.setItem(backup,raw);
}
export const gameStorage=createJSONStorage<SavedGame>(()=>({
  getItem(key){
    try{
      const current=localStorage.getItem(key),raw=current??localStorage.getItem(LEGACY_AUTO_KEY);
      if(raw===null)return null;
      const decoded=decodeSave(JSON.parse(raw));
      if(decoded.migrated){
        backUp(current===null?LEGACY_AUTO_KEY:key,raw);
        const upgraded=JSON.stringify({version:SAVE_VERSION,state:decoded.state});
        localStorage.setItem(key,upgraded);
        useSaveStatus.setState({message:'已將 40 格存檔轉換為 50 格；原檔與轉換前備份均已保留。玩家數值、回合與待處理事件不變。',blocked:false});
      }
      return JSON.stringify({version:SAVE_VERSION,state:decoded.state});
    }catch(error){
      useSaveStatus.setState({message:'存檔無法讀取，原資料已保留。目前可暫玩，但不會覆寫自動存檔。請先匯出原始存檔。',blocked:true});
      throw error;
    }
  },
  setItem(key,value){
    if(useSaveStatus.getState().blocked)return;
    try{localStorage.setItem(key,value);}catch{useSaveStatus.setState({message:'瀏覽器無法儲存自動進度，請檢查儲存空間與權限。',blocked:true});}
  },
  removeItem(key){if(!useSaveStatus.getState().blocked)localStorage.removeItem(key);},
}));
