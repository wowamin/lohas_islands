import './register-ts.mjs';
import assert from 'node:assert/strict';
const {BOARD_DATA}=await import('../src/game/board.ts');
const {TILE_FOOTPRINT}=await import('../src/components/District/cityTerrain.ts');
const axes=t=>[[Math.cos(t.rotation),-Math.sin(t.rotation)],[Math.sin(t.rotation),Math.cos(t.rotation)]];
const radius=(t,axis)=>{const [x,z]=axes(t);return Math.abs(axis[0]*x[0]+axis[1]*x[1])*TILE_FOOTPRINT.width/2+Math.abs(axis[0]*z[0]+axis[1]*z[1])*TILE_FOOTPRINT.length/2;};
for(let i=0;i<80;i++)for(let j=i+1;j<80;j++){
 const a=BOARD_DATA[i],b=BOARD_DATA[j],dx=b.position[0]-a.position[0],dz=b.position[2]-a.position[2];
 assert.ok([...axes(a),...axes(b)].some(axis=>Math.abs(dx*axis[0]+dz*axis[1])>=radius(a,axis)+radius(b,axis)-.001),'raised tile footprints do not overlap: '+i+','+j);
}
console.log('PASS: all 3160 pairs of oriented 3D tile footprints are separate, including every bend.');
