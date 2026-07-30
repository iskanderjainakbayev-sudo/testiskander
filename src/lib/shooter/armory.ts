export type FinishRarity = "common" | "rare" | "epic" | "legendary";

export type WeaponFinish = {
  id: string;
  name: string;
  weapon: string;
  rarity: FinishRarity;
  color: number;
  accent: number;
  description: string;
  odds: number;
};

export const weaponFinishes: WeaponFinish[] = [
  finish("field-standard", "FIELD STANDARD", "ALL LOADOUTS", "common", 0x76e8df, 0x173d50, "Issued finish for every operative.", 0),
  finish("harbor-blue", "HARBOR BLUE", "M9 PISTOL", "common", 0x4fc3f7, 0x12314d, "Weatherproof cobalt receiver.", 32),
  finish("sunflare", "SUNFLARE", "VOLT SMG", "rare", 0xffc65a, 0x6d3512, "Heat-treated desert alloy.", 24),
  finish("nightglass", "NIGHTGLASS", "AR-9", "rare", 0x7be4f0, 0x12294a, "Low-light reactive polymer.", 20),
  finish("orchid-veil", "ORCHID VEIL", "SABLE SR", "epic", 0xdf8cff, 0x452069, "Iridescent long-range finish.", 14),
  finish("ember-crown", "EMBER CROWN", "BREACH-8", "epic", 0xff794f, 0x571716, "Hand-finished volcanic ceramic.", 8),
  finish("black-signal", "BLACK SIGNAL", "LANCER-1", "legendary", 0xf2d97d, 0x36280d, "Numbered stealth prototype blueprint.", 2),
];

export function getWeaponFinish(id: string) {
  return weaponFinishes.find((finish) => finish.id === id) ?? weaponFinishes[0];
}

export function openFieldCrate(ownedFinishIds: string[], random = Math.random) {
  const available = weaponFinishes.filter((finish) => finish.odds > 0 && !ownedFinishIds.includes(finish.id));
  if (!available.length) return undefined;
  const total = available.reduce((sum, finish) => sum + finish.odds, 0);
  let pick = random() * total;
  return available.find((finish) => {
    pick -= finish.odds;
    return pick <= 0;
  }) ?? available[available.length - 1];
}

function finish(id: string, name: string, weapon: string, rarity: FinishRarity, color: number, accent: number, description: string, odds: number): WeaponFinish {
  return { id, name, weapon, rarity, color, accent, description, odds };
}
