import { BOARD_DATA } from './board';
import { CENTERS } from './cityLayout';
export const CITY_CELLS = BOARD_DATA.map(t=>[t.position[0],t.position[2]] as [number,number]);
export const cityPosition = (id:number):[number,number,number] => [...BOARD_DATA[id].position];
export const cityPoint = (id:number):[number,number] => {
  const [x,,z]=cityPosition(id);
  return [640+(x-z)*23,440+(x+z)*14];
};
export const CITY_COLORS = { START:'#d78461',LIVING:'#e4b56f',SERVICE:'#6daba5',OPPORTUNITY:'#b39cc5',ACCIDENT:'#d99383',REST:'#8ba776',RESOURCE:'#7da4bd' };
export const DISTRICTS = CENTERS.map(c=>c.title);
export const districtOf = (id:number) => CENTERS[Math.floor(id/10)].title;
export const CITY_ROUTE = [...BOARD_DATA.map(t=>cityPoint(t.id)),cityPoint(0)].map(p=>p.join(',')).join(' ');
