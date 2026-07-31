import * as THREE from 'three';
import type { OceanAudio } from './OceanAudio';
import type { OceanState } from './OceanState';
import type { PlayerController } from './PlayerController';
import { clearOceanSave, readOceanSave, writeOceanSave } from './save';
import type { OceanSave, RecipeId } from './types';
import type { WorldContent } from './WorldContent';

export class OceanSessionActions {
  constructor(
    private readonly state: OceanState,
    private readonly player: PlayerController,
    private readonly content: WorldContent,
    private readonly audio: OceanAudio,
    private readonly toast: (message: string, duration: number) => void,
  ) {}

  newDive(): void {
    clearOceanSave();
    this.state.reset();
    this.player.reset();
  }

  loadDive(): OceanSave | null {
    const save = readOceanSave();
    if (!save) return null;
    this.state.restore(save);
    this.player.reset(save.position);
    return save;
  }

  prepare(): void {
    this.content.reconcile(this.state.crafted, this.state.logs);
    if (this.state.crafted.includes('submarine')) {
      this.content.setSubPosition(this.player.position.clone().add(new THREE.Vector3(4, 0, 0)));
    }
    this.audio.start();
    this.toast('WASD swim · Shift accelerate · LMB fire · X Dragonbreaker pulse', 6200);
  }

  craft(recipeId: RecipeId): boolean {
    const result = this.state.craft(recipeId);
    this.toast(result.message, result.ok ? 3200 : 2200);
    if (result.ok) {
      this.audio.discovery();
      this.content.reconcile(this.state.crafted, this.state.logs);
    } else {
      this.audio.danger();
    }
    return result.ok;
  }

  save(inSub: boolean): void {
    const { x, y, z } = this.player.position;
    writeOceanSave(this.state.makeSave([x, y, z], inSub));
    this.toast('Dive saved', 2200);
  }

  respawn(): void {
    this.state.servicePod();
    this.player.reset();
    this.toast('Pod med-system recovered you', 3600);
  }
}
