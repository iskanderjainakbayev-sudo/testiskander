export const ECLIPSE_SAVE_VERSION = 1;

export const ECLIPSE_REGION_IDS = [
  'neon-arcology',
  'crystal-dunes',
  'frostpeak-range',
  'verdant-ruins',
  'aether-isles',
  'underdeep',
  'ember-caldera',
  'azure-expanse',
  'lost-citadel',
  'whisperwood',
  'sky-temple',
  'deep-caves',
  'ruined-megacity',
  'helix-labs',
  'null-rift',
] as const;

export type RegionId = (typeof ECLIPSE_REGION_IDS)[number];
export type GameScreen = 'title' | 'exploration' | 'paused' | 'game-over';
export type PanelName =
  | 'inventory'
  | 'map'
  | 'quest-log'
  | 'skills'
  | 'crafting'
  | 'settings'
  | 'achievements';
export type GraphicsQuality = 'performance' | 'balanced' | 'cinematic';
export type ColorblindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
export type QuestStatus = 'available' | 'active' | 'completed' | 'failed';

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  effectsVolume: number;
  uiScale: number;
  graphicsQuality: GraphicsQuality;
  subtitles: boolean;
  colorblindMode: ColorblindMode;
  reducedMotion: boolean;
}

export interface EclipseUiState {
  screen: GameScreen;
  openPanel: PanelName | null;
  mapZoom: number;
}

export interface WorldPosition {
  x: number;
  y: number;
  z: number;
}

export interface InventoryStack {
  itemId: string;
  quantity: number;
}

export interface QuestState {
  questId: string;
  status: QuestStatus;
  progress: number;
  target: number;
  updatedAt: number;
}

export interface EclipseSnapshot {
  currentRegion: RegionId;
  position: WorldPosition;
  health: number;
  maxHealth: number;
  stamina: number;
  level: number;
  experience: number;
  eclipseShards: number;
  inventory: InventoryStack[];
  quests: QuestState[];
  discoveredRegions: RegionId[];
  unlockedAbilityIds: string[];
  completedAchievementIds: string[];
  worldFlags: string[];
  playtimeSeconds: number;
}

export interface EclipseSave {
  version: number;
  savedAt: number;
  settings: GameSettings;
  ui: EclipseUiState;
  snapshot: EclipseSnapshot;
}

export function createDefaultGameSettings(): GameSettings {
  return {
    masterVolume: 0.8,
    musicVolume: 0.65,
    effectsVolume: 0.8,
    uiScale: 1,
    graphicsQuality: 'balanced',
    subtitles: true,
    colorblindMode: 'none',
    reducedMotion: false,
  };
}

export function createDefaultEclipseSnapshot(): EclipseSnapshot {
  return {
    currentRegion: 'neon-arcology',
    position: { x: 0, y: 1.7, z: 0 },
    health: 100,
    maxHealth: 100,
    stamina: 100,
    level: 1,
    experience: 0,
    eclipseShards: 0,
    inventory: [],
    quests: [],
    discoveredRegions: ['neon-arcology'],
    unlockedAbilityIds: ['dash'],
    completedAchievementIds: [],
    worldFlags: [],
    playtimeSeconds: 0,
  };
}

export function createDefaultEclipseSave(): EclipseSave {
  return {
    version: ECLIPSE_SAVE_VERSION,
    savedAt: Date.now(),
    settings: createDefaultGameSettings(),
    ui: { screen: 'title', openPanel: null, mapZoom: 1 },
    snapshot: createDefaultEclipseSnapshot(),
  };
}
