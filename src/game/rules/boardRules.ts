import { LEGACY_BOARD_DATA } from '../legacyBoard';
import { BOARD_SIZE, CENTER_DEFINITIONS } from '../mapDefinition';
import type { CenterId } from '../mapDefinition';
import type { ServiceKey, TileType } from '../types';
export interface RuleTile {
  id:number;index:number;name:string;type:TileType;eventIds:string[];serviceKey?:ServiceKey;
  centerId:CenterId;color:string;previous:number;next:number;educationModule:string;role:string;legacyId:number|null;
}
const ROLES=['入口','庭院步道','活動區','活動區','休憩區','庭院活動','生活事件','機會探索','知識格','出口轉場'];
// No world coordinates: a server can import this module without Three.js or a browser.
export const BOARD_RULES:RuleTile[]=Array.from({length:BOARD_SIZE},(_,id)=>{
  const center=CENTER_DEFINITIONS[Math.floor(id/10)],local=id%10;
  const legacyId=local<8?Math.floor(id/10)*8+local:null;
  const original=legacyId===null?null:LEGACY_BOARD_DATA[legacyId];
  return {id,index:id,name:original?.name??(local===8?center.title.slice(0,2)+'知識花園':center.title.slice(0,2)+'出口'),
    type:original?.type??(local===8?'OPPORTUNITY':'REST'),eventIds:original?[...original.eventIds]:local===8?[`education-${center.module}`]:[],serviceKey:original?original.serviceKey:'community',
    centerId:center.id,color:center.color,previous:(id+BOARD_SIZE-1)%BOARD_SIZE,next:(id+1)%BOARD_SIZE,educationModule:center.module,role:ROLES[local],legacyId};
});
