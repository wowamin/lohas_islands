export const BOARD_SIZE = 50;
export const TILES_PER_CENTER = 10;
export type CenterId = 'dahe'|'annan'|'xinying'|'yihe'|'longshan';
export const CENTER_DEFINITIONS = [
  {id:'dahe',title:'大和日照中心',color:'#A9CCE2',theme:'健康管理與生活照顧',features:['健康步道','香草花園','休憩涼亭'],module:'C'},
  {id:'annan',title:'安南日照中心',color:'#C8B9D9',theme:'社區參與與社交活動',features:['社區交流廣場','戶外桌椅','社區市集'],module:'A'},
  {id:'xinying',title:'新營日照中心',color:'#E8B29B',theme:'認知訓練與懷舊活動',features:['記憶花園','懷舊小巷','回憶展示牆'],module:'B'},
  {id:'yihe',title:'義合日照中心',color:'#F1D69C',theme:'復能運動與生活自立',features:['復能步道','平衡訓練區','無障礙活動空間'],module:'E'},
  {id:'longshan',title:'龍山日照中心',color:'#A9C8A2',theme:'藝術創作與身心療癒',features:['藝術花園','戶外畫架','音樂休憩區'],module:'F'},
] as const;
export const CENTERS = CENTER_DEFINITIONS.map((c,index)=>{
  const angle=-Math.PI/2-index*Math.PI*2/5;
  return {...c,index,angle,rotation:angle+Math.PI,position:[Math.sin(angle)*10.5,Math.cos(angle)*10.5] as [number,number],start:index*TILES_PER_CENTER,end:(index+1)*TILES_PER_CENTER-1};
});
export const COURTYARD_ROUTE: readonly (readonly [number,number])[] = [
  [-4.5,.3],[-3.7,1.7],[-2.6,2.8],[-1.4,3.5],[0,3.7],[1.4,3.5],[2.6,2.8],[3.5,1.9],[4,1],[4.5,.3],
];
export function centerWorld(center:typeof CENTERS[number],x:number,z:number,y=.24):[number,number,number]{
  const cos=Math.cos(center.rotation),sin=Math.sin(center.rotation);
  return [center.position[0]+cos*x+sin*z,y,center.position[1]-sin*x+cos*z];
}
export function routePosition(index:number):[number,number,number]{
  if(!Number.isInteger(index)||index<0||index>=BOARD_SIZE)throw new Error('棋盤索引必須為 0–49');
  const center=CENTERS[Math.floor(index/TILES_PER_CENTER)];
  const [x,z]=COURTYARD_ROUTE[index%TILES_PER_CENTER];
  return centerWorld(center,x,z);
}
export const LEGACY_TO_CURRENT = Array.from({length:40},(_,i)=>Math.floor(i/8)*TILES_PER_CENTER+i%8);
export const CITY_SEED=3050;
export function seededRandom(seed= CITY_SEED){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
