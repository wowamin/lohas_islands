import * as T from 'three';
export { createIslandDice } from './diceModel';
export function createPawn(color:string) {
  const root=new T.Group();
  const part=(g:T.BufferGeometry,c:string,y:number)=>{const m=new T.Mesh(g,new T.MeshStandardMaterial({color:c,roughness:.85}));m.position.y=y;m.castShadow=true;root.add(m);return m;};
  part(new T.CylinderGeometry(.2,.24,.09,16),'#fff8e5',.06);
  part(new T.CapsuleGeometry(.12,.23,4,8),color,.3);
  part(new T.SphereGeometry(.135,12,8),'#edc7a8',.62);
  const hair=part(new T.SphereGeometry(.14,12,8,0,Math.PI*2,0,Math.PI/2),'#8a7967',.65);hair.position.z=-.015;
  return root;
}
