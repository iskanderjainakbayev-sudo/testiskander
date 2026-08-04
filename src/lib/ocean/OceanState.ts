import { EMPTY_INVENTORY, RECIPES, RESOURCE_NAMES } from './content';
import { getObjective } from './progression';
import type { Inventory, OceanSave, RecipeId, ResourceId } from './types';

const STANDARD_OXYGEN = 105;
const HIGH_CAPACITY_OXYGEN = 220;
const OXYGEN_DRAIN_RATE = 0.72;

export interface CraftResult {
  ok: boolean;
  message: string;
}

export class OceanState {
  health = 100;
  oxygen = STANDARD_OXYGEN;
  hunger = 100;
  water = 100;
  subBattery = 100;
  elapsed = 0;
  readonly inventory: Inventory = { ...EMPTY_INVENTORY };
  readonly crafted: RecipeId[] = [];
  readonly logs: string[] = [];

  get maxOxygen(): number {
    return this.crafted.includes('tank') ? HIGH_CAPACITY_OXYGEN : STANDARD_OXYGEN;
  }

  get crushDepth(): number {
    return this.crafted.includes('depthModule') ? 160 : 85;
  }

  get objective(): string {
    return getObjective(this.crafted, this.logs);
  }

  reset(): void {
    this.health = 100;
    this.oxygen = STANDARD_OXYGEN;
    this.hunger = 100;
    this.water = 100;
    this.subBattery = 100;
    this.elapsed = 0;
    Object.assign(this.inventory, EMPTY_INVENTORY);
    this.crafted.splice(0);
    this.logs.splice(0);
  }

  restore(save: OceanSave): void {
    this.health = save.health;
    this.oxygen = save.oxygen;
    this.hunger = save.hunger;
    this.water = save.water;
    this.subBattery = save.subBattery;
    this.elapsed = save.elapsed;
    Object.assign(this.inventory, EMPTY_INVENTORY, save.inventory);
    this.crafted.splice(0, Infinity, ...save.crafted);
    this.logs.splice(0, Infinity, ...save.logs);
  }

  tick(delta: number, depth: number, surfaced: boolean, inSub: boolean): void {
    this.elapsed += delta;
    this.hunger = Math.max(0, this.hunger - delta * 0.026);
    this.water = Math.max(0, this.water - delta * 0.043);
    if (surfaced) this.oxygen = this.maxOxygen;
    else if (!inSub) {
      const depthPressure = 1 + depth / 180;
      this.oxygen = Math.max(0, this.oxygen - delta * OXYGEN_DRAIN_RATE * depthPressure);
    }
    if (inSub) this.subBattery = Math.max(0, this.subBattery - delta * 0.11);
    if (this.oxygen <= 0 || this.water <= 0 || this.hunger <= 0) this.damage(delta * 4.5);
    if (!inSub && depth > 78) this.damage(delta * (depth - 78) * 0.055);
    if (inSub && depth > this.crushDepth) this.damage(delta * (depth - this.crushDepth) * 0.18);
  }

  collect(resource: ResourceId): string {
    this.inventory[resource] += 1;
    return `Collected ${RESOURCE_NAMES[resource]}`;
  }

  addMeat(amount: number): void {
    this.inventory.meat += amount;
  }

  repair(amount: number): number {
    const restored = Math.min(amount, 100 - this.health);
    this.health += restored;
    return restored;
  }

  usePowerCell(): boolean {
    if (this.inventory.cell <= 0) return false;
    this.inventory.cell -= 1;
    return true;
  }

  eatMeat(): string {
    if (this.inventory.meat <= 0) return 'No fish meat in inventory';
    this.inventory.meat -= 1;
    this.hunger = Math.min(100, this.hunger + 34);
    this.health = Math.min(100, this.health + 8);
    return 'Fish meat eaten · food +34 · health +8';
  }

  addLog(logId: string): boolean {
    if (this.logs.includes(logId)) return false;
    this.logs.push(logId);
    return true;
  }

  craft(recipeId: RecipeId): CraftResult {
    const recipe = RECIPES.find((item) => item.id === recipeId);
    if (!recipe) return { ok: false, message: 'Unknown blueprint' };
    if (!recipe.repeatable && this.crafted.includes(recipeId)) return { ok: false, message: 'Already fabricated' };
    if (recipe.requires && !this.crafted.includes(recipe.requires)) return { ok: false, message: 'Blueprint prerequisite missing' };
    const missing = Object.entries(recipe.cost).find(([id, amount]) => this.inventory[id as ResourceId] < (amount ?? 0));
    if (missing) return { ok: false, message: `Need more ${RESOURCE_NAMES[missing[0] as ResourceId]}` };
    Object.entries(recipe.cost).forEach(([id, amount]) => {
      this.inventory[id as ResourceId] -= amount ?? 0;
    });
    if (!this.crafted.includes(recipeId)) this.crafted.push(recipeId);
    if (recipeId === 'battery') this.inventory.cell += 1;
    if (recipeId === 'tank') this.oxygen = this.maxOxygen;
    return { ok: true, message: `${recipe.name} fabricated` };
  }

  damage(amount: number): boolean {
    this.health = Math.max(0, this.health - amount);
    return this.health <= 0;
  }

  servicePod(): void {
    this.health = 100;
    this.oxygen = this.maxOxygen;
    this.hunger = 100;
    this.water = 100;
    if (this.crafted.includes('charger') || this.subBattery < 12) this.subBattery = 100;
  }

  makeSave(position: [number, number, number], inSub: boolean): OceanSave {
    return {
      version: 1,
      position,
      inSub,
      inventory: { ...this.inventory },
      crafted: [...this.crafted],
      logs: [...this.logs],
      health: this.health,
      oxygen: this.oxygen,
      hunger: this.hunger,
      water: this.water,
      subBattery: this.subBattery,
      elapsed: this.elapsed,
    };
  }
}
