export type FireMode = "AUTO" | "BURST" | "SCATTER" | "PIERCE" | "DOUBLE";

export type WeaponStats = {
  magazine: number;
  reserve: number;
  fireDelay: number;
  reloadTime: number;
  damage: number;
  fireMode: FireMode;
  pellets: number;
  spread: number;
};

export type WeaponAssets = {
  model: string;
  textureSet: string;
  sounds: { fire: string; reload: string; inspect: string };
  animations: { idle: string; reload: string; inspect: string };
  muzzleFlash: { color: number; intensity: number };
  attachments: ("optic" | "muzzle" | "underbarrel" | "magazine")[];
};

export type WeaponDefinition = { id: string; name: string; stats: WeaponStats; assets: WeaponAssets };

const damageBoost = 1.55;

const scaleDamage = (damage: number) => Number((damage * damageBoost).toFixed(2));

export const weaponCatalog: WeaponDefinition[] = [
  weapon("ar9", "AR-9", auto(24, 96, 105, 1100, 1.55), ["optic", "muzzle", "underbarrel", "magazine"]),
  weapon("volt-smg", "VOLT SMG", auto(36, 144, 68, 1350, 1.35), ["optic", "muzzle", "magazine"]),
  weapon("sable-sr", "SABLE SR", pierce(5, 30, 680, 1750, 4.25), ["optic", "muzzle", "magazine"]),
  weapon("breach-8", "BREACH-8", scatter(8, 40, 560, 1550, 1.6, 8, 0.09), ["muzzle", "underbarrel", "magazine"]),
  weapon("m9-pistol", "M9 PISTOL", auto(12, 72, 180, 900, 1.45), ["muzzle", "magazine"]),
  weapon("ranger-br3", "RANGER BR-3", burst(27, 108, 360, 1450, 1.85), ["optic", "muzzle", "underbarrel", "magazine"]),
  weapon("ember-6", "EMBER-6", scatter(6, 36, 760, 1800, 1.55, 12, 0.14), ["muzzle", "underbarrel", "magazine"]),
  weapon("spectre-11", "SPECTER-11", auto(20, 120, 70, 1300, 1.7), ["optic", "muzzle", "underbarrel", "magazine"]),
  weapon("lancer-1", "LANCER-1", pierce(4, 24, 950, 2050, 5.8), ["optic", "muzzle", "magazine"]),
  weapon("falcon-9", "FALCON-9", double(18, 90, 280, 1300, 2.35), ["optic", "muzzle", "magazine"]),
  weapon("vector-0", "VECTOR-0", pierce(7, 35, 540, 1850, 3.5), ["optic", "muzzle", "magazine"]),
];

export function getWeapon(slot: number) { return weaponCatalog[slot - 1] ?? weaponCatalog[0]; }

function auto(magazine: number, reserve: number, fireDelay: number, reloadTime: number, damage: number): WeaponStats {
  return { magazine, reserve, fireDelay, reloadTime, damage: scaleDamage(damage), fireMode: "AUTO", pellets: 1, spread: 0 };
}

function burst(magazine: number, reserve: number, fireDelay: number, reloadTime: number, damage: number): WeaponStats {
  return { magazine, reserve, fireDelay, reloadTime, damage: scaleDamage(damage), fireMode: "BURST", pellets: 1, spread: 0 };
}

function scatter(magazine: number, reserve: number, fireDelay: number, reloadTime: number, damage: number, pellets: number, spread: number): WeaponStats {
  return { magazine, reserve, fireDelay, reloadTime, damage: scaleDamage(damage), fireMode: "SCATTER", pellets, spread };
}

function pierce(magazine: number, reserve: number, fireDelay: number, reloadTime: number, damage: number): WeaponStats {
  return { magazine, reserve, fireDelay, reloadTime, damage: scaleDamage(damage), fireMode: "PIERCE", pellets: 1, spread: 0 };
}

function double(magazine: number, reserve: number, fireDelay: number, reloadTime: number, damage: number): WeaponStats {
  return { magazine, reserve, fireDelay, reloadTime, damage: scaleDamage(damage), fireMode: "DOUBLE", pellets: 2, spread: 0.035 };
}

function weapon(id: string, name: string, stats: WeaponStats, attachments: WeaponAssets["attachments"]): WeaponDefinition {
  return {
    id, name, stats,
    assets: {
      model: `weapons/${id}.glb`, textureSet: `textures/weapons/${id}/`,
      sounds: { fire: `sounds/weapons/${id}-fire.ogg`, reload: `sounds/weapons/${id}-reload.ogg`, inspect: `sounds/weapons/${id}-inspect.ogg` },
      animations: { idle: `animations/weapons/${id}-idle.glb`, reload: `animations/weapons/${id}-reload.glb`, inspect: `animations/weapons/${id}-inspect.glb` },
      muzzleFlash: { color: stats.fireMode === "PIERCE" ? 0xffcf70 : 0x9fffee, intensity: stats.fireMode === "SCATTER" ? 3.4 : 2.6 }, attachments,
    },
  };
}
