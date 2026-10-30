export const MAP_ID='lohas-city-50';
export const MAP_VERSION=1;
export const RULES_VERSION=1;
export const BOARD_SIZE=50;
export const TILES_PER_CENTER=10;
export type CenterId='dahe'|'annan'|'xinying'|'yihe'|'longshan';
export const CENTER_DEFINITIONS=[
  {id:'dahe',title:'大和日照中心',color:'#A9CCE2',theme:'健康管理與生活照顧',features:['健康步道','香草花園','休憩涼亭'],module:'C'},
  {id:'annan',title:'安南日照中心',color:'#C8B9D9',theme:'社區參與與社交活動',features:['社區交流廣場','戶外桌椅','社區市集'],module:'A'},
  {id:'xinying',title:'新營日照中心',color:'#E8B29B',theme:'認知訓練與懷舊活動',features:['記憶花園','懷舊小巷','回憶展示牆'],module:'B'},
  {id:'yihe',title:'義合日照中心',color:'#F1D69C',theme:'復能運動與生活自立',features:['復能步道','平衡訓練區','無障礙活動空間'],module:'E'},
  {id:'longshan',title:'龍山日照中心',color:'#A9C8A2',theme:'藝術創作與身心療癒',features:['藝術花園','戶外畫架','音樂休憩區'],module:'F'},
] as const;
export const LEGACY_TO_CURRENT=Array.from({length:40},(_,i)=>Math.floor(i/8)*TILES_PER_CENTER+i%8);
