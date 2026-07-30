import type * as THREE from 'three';

export type CinematicKind = 'discovery-flyby' | 'landing-companion' | 'atlas-finale';

export type CinematicShot =
  | 'idle'
  | 'departure'
  | 'companion'
  | 'reveal'
  | 'orbit'
  | 'threshold'
  | 'return'
  | 'interrupted'
  | 'complete';

export interface CinematicFrame {
  shipPosition: THREE.Vector3;
  shipQuaternion: THREE.Quaternion;
  targetPosition: THREE.Vector3;
  targetSpace?: 'inertial' | 'scene';
}

export interface CinematicPlayOptions {
  subjectName?: string;
  targetRadius?: number;
  shipScale?: number;
  captions?: Partial<Record<CinematicShot, string>>;
}

export interface CinematicState {
  active: boolean;
  completed: boolean;
  justCompleted: boolean;
  skipRequested: boolean;
  kind: CinematicKind | null;
  currentShot: CinematicShot;
  caption: string;
  progress: number;
  elapsed: number;
  duration: number;
}

export interface RailKey {
  position: readonly [number, number, number];
  focus: readonly [number, number, number];
  targetAnchor: number;
  targetFocus: number;
  radiusScale: number;
  fov: number;
  roll: number;
}

export interface ShotMarker {
  at: number;
  id: CinematicShot;
  caption: string;
}

export interface CinematicPreset {
  kind: CinematicKind;
  duration: number;
  entryEnd: number;
  exitStart: number;
  defaultSubject: string;
  rail: readonly RailKey[];
  shots: readonly ShotMarker[];
}

export interface CinematicValidation {
  valid: boolean;
  issues: string[];
  maximumNormalizedVelocityJump: number;
}
