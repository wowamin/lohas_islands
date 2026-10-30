import * as T from 'three';
export function createPawn(color:string) {
  const root=new T.Group();
  const part=(g:T.BufferGeometry,c:string,y:number)=>{const m=new T.Mesh(g,new T.MeshStandardMaterial({color:c,roughness:.85}));m.position.y=y;m.castShadow=true;root.add(m);return m;};
  part(new T.CylinderGeometry(.2,.24,.09,16),'#fff8e5',.06);
  part(new T.CapsuleGeometry(.12,.23,4,8),color,.3);
  part(new T.SphereGeometry(.135,12,8),'#edc7a8',.62);
  const hair=part(new T.SphereGeometry(.14,12,8,0,Math.PI*2,0,Math.PI/2),'#8a7967',.65);hair.position.z=-.015;
  return root;
}
export function createIslandDice(){
  const root=new T.Group();root.position.set(0,1.8,1);root.scale.setScalar(.8);
  root.add(new T.Mesh(new T.BoxGeometry(.7,.7,.7),new T.MeshStandardMaterial({color:'#fff8e6',roughness:.7})));
  const patterns:Record<number,number[][]>={1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],4:[[-1,-1],[-1,1],[1,-1],[1,1]],5:[[-1,-1],[-1,1],[0,0],[1,-1],[1,1]],6:[[-1,-1],[-1,0],[-1,1],[1,-1],[1,0],[1,1]]};
  const faces=new T.Group();root.add(faces);let lastValue=0;
  const pipG=new T.SphereGeometry(.045,8,6),pipM=new T.MeshStandardMaterial({color:'#31594f'});
  function update(value:number,rolling:boolean,dt:number){
    root.visible=true;
    if(rolling){root.rotation.x+=dt*9;root.rotation.z+=dt*7;root.rotation.y+=dt*5;}else root.rotation.set(.12,0,.15);
    if(value===lastValue)return;lastValue=value;faces.clear();
    const sides=[[1,6],[2,5],[3,4]].filter(pair=>!pair.includes(value)).flat();
    const numbers=[value,7-value,...sides];
    numbers.forEach((n,i)=>{const face=new T.Group();if(i===1)face.rotation.x=Math.PI;if(i===2)face.rotation.z=Math.PI/2;if(i===3)face.rotation.z=-Math.PI/2;if(i===4)face.rotation.x=Math.PI/2;if(i===5)face.rotation.x=-Math.PI/2;for(const[x,z]of patterns[n]){const pip=new T.Mesh(pipG,pipM);pip.position.set(x*.16,.351,z*.16);pip.scale.y=.15;face.add(pip);}faces.add(face);});
  }
  return {root,update,dispose(){root.traverse(o=>{if(o instanceof T.Mesh&&o.geometry!==pipG){o.geometry.dispose();(o.material as T.Material).dispose();}});pipG.dispose();pipM.dispose();}};
}
