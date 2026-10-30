import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { diceHeight } from '../../game/dice/DiceAnimationController';
import type { DiceFrame } from '../../game/dice/DiceAnimationController';

export const DICE_PATTERNS:Readonly<Record<number,readonly (readonly [number,number])[]>>={
  1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],
  4:[[-1,-1],[-1,1],[1,-1],[1,1]],5:[[-1,-1],[-1,1],[0,0],[1,-1],[1,1]],
  6:[[-1,-1],[-1,0],[-1,1],[1,-1],[1,0],[1,1]],
};
// Fixed physical die: opposite sides always sum to seven.
export const DICE_NORMALS:Readonly<Record<number,readonly [number,number,number]>>={1:[0,1,0],6:[0,-1,0],2:[0,0,1],5:[0,0,-1],3:[1,0,0],4:[-1,0,0]};
const UP=new T.Vector3(0,1,0);
export function diceResultQuaternion(value:number){return new T.Quaternion().setFromUnitVectors(new T.Vector3(...DICE_NORMALS[value]),UP);}
export function createIslandDice(){
  const root=new T.Group();root.name='HealingDice';root.position.set(0,.12,4.2);root.scale.setScalar(1.3);
  const body=new T.Group();body.name='FixedSixFaces';root.add(body);
  const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();
  const g=<G extends T.BufferGeometry>(shape:G)=>{geometries.add(shape);return shape;};
  const m=<M extends T.Material>(material:M)=>{materials.add(material);return material;};
  const cube=new T.Mesh(g(new RoundedBoxGeometry(1,1,1,2,.1)),m(new T.MeshStandardMaterial({color:'#fff4df',roughness:.76})));cube.castShadow=true;body.add(cube);
  const pipGeometry=g(new T.SphereGeometry(.064,8,6)),pipMaterial=m(new T.MeshStandardMaterial({color:'#234c3c',roughness:.85}));
  for(const value of [1,2,3,4,5,6]){
    const face=new T.Group();face.name='face-'+value;face.userData.value=value;face.userData.normal=DICE_NORMALS[value];face.quaternion.setFromUnitVectors(UP,new T.Vector3(...DICE_NORMALS[value]));
    for(const[x,z] of DICE_PATTERNS[value]){const pip=new T.Mesh(pipGeometry,pipMaterial);pip.position.set(x*.23,.497,z*.23);pip.scale.y=.12;face.add(pip);}
    body.add(face);
  }
  // Soft radial contact shadow is made once; independent of GPU shadow quality.
  const size=32,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const radius=Math.hypot((x+.5)/size*2-1,(y+.5)/size*2-1),i=(y*size+x)*4;data[i]=35;data[i+1]=62;data[i+2]=48;data[i+3]=Math.round(Math.max(0,1-radius)**2*100);}
  const texture=new T.DataTexture(data,size,size);texture.needsUpdate=true;
  const shadowMaterial=m(new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));
  const shadow=new T.Mesh(g(new T.PlaneGeometry(2.3,2.3)),shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.y=.002;root.add(shadow);
  const ringMaterial=m(new T.MeshBasicMaterial({color:'#d8ddb1',transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}));
  const ring=new T.Mesh(g(new T.RingGeometry(.63,.71,32)),ringMaterial);ring.rotation.x=-Math.PI/2;ring.position.y=.01;root.add(ring);
  const starShape=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?.042:.095;if(i===0)starShape.moveTo(Math.cos(a)*r,Math.sin(a)*r);else starShape.lineTo(Math.cos(a)*r,Math.sin(a)*r);}starShape.closePath();
  const starMaterial=m(new T.MeshBasicMaterial({color:'#d4ae64',transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}));
  const stars=new T.InstancedMesh(g(new T.ShapeGeometry(starShape)),starMaterial,8);stars.name='DiceStars';root.add(stars);
  const poses=Array.from({length:6},(_,i)=>diceResultQuaternion(i+1));
  const tumble=new T.Quaternion(),euler=new T.Euler(),dummy=new T.Object3D();
  function update(frame:DiceFrame){
    const p=frame.progress,reduced=frame.mode==='reduced',height=diceHeight(p,reduced);
    body.position.set(0,.53+height,0);
    const target=poses[frame.result-1];
    if(reduced||p>=1)body.quaternion.copy(target);
    else if(p<.68){const t=Math.max(0,(p-.14)/.54),eased=t*t*(3-2*t);euler.set(.2+eased*Math.PI*4,.25+eased*Math.PI*6,.12+eased*Math.PI*4);tumble.setFromEuler(euler);body.quaternion.copy(tumble);}
    else {euler.set(.2+Math.PI*4,.25+Math.PI*6,.12+Math.PI*4);tumble.setFromEuler(euler);const t=Math.min(1,(p-.68)/.24),ease=1-(1-t)**3;body.quaternion.slerpQuaternions(tumble,target,ease);}
    const contact=Math.max(0,(p-.68)/.32);
    shadow.scale.setScalar(1+height*.35);shadowMaterial.opacity=1-height*.35;
    ring.visible=!reduced&&p>.68;ring.scale.setScalar(1+contact*1.8);ringMaterial.opacity=(1-contact)*.45;
    stars.visible=!reduced&&p>.68&&p<1;starMaterial.opacity=(1-contact)*.8;
    if(stars.visible){for(let i=0;i<8;i++){const angle=i/8*Math.PI*2;dummy.position.set(Math.cos(angle)*(.6+contact*.8),.4+Math.sin(contact*Math.PI)*.55,Math.sin(angle)*(.6+contact*.8));dummy.rotation.set(-.4,angle,contact*1.3);dummy.scale.setScalar(1-contact*.7);dummy.updateMatrix();stars.setMatrixAt(i,dummy.matrix);}stars.instanceMatrix.needsUpdate=true;}
  }
  update({phase:'idle',progress:1,result:1,mode:'reduced',token:''});root.visible=false;
  return{root,body,update,dispose(){stars.dispose();texture.dispose();geometries.forEach(v=>v.dispose());materials.forEach(v=>v.dispose());}};
}
