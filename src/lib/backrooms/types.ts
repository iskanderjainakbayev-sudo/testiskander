export type BackroomsLevel = {
  id: number;
  title: string;
  subtitle: string;
  palette: { wall: number; floor: number; light: number; fog: number };
  objective: string;
};

export type InventoryItem = 'flashlight' | 'battery' | 'key' | 'note' | 'medkit';

export type GameSave = {
  level: number;
  health: number;
  battery: number;
  inventory: InventoryItem[];
  collected: string[];
  settings: { sound: number; sensitivity: number; grain: boolean };
};

export type GameState = GameSave & {
  stamina: number;
  objective: string;
  message: string;
  enemyNear: boolean;
  paused: boolean;
};

export type Interactable = {
  id: string;
  label: string;
  distance: number;
};
