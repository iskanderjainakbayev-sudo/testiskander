import type { InputController } from './InputController';
import { CreatureSystem, type PredatorAlert } from './CreatureSystem';
import { HarpoonSystem } from './HarpoonSystem';
import type { OceanAudio } from './OceanAudio';
import type { OceanState } from './OceanState';
import type { PlayerController } from './PlayerController';
import type { OceanEnvironment } from './environment';

export class OceanCombat {
  private readonly creatures: CreatureSystem;
  private readonly harpoon: HarpoonSystem;
  private damageFlashUntil = 0;
  threat: PredatorAlert | null = null;

  constructor(
    environment: OceanEnvironment,
    private readonly input: InputController,
    private readonly state: OceanState,
    private readonly audio: OceanAudio,
    private readonly toast: (message: string, duration: number) => void,
  ) {
    this.creatures = new CreatureSystem(environment.scene);
    this.harpoon = new HarpoonSystem(environment.camera, environment.scene);
  }

  update(delta: number, now: number, time: number, player: PlayerController, inSub: boolean): void {
    const wantsSpecial = this.input.consume('KeyX');
    const wantsShot = this.input.consume('Mouse0') || this.input.consume('KeyR');
    if ((wantsSpecial || wantsShot) && !inSub) this.fire(now, player, wantsSpecial);
    this.harpoon.update(now, inSub);
    this.threat = this.creatures.update(delta, time, player.position, inSub, (damage, creature) => {
      this.state.damage(damage);
      this.damageFlashUntil = now + 520;
      this.toast(`${creature} attack · -${Math.round(damage)} health`, 1700);
      this.audio.danger();
    });
  }

  weaponReady(now: number): boolean {
    return this.harpoon.ready(now);
  }

  specialWeaponReady(now: number): boolean {
    return this.harpoon.specialReady(now);
  }

  damageFlashing(now: number): boolean {
    return now < this.damageFlashUntil;
  }

  dispose(): void {
    this.harpoon.dispose();
  }

  private fire(now: number, player: PlayerController, special: boolean): void {
    const shot = this.harpoon.fire(now, player.position, player.forward(), this.creatures, special);
    if (!shot.fired) return;
    this.audio.harpoon();
    if (shot.special) this.toast('DRAGONBREAKER PULSE', 900);
    if (!shot.hit) return;
    this.audio.weaponHit();
    const hit = shot.hit;
    const message = hit.killed
      ? `${hit.name} neutralized`
      : `${shot.special ? 'Critical pulse · ' : ''}${hit.name} · ${Math.ceil(hit.health)}/${hit.maxHealth}`;
    this.toast(message, hit.isBoss ? 2200 : 1300);
  }
}
