import * as THREE from 'three';
import { STORY_LOGS } from './content';
import type { OceanAudio } from './OceanAudio';
import type { OceanState } from './OceanState';
import type { PlayerController } from './PlayerController';
import type { Interactable } from './types';
import type { WorldContent } from './WorldContent';

export type InteractionOutcome = 'enterSub' | 'ending' | null;

export class OceanInteraction {
  constructor(
    private readonly state: OceanState,
    private readonly content: WorldContent,
    private readonly audio: OceanAudio,
    private readonly player: PlayerController,
    private readonly toast: (message: string, duration: number) => void,
  ) {}

  use(item: Interactable, now: number): InteractionOutcome {
    if (item.kind === 'resource' && item.resource) {
      this.toast(this.state.collect(item.resource), 1800);
      this.content.collect(item, now);
      this.audio.collect();
      return null;
    }
    if (item.kind === 'log' && item.logId && this.state.addLog(item.logId)) {
      this.toast(`PDA: ${STORY_LOGS[item.logId]?.title ?? 'Archive recovered'}`, 3800);
      this.content.collect(item, now);
      this.audio.discovery();
      return null;
    }
    if (item.kind === 'pod') {
      this.state.servicePod();
      this.toast('Pod systems restored your vitals', 2600);
      return null;
    }
    if (item.kind === 'submarine') {
      this.content.setSubVisible(false);
      this.toast('Nereid online · E to exit', 2600);
      return 'enterSub';
    }
    if (item.kind === 'rocket') return 'ending';
    return null;
  }

  exitSub(): void {
    this.content.setSubPosition(this.player.position.clone().add(new THREE.Vector3(2.5, 0, 0)));
    this.content.setSubVisible(true);
    this.toast('Exited Nereid', 1500);
  }
}

