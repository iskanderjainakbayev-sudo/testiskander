import {
  ECLIPSE_REGION_IDS,
  ECLIPSE_SAVE_VERSION,
  createDefaultEclipseSave,
  createDefaultEclipseSnapshot,
  createDefaultGameSettings,
  type EclipseSave,
  type RegionId,
} from './types';

const SCREENS = ['title', 'exploration', 'paused', 'game-over'] as const;
const PANELS = ['inventory', 'map', 'quest-log', 'skills', 'crafting', 'settings', 'achievements'] as const;
const QUALITIES = ['performance', 'balanced', 'cinematic'] as const;
const COLORBLIND_MODES = ['none', 'protanopia', 'deuteranopia', 'tritanopia'] as const;
const QUEST_STATUSES = ['available', 'active', 'completed', 'failed'] as const;

export function migrateEclipseSave(value: unknown): EclipseSave {
  const fresh = createDefaultEclipseSave();
  if (!isRecord(value)) return fresh;
  return {
    version: ECLIPSE_SAVE_VERSION,
    savedAt: nonNegative(value.savedAt, fresh.savedAt),
    settings: readSettings(value.settings),
    ui: readUi(value.ui),
    snapshot: readSnapshot(value.snapshot),
  };
}

function readSettings(value: unknown) {
  const fallback = createDefaultGameSettings();
  if (!isRecord(value)) return fallback;
  return {
    masterVolume: bounded(value.masterVolume, fallback.masterVolume, 0, 1),
    musicVolume: bounded(value.musicVolume, fallback.musicVolume, 0, 1),
    effectsVolume: bounded(value.effectsVolume, fallback.effectsVolume, 0, 1),
    uiScale: bounded(value.uiScale, fallback.uiScale, 0.75, 1.5),
    graphicsQuality: oneOf(value.graphicsQuality, QUALITIES) ? value.graphicsQuality : fallback.graphicsQuality,
    subtitles: typeof value.subtitles === 'boolean' ? value.subtitles : fallback.subtitles,
    colorblindMode: oneOf(value.colorblindMode, COLORBLIND_MODES) ? value.colorblindMode : fallback.colorblindMode,
    reducedMotion: typeof value.reducedMotion === 'boolean' ? value.reducedMotion : fallback.reducedMotion,
  };
}

function readUi(value: unknown) {
  const fallback = createDefaultEclipseSave().ui;
  if (!isRecord(value)) return fallback;
  return {
    screen: oneOf(value.screen, SCREENS) ? value.screen : fallback.screen,
    openPanel: oneOf(value.openPanel, PANELS) ? value.openPanel : null,
    mapZoom: bounded(value.mapZoom, fallback.mapZoom, 0.5, 3),
  };
}

function readSnapshot(value: unknown) {
  const fallback = createDefaultEclipseSnapshot();
  if (!isRecord(value)) return fallback;
  return {
    ...fallback,
    currentRegion: isRegionId(value.currentRegion) ? value.currentRegion : fallback.currentRegion,
    position: readPosition(value.position, fallback.position),
    health: nonNegative(value.health, fallback.health),
    maxHealth: nonNegative(value.maxHealth, fallback.maxHealth),
    stamina: nonNegative(value.stamina, fallback.stamina),
    level: Math.max(1, Math.floor(nonNegative(value.level, fallback.level))),
    experience: nonNegative(value.experience, fallback.experience),
    eclipseShards: nonNegative(value.eclipseShards, fallback.eclipseShards),
    inventory: readInventory(value.inventory),
    quests: readQuests(value.quests),
    discoveredRegions: readRegions(value.discoveredRegions, fallback.discoveredRegions),
    unlockedAbilityIds: readStrings(value.unlockedAbilityIds, fallback.unlockedAbilityIds),
    completedAchievementIds: readStrings(value.completedAchievementIds, []),
    worldFlags: readStrings(value.worldFlags, []),
    playtimeSeconds: nonNegative(value.playtimeSeconds, 0),
  };
}

function readPosition(value: unknown, fallback: { x: number; y: number; z: number }) {
  if (!isRecord(value)) return fallback;
  return { x: finite(value.x, fallback.x), y: finite(value.y, fallback.y), z: finite(value.z, fallback.z) };
}

function readInventory(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.itemId !== 'string') return [];
    return [{ itemId: entry.itemId, quantity: Math.floor(nonNegative(entry.quantity, 0)) }];
  });
}

function readQuests(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.questId !== 'string' || !oneOf(entry.status, QUEST_STATUSES)) return [];
    return [{
      questId: entry.questId,
      status: entry.status,
      progress: nonNegative(entry.progress, 0),
      target: nonNegative(entry.target, 0),
      updatedAt: nonNegative(entry.updatedAt, 0),
    }];
  });
}

function readRegions(value: unknown, fallback: readonly RegionId[]): RegionId[] {
  if (!Array.isArray(value)) return [...fallback];
  return Array.from(new Set(value.filter(isRegionId)));
}

function readStrings(value: unknown, fallback: readonly string[]) {
  if (!Array.isArray(value)) return [...fallback];
  return Array.from(new Set(value.filter((entry): entry is string => typeof entry === 'string')));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function oneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === 'string' && options.some((option) => option === value);
}

function isRegionId(value: unknown) {
  return oneOf(value, ECLIPSE_REGION_IDS);
}

function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function nonNegative(value: unknown, fallback: number): number {
  return Math.max(0, finite(value, fallback));
}

function bounded(value: unknown, fallback: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, finite(value, fallback)));
}
