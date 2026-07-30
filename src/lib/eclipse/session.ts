import type { EclipseSnapshot, InventoryStack, QuestState, RegionId } from './types';
import type { EclipseRegionId } from './regions';

export type SessionQuest = { title: string; current: number; target: number };

const regionIds: Record<EclipseRegionId, RegionId> = {
  'neon-refuge': 'neon-arcology', 'crystal-desert': 'crystal-dunes', frostbreak: 'frostpeak-range',
  rootfall: 'verdant-ruins', 'sky-breach': 'aether-isles', emberfall: 'ember-caldera',
};

export class EclipseSession {
  health: number;
  readonly maxHealth: number;
  shards: number;
  alloy: number;
  xp: number;
  level: number;
  readonly flags: Set<string>;
  readonly discovered: Set<RegionId>;
  playtime = 0;

  constructor(snapshot: EclipseSnapshot) {
    this.health = snapshot.health;
    this.maxHealth = Math.max(100, snapshot.maxHealth);
    this.shards = snapshot.eclipseShards;
    this.alloy = snapshot.inventory.find((item) => item.itemId === 'rift-alloy')?.quantity ?? 0;
    this.xp = snapshot.experience;
    this.level = snapshot.level;
    this.flags = new Set(snapshot.worldFlags);
    this.discovered = new Set(snapshot.discoveredRegions);
    this.playtime = snapshot.playtimeSeconds;
  }

  get beaconOnline() { return this.flags.has('beacon-online'); }
  get wardenDefeated() { return this.flags.has('warden-defeated'); }
  get quest(): SessionQuest {
    if (this.wardenDefeated) return { title: 'Eclipse Restored', current: 1, target: 1 };
    if (this.beaconOnline) return { title: 'A Rift Has a Heart', current: 0, target: 1 };
    if (this.shards >= 6) return { title: 'Wake the Beacon', current: 0, target: 1 };
    return { title: 'Signal in the Sand', current: this.shards, target: 6 };
  }
  get objective() {
    if (this.wardenDefeated) return 'Explore the frontier — the rift now bends to your signal.';
    if (this.beaconOnline) return 'Travel to Sky Breach and end the Eclipse Warden.';
    if (this.shards >= 6) return 'Return to Neon Refuge and activate the Eclipse Beacon.';
    return 'Harvest Lunar Shards from the fractured frontier.';
  }
  discover(region: EclipseRegionId) { this.discovered.add(regionIds[region]); }
  addResource(kind: 'shard' | 'alloy') {
    if (kind === 'shard') this.shards += 1;
    else this.alloy += 1;
  }
  addExperience(amount: number) {
    this.xp += amount;
    const nextLevel = 1 + Math.floor(this.xp / 100);
    const increased = nextLevel > this.level;
    this.level = nextLevel;
    return increased;
  }
  takeDamage(amount: number) { this.health = Math.max(0, this.health - amount); }
  heal(amount: number) { this.health = Math.min(this.maxHealth, this.health + amount); }
  activateBeacon() {
    if (this.shards < 6 || this.beaconOnline) return false;
    this.flags.add('beacon-online');
    return true;
  }
  defeatWarden() { this.flags.add('warden-defeated'); }
  canCraftTonic() { return this.shards >= 2 && this.health < this.maxHealth; }
  craftTonic() { if (!this.canCraftTonic()) return false; this.shards -= 2; this.heal(45); return true; }
  toSnapshot(position: { x: number; y: number; z: number }, region: EclipseRegionId): EclipseSnapshot {
    return {
      currentRegion: regionIds[region], position, health: this.health, maxHealth: this.maxHealth, stamina: 100,
      level: this.level, experience: this.xp, eclipseShards: this.shards, inventory: this.inventory(), quests: this.quests(),
      discoveredRegions: [...this.discovered], unlockedAbilityIds: ['dash', 'double-jump', 'grapple', ...(this.beaconOnline ? ['eclipse-pulse'] : [])],
      completedAchievementIds: this.wardenDefeated ? ['riftbreaker'] : [], worldFlags: [...this.flags], playtimeSeconds: Math.round(this.playtime),
    };
  }
  private inventory(): InventoryStack[] { return [{ itemId: 'rift-alloy', quantity: this.alloy }, { itemId: 'lunar-shard', quantity: this.shards }]; }
  private quests(): QuestState[] {
    const status = this.wardenDefeated ? 'completed' : 'active';
    return [{ questId: 'eclipse-main', status, progress: this.quest.current, target: this.quest.target, updatedAt: Date.now() }];
  }
}
