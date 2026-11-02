import { CENTER_DEFINITIONS, FIFTY_TO_CURRENT, START_INDEX } from './mapDefinition';
import type { GameEvent } from './types';

// Explicit event references for the original passive stops. These do not change balances
// or add a choice step to the existing start/rest interaction.
export const TRANSITION_STOPS:readonly {index:number;event:GameEvent}[]=[
  {index:START_INDEX,event:{id:'city-entrance',title:'樂活起點',category:'START',description:'從城市入口出發，沿步道探索五間日照中心。',effect:{},result:'旅程開始，金錢、健康與壓力不變。'}},
  ...CENTER_DEFINITIONS.map((center,i)=>{
    const title=center.title.slice(0,2)+'出口';
    return {index:FIFTY_TO_CURRENT[i*10+9],event:{id:`city-rest-${center.id}`,title,category:'REST' as const,description:'在庭院出口整理旅程，準備走向下一區。',effect:{},result:`${title}：這是教育／轉場停靠點，金錢、健康與壓力不變。可在回合間開啟知識圖鑑。`}};
  }),
];
export const TRANSITION_EVENTS=TRANSITION_STOPS.map(stop=>stop.event);
