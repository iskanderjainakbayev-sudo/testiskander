import type { EclipseWorldSnapshot } from '../../lib/eclipse/EclipseWorld';
import type { EclipseSave, GameSettings } from '../../lib/eclipse/types';
import type { EclipseHudSnapshot } from './EclipseHud';
import type { EclipseInventoryItem, EclipseMapDetails, EclipseRecipe, EclipseResources, EclipseSettings } from './EclipsePanels';

export function initialHud(save: EclipseSave): EclipseHudSnapshot {
  const snapshot = save.snapshot;
  return { health: snapshot.health, maxHealth: snapshot.maxHealth, stamina: snapshot.stamina, maxStamina: 100, level: snapshot.level, xp: snapshot.experience % 100, xpToNextLevel: 100, shards: snapshot.eclipseShards, alloy: itemQuantity(snapshot.inventory, 'rift-alloy'), region: 'Neon Refuge', weather: 'Clear Eclipse', timeLabel: '18:00', objective: 'Wake up the Eclipse Beacon.', enemies: 0, quest: null, interaction: null, boss: null, toast: null, weaponName: 'Starfall Blade', ammo: 4, reserveAmmo: 12, abilityReady: false };
}

export function toUiSettings(settings: GameSettings): EclipseSettings {
  return { masterVolume: Math.round(settings.masterVolume * 100), musicVolume: Math.round(settings.musicVolume * 100), sfxVolume: Math.round(settings.effectsVolume * 100), uiScale: Math.round(settings.uiScale * 100), reducedMotion: settings.reducedMotion, colorblindMode: settings.colorblindMode === 'none' || settings.colorblindMode === 'tritanopia' ? 'off' : settings.colorblindMode, quality: settings.graphicsQuality === 'cinematic' ? 'high' : 'balanced' };
}

export function fromUiSettings(value: EclipseSettings, previous: GameSettings): GameSettings {
  return { ...previous, masterVolume: value.masterVolume / 100, musicVolume: value.musicVolume / 100, effectsVolume: value.sfxVolume / 100, uiScale: value.uiScale / 100, reducedMotion: value.reducedMotion, colorblindMode: value.colorblindMode === 'off' ? 'none' : value.colorblindMode, graphicsQuality: value.quality === 'high' ? 'cinematic' : 'balanced' };
}

export function inventoryFor(hud: EclipseWorldSnapshot): EclipseInventoryItem[] {
  return [
    { id: 'blade', name: 'Starfall Blade', description: 'Three-strike Arc Blade with a Rift Bolt focus.', quantity: 1, icon: '⚔', rarity: 'epic', equipped: true },
    { id: 'glider', name: 'Aether Glider', description: 'Hold high ground, then use G to drift on ion currents.', quantity: 1, icon: '⌁', rarity: 'rare' },
    { id: 'drone', name: 'Astra Drone', description: hud.abilityReady ? 'Awake and mapping Sky Breach.' : 'Reactivates when the Beacon comes online.', quantity: 1, icon: '◈', rarity: 'uncommon' },
    { id: 'alloy', name: 'Rift Alloy', description: 'Dense salvage from purged rift hosts.', quantity: hud.alloy, icon: '⬡', rarity: 'common' },
  ];
}

export function recipesFor(): EclipseRecipe[] {
  return [
    { id: 'tonic', name: 'Lumen Tonic', description: 'Restores 45 vitality from a compressed lunar infusion.', icon: '✚', unlocked: true, requirements: [{ resource: 'shards', amount: 2 }] },
    { id: 'pulse-lens', name: 'Pulse Lens', description: 'A Warden-reactive module. Recover its lost schematic beyond Sky Breach.', icon: '◉', unlocked: false, requirements: [{ resource: 'alloy', amount: 4 }] },
  ];
}

export function resourcesFor(hud: EclipseWorldSnapshot): EclipseResources { return { shards: hud.shards, alloy: hud.alloy }; }

export function mapFor(hud: EclipseWorldSnapshot, save: EclipseSave): EclipseMapDetails {
  return { region: hud.region, landmark: hud.boss ? 'Eclipse Warden breach' : 'Astra’s signal path', discovered: save.snapshot.discoveredRegions.length, total: 15, event: hud.boss ? 'Warden awakening' : hud.weather === 'Ion Rain' ? 'Ion rainfront' : null };
}

export function formatPlaytime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function itemQuantity(items: EclipseSave['snapshot']['inventory'], itemId: string) { return items.find((item) => item.itemId === itemId)?.quantity ?? 0; }
