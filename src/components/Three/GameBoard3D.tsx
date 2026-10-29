import { useEffect, useRef } from 'react';
import { Html, OrbitControls } from '@react-three/drei';
import { CityBox as RoundedBox } from './CityBox';
import { CITY_BASE, CITY_SURFACE } from './cityGeometry';
import { CityScenery, Neighborhood } from './CityScenery';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Player } from '../../game/types';
import { BOARD_DATA } from '../../game/board';
import { cityPosition } from '../../game/city';
import { useGameStore } from '../../game/store/useGameStore';

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
      const [x,,z]=tilePosition(i);const [nx,,nz]=tilePosition((i+1)%40);
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

function PlayerMiniature({ player, index, active }: { player: Player; index: number; active: boolean }) {
  const group = useRef<THREE.Group>(null);
  const lastPosition = useRef(player.position);
  const movingSince = useRef(0);
  const offsets: [number, number][] = [[-0.24, -0.23], [0.24, -0.23], [-0.24, 0.23], [0.24, 0.23]];
  const [offsetX, offsetZ] = offsets[index % offsets.length];

  useFrame((state, delta) => {
    if (!group.current) return;
    if (lastPosition.current !== player.position) {
      lastPosition.current = player.position;
      movingSince.current = state.clock.elapsedTime;
    }
    const [x, , z] = tilePosition(player.position);
    const targetX = x + offsetX;
    const targetZ = z + offsetZ + .55;
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, targetX, 5, delta);
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, targetZ, 5, delta);
    const elapsed = state.clock.elapsedTime - movingSince.current;
    const jumping = elapsed < 0.8 && movingSince.current > 0;
    const bob = jumping ? Math.abs(Math.sin((elapsed / 0.8) * Math.PI * 2)) * 0.42 : Math.sin(state.clock.elapsedTime * 1.8 + index) * 0.025;
    group.current.position.y = 0.38 + bob + (active ? 0.06 : 0);
    if (jumping && elapsed >= 0.8) movingSince.current = 0;
  });

  return (
    <group ref={group} position={[0, 0.38, 0]} scale={.65}>
      {active && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.26, 0]}>
          <torusGeometry args={[0.38, 0.035, 8, 30]} />
          <meshBasicMaterial color={player.color} transparent opacity={0.82} />
        </mesh>
      )}
      <mesh position={[0, -0.16, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.31, 0.35, 0.16, 24]} />
        <meshStandardMaterial color="#fff9eb" roughness={0.42} />
      </mesh>
      <mesh position={[0, -0.065, 0]}>
        <cylinderGeometry args={[0.26, 0.29, 0.055, 24]} />
        <meshStandardMaterial color={player.color} roughness={0.52} />
      </mesh>
      <mesh position={[0, 0.18, 0]} castShadow>
        <capsuleGeometry args={[0.14, 0.34, 4, 8]} />
        <meshStandardMaterial color={player.color} roughness={0.74} flatShading />
      </mesh>
      <mesh position={[0, 0.56, 0]} castShadow>
        <icosahedronGeometry args={[0.19, 2]} />
        <meshStandardMaterial color="#efc6a5" roughness={0.75} flatShading />
      </mesh>
      {index === 0 && <PlayerHair color="#58463b" />}
      {index === 1 && <PlayerHat color="#d5b86a" />}
      {index === 2 && <PlayerScarf color="#f6e7c7" />}
      {index === 3 && <PlayerCap color="#89b5ad" />}
      <mesh position={[-0.055, 0.58, 0.16]}>
        <sphereGeometry args={[0.018, 8, 6]} />
        <meshStandardMaterial color="#58463b" />
      </mesh>
      <mesh position={[0.055, 0.58, 0.16]}>
        <sphereGeometry args={[0.018, 8, 6]} />
        <meshStandardMaterial color="#58463b" />
      </mesh>
    </group>
  );
}

function PlayerHair({ color }: { color: string }) {
  return (
    <mesh position={[0, 0.68, -0.035]}>
      <sphereGeometry args={[0.2, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color={color} roughness={0.88} flatShading />
    </mesh>
  );
}

function PlayerHat({ color }: { color: string }) {
  return (
    <group position={[0, 0.72, 0]}>
      <mesh><cylinderGeometry args={[0.18, 0.2, 0.11, 12]} /><meshStandardMaterial color={color} roughness={0.8} /></mesh>
      <mesh position={[0, -0.045, 0]}><cylinderGeometry args={[0.24, 0.24, 0.035, 16]} /><meshStandardMaterial color="#b77a56" roughness={0.85} /></mesh>
    </group>
  );
}

function PlayerScarf({ color }: { color: string }) {
  return <mesh position={[0, 0.3, 0.12]} rotation={[0.18, 0, 0]}><torusGeometry args={[0.145, 0.04, 6, 12]} /><meshStandardMaterial color={color} roughness={0.78} /></mesh>;
}

function PlayerCap({ color }: { color: string }) {
  return <mesh position={[0, 0.71, 0.02]} rotation={[0.1, 0, 0]}><sphereGeometry args={[0.2, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={color} roughness={0.78} flatShading /></mesh>;
}
