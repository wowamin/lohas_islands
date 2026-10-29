import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { BoardTile } from '../../game/board';
import { CityBox } from './CityBox';

const COLORS = ['#e7b8a5','#e4c982','#b4cbb9','#9bbec6','#ddd6ba'];
function Box({size,at,color,glow=false}:{size:[number,number,number];at:[number,number,number];color:string;glow?:boolean}) {
  return <CityBox args={size} position={at} radius={.035} castShadow receiveShadow><meshStandardMaterial color={color} roughness={.85} emissive={glow?color:'#000'} emissiveIntensity={glow?.45:0}/></CityBox>;
}
export function Neighborhood({tile,night}:{tile:BoardTile;night:boolean}) {
  const id=tile.id;
  const park=tile.type==='REST'||tile.type==='OPPORTUNITY';
  const clinic=tile.type==='SERVICE';
  const careHall=tile.name==='日照中心';
  const tall=tile.name==='專業服務'||tile.name==='健康管理';
  const levels=tall?3+id%3:clinic?2:1+id%2;
  const h=levels*.38;
  const color=clinic?'#e7eee1':COLORS[id%COLORS.length];
  const windows=night?'#ffe2a0':'#83b4bb';
  const roof=clinic?'#68a395':id%3===0?'#cc896c':id%3===1?'#667c75':'#dbbc77';
  return <group>
    <Box size={[1.45,.07,1.32]} at={[0,.11,-.14]} color={park?'#9bbf86':'#dddac8'}/>
    <Box size={[1.4,.04,.2]} at={[0,.17,.44]} color="#f4eedc"/>
    {park?<>
      <Box size={[1.1,.04,.82]} at={[0,.17,-.2]} color={tile.type==='REST'?'#aac9bf':'#bad58d'}/>
      <Tree at={[-.48,.15,-.52]} size={.55}/><Tree at={[.43,.15,-.5]} size={.43}/>
      <Bench at={[-.38,.18,.03]}/><Resident at={[.2,.19,-.1]} color="#ce897c" wheelchair={id%2===0}/>
      <Resident at={[-.05,.18,-.42]} color="#6d94ad"/>
    </>:<>
      <Box size={[.91,h,.72]} at={[0,.17+h/2,-.24]} color={color}/>
      {(clinic&&!careHall)||tall?<><Box size={[1.03,.09,.82]} at={[0,.21+h,-.24]} color="#f8f5e9"/><Box size={[.45,.14,.3]} at={[-.1,.32+h,-.27]} color="#c7d2c8"/></>:<mesh position={[0,.27+h,-.24]} rotation={[0,Math.PI/4,0]} castShadow><coneGeometry args={[.74,.38,4]}/><meshStandardMaterial color={roof} roughness={.9}/></mesh>}
      {Array.from({length:levels},(_,floor)=><group key={floor}>
        {[-.28,0,.28].map(x=><Box key={x} size={[.17,.19,.024]} at={[x,.36+floor*.38,.132]} color={windows} glow={night}/>)}
        {[-.44,-.1].map(z=><Box key={z} size={[.024,.19,.17]} at={[.465,.36+floor*.38,z]} color={windows} glow={night}/>)}
        {tall&&<Box size={[.98,.035,.8]} at={[0,.18+(floor+1)*.38,-.24]} color="#eef0df"/>}
      </group>)}
      <Box size={[.19,.27,.03]} at={[0,.3,.15]} color="#5d8d87"/>
      {clinic&&<><Box size={[.94,.08,.28]} at={[0,.65,.26]} color="#6da998"/><Box size={[.25,.07,.035]} at={[0,.85,.14]} color="#fff9df"/><Box size={[.07,.25,.035]} at={[0,.85,.14]} color="#fff9df"/></>}
      {(tile.serviceKey==='meal')&&<><Box size={[1.04,.1,.3]} at={[0,.62,.23]} color="#dd9a73"/><Bench at={[.43,.2,.26]}/></>}
      <Tree at={[-.57,.16,-.4]} size={.36}/>
      <Box size={[.2,.16,.28]} at={[.57,.23,-.48]} color="#8aaf83"/>
      {id%4===0&&<Resident at={[.44,.2,.25]} color="#dc9c78" wheelchair={id%8===0}/>}
    </>}
    {id===0&&<group position={[.53,.15,-.5]}><Box size={[.035,1,.035]} at={[0,.5,0]} color="#7e8571"/><Box size={[.32,.22,.03]} at={[.16,.88,0]} color="#da9b72"/></group>}
  </group>;
}
function Tree({at,size=1}:{at:[number,number,number];size?:number}) {
  return <group position={at} scale={size}><mesh position={[0,.35,0]} castShadow><cylinderGeometry args={[.055,.075,.7,6]}/><meshStandardMaterial color="#8f8363"/></mesh><mesh position={[0,.9,0]} castShadow><coneGeometry args={[.31,.85,7]}/><meshStandardMaterial color="#4f8973" flatShading/></mesh><mesh position={[0,1.12,0]} castShadow><coneGeometry args={[.23,.65,7]}/><meshStandardMaterial color="#6c9d77" flatShading/></mesh></group>;
}
function Bench({at}:{at:[number,number,number]}) {
  return <group position={at}><Box size={[.42,.045,.17]} at={[0,.17,0]} color="#d6a36c"/><Box size={[.42,.14,.035]} at={[0,.26,-.07]} color="#d6a36c"/>{[-.15,.15].map(x=><Box key={x} size={[.035,.15,.13]} at={[x,.07,0]} color="#6e8275"/>)}</group>;
}
function Resident({at,color,wheelchair=false}:{at:[number,number,number];color:string;wheelchair?:boolean}) {
  return <group position={at}>
    <mesh position={[0,wheelchair?.31:.4,0]} castShadow><sphereGeometry args={[.07,8,6]}/><meshStandardMaterial color="#ebc4a2"/></mesh>
    <Box size={[.1,.18,.08]} at={[0,wheelchair?.16:.25,0]} color={color}/>
    {wheelchair?<><Box size={[.15,.035,.16]} at={[0,.1,.04]} color="#778e9a"/>{[-.1,.1].map(x=><mesh key={x} position={[x,.11,.01]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.1,.015,5,16]}/><meshStandardMaterial color="#525f68"/></mesh>)}<Box size={[.1,.04,.14]} at={[0,.15,.12]} color="#5c7d8f"/></>:<>{[-.035,.035].map(x=><Box key={x} size={[.035,.16,.04]} at={[x,.09,0]} color="#5d6d77"/>)}</>}
  </group>;
}
function Lamp({at,night}:{at:[number,number,number];night:boolean}) {
  return <group position={at}><Box size={[.035,.75,.035]} at={[0,.375,0]} color="#677a70"/><Box size={[.2,.035,.035]} at={[.08,.76,0]} color="#677a70"/><Box size={[.1,.045,.08]} at={[.15,.73,0]} color={night?'#ffe6a2':'#e9dfb9'} glow={night}/></group>;
}
function Car({color='#d49775'}:{color?:string}) {
  return <group><Box size={[.44,.15,.22]} at={[0,.14,0]} color={color}/><Box size={[.25,.12,.2]} at={[-.01,.25,0]} color="#accbd0"/>{[-.15,.15].flatMap(x=>[-.11,.11].map(z=><mesh key={x+':'+z} position={[x,.07,z]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.06,.06,.035,8]}/><meshStandardMaterial color="#52615d"/></mesh>))}</group>;
}
function Traffic({night}:{night:boolean}) {
  const ref=useRef<THREE.Group>(null);
  const reduced=typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useFrame(({clock})=>{if(!ref.current||reduced)return;const t=(clock.elapsedTime*.025)%1;const x=7.7,z=5.3;let a:number,b:number,r:number;if(t<.25){a=-x+t*8*x;b=-z;r=0;}else if(t<.5){a=x;b=-z+(t-.25)*8*z;r=-Math.PI/2;}else if(t<.75){a=x-(t-.5)*8*x;b=z;r=Math.PI;}else{a=-x;b=z-(t-.75)*8*z;r=Math.PI/2;}ref.current.position.set(a,.17,b);ref.current.rotation.y=r;});
  return <group ref={ref} position={[-7.7,.17,-5.3]}><Car color={night?'#e5c18d':'#dc9c76'}/></group>;
}
export function CityScenery({night}:{night:boolean}) {
  const asphalt=night?'#53636a':'#989fa1';
  return <group>
    <Box size={[16.2,.05,.8]} at={[0,.11,-5.3]} color={asphalt}/><Box size={[16.2,.05,.8]} at={[0,.11,5.3]} color={asphalt}/>
    {[-7.7,7.7].map(x=><Box key={x} size={[.8,.05,11.4]} at={[x,.11,0]} color={asphalt}/>)}
    {Array.from({length:23},(_,i)=><group key={i}>{[-5.3,5.3].map(z=><Box key={z} size={[.28,.007,.035]} at={[-7.1+i*.64,.142,z]} color="#f3ecd8"/>)}</group>)}
    {[-7.7,7.7].map(x=>Array.from({length:15},(_,i)=><Box key={x+':'+i} size={[.035,.007,.25]} at={[x,.142,-4.6+i*.65]} color="#f3ecd8"/>))}
    <Box size={[.65,.025,11.8]} at={[-8.65,.09,0]} color={night?'#5a9fa7':'#8cd1c3'}/>
    {[-2.4,2.6].map(z=><group key={z} position={[-8.65,.15,z]}><Box size={[1.1,.1,.6]} at={[0,.04,0]} color="#d1b28c"/>{[-.32,.32].map(side=><Box key={side} size={[1.15,.14,.04]} at={[0,.19,side]} color="#b17c67"/>)}</group>)}
    {[-6,-3,0,3,6].map(x=><group key={x}><Tree at={[x,.09,-6.2]} size={.6+(x+6)*.015}/><Tree at={[x+.3,.09,6.1]} size={.5}/><Lamp at={[x,.14,-4.76]} night={night}/><Lamp at={[x,.14,4.78]} night={night}/></group>)}
    {[-4,4].map(x=><group key={x} position={[x,.15,5.3]}>{[-.22,-.11,0,.11,.22].map(v=><Box key={v} size={[.055,.01,.7]} at={[v,0,0]} color="#fff4df"/>)}</group>)}
    <group position={[2,.15,6.1]}><Bench at={[0,0,0]}/><Resident at={[.45,0,0]} color="#c88c80" wheelchair/><Resident at={[.7,0,0]} color="#7ca798"/></group>
    <group position={[-3,.15,6.05]}><Car color="#8faab6"/></group><Traffic night={night}/>
  </group>;
}
