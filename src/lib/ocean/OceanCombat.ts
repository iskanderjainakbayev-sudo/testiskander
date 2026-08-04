import type * as THREE from 'three';
import type { InputController } from './InputController';
import { CreatureSystem, type PredatorAlert } from './CreatureSystem';
import { OceanWeapons } from './OceanWeapons';
import type { OceanAudio } from './OceanAudio';
import type { OceanState } from './OceanState';
import type { PlayerController } from './PlayerController';
import type { OceanEnvironment } from './environment';
import { getOceanClimate } from './climate';
import type { MultiToolModule } from './multitoolCatalog';

export class OceanCombat {
  private readonly creatures: CreatureSystem;
  private readonly weapons: OceanWeapons;
  private readonly camera: THREE.Camera;
  private damageFlashUntil = 0;
  private weaponNoiseUntil = 0;
  private explosionUntil = 0;
  threat: PredatorAlert | null = null;

  constructor(
    environment: OceanEnvironment,
    private readonly input: InputController,
    private readonly state: OceanState,
    private readonly audio: OceanAudio,
    private readonly toast: (message: string, duration: number) => void,
  ) {
    this.camera = environment.camera;
    this.creatures = new CreatureSystem(environment.scene);
    this.weapons = new OceanWeapons(environment.camera, environment.scene);
  }

  update(
    delta: number,
    now: number,
    time: number,
    player: PlayerController,
    inSub: boolean,
    lightsOn: boolean,
  ): void {
    const wantsPulse = this.input.consume('KeyX');
    const wantsShot = this.input.isDown('Mouse0') || this.input.consume('KeyR');
    const modules: MultiToolModule[] = ['mining', 'harpoon', 'repulsor', 'scanner', 'repair'];
    modules.forEach((module, index) => {
      if (this.input.consume(`Digit${index + 1}`)) this.equip(module, now);
    });
    if (wantsPulse) {
      this.equip('repulsor', now);
      if (!inSub) this.fire(now, player);
    } else if (wantsShot && !inSub) this.fire(now, player);
    if (this.input.consume('KeyC')) this.recharge(now);
    this.weapons.update(now, inSub, {
      moving: player.moving,
      accelerating: player.accelerating,
      lowOxygen: this.state.oxygen < 22,
    });
    const climate = getOceanClimate(this.state.elapsed);
    this.threat = this.creatures.update(delta, time, player.position, inSub, {
      lightsOn,
      vehicleNoise: inSub ? .9 : 0,
      weaponNoise: now < this.weaponNoiseUntil ? 1 : 0,
      explosion: now < this.explosionUntil ? 1 : 0,
      movement: player.accelerating ? 1 : player.moving ? .48 : .05,
      dayPhase: climate.phase,
      weather: climate.weather,
    }, (damage, creature, soundHz, attack) => {
      this.state.damage(damage);
      this.damageFlashUntil = now + 520;
      this.toast(`${creature} attack · -${Math.round(damage)} health`, 1700);
      this.audio.creatureAttack(creature === 'Abyssal Dragon', soundHz, attack);
    });
    this.audio.setBossNear(Boolean(this.threat?.isBoss));
    if (this.threat && this.threat.distance < 24) {
      this.audio.creatureNearby(now, this.threat.soundHz, this.threat.mode);
    }
  }

  weaponReady(now: number): boolean {
    return this.weapons.ready(now);
  }

  specialWeaponReady(now: number): boolean {
    return this.weapons.specialReady(now);
  }

  get activeWeapon() { return this.weapons.active; }
  get toolBattery() { return this.weapons.battery; }
  get toolTemperature() { return this.weapons.temperature; }

  damageFlashing(now: number): boolean {
    return now < this.damageFlashUntil;
  }

  dispose(): void {
    this.weapons.dispose(this.camera);
  }

  private fire(now: number, player: PlayerController): void {
    const shot = this.weapons.use(now, player.position, player.forward(), this.creatures);
    if (!shot.fired) return;
    this.weaponNoiseUntil = now + (shot.weapon === 'scanner' || shot.weapon === 'repair' ? 350 : 1700);
    if (shot.weapon === 'repulsor') this.explosionUntil = now + 2100;
    this.audio.multiTool(shot.weapon);
    if (shot.weapon === 'scanner') this.toast('Echo sweep complete · signatures mapped', 1300);
    if (shot.weapon === 'repulsor') this.toast(`Pressure wave · ${shot.repelled} targets displaced`, 1100);
    if (shot.repaired > 0) {
      const restored = this.state.repair(shot.repaired);
      this.toast(restored > 0 ? `Suit integrity +${Math.round(restored)}` : 'Suit integrity nominal', 1100);
    }
    if (!shot.hit) return;
    this.audio.weaponHit();
    const hit = shot.hit;
    if (hit.killed) {
      const meat = hit.isBoss ? 5 : 1;
      this.state.addMeat(meat);
      this.toast(`${hit.name} neutralized · +${meat} fish meat`, hit.isBoss ? 2600 : 1700);
      return;
    }
    const message = `${shot.weapon === 'harpoon' ? 'Tether impact · ' : ''}${hit.name} · ${Math.ceil(hit.health)}/${hit.maxHealth}`;
    this.toast(message, hit.isBoss ? 2200 : 1300);
  }

  private equip(weapon: MultiToolModule, now: number): void {
    if (this.weapons.equip(weapon, now)) this.audio.weaponSwitch();
  }

  private recharge(now: number): void {
    if (this.weapons.battery > 92) {
      this.toast('Power cell already charged', 900);
      return;
    }
    if (!this.state.usePowerCell()) {
      this.toast('No spare power cell', 1100);
      return;
    }
    this.weapons.recharge(now);
    this.audio.toolRecharge();
    this.toast('Power cell replaced · 100%', 1300);
  }
}
