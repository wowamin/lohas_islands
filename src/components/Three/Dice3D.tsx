import * as THREE from 'three';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CityBox as RoundedBox } from './CityBox';
import { useGameStore } from '../../game/store/useGameStore';

const PIP_PATTERNS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-0.19, 0.19], [0.19, -0.19]],
  3: [[-0.19, 0.19], [0, 0], [0.19, -0.19]],
  4: [[-0.19, -0.19], [-0.19, 0.19], [0.19, -0.19], [0.19, 0.19]],
  5: [[-0.19, -0.19], [-0.19, 0.19], [0, 0], [0.19, -0.19], [0.19, 0.19]],
  6: [[-0.19, -0.2], [-0.19, 0], [-0.19, 0.2], [0.19, -0.2], [0.19, 0], [0.19, 0.2]],
};

export const Dice3D = () => {
  const phase = useGameStore((state) => state.phase);
  const diceValue = useGameStore((state) => state.diceValue);
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    if (phase === 'ROLLING') {
      ref.current.rotation.x += delta * 11;
      ref.current.rotation.y += delta * 13;
      ref.current.rotation.z += delta * 7;
    } else {
      ref.current.rotation.x = THREE.MathUtils.damp(ref.current.rotation.x, 0.22, 5, delta);
      ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, -0.3, 5, delta);
      ref.current.rotation.z = THREE.MathUtils.damp(ref.current.rotation.z, 0, 5, delta);
    }
  });

  if (phase === 'SETUP' || phase === 'RESULT') return null;

  return (
    <group ref={ref} position={[0, 1.1, 5.8]} scale={0.76}>
      <RoundedBox args={[0.76, 0.76, 0.76]} radius={0.12} smoothness={5} castShadow receiveShadow>
        <meshStandardMaterial color="#fffaf0" roughness={0.36} metalness={0.02} />
      </RoundedBox>
      <Pips value={phase === 'ROLLING' ? 5 : diceValue} />
      <Face rotation={[Math.PI, 0, 0]} value={7 - diceValue} />
      <Face rotation={[0, 0, -Math.PI / 2]} value={2} />
      <Face rotation={[0, 0, Math.PI / 2]} value={5} />
      <Face rotation={[Math.PI / 2, 0, 0]} value={3} />
      <Face rotation={[-Math.PI / 2, 0, 0]} value={4} />
    </group>
  );
};

function Pips({ value }: { value: number }) {
  return (
    <group position={[0, 0.385, 0]}>
      {(PIP_PATTERNS[value] ?? PIP_PATTERNS[1]).map(([x, z], index) => (
        <mesh key={index} position={[x, 0, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.065, 16]} />
          <meshBasicMaterial color="#9f6950" />
        </mesh>
      ))}
    </group>
  );
}

function Face({ rotation, value }: { rotation: [number, number, number]; value: number }) {
  return (
    <group rotation={rotation}>
      <Pips value={value} />
    </group>
  );
}
