import * as THREE from 'three';
import { DISCOVERIES, getObjective } from '../discoveries';
import type { GameMode, GameSnapshot } from '../types';
import type { FlightController } from './FlightController';
import type { MissionController } from './MissionController';

const localTarget = new THREE.Vector3();
const projectedTarget = new THREE.Vector3();
const inverseFlight = new THREE.Quaternion();

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
  nacreSurveyed: false,
  locationName: 'LYRA / DECK 01',
  landingSiteName: 'SOLACE / RAINSHELF 04',
  nearestShipName: null,
  nearestShipDistance: Number.POSITIVE_INFINITY,
  canLand: false,
  frameRate: 60,
  frameTimeP95: 16.67,
  frameTimeP99: 16.67,
  longFramePercent: 0,
  drawCalls: 0,
  triangles: 0,
  cinematicCaption: '',
  cinematicProgress: 0,
  cinematicShot: 'idle',
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
  landingSiteName?: string;
  nearestShipName?: string | null;
  nearestShipDistance?: number;
  canLand?: boolean;
  frameTimeP95?: number;
  frameTimeP99?: number;
  longFramePercent?: number;
  drawCalls?: number;
  triangles?: number;
  cinematicCaption?: string;
  cinematicProgress?: number;
  cinematicShot?: string;
}

export function createSnapshot(options: SnapshotOptions): GameSnapshot {
  const { mode, mission, flight, camera } = options;
  const discovery = DISCOVERIES[mission.target];
  flight.getInverseQuaternion(inverseFlight);
  localTarget.fromArray(discovery.position)
    .sub(flight.position)
    .applyQuaternion(inverseFlight);
  projectedTarget.copy(localTarget).project(camera);
  const inFront = localTarget.z < camera.position.z;
  if (!inFront) {
    projectedTarget.x *= -1;
    projectedTarget.y *= -1;
  }
  return {
    mode,
    objective: getObjective(
      mission.scanned,
      mode,
      options.surfaceSamples,
      mission.solaceSurveyed,
      mission.nacreSurveyed,
      options.landingSiteName?.toLowerCase().startsWith('nacre') ? 'nacre' : 'solace',
    ),
    target: mission.target,
    targetName: discovery.name,
    targetDistance: localTarget.length(),
    targetBearing: THREE.MathUtils.radToDeg(Math.atan2(localTarget.x, -localTarget.z)),
    targetScreen: {
      x: THREE.MathUtils.clamp(projectedTarget.x, -1.4, 1.4),
      y: THREE.MathUtils.clamp(projectedTarget.y, -1.25, 1.25),
      visible: inFront && Math.abs(projectedTarget.x) < 1 && Math.abs(projectedTarget.y) < 1,
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
    nacreSurveyed: mission.nacreSurveyed,
    locationName: options.locationName ?? (mode === 'walking' ? 'LYRA / DECK 01' : 'HELIOS NULL'),
    landingSiteName: options.landingSiteName ?? 'SOLACE / RAINSHELF 04',
    nearestShipName: options.nearestShipName ?? null,
    nearestShipDistance: options.nearestShipDistance ?? Number.POSITIVE_INFINITY,
    canLand: options.canLand ?? false,
    frameRate: options.frameRate,
    frameTimeP95: options.frameTimeP95 ?? 16.67,
    frameTimeP99: options.frameTimeP99 ?? 16.67,
    longFramePercent: options.longFramePercent ?? 0,
    drawCalls: options.drawCalls ?? 0,
    triangles: options.triangles ?? 0,
    cinematicCaption: options.cinematicCaption ?? '',
    cinematicProgress: options.cinematicProgress ?? 0,
    cinematicShot: options.cinematicShot ?? 'idle',
  };
}
