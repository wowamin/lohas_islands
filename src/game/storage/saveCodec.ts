import { BOARD_SIZE, LEGACY_TO_CURRENT, MAP_ID, MAP_VERSION, RULES_VERSION } from '../mapDefinition';
import { ALL_GAME_EVENTS } from '../eventRegistry';
import type { GameSnapshot } from '../rules/model';
export const SAVE_VERSION=3;
export const AUTO_KEY='long-care-game-save-v3';
export const MANUAL_KEY='lohas-manual-save-v3';
export const LEGACY_AUTO_KEYS=['long-care-game-save-v2','long-care-game-save-v1'];
export const LEGACY_MANUAL_KEYS=['lohas-manual-save-v2','lohas-manual-save-v1'];
export const RECENT_AUTO_KEY='lohas-recent-session-v3';
export const RECENT_MANUAL_KEY='lohas-recent-manual-v3';
const phases=['SETUP','WAITING_ROLL','ROLLING','MOVING','EVENT','RESULT'];
const integer=(v:unknown,min:number,max:number)=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max;
export function decodeSave(envelope:unknown):{version:number;state:GameSnapshot;migrated:boolean}{
  const input=envelope as {version?:unknown;state?:Partial<GameSnapshot>};
  if(input?.version!==1&&input?.version!==2&&input?.version!==SAVE_VERSION)throw new Error('無法辨識存檔版本');
  const s=input.state,oldBoard=input.version===1,size=oldBoard?LEGACY_TO_CURRENT.length:BOARD_SIZE;
  if(!s||!Array.isArray(s.players)||s.players.length>4||!phases.includes(String(s.phase))||!integer(s.round,1,12)||!integer(s.diceValue,1,6)||!integer(s.currentPlayerIndex,0,Math.max(0,s.players.length-1))||(s.phase!=='SETUP'&&s.players.length<(input.version===3?1:2)))throw new Error('存檔狀態無效');
  if(input.version===3&&(s.mapId!==MAP_ID||s.mapVersion!==MAP_VERSION||s.rulesVersion!==RULES_VERSION||!integer(s.revision,0,Number.MAX_SAFE_INTEGER)))throw new Error('地圖或規則版本不相容');
  const players=s.players.map((p,i)=>{
    if(!p||p.id!==i||typeof p.name!=='string'||p.name.length>100||!/^#[0-9a-f]{6}$/i.test(p.color)||!integer(p.position,0,size-1)||!Number.isFinite(p.money)||p.money<0||!Number.isFinite(p.health)||p.health<0||p.health>100||!Number.isFinite(p.stress)||p.stress<0||p.stress>100)throw new Error('玩家資料無效');
    if(p.learnedServices!==undefined&&(!Array.isArray(p.learnedServices)||p.learnedServices.some(k=>!['care','transport','equipment','respite','meal','community'].includes(k))))throw new Error('服務紀錄無效');
    if(p.completedActivities!==undefined&&(!Array.isArray(p.completedActivities)||p.completedActivities.some(k=>!['meal','respite'].includes(k))))throw new Error('任務紀錄無效');
    return {id:p.id,name:p.name,color:p.color,position:oldBoard?LEGACY_TO_CURRENT[p.position]:p.position,money:p.money,health:p.health,stress:p.stress,learnedServices:p.learnedServices,completedActivities:p.completedActivities};
  });
  const event=s.selectedEvent?ALL_GAME_EVENTS.find(e=>e.id===s.selectedEvent?.id):null;
  if(s.selectedEvent&&!event)throw new Error('未知事件');
  return {version:SAVE_VERSION,migrated:input.version!==SAVE_VERSION,state:{mapId:MAP_ID,mapVersion:MAP_VERSION,rulesVersion:RULES_VERSION,revision:input.version===3?s.revision!:0,
    players,currentPlayerIndex:s.currentPlayerIndex!,round:s.round!,diceValue:s.diceValue!,phase:s.phase==='ROLLING'?'MOVING':s.phase!,selectedEvent:event??null,eventResultText:typeof s.eventResultText==='string'?s.eventResultText:null,eventLesson:typeof s.eventLesson==='string'?s.eventLesson:undefined}};
}
export function encodeSave(snapshot:GameSnapshot){return JSON.stringify({version:SAVE_VERSION,state:snapshot});}
