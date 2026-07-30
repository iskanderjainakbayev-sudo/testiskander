import type { EclipseSnapshot, GameSettings } from './types';

export type EclipseWorldSnapshot = {
  health: number; maxHealth: number; stamina: number; maxStamina: number; level: number; xp: number; xpToNextLevel: number;
  shards: number; alloy: number; region: string; weather: string; timeLabel: string; objective: string; enemies: number;
  quest: { title: string; current: number; target: number } | null; interaction: string | null; toast: string | null;
  boss: { name: string; health: number; maxHealth: number; phase: number } | null;
  weaponName: string; ammo: number; reserveAmmo: number; abilityReady: boolean;
};

export type EclipseWorldOptions = {
  canvas: HTMLCanvasElement;
  snapshot: EclipseSnapshot;
  settings: GameSettings;
  onUpdate: (snapshot: EclipseWorldSnapshot) => void;
  onOutcome: (outcome: 'victory' | 'defeat') => void;
};
