import { BOARD_SIZE, CENTER_DEFINITIONS, TILES_PER_CENTER } from './mapDefinition';
export { BOARD_SIZE, CENTER_DEFINITIONS, TILES_PER_CENTER, LEGACY_TO_CURRENT, MAP_ID, MAP_VERSION } from './mapDefinition';
export type { CenterId } from './mapDefinition';
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
export const CITY_SEED=3050;
export function seededRandom(seed= CITY_SEED){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
