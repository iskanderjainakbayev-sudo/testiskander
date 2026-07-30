import * as THREE from 'three';

export function smootherstep(value: number): number {
  const x = THREE.MathUtils.clamp(value, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

export function integratedSmootherstep(value: number): number {
  const x = THREE.MathUtils.clamp(value, 0, 1);
  const x2 = x * x;
  const x4 = x2 * x2;
  return 2.5 * x4 - 3 * x4 * x + x4 * x2;
}
