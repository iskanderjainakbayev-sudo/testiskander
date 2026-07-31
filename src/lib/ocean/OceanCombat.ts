import type * as THREE from 'three';
import type { InputController } from './InputController';
import { CreatureSystem, type PredatorAlert } from './CreatureSystem';
import { OceanWeapons } from './OceanWeapons';
import type { OceanAudio } from './OceanAudio';
import type { OceanState } from './OceanState';
import type { PlayerController } from './PlayerController';
import type { OceanEnvironment } from './environment';
import { getOceanClimate } from './climate';

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
    const wantsSpecial = this.input.consume('KeyX');
    const wantsShot = this.input.consume('Mouse0') || this.input.consume('KeyR');
    if (this.input.consume('Digit1')) this.equip('gun', inSub);
    if (this.input.consume('Digit2')) this.equip('knife', inSub);
    if ((wantsSpecial || wantsShot) && !inSub) this.fire(now, player, wantsSpecial);
    this.weapons.update(now, inSub);
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
  }

  weaponReady(now: number): boolean {
    return this.weapons.ready(now);
  }

  specialWeaponReady(now: number): boolean {
    return this.weapons.specialReady(now);
  }

  get activeWeapon() { return this.weapons.active; }

  damageFlashing(now: number): boolean {
    return now < this.damageFlashUntil;
  }

  dispose(): void {
    this.weapons.dispose(this.camera);
  }

  private fire(now: number, player: PlayerController, special: boolean): void {
    const shot = this.weapons.use(now, player.position, player.forward(), this.creatures, special);
    if (!shot.fired) return;
    this.weaponNoiseUntil = now + (shot.weapon === 'knife' ? 500 : 2200);
    if (shot.special) this.explosionUntil = now + 3200;
    if (shot.weapon === 'knife') this.audio.knifeSwing();
    else if (shot.special) this.audio.specialShot();
    else this.audio.gunshot();
    if (shot.special) this.toast('DRAGONBREAKER PULSE', 900);
    if (!shot.hit) return;
    if (shot.weapon === 'knife') this.audio.knifeHit();
    else this.audio.weaponHit();
    const hit = shot.hit;
    if (hit.killed) {
      const meat = hit.isBoss ? 5 : 1;
      this.state.addMeat(meat);
      this.toast(`${hit.name} neutralized · +${meat} fish meat`, hit.isBoss ? 2600 : 1700);
      return;
    }
    const message = `${shot.special ? 'Critical pulse · ' : ''}${hit.name} · ${Math.ceil(hit.health)}/${hit.maxHealth}`;
    this.toast(message, hit.isBoss ? 2200 : 1300);
  }

  private equip(weapon: 'gun' | 'knife', hidden: boolean): void {
    if (this.weapons.equip(weapon, hidden)) this.audio.weaponSwitch();
  }
}
