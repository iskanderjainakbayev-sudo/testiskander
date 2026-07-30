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
  transitionProgress: 0,
  surfaceSamples: 0,
  solaceSurveyed: false,
  locationName: 'LYRA / DECK 01',
  nearestShipName: null,
  nearestShipDistance: Number.POSITIVE_INFINITY,
  canLand: false,
  frameRate: 60,
  frameTimeP95: 16.67,
  frameTimeP99: 16.67,
  longFramePercent: 0,
};

interface SnapshotOptions {
  mode: GameMode;
  mission: MissionController;
  flight: FlightController;
  camera: THREE.PerspectiveCamera;
  nearbyInteraction: string | null;
  fuel: number;
  frameRate: number;
  transitionProgress?: number;
  surfaceSamples?: number;
  locationName?: string;
  nearestShipName?: string | null;
  nearestShipDistance?: number;
  canLand?: boolean;
  frameTimeP95?: number;
  frameTimeP99?: number;
  longFramePercent?: number;
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
    objective: getObjective(
      mission.scanned,
      mode,
      options.surfaceSamples,
      mission.solaceSurveyed,
    ),
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
    transitionProgress: options.transitionProgress ?? 0,
    surfaceSamples: options.surfaceSamples ?? 0,
    solaceSurveyed: mission.solaceSurveyed,
    locationName: options.locationName ?? (mode === 'walking' ? 'LYRA / DECK 01' : 'HELIOS NULL'),
    nearestShipName: options.nearestShipName ?? null,
    nearestShipDistance: options.nearestShipDistance ?? Number.POSITIVE_INFINITY,
    canLand: options.canLand ?? false,
    frameRate: options.frameRate,
    frameTimeP95: options.frameTimeP95 ?? 16.67,
    frameTimeP99: options.frameTimeP99 ?? 16.67,
    longFramePercent: options.longFramePercent ?? 0,
  };
}
