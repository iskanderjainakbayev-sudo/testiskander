import type { InputController } from './InputController';
import type { OceanAudio } from './OceanAudio';
import type { OceanInteraction } from './OceanInteraction';
import type { OceanState } from './OceanState';
import type { Interactable, WorldEvent } from './types';
import type { WorldContent } from './WorldContent';

export interface ControlResult {
  inSub: boolean;
  lightsOn: boolean;
  event?: WorldEvent;
}

export class OceanControls {
  constructor(
    private readonly input: InputController,
    private readonly state: OceanState,
    private readonly content: WorldContent,
    private readonly audio: OceanAudio,
    private readonly interaction: OceanInteraction,
    private readonly toast: (message: string, duration: number) => void,
  ) {}

  update(
    now: number,
    inSub: boolean,
    lightsOn: boolean,
    target: Interactable | null,
  ): ControlResult {
    let nextSub = inSub;
    let nextLights = lightsOn;
    let event: WorldEvent | undefined;
    if (this.input.consume('KeyE')) {
      if (inSub) {
        nextSub = false;
        this.interaction.exitSub();
      } else if (target) {
        const outcome = this.interaction.use(target, now);
        if (outcome === 'enterSub') nextSub = true;
        if (outcome === 'ending') event = 'ending';
      }
    }
    if (this.input.consume('KeyF') && (nextSub || this.state.crafted.includes('flashlight'))) {
      nextLights = !nextLights;
      this.toast(nextLights ? 'Lights on' : 'Lights off', 1200);
    }
    if (this.input.consume('KeyQ') && this.state.crafted.includes('scanner')) {
      this.content.scan(now);
      this.audio.scan();
      this.toast('Scanner pulse active', 2200);
    }
    if (this.input.consume('KeyC')) event = 'craft';
    if (this.input.consume('KeyJ')) event = 'pda';
    return { inSub: nextSub, lightsOn: nextLights, event };
  }
}

