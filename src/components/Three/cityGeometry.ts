import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Native rounded geometry keeps its bounds even when a caller supplies a large radius.
export function createCityBoxGeometry(size: [number, number, number], radius: number, segments = 2) {
  return new RoundedBoxGeometry(...size, segments, radius);
}
export const CITY_BASE = { size: [18.6, 0.5, 13.8] as [number, number, number], y: -0.3, radius: 0.2 };
export const CITY_SURFACE = { size: [18.4, 0.12, 13.6] as [number, number, number], y: 0.01, radius: 0.04 };
