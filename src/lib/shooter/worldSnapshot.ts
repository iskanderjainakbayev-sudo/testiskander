import type { Enemy } from "./enemies";
import type { LevelManager } from "./levelManager";
import type { Rifle } from "./rifle";
import type { ShooterSnapshot } from "./types";

type SnapshotSource = {
  score: number;
  health: number;
  maxHealth: number;
  enemies: Enemy[];
  rifle: Rifle;
  levelManager: LevelManager;
  stamina: number;
  maxStamina: number;
};

export function createWorldSnapshot(source: SnapshotSource): Omit<ShooterSnapshot, "isAiming" | "mapName" | "mapSubtitle"> {
  return {
    score: source.score,
    health: source.health,
    maxHealth: source.maxHealth,
    stamina: source.stamina,
    maxStamina: source.maxStamina,
    enemies: source.enemies.filter((enemy) => enemy.model.group.visible).length,
    ...source.rifle.snapshot(),
    ...source.levelManager.snapshot(),
    bossHealth: source.enemies.find((enemy) => enemy.isBoss && enemy.model.group.visible)?.health ?? 0,
    gameOver: false,
    gameComplete: false,
  };
}
