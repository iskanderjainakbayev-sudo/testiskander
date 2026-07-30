import type * as THREE from 'three';
import { createSolaceSurface } from '../surface/createSolaceSurface';
import type { GameMode } from '../types';
import type { InputController } from './InputController';
import type { OdysseySession } from './OdysseySession';
import { SurfaceController } from './SurfaceController';

export class SolaceExpedition {
  readonly surface = createSolaceSurface();
  readonly walker = new SurfaceController(
    this.surface.getHeight,
    this.surface.sampleSites,
  );

  constructor(scene: THREE.Scene) {
    scene.add(this.surface.group);
  }

  reset() {
    this.walker.resetExpedition();
  }

  nearbyInteraction() {
    const nearby = this.walker.nearbyAction();
    return nearby ? `E  ·  ${nearby.label}` : null;
  }

  interact(session: OdysseySession, input: InputController) {
    const nearby = this.walker.nearbyAction();
    if (!nearby) return session.audio.ui('error');
    if (nearby.action.type === 'takeoff') {
      session.beginTakeoff(input);
      return;
    }
    this.walker.completeSample(nearby.action.index);
    session.audio.discovery();
    const count = this.walker.samples.size;
    const message = count < 3
      ? `SOLACE BIOSPHERE // ECHO BLOOM ${count}/3 CATALOGUED.`
      : 'SOLACE BIOSPHERE // THREE HARMONICS AGREE. LYRA MAY DEPART.';
    session.mission.showTransmission(message);
  }

  syncVisibility(
    mode: GameMode,
    transitionProgress: number,
    space: THREE.Object3D,
    ship: THREE.Object3D,
  ) {
    const surfaceVisible = mode === 'surface'
      || (mode === 'landing' && transitionProgress > 0.5)
      || (mode === 'takeoff' && transitionProgress < 0.59);
    const spaceVisible = mode !== 'surface'
      && !(mode === 'landing' && transitionProgress > 0.63)
      && !(mode === 'takeoff' && transitionProgress < 0.53);
    this.surface.group.visible = surfaceVisible;
    space.visible = spaceVisible;
    ship.visible = spaceVisible;
  }

  atmosphereBlend(mode: GameMode, progress: number) {
    if (mode === 'surface') return 1;
    if (mode === 'landing') return smoothstep(0.5, 0.68, progress);
    if (mode === 'takeoff') return 1 - smoothstep(0.48, 0.63, progress);
    return 0;
  }

  update(time: number, camera: THREE.Camera) {
    if (this.surface.group.visible) this.surface.update(time, camera);
  }

  dispose() {
    this.surface.dispose();
  }
}

function smoothstep(start: number, end: number, value: number) {
  const ratio = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return ratio * ratio * (3 - 2 * ratio);
}
