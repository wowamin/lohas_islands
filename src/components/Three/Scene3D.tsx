import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { GameBoard3D } from './GameBoard3D';
import type { CitySceneProps } from './GameBoard3D';
import { Dice3D } from './Dice3D';
export default function Scene3D(props: CitySceneProps) {
  return <Canvas shadows dpr={[1,1.5]} camera={{position:[13,19,18],fov:38}}>
    <color attach="background" args={[props.night?'#193648':'#d5e7e5']}/>
    <fog attach="fog" args={[props.night?'#193648':'#d5e7e5',35,75]}/>
    <Suspense fallback={null}><GameBoard3D {...props}/><Dice3D/></Suspense>
  </Canvas>;
}
