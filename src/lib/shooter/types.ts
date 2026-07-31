export type ShooterSnapshot = {
  score: number;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  enemies: number;
  ammo: number;
  reserveAmmo: number;
  isReloading: boolean;
  isAiming: boolean;
  weapon: string;
  fireMode: string;
  level: number;
  levelName: string;
  objective: string;
  missionName: string;
  missionBoss: boolean;
  bossHealth: number;
  mapName: string;
  mapSubtitle: string;
  gameOver: boolean;
  gameComplete: boolean;
};

export type ShooterWorldOptions = {
  canvas: HTMLCanvasElement;
  mapId: string;
  onUpdate: (snapshot: ShooterSnapshot) => void;
};
