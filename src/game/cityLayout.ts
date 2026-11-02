import { BOARD_SIZE, CENTER_DEFINITIONS, TILES_PER_CENTER, FINISH_INDEX } from './mapDefinition';
export { BOARD_SIZE, CENTER_DEFINITIONS, TILES_PER_CENTER, LEGACY_TO_CURRENT, MAP_ID, MAP_VERSION } from './mapDefinition';
export type { CenterId } from './mapDefinition';
export const CENTERS = CENTER_DEFINITIONS.map((c,index)=>{
  const angle=-Math.PI/2-index*Math.PI*2/5;
  return {...c,index,angle,rotation:angle+Math.PI,position:[Math.sin(angle)*10.5,Math.cos(angle)*10.5] as [number,number],start:10+index*TILES_PER_CENTER,end:22+index*TILES_PER_CENTER};
});
const anchors:readonly (readonly [number,number])[]=[[-4.5,.3],[-3.7,1.7],[-2.6,2.8],[-1.4,3.5],[0,3.7],[1.4,3.5],[2.6,2.8],[3.5,1.9],[4,1],[4.5,.3]];
function samplePolyline(points:readonly (readonly [number,number])[],count:number){
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
  const total=lengths.reduce((a,b)=>a+b,0);
  return Array.from({length:count},(_,i):readonly [number,number]=>{
    let distance=total*i/(count-1),segment=0;
    while(segment<lengths.length-1&&distance>lengths[segment])distance-=lengths[segment++];
    const a=points[segment],b=points[segment+1],t=distance/lengths[segment];
    return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  });
}
export const COURTYARD_ROUTE=Object.freeze(samplePolyline(anchors,TILES_PER_CENTER));
export function centerWorld(center:typeof CENTERS[number],x:number,z:number,y=.24):[number,number,number]{
  const cos=Math.cos(center.rotation),sin=Math.sin(center.rotation);
  return [center.position[0]+cos*x+sin*z,y,center.position[1]-sin*x+cos*z];
}
const courtyard=CENTERS.flatMap(c=>COURTYARD_ROUTE.map(([x,z])=>centerWorld(c,x,z)));
const first=courtyard[0],last=courtyard[courtyard.length-1];
const entranceCurve=Array.from({length:61},(_,i):readonly [number,number]=>{const t=i/60,u=1-t;return[u*u*u*-3+3*u*u*t*-4+3*u*t*t*-12.7+t*t*t*first[0],u*u*u*1.4+3*u*u*t*5.5+3*u*t*t*7+t*t*t*first[2]];});
const entrance=samplePolyline(entranceCurve,11).slice(0,-1);
const finish=samplePolyline([[last[0],last[2]],[-9.1,7.5],[-8.8,6.5],[-6.5,5.8],[-2.4,4.8],[1.5,3.0]],6).slice(1);
// Only this module defines world coordinates; all consumers use BOARD_DATA's join.
const route=Object.freeze([...entrance.map(([x,z])=>[x,.24,z] as const),...courtyard,...finish.map(([x,z])=>[x,.24,z] as const)].map(p=>Object.freeze(p)));
export function routePosition(index:number):[number,number,number]{
  if(!Number.isInteger(index)||index<0||index>=BOARD_SIZE)throw new Error('棋盤索引必須為 0–79');
  return [...route[index]];
}
export function routeHeading(index:number){const a=routePosition(index),b=routePosition(index===FINISH_INDEX?index-1:index+1);return Math.atan2(b[0]-a[0],b[2]-a[2])+(index===FINISH_INDEX?Math.PI:0);}
export const CITY_SEED=3080;
export function seededRandom(seed=CITY_SEED){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
