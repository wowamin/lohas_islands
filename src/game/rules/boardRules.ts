import { LEGACY_BOARD_DATA } from '../legacyBoard';
import { BOARD_SIZE, CENTER_DEFINITIONS, FIFTY_TO_CURRENT, FINISH_INDEX, regionFor } from '../mapDefinition';
import type { RegionId } from '../mapDefinition';
import type { ServiceKey, TileType } from '../types';
import { JOURNEY_SCENARIOS } from '../journeyEvents';
import { TRANSITION_STOPS } from '../transitionEvents';
export interface RuleTile {
  id:number;index:number;displayNumber:number;name:string;type:TileType;eventIds:readonly string[];serviceKey?:ServiceKey;
  centerId:RegionId;color:string;previous:number;next:number;educationModule:string;role:string;legacyId:number|null;old50Id:number|null;
  interaction:'landing-event'|'rest'|'start'|'finish';
}
// Logical rules stay independent of Three.js and browser rendering.
export const BOARD_RULES:readonly RuleTile[]=Object.freeze(Array.from({length:BOARD_SIZE},(_,id)=>{
  const region=regionFor(id),oldIndex=FIFTY_TO_CURRENT.indexOf(id),old50Id=oldIndex<0?null:oldIndex;
  const legacyId=old50Id!==null&&old50Id%10<8?Math.floor(old50Id/10)*8+old50Id%10:null;
  const original=legacyId===null?null:LEGACY_BOARD_DATA[legacyId];
  const oldCenter=old50Id===null?null:CENTER_DEFINITIONS[Math.floor(old50Id/10)];
  const scenario=JOURNEY_SCENARIOS.find(s=>s.index===id);
  const transition=TRANSITION_STOPS.find(s=>s.index===id);
  const knowledge=old50Id!==null&&old50Id%10===8;
  const name=original?.name??(scenario?.title??(knowledge?oldCenter!.title.slice(0,2)+'知識花園':oldCenter!.title.slice(0,2)+'出口'));
  const type:TileType=original?.type??(id===FINISH_INDEX?'FINISH':scenario||knowledge?'OPPORTUNITY':'REST');
  return Object.freeze({id,index:id,displayNumber:id+1,name,type,
    eventIds:Object.freeze(original?.eventIds.length?[...original.eventIds]:scenario?[scenario.id]:knowledge?[`education-${oldCenter!.module}`]:transition?[transition.event.id]:[]),
    serviceKey:original?original.serviceKey:scenario?.serviceKey??'community',centerId:region.id,color:region.color,
    previous:Math.max(0,id-1),next:Math.min(FINISH_INDEX,id+1),educationModule:region.module,
    role:id===0?'城市入口':id===FINISH_INDEX?'終點回顧':scenario?'城市互動':type==='REST'?'出口轉場':'庭院步道',legacyId,old50Id,
    interaction:id===0?'start':id===FINISH_INDEX?'finish':type==='REST'?'rest':'landing-event'});
}));
