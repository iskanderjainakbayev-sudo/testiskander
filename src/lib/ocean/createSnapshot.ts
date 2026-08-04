import type { OceanState } from './OceanState';
import type { PlayerController } from './PlayerController';
import { biomeAt } from './biomes';
import { getOceanClimate } from './climate';
import type { PredatorAlert } from './CreatureSystem';
import type { Interactable, OceanSnapshot, OceanWeapon } from './types';

interface SnapshotOptions {
  fps: number;
  interaction: Interactable | null;
  toast: string;
  showToast: boolean;
  inSub: boolean;
  lightsOn: boolean;
  threat: PredatorAlert | null;
  damageFlash: boolean;
  weaponReady: boolean;
  specialWeaponReady: boolean;
  toolBattery: number;
  toolTemperature: number;
  activeWeapon: OceanWeapon;
  objectiveTarget: { position: import('three').Vector3; label: string };
  nearbySite: { name: string; distance: number };
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
  const forward = player.forward().setY(0).normalize();
  const toObjective = options.objectiveTarget.position.clone().sub(player.position).setY(0);
  const objectiveDistance = toObjective.length();
  const climate = getOceanClimate(state.elapsed);
  toObjective.normalize();
  const objectiveAngle = Math.atan2(
    forward.x * toObjective.z - forward.z * toObjective.x,
    forward.dot(toObjective),
  );
  return {
    fps: options.fps,
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
    biome: biomeAt(player.position),
    weather: climate.weather,
    dayPhase: climate.phase,
    nearbySite: options.nearbySite.name,
    nearbySiteDistance: options.nearbySite.distance,
    objective: state.objective,
    objectiveAngle,
    objectiveDistance,
    objectiveLabel: options.objectiveTarget.label,
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
    activeWeapon: options.activeWeapon,
    weaponReady: options.weaponReady,
    specialWeaponReady: options.specialWeaponReady,
    toolBattery: options.toolBattery,
    toolTemperature: options.toolTemperature,
  };
}
