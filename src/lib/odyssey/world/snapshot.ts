import * as THREE from 'three';
import { DISCOVERIES, getObjective } from '../discoveries';
import type { GameMode, GameSnapshot } from '../types';
import type { FlightController } from './FlightController';
import type { MissionController } from './MissionController';

export const INITIAL_SNAPSHOT: GameSnapshot = {
  mode: 'menu',
  objective: getObjective([], 'walking'),
  target: 'solace',
  targetName: DISCOVERIES.solace.name,
  targetDistance: 817,
  targetBearing: 0,
  targetScreen: { x: 0.5, y: 0.5, visible: true },
  speed: 0,
  throttle: 0,
  boost: false,
  hull: 100,
  fuel: 100,
  scanned: [],
  echoes: 0,
  nearbyInteraction: null,
  transmission: null,
  scanProgress: 0,
  frameRate: 60,
};

interface SnapshotOptions {
  mode: GameMode;
  mission: MissionController;
  flight: FlightController;
  camera: THREE.PerspectiveCamera;
  nearbyInteraction: string | null;
  fuel: number;
  frameRate: number;
}

export function createSnapshot(options: SnapshotOptions): GameSnapshot {
  const { mode, mission, flight, camera } = options;
  const discovery = DISCOVERIES[mission.target];
  const inverse = flight.getInverseQuaternion();
  const localTarget = new THREE.Vector3(...discovery.position)
    .sub(flight.position)
    .applyQuaternion(inverse);
  const projected = localTarget.clone().project(camera);
  const inFront = localTarget.z < camera.position.z;
  if (!inFront) {
    projected.x *= -1;
    projected.y *= -1;
  }
  return {
    mode,
    objective: getObjective(mission.scanned, mode === 'walking' ? 'walking' : 'flight'),
    target: mission.target,
    targetName: discovery.name,
    targetDistance: localTarget.length(),
    targetBearing: THREE.MathUtils.radToDeg(Math.atan2(localTarget.x, -localTarget.z)),
    targetScreen: {
      x: THREE.MathUtils.clamp(projected.x, -1.4, 1.4),
      y: THREE.MathUtils.clamp(projected.y, -1.25, 1.25),
      visible: inFront && Math.abs(projected.x) < 1 && Math.abs(projected.y) < 1,
    },
    speed: flight.speed,
    throttle: flight.throttle,
    boost: flight.boost,
    hull: 100,
    fuel: options.fuel,
    scanned: [...mission.scanned],
    echoes: mission.echoes,
    nearbyInteraction: options.nearbyInteraction,
    transmission: mission.transmission,
    scanProgress: mission.scanProgress,
    frameRate: options.frameRate,
  };
}
