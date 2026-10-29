import { useEffect, useMemo } from 'react';
import type { ThreeElements } from '@react-three/fiber';
import { createCityBoxGeometry } from './cityGeometry';

type Props = Omit<ThreeElements['mesh'], 'args'> & { args: [number, number, number]; radius?: number; smoothness?: number };
export function CityBox({ args, radius = 0.05, smoothness = 2, children, ...props }: Props) {
  const [w,h,d] = args;
  const geometry = useMemo(() => createCityBoxGeometry([w,h,d],radius,Math.min(3,smoothness)), [w,h,d,radius,smoothness]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh {...props}><primitive object={geometry} attach="geometry" />{children}</mesh>;
}
