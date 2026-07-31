import type { OceanState } from './OceanState';
import type { PlayerController } from './PlayerController';
import { biomeAtDepth } from './terrain';
import type { PredatorAlert } from './CreatureSystem';
import type { Interactable, OceanSnapshot } from './types';

interface SnapshotOptions {
  interaction: Interactable | null;
  toast: string;
  showToast: boolean;
  inSub: boolean;
  lightsOn: boolean;
  threat: PredatorAlert | null;
  damageFlash: boolean;
  weaponReady: boolean;
  specialWeaponReady: boolean;
}

function promptFor(item: Interactable | null): string {
  if (!item) return '';
  if (item.kind === 'resource') return `[ E ] Collect ${item.label}`;
  if (item.kind === 'log') return `[ E ] Recover ${item.label}`;
  if (item.kind === 'pod') return '[ E ] Use escape pod';
  if (item.kind === 'submarine') return '[ E ] Enter Nereid';
  return '[ E ] Launch the Aster';
}

export function createSnapshot(
  state: OceanState,
  player: PlayerController,
  options: SnapshotOptions,
): OceanSnapshot {
  const depth = Math.max(0, -player.position.y);
  return {
    health: state.health,
    stamina: player.stamina,
    maxStamina: player.maxStamina,
    accelerating: player.accelerating,
    oxygen: state.oxygen,
    maxOxygen: state.maxOxygen,
    hunger: state.hunger,
    water: state.water,
    depth,
    heading: player.heading(),
    biome: biomeAtDepth(depth),
    objective: state.objective,
    inventory: { ...state.inventory },
    crafted: [...state.crafted],
    logs: [...state.logs],
    prompt: promptFor(options.interaction),
    toast: options.showToast ? options.toast : '',
    inSub: options.inSub,
    subBattery: state.subBattery,
    crushDepth: state.crushDepth,
    lightsOn: options.lightsOn,
    elapsed: state.elapsed,
    threatName: options.threat?.name ?? '',
    threatDistance: options.threat?.distance ?? 0,
    threatAttacking: options.threat?.attacking ?? false,
    damageFlash: options.damageFlash,
    threatHealth: options.threat?.health ?? 0,
    threatMaxHealth: options.threat?.maxHealth ?? 0,
    threatIsBoss: options.threat?.isBoss ?? false,
    weaponReady: options.weaponReady,
    specialWeaponReady: options.specialWeaponReady,
  };
}
