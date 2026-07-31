import * as THREE from 'three';
import { CreatureSystem } from './CreatureSystem';
import { STORY_LOGS } from './content';
import { createDecorations } from './decorations';
import { OceanEnvironment } from './environment';
import { InputController } from './InputController';
import { OceanAudio } from './OceanAudio';
import { OceanState } from './OceanState';
import { PlayerController } from './PlayerController';
import { biomeAtDepth } from './terrain';
import { clearOceanSave, readOceanSave, writeOceanSave } from './save';
import type { Interactable, OceanSnapshot, RecipeId, WorldEvent } from './types';
import { WorldContent } from './WorldContent';

export class OceanWorld {
  private readonly environment: OceanEnvironment;
  private readonly input: InputController;
  private readonly player: PlayerController;
  private readonly state = new OceanState();
  private readonly content: WorldContent;
  private readonly creatures: CreatureSystem;
  private readonly audio = new OceanAudio();
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

  constructor(
    canvas: HTMLCanvasElement,
    private readonly onSnapshot: (snapshot: OceanSnapshot) => void,
    private readonly onEvent: (event: WorldEvent) => void,
  ) {
    this.environment = new OceanEnvironment(canvas);
    const decor = createDecorations(this.environment.scene);
    this.content = new WorldContent(this.environment.scene, decor);
    this.creatures = new CreatureSystem(this.environment.scene);
    this.input = new InputController(canvas, (locked) => {
      if (!locked && this.running && !this.paused) this.pauseFor('pause');
    });
    this.player = new PlayerController(this.environment.camera, this.input);
    window.addEventListener('resize', this.environment.resize);
    this.publish(performance.now());
    this.frame = requestAnimationFrame(this.loop);
  }

  startNew(): void {
    clearOceanSave();
    this.state.reset();
    this.player.reset();
    this.startSession();
  }

  continue(): void {
    const save = readOceanSave();
    if (!save) {
      this.startNew();
      return;
    }
    this.state.restore(save);
    this.player.reset(save.position);
    this.startSession();
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) this.input.releaseLock();
    else if (this.running) this.input.requestLock();
  }

  requestInput(): void {
    if (this.running && !this.paused) this.input.requestLock();
  }

  craft(recipeId: RecipeId): boolean {
    const result = this.state.craft(recipeId);
    this.showToast(result.message, result.ok ? 3200 : 2200);
    if (result.ok) {
      this.audio.discovery();
      this.content.reconcile(this.state.crafted, this.state.logs);
    } else {
      this.audio.danger();
    }
    this.publish(performance.now());
    return result.ok;
  }

  save(): void {
    const { x, y, z } = this.player.position;
    writeOceanSave(this.state.makeSave([x, y, z]));
    this.lastSave = performance.now();
    this.showToast('Dive saved', 2200);
    this.publish(performance.now());
  }

  dispose(): void {
    cancelAnimationFrame(this.frame);
    window.removeEventListener('resize', this.environment.resize);
    this.input.dispose();
    this.audio.stop();
    this.environment.dispose();
  }

  private startSession(): void {
    this.running = true;
    this.inSub = false;
    this.lightsOn = false;
    this.content.reconcile(this.state.crafted, this.state.logs);
    if (this.state.crafted.includes('submarine')) {
      this.content.setSubPosition(this.player.position.clone().add(new THREE.Vector3(4, 0, 0)));
    }
    this.audio.start();
    this.setPaused(false);
    this.showToast('WASD swim · SPACE rise · CTRL dive', 5200);
  }

  private readonly loop = (now: number) => {
    this.frame = requestAnimationFrame(this.loop);
    const delta = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    const time = now / 1000;
    if (this.running && !this.paused) this.update(delta, now, time);
    const depth = Math.max(0, -this.player.position.y);
    this.environment.update(time, biomeAtDepth(depth), this.lightsOn || this.inSub);
    this.environment.renderer.render(this.environment.scene, this.environment.camera);
    if (now - this.lastSnapshot > 110) this.publish(now);
  };

  private update(delta: number, now: number, time: number): void {
    this.player.update(delta, this.state, this.inSub);
    const depth = Math.max(0, -this.player.position.y);
    this.state.tick(delta, depth, depth < 0.8, this.inSub);
    this.content.update(now, time);
    this.creatures.update(delta, time, this.player.position, this.inSub, (damage, creature) => {
      this.state.damage(damage);
      this.showToast(`${creature} struck the hull`, 1700);
      this.audio.danger();
    });
    this.currentInteraction = this.content.nearest(this.player.position, this.player.forward());
    this.handleInput(now);
    if (this.state.oxygen < 22 && !this.inSub) this.audio.lowOxygen(now);
    if (this.state.health <= 0) this.respawn();
    if (now - this.lastSave > 120_000) this.save();
  }

  private handleInput(now: number): void {
    if (this.input.consume('KeyE')) {
      if (this.inSub) this.exitSub();
      else if (this.currentInteraction) this.interact(this.currentInteraction, now);
    }
    if (this.input.consume('KeyF') && (this.inSub || this.state.crafted.includes('flashlight'))) {
      this.lightsOn = !this.lightsOn;
      this.showToast(this.lightsOn ? 'Lights on' : 'Lights off', 1200);
    }
    if (this.input.consume('KeyQ') && this.state.crafted.includes('scanner')) {
      this.content.scan(now);
      this.audio.scan();
      this.showToast('Scanner pulse active', 2200);
    }
    if (this.input.consume('KeyC')) this.pauseFor('craft');
    if (this.input.consume('KeyJ')) this.pauseFor('pda');
  }

  private interact(item: Interactable, now: number): void {
    if (item.kind === 'resource' && item.resource) {
      this.showToast(this.state.collect(item.resource), 1800);
      this.content.collect(item, now);
      this.audio.collect();
    } else if (item.kind === 'log' && item.logId) {
      if (this.state.addLog(item.logId)) {
        this.showToast(`PDA: ${STORY_LOGS[item.logId]?.title ?? 'Archive recovered'}`, 3800);
        this.content.collect(item, now);
        this.audio.discovery();
      }
    } else if (item.kind === 'pod') {
      this.state.servicePod();
      this.showToast('Pod systems restored your vitals', 2600);
    } else if (item.kind === 'submarine') {
      this.inSub = true;
      this.content.setSubVisible(false);
      this.showToast('Nereid online · E to exit', 2600);
    } else if (item.kind === 'rocket') {
      this.pauseFor('ending');
    }
  }

  private exitSub(): void {
    this.inSub = false;
    this.content.setSubPosition(this.player.position.clone().add(new THREE.Vector3(2.5, 0, 0)));
    this.content.setSubVisible(true);
    this.showToast('Exited Nereid', 1500);
  }

  private pauseFor(event: WorldEvent): void {
    this.paused = true;
    this.input.releaseLock();
    this.onEvent(event);
  }

  private respawn(): void {
    this.inSub = false;
    this.state.servicePod();
    this.player.reset();
    this.showToast('Pod med-system recovered you', 3600);
  }

  private showToast(message: string, duration: number): void {
    this.toast = message;
    this.toastUntil = performance.now() + duration;
  }

  private publish(now: number): void {
    this.lastSnapshot = now;
    const depth = Math.max(0, -this.player.position.y);
    const prompt = this.currentInteraction ? this.promptFor(this.currentInteraction) : '';
    this.onSnapshot({
      health: this.state.health,
      oxygen: this.state.oxygen,
      maxOxygen: this.state.maxOxygen,
      hunger: this.state.hunger,
      water: this.state.water,
      depth,
      heading: this.player.heading(),
      biome: biomeAtDepth(depth),
      objective: this.state.objective,
      inventory: { ...this.state.inventory },
      crafted: [...this.state.crafted],
      logs: [...this.state.logs],
      prompt,
      toast: now < this.toastUntil ? this.toast : '',
      inSub: this.inSub,
      subBattery: this.state.subBattery,
      crushDepth: this.state.crushDepth,
      lightsOn: this.lightsOn,
      elapsed: this.state.elapsed,
    });
  }

  private promptFor(item: Interactable): string {
    if (item.kind === 'resource') return `[ E ] Collect ${item.label}`;
    if (item.kind === 'log') return `[ E ] Recover ${item.label}`;
    if (item.kind === 'pod') return '[ E ] Use escape pod';
    if (item.kind === 'submarine') return '[ E ] Enter Nereid';
    return '[ E ] Launch the Aster';
  }
}
