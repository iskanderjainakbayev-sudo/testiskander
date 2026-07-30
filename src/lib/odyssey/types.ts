export type GameMode =
  | 'menu'
  | 'walking'
  | 'flight'
  | 'landing'
  | 'surface'
  | 'takeoff'
  | 'paused'
  | 'ending';

export type DiscoveryId = 'solace' | 'veil' | 'pilgrim' | 'atlas';

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
  locationName: string;
  nearestShipName: string | null;
  nearestShipDistance: number;
  canLand: boolean;
  frameRate: number;
  frameTimeP95: number;
  frameTimeP99: number;
  longFramePercent: number;
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
}
