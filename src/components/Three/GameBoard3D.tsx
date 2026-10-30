import { useEffect, useRef } from 'react';
import { Html, OrbitControls } from '@react-three/drei';
import { CityBox as RoundedBox } from './CityBox';
import { CITY_BASE, CITY_SURFACE } from './cityGeometry';
import { CityScenery, Neighborhood } from './CityScenery';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Player } from '../../game/types';
import { BOARD_DATA, BOARD_SIZE } from '../../game/board';
import { cityPosition } from '../../game/city';
import { useGameStore } from '../../game/store/useGameStore';
import { createCharacterActor } from '../Characters/actor';
import { resolveCharacter } from '../../game/characters';
import { useJourney } from '../../game/journey';
import { useDicePresentation } from '../../game/dice/presentation';

const tilePosition = cityPosition;

export interface CitySceneProps { onSelect: (id: number) => void; selected: number | null; labels: boolean; night: boolean; resetKey: number }
export const GameBoard3D = ({ onSelect, selected, labels, night, resetKey }: CitySceneProps) => {
  const players = useGameStore(s => s.players);
  const currentPlayerIndex = useGameStore(s => s.currentPlayerIndex);
  const {camera,size}=useThree();
  const controls=useRef<import('three-stdlib').OrbitControls>(null);
  const focusFlight = useRef<{ camera: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  useEffect(()=>{
    if(selected === null) return;
    const [x,,z] = cityPosition(selected);
    focusFlight.current = {camera:new THREE.Vector3(x+7,10,z+9),target:new THREE.Vector3(x,0,z)};
  },[selected]);
  useFrame((_,delta)=>{
    const flight=focusFlight.current;
    if(!flight||!controls.current) return;
    const step=1-Math.exp(-delta*5);
    camera.position.lerp(flight.camera,step);
    controls.current.target.lerp(flight.target,step);
    controls.current.update();
    if(camera.position.distanceTo(flight.camera)<.05) focusFlight.current=null;
  });
  useEffect(()=>{
    focusFlight.current=null;
    const distance=Math.max(31, 28/Math.max(size.width/size.height,.45));
    camera.position.copy(new THREE.Vector3(15,23,19).normalize().multiplyScalar(distance));
    camera.lookAt(0,0,0);camera.updateProjectionMatrix();
    controls.current?.target.set(0,0,0); controls.current?.update();
  },[camera,size.width,size.height,resetKey]);
  return <>
    <OrbitControls ref={controls} makeDefault minDistance={10} maxDistance={60} maxPolarAngle={Math.PI/2.2} minPolarAngle={.25} enableDamping rotateSpeed={.5}/>
    <ambientLight intensity={night ? .45 : 1.1}/><hemisphereLight args={[night?'#9dbee1':'#fff8e4','#819985',night ? .65 : 1.3]}/>
    <directionalLight position={[-8,16,6]} intensity={night ? .6 : 2} color={night?'#b9ceff':'#fff1d5'} castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12}/>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.65,0]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color={night?'#193648':'#d5e7e5'}/></mesh>
    <RoundedBox args={CITY_BASE.size} radius={CITY_BASE.radius} position={[0,CITY_BASE.y,0]} receiveShadow castShadow><meshStandardMaterial color={night?'#536d60':'#91ad89'}/></RoundedBox>
    <RoundedBox args={CITY_SURFACE.size} radius={CITY_SURFACE.radius} position={[0,CITY_SURFACE.y,0]} receiveShadow><meshStandardMaterial color={night?'#64755e':'#c6d8a9'}/></RoundedBox>
    {BOARD_DATA.map((tile,i)=>{
      const [x,,z]=tilePosition(i);const [nx,,nz]=tilePosition((i+1)%BOARD_SIZE);
      const length=Math.hypot(nx-x,nz-z);
      return <group key={tile.id}>
        <mesh position={[(x+nx)/2,.13,(z+nz)/2+.55]} rotation={[0,-Math.atan2(nz-z,nx-x),0]} receiveShadow><boxGeometry args={[length,.04,.45]}/><meshStandardMaterial color={night?'#747e80':'#a9acaf'}/></mesh>
        <group position={[x,0,z]} onClick={e=>{e.stopPropagation();onSelect(i);}}>
          <Neighborhood tile={tile} night={night}/>
          {(selected===i||players[currentPlayerIndex]?.position===i)&&<mesh position={[0,.35,.55]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.28,.33,32]}/><meshBasicMaterial color={selected===i?'#fff4a2':players[currentPlayerIndex].color}/></mesh>}
          <Html position={[0,.38,.72]} center zIndexRange={[1,0]}><button className="city-3d-label" onClick={()=>onSelect(i)} aria-label={(i+1)+' '+tile.name}><b>{String(i+1).padStart(2,'0')}</b>{labels&&<span>{tile.name}</span>}</button></Html>
        </group>
      </group>;
    })}
    <CityScenery night={night}/>
    {players.map((player,index)=><PlayerMiniature key={player.id} player={player} index={index} active={index===currentPlayerIndex}/>)}
  </>;
};

function PlayerMiniature({player}:{player:Player;index:number;active:boolean}){
  const group=useRef<THREE.Group>(null),actor=useRef<ReturnType<typeof createCharacterActor>|null>(null),reduced=useRef(false);
  useEffect(()=>{
    const parent=group.current;if(!parent)return;
    const instance=createCharacterActor({characterId:resolveCharacter(player.characterId,player.id),color:player.color,playerId:player.id,quality:'medium'});parent.add(instance.root);actor.current=instance;
    const media=window.matchMedia('(prefers-reduced-motion: reduce)'),changed=()=>{reduced.current=media.matches;};changed();media.addEventListener('change',changed);
    return()=>{media.removeEventListener('change',changed);parent.remove(instance.root);instance.dispose();actor.current=null;};
  },[player.id,player.color,player.characterId]);
  useFrame((_,delta)=>{
    if(!actor.current)return;const game=useGameStore.getState(),journey=useJourney.getState(),current=game.players.find(p=>p.id===player.id);if(!current)return;
    actor.current.update({delta,position:current.position,visualPosition:journey.position,moving:journey.playerId===player.id,active:game.players[game.currentPlayerIndex]?.id===player.id,phase:game.phase,dicePhase:useDicePresentation.getState().phase,reducedMotion:reduced.current,worldPosition:index=>{const p=tilePosition(index);return[p[0],p[1]+.38,p[2]+.55];}});
  });
  return <group ref={group} dispose={null}/>;
}
