import * as THREE from 'three';
import type { CreatureSystem } from './CreatureSystem';
import { MultiToolEffects } from './MultiToolEffects';
import { colorMultiTool, createMultiToolModel, moduleIndex } from './MultiToolModel';
import { getMultiToolSpec, type MultiToolModule } from './multitoolCatalog';
import type { WeaponHit } from './creatureRuntime';

export interface MultiToolAction {
  fired: boolean;
  hit: WeaponHit | null;
  module: MultiToolModule;
  repaired: number;
  repelled: number;
}

export interface MultiToolMotion {
  moving: boolean;
  accelerating: boolean;
  lowOxygen: boolean;
}

export class OceanMultiTool {
  readonly rig = createMultiToolModel();
  readonly model = this.rig.root;
  module: MultiToolModule = 'mining';
  battery = 100;
  temperature = 18;
  private readonly effects: MultiToolEffects;
  private nextActionAt = 0;
  private actionAt = -Infinity;
  private switchAt = -Infinity;
  private rechargeAt = -Infinity;

  constructor(scene: THREE.Scene) { this.effects = new MultiToolEffects(scene); }

  equip(module: MultiToolModule, now: number): boolean {
    if (module === this.module) return false;
    this.module = module;
    this.switchAt = now;
    colorMultiTool(this.rig, getMultiToolSpec(module).color);
    return true;
  }

  use(now: number, origin: THREE.Vector3, direction: THREE.Vector3, creatures: CreatureSystem): MultiToolAction {
    const spec = getMultiToolSpec(this.module);
    const empty = { fired: false, hit: null, module: this.module, repaired: 0, repelled: 0 };
    if (now < this.nextActionAt || this.battery < spec.cost) return empty;
    this.nextActionAt = now + spec.cooldown;
    this.actionAt = now;
    this.battery = Math.max(0, this.battery - spec.cost);
    this.temperature = Math.min(100, this.temperature + spec.cost * 1.25);
    const aim = direction.clone().normalize();
    const start = origin.clone().addScaledVector(aim, .8);
    const end = origin.clone().addScaledVector(aim, spec.range);
    let hit: WeaponHit | null = null;
    let repelled = 0;
    if (spec.mode === 'beam' || spec.mode === 'projectile') {
      hit = creatures.hit(origin, aim, spec.range, spec.damage, now / 1000);
      if (hit) end.copy(hit.point);
      if (spec.mode === 'beam') this.effects.beam(now, start, end, spec.color);
      else this.effects.harpoon(now, start, end, spec.color);
    } else if (spec.mode === 'pulse') {
      repelled = creatures.repulse(origin, aim, spec.range, 5.5, now / 1000);
      this.effects.pulse(now, start, spec.color);
    } else if (spec.mode === 'scan') this.effects.scan(now, start, spec.color);
    else this.effects.sparks(now, start, spec.color, 12);
    vibrate(spec.mode === 'pulse' ? 45 : 18);
    return { fired: true, hit, module: this.module, repaired: spec.mode === 'repair' ? 7 : 0, repelled };
  }

  recharge(now: number): boolean {
    if (this.battery > 92) return false;
    this.battery = 100;
    this.temperature = 12;
    this.rechargeAt = now;
    return true;
  }

  update(now: number, hidden: boolean, motion: MultiToolMotion): void {
    this.model.visible = !hidden;
    this.effects.update(now);
    this.temperature = Math.max(12, this.temperature - .035);
    const action = Math.max(0, 1 - (now - this.actionAt) / 360);
    const switching = Math.max(0, 1 - (now - this.switchAt) / 620);
    const recharge = Math.max(0, 1 - (now - this.rechargeAt) / 1050);
    const breathe = Math.sin(now * (motion.lowOxygen ? .006 : .0022));
    const swim = motion.moving ? Math.sin(now * .008) : 0;
    const sprint = motion.accelerating ? 1 : 0;
    this.model.position.set(.38 + swim * .012, -.32 + breathe * .008 - sprint * .08 + recharge * .15, -.7 + action * .16 + switching * .24);
    this.model.rotation.set(-.05 + action * .08, -.12 + swim * .025, -.04 + breathe * .012 + switching * .5 - recharge * .7);
    this.rig.rotor.rotation.z = moduleIndex(this.module) * Math.PI * .4 + switching * Math.PI * 1.6;
    this.rig.rails.forEach((rail, index) => { rail.position.z = -.18 + action * (.05 + index * .018) + switching * .12; });
    this.rig.emitter.scale.setScalar(1 + action * .32);
    this.rig.screen.emissiveIntensity = this.battery < 18 ? 1.1 + Math.sin(now * .012) : 2.5 + action * 3;
  }

  ready(now: number): boolean { return now >= this.nextActionAt && this.battery >= getMultiToolSpec(this.module).cost; }
  dispose(): void { this.effects.dispose(); }
}

function vibrate(duration: number): void {
  if ('vibrate' in navigator) navigator.vibrate(duration);
}
