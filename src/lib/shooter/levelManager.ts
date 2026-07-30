import { prepareEnemies, type Enemy } from "./enemies";
import { missions, type Mission } from "./levels";

export class LevelManager {
  private mission = missions[0];
  private clearedAt = 0;

  constructor(private readonly enemies: Enemy[]) {}

  start(missionId: number) {
    this.mission = missions.find((item) => item.id === missionId) ?? missions[0];
    prepareEnemies(this.enemies, this.mission.enemies, this.mission.boss);
    this.clearedAt = 0;
  }

  advance(time: number) {
    if (this.enemies.some((enemy) => enemy.model.group.visible)) return false;
    if (!this.clearedAt) this.clearedAt = time;
    return time - this.clearedAt > 1000;
  }

  snapshot() {
    return {
      level: this.mission.id,
      levelName: `${this.mission.location.toUpperCase()} // ${this.mission.name}`,
      objective: this.enemies.some((enemy) => enemy.model.group.visible)
        ? this.mission.objective
        : "AREA SECURED // EXFILTRATION IN PROGRESS",
      missionName: this.mission.name,
      missionBoss: Boolean(this.mission.boss),
    };
  }

  get current(): Mission {
    return this.mission;
  }
}
