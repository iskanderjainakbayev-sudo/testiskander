export type GameMode =
  | 'menu'
  | 'walking'
  | 'flight'
  | 'cinematic'
  | 'landing'
  | 'surface'
  | 'takeoff'
  | 'paused'
  | 'ending';

export type DiscoveryId = 'solace' | 'nacre' | 'veil' | 'pilgrim' | 'atlas';
export type LandablePlanetId = Extract<DiscoveryId, 'solace' | 'nacre'>;

export interface Discovery {
  id: DiscoveryId;
  name: string;
  classification: string;
  description: string;
  position: readonly [number, number, number];
  scanRange: number;
}

export interface Objective {
  eyebrow: string;
  title: string;
  detail: string;
}

export interface GameSnapshot {
  mode: GameMode;
  objective: Objective;
  target: DiscoveryId;
  targetName: string;
  targetDistance: number;
  targetBearing: number;
  targetScreen: { x: number; y: number; visible: boolean };
  speed: number;
  throttle: number;
  boost: boolean;
  hull: number;
  fuel: number;
  scanned: DiscoveryId[];
  echoes: number;
  nearbyInteraction: string | null;
  transmission: string | null;
  scanProgress: number;
  transitionProgress: number;
  surfaceSamples: number;
  solaceSurveyed: boolean;
  nacreSurveyed: boolean;
  locationName: string;
  landingSiteName: string;
  nearestShipName: string | null;
  nearestShipDistance: number;
  canLand: boolean;
  frameRate: number;
  frameTimeP95: number;
  frameTimeP99: number;
  longFramePercent: number;
  cinematicCaption: string;
  cinematicProgress: number;
  cinematicShot: string;
}

export interface WorldCallbacks {
  onSnapshot: (snapshot: GameSnapshot) => void;
  onPointerLock: (locked: boolean) => void;
  onComplete: () => void;
}

export interface SaveData {
  scanned: DiscoveryId[];
  echoes: number;
  target: DiscoveryId;
  shipPosition: [number, number, number];
  solaceSurveyed?: boolean;
  surfaceSamples?: number[];
  nacreSurveyed?: boolean;
  nacreSurfaceSamples?: number[];
}
