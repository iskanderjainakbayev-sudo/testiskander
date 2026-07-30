import * as THREE from 'three';
import { CINEMATIC_PRESETS } from './presets';
import { createRailPose, sampleRail } from './railMath';
import type { CinematicPreset, CinematicValidation, RailKey } from './types';

const EPSILON = 0.00001;

function valuesOf(key: RailKey): number[] {
  return [
    ...key.position,
    ...key.focus,
    key.targetAnchor,
    key.targetFocus,
    key.radiusScale,
    key.fov,
    key.roll,
  ];
}

function validateStructure(preset: CinematicPreset, issues: string[]): void {
  if (preset.duration <= 0) issues.push(`${preset.kind}: duration must be positive`);
  if (preset.entryEnd <= 0 || preset.entryEnd >= preset.exitStart) {
    issues.push(`${preset.kind}: entryEnd must precede exitStart`);
  }
  if (preset.exitStart >= 1) issues.push(`${preset.kind}: exitStart must be below one`);
  if (preset.rail.length < 4) issues.push(`${preset.kind}: rail needs at least four keys`);
  preset.rail.forEach((key, index) => {
    if (valuesOf(key).some((value) => !Number.isFinite(value))) {
      issues.push(`${preset.kind}: rail key ${index} contains a non-finite value`);
    }
  });
  let previous = -1;
  preset.shots.forEach((shot) => {
    if (shot.at < previous || shot.at < 0 || shot.at > 1) {
      issues.push(`${preset.kind}: shot markers must be ordered within zero and one`);
    }
    previous = shot.at;
  });
}

function maximumVelocityJump(preset: CinematicPreset): number {
  const before = createRailPose();
  const center = createRailPose();
  const after = createRailPose();
  const leftVelocity = new THREE.Vector3();
  const rightVelocity = new THREE.Vector3();
  let maximum = 0;
  for (let index = 1; index < preset.rail.length + 1; index += 1) {
    const boundary = index / (preset.rail.length + 1);
    sampleRail(preset.rail, boundary - EPSILON, before);
    sampleRail(preset.rail, boundary, center);
    sampleRail(preset.rail, boundary + EPSILON, after);
    leftVelocity.subVectors(center.position, before.position).divideScalar(EPSILON);
    rightVelocity.subVectors(after.position, center.position).divideScalar(EPSILON);
    const scale = Math.max(leftVelocity.length(), rightVelocity.length(), 1);
    maximum = Math.max(
      maximum,
      leftVelocity.sub(rightVelocity).length() / scale,
    );
  }
  return maximum;
}

export function validateCinematicPresets(): CinematicValidation {
  const issues: string[] = [];
  let maximumNormalizedVelocityJump = 0;
  Object.values(CINEMATIC_PRESETS).forEach((preset) => {
    validateStructure(preset, issues);
    maximumNormalizedVelocityJump = Math.max(
      maximumNormalizedVelocityJump,
      maximumVelocityJump(preset),
    );
  });
  if (maximumNormalizedVelocityJump > 0.002) {
    issues.push(`Rail velocity discontinuity is ${maximumNormalizedVelocityJump.toExponential(2)}`);
  }
  return {
    valid: issues.length === 0,
    issues,
    maximumNormalizedVelocityJump,
  };
}
