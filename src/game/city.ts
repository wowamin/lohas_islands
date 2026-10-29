import { BOARD_DATA } from './board';
// A closed Hamiltonian route: every original tile appears once in the city.
const cells: [number, number][] = [];
for (let x = 0; x < 8; x++) cells.push([x, 0]);
for (let z = 1; z < 5; z++) cells.push([7,z]);
for (let x = 6; x >= 1; x--) {
  const zs = x % 2 === 0 ? [4,3,2,1] : [1,2,3,4];
  zs.forEach(z => cells.push([x,z]));
}
for (let z = 4; z > 0; z--) cells.push([0,z]);
export const CITY_CELLS = cells;
export const cityPosition = (id: number): [number, number, number] => [(cells[id][0]-3.5)*1.8, 0, (cells[id][1]-2)*2];
export const cityPoint = (id: number): [number, number] => {
  const [x,,z] = cityPosition(id);
  return [640 + (x-z)*47, 470 + (x+z)*23];
};
export const CITY_COLORS = { START: '#d78461', LIVING: '#e4b56f', SERVICE: '#6daba5', OPPORTUNITY: '#b39cc5', ACCIDENT: '#d99383', REST: '#8ba776', RESOURCE: '#7da4bd' };
export const DISTRICTS = ['居家生活區', '照顧服務區', '社區共享區', '身心支持區', '友善資源區'];
export const districtOf = (id: number) => DISTRICTS[cells[id][1]];
export const CITY_ROUTE = [...BOARD_DATA.map(t => cityPoint(t.id)), cityPoint(0)].map(p => p.join(',')).join(' ');
