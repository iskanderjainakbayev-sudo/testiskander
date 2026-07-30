import * as THREE from 'three';
import type { RailKey } from './types';

export interface RailPose {
  position: THREE.Vector3;
  focus: THREE.Vector3;
  targetAnchor: number;
  targetFocus: number;
  radiusScale: number;
  fov: number;
  roll: number;
}

export function createRailPose(): RailPose {
  return {
    position: new THREE.Vector3(),
    focus: new THREE.Vector3(),
    targetAnchor: 0,
    targetFocus: 0,
    radiusScale: 0,
    fov: 68,
    roll: 0,
  };
}

function keyIndex(virtualIndex: number, keyCount: number): number {
  if (virtualIndex <= 2) return 0;
  if (virtualIndex >= keyCount + 1) return keyCount - 1;
  return virtualIndex - 2;
}

function basis(index: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  if (index === 0) return (1 - 3 * t + 3 * t2 - t3) / 6;
  if (index === 1) return (4 - 6 * t2 + 3 * t3) / 6;
  if (index === 2) return (1 + 3 * t + 3 * t2 - 3 * t3) / 6;
  return t3 / 6;
}

export function sampleRail(keys: readonly RailKey[], progress: number, out: RailPose): RailPose {
  const segmentCount = keys.length + 1;
  const scaled = THREE.MathUtils.clamp(progress, 0, 1) * segmentCount;
  const segment = Math.min(Math.floor(scaled), segmentCount - 1);
  const t = progress >= 1 ? 1 : scaled - segment;
  out.position.set(0, 0, 0);
  out.focus.set(0, 0, 0);
  out.targetAnchor = 0;
  out.targetFocus = 0;
  out.radiusScale = 0;
  out.fov = 0;
  out.roll = 0;

  for (let basisIndex = 0; basisIndex < 4; basisIndex += 1) {
    const weight = basis(basisIndex, t);
    const key = keys[keyIndex(segment + basisIndex, keys.length)];
    out.position.x += key.position[0] * weight;
    out.position.y += key.position[1] * weight;
    out.position.z += key.position[2] * weight;
    out.focus.x += key.focus[0] * weight;
    out.focus.y += key.focus[1] * weight;
    out.focus.z += key.focus[2] * weight;
    out.targetAnchor += key.targetAnchor * weight;
    out.targetFocus += key.targetFocus * weight;
    out.radiusScale += key.radiusScale * weight;
    out.fov += key.fov * weight;
    out.roll += key.roll * weight;
  }
  return out;
}
