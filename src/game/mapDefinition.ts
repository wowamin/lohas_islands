export const MAP_ID='lohas-city-80';
export const MAP_VERSION=2;
export const RULES_VERSION=2;
export const BOARD_SIZE=80;
export const START_INDEX=0;
export const FINISH_INDEX=BOARD_SIZE-1;
export const TILES_PER_CENTER=13;
export type CenterId='dahe'|'annan'|'xinying'|'yihe'|'longshan';
export const CENTER_DEFINITIONS=[
  {id:'dahe',title:'大和日照中心',color:'#E8B17B',theme:'健康管理與生活照顧',features:['健康步道','香草花園','休憩涼亭'],module:'C'},
  {id:'annan',title:'安南日照中心',color:'#8BCAD8',theme:'社區參與與社交活動',features:['社區交流廣場','戶外桌椅','社區市集'],module:'A'},
  {id:'xinying',title:'新營日照中心',color:'#A8C7A0',theme:'認知訓練與懷舊活動',features:['記憶花園','懷舊小巷','回憶展示牆'],module:'B'},
  {id:'yihe',title:'義合日照中心',color:'#F3B7C7',theme:'復能運動與生活自立',features:['復能步道','平衡訓練區','無障礙活動空間'],module:'E'},
  {id:'longshan',title:'龍山日照中心',color:'#C9B5DF',theme:'藝術創作與身心療癒',features:['藝術花園','戶外畫架','音樂休憩區'],module:'F'},
] as const;
export type RegionId=CenterId|'entrance'|'finish';
export const REGIONS=[
  {id:'entrance',title:'城市入口',start:0,end:9,color:'#F8F2E7',module:'A'},
  ...CENTER_DEFINITIONS.map((c,i)=>({...c,start:10+i*TILES_PER_CENTER,end:22+i*TILES_PER_CENTER})),
  {id:'finish',title:'終點園區',start:75,end:79,color:'#d8bb79',module:'F'},
] as const;
export const regionFor=(index:number)=>{
  const region=REGIONS.find(r=>index>=r.start&&index<=r.end);
  if(!Number.isInteger(index)||!region)throw new Error('棋盤索引必須為 0–79');
  return region;
};
export const FIFTY_TO_CURRENT=Object.freeze(Array.from({length:50},(_,i)=>i===0?START_INDEX:10+Math.floor(i/10)*TILES_PER_CENTER+i%10));
export const LEGACY_TO_CURRENT=Object.freeze(Array.from({length:40},(_,i)=>FIFTY_TO_CURRENT[Math.floor(i/8)*10+i%8]));
