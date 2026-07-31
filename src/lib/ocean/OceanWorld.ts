import { createSnapshot } from './createSnapshot';
import { createDecorations } from './decorations';
import { OceanEnvironment } from './environment';
import { InputController } from './InputController';
import { OceanAudio } from './OceanAudio';
import { OceanCombat } from './OceanCombat';
import { OceanControls } from './OceanControls';
import { OceanInteraction } from './OceanInteraction';
import { OceanSessionActions } from './OceanSessionActions';
import { OceanState } from './OceanState';
import { PlayerController } from './PlayerController';
import { biomeAtDepth } from './terrain';
import type { Interactable, OceanSnapshot, RecipeId, WorldEvent } from './types';
import { WorldContent } from './WorldContent';

export class OceanWorld {
  private readonly environment: OceanEnvironment;
  private readonly input: InputController;
  private readonly player: PlayerController;
  private readonly state = new OceanState();
  private readonly content: WorldContent;
  private readonly combat: OceanCombat;
  private readonly audio = new OceanAudio();
  private readonly interaction: OceanInteraction;
  private readonly controls: OceanControls;
  private readonly actions: OceanSessionActions;
  private running = false;
  private paused = true;
  private inSub = false;
  private lightsOn = false;
  private currentInteraction: Interactable | null = null;
  private toast = '';
  private toastUntil = 0;
  private frame = 0;
  private lastTime = performance.now();
  private lastSnapshot = 0;
  private lastSave = 0;
  private failed = false;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly onSnapshot: (snapshot: OceanSnapshot) => void,
    private readonly onEvent: (event: WorldEvent) => void,
  ) {
    this.environment = new OceanEnvironment(canvas);
    const decor = createDecorations(this.environment.scene);
    this.content = new WorldContent(this.environment.scene, decor);
    this.input = new InputController(canvas, (locked) => {
      if (!locked && this.running && !this.paused) this.pauseFor('pause');
    });
    this.player = new PlayerController(this.environment.camera, this.input);
    this.combat = new OceanCombat(
      this.environment, this.input, this.state, this.audio,
      (message, duration) => this.showToast(message, duration),
    );
    this.interaction = new OceanInteraction(
      this.state, this.content, this.audio, this.player,
      (message, duration) => this.showToast(message, duration),
    );
    this.controls = new OceanControls(
      this.input, this.state, this.content, this.audio, this.interaction,
      (message, duration) => this.showToast(message, duration),
    );
    this.actions = new OceanSessionActions(
      this.state, this.player, this.content, this.audio,
      (message, duration) => this.showToast(message, duration),
    );
    window.addEventListener('resize', this.environment.resize);
    this.publish(performance.now());
    this.frame = requestAnimationFrame(this.loop);
  }

  startNew(): void {
    this.actions.newDive();
    this.startSession(false);
  }

  continue(): void {
    const save = this.actions.loadDive();
    if (!save) this.actions.newDive();
    this.startSession(save?.inSub ?? false);
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) this.input.releaseLock();
    else if (this.running) this.input.requestLock();
  }

  requestInput(): void {
    if (this.running && !this.paused) this.input.requestLock();
  }

  setVirtualKey(code: string, active: boolean): void {
    this.input.setVirtualKey(code, active);
  }

  craft(recipeId: RecipeId): boolean {
    const result = this.actions.craft(recipeId);
    this.publish(performance.now());
    return result;
  }

  save(): void {
    this.actions.save(this.inSub);
    this.lastSave = performance.now();
    this.publish(performance.now());
  }

  dispose(): void {
    cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.environment.resize);
    this.input.dispose();
    this.audio.stop();
    this.combat.dispose();
    this.environment.dispose();
  }

  private startSession(inSub: boolean): void {
    this.running = true;
    this.inSub = inSub;
    this.lightsOn = false;
    this.actions.prepare();
    if (inSub) this.content.setSubVisible(false);
    this.setPaused(false);
  }

  private readonly loop = (now: number) => {
    if (this.failed) return;
    this.frame = requestAnimationFrame(this.loop);
    try {
      const delta = Math.min(0.05, (now - this.lastTime) / 1000);
      this.lastTime = now;
      const time = now / 1000;
      if (this.running && !this.paused) this.update(delta, now, time);
      const depth = Math.max(0, -this.player.position.y);
      this.environment.update(time, biomeAtDepth(depth), this.lightsOn || this.inSub);
      this.environment.render();
      if (now - this.lastSnapshot > 110) this.publish(now);
    } catch {
      this.failed = true;
      cancelAnimationFrame(this.frame);
      this.onEvent('fatal');
    }
  };

  private update(delta: number, now: number, time: number): void {
    this.player.update(delta, this.state, this.inSub);
    if (this.player.moving) this.audio.swim(now, this.player.accelerating);
    const depth = Math.max(0, -this.player.position.y);
    this.state.tick(delta, depth, depth < 0.8, this.inSub);
    this.content.update(now, time);
    this.combat.update(delta, now, time, this.player, this.inSub);
    this.currentInteraction = this.content.nearest(this.player.position, this.player.forward());
    const control = this.controls.update(now, this.inSub, this.lightsOn, this.currentInteraction);
    this.inSub = control.inSub;
    this.lightsOn = control.lightsOn;
    if (control.event) this.pauseFor(control.event);
    if (this.state.oxygen < 22 && !this.inSub) this.audio.lowOxygen(now);
    if (this.state.health <= 0) this.respawn();
    if (now - this.lastSave > 120_000) this.save();
  }

  private pauseFor(event: WorldEvent): void {
    this.paused = true;
    this.input.releaseLock();
    this.onEvent(event);
  }

  private respawn(): void {
    this.inSub = false;
    this.actions.respawn();
  }

  private showToast(message: string, duration: number): void {
    this.toast = message;
    this.toastUntil = performance.now() + duration;
  }

  private publish(now: number): void {
    this.lastSnapshot = now;
    this.onSnapshot(createSnapshot(this.state, this.player, {
      interaction: this.currentInteraction,
      toast: this.toast,
      showToast: now < this.toastUntil,
      inSub: this.inSub,
      lightsOn: this.lightsOn,
      threat: this.combat.threat,
      activeWeapon: this.combat.activeWeapon,
      damageFlash: this.combat.damageFlashing(now),
      weaponReady: this.combat.weaponReady(now),
      specialWeaponReady: this.combat.specialWeaponReady(now),
    }));
  }
}
