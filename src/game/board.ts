import type { ServiceKey, TileType } from './types';
import { LEGACY_BOARD_DATA } from './legacyBoard';
import { BOARD_SIZE, CENTERS, LEGACY_TO_CURRENT, routePosition } from './cityLayout';
export { BOARD_SIZE } from './cityLayout';
export interface BoardTile {
  id:number; index:number; name:string; type:TileType; eventIds:string[]; serviceKey?:ServiceKey;
  centerId:typeof CENTERS[number]['id']; color:string; position:[number,number,number];
  previous:number; next:number; educationModule:string; role:string; legacyId:number|null;
}
const ROLES=['入口','庭院步道','活動區','活動區','休憩區','庭院活動','生活事件','機會探索','知識格','出口轉場'];
export const BOARD_DATA:BoardTile[]=Array.from({length:BOARD_SIZE},(_,id)=>{
  const center=CENTERS[Math.floor(id/10)],local=id%10;
  const legacyId=local<8?center.index*8+local:null;
  const original=legacyId===null?null:LEGACY_BOARD_DATA[legacyId];
  return {id,index:id,name:original?.name??(local===8?center.title.slice(0,2)+'知識花園':center.title.slice(0,2)+'出口'),
    type:original?.type??(local===8?'OPPORTUNITY':'REST'),eventIds:original?[...original.eventIds]:local===8?[`education-${center.module}`]:[],serviceKey:original?original.serviceKey:'community',
    centerId:center.id,color:center.color,position:routePosition(id),previous:(id+BOARD_SIZE-1)%BOARD_SIZE,next:(id+1)%BOARD_SIZE,
    educationModule:center.module,role:ROLES[local],legacyId};
});
export { LEGACY_TO_CURRENT };
