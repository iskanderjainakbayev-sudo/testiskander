import type * as THREE from 'three';
import { createNacreSurface } from '../nacre';
import { createLandingEquipment } from '../surface/createLandingEquipment';
import { createSolaceSurface } from '../surface/createSolaceSurface';
import type { GameMode, LandablePlanetId } from '../types';
import type { InputController } from './InputController';
import type { OdysseySession } from './OdysseySession';
import { SurfaceController } from './SurfaceController';

export interface PlanetSurface {
  group: THREE.Group;
  sampleSites: THREE.Object3D[];
  getHeight: (x: number, z: number) => number;
  update: (time: number, camera: THREE.Camera) => void;
  dispose: () => void;
}

interface Expedition {
  surface: PlanetSurface;
  walker: SurfaceController;
  rootZ: number;
  locationName: string;
}

export class PlanetExpeditions {
  private readonly expeditions: Record<LandablePlanetId, Expedition>;

  constructor(scene: THREE.Scene, private readonly session: OdysseySession) {
    const solace = createSolaceSurface();
    const nacre = createNacreSurface();
    nacre.group.add(createLandingEquipment(nacre.getHeight, 28));
    this.expeditions = {
      solace: {
        surface: solace,
        walker: new SurfaceController(solace.getHeight, solace.sampleSites, 45, 28),
        rootZ: 75,
        locationName: 'SOLACE / RAINSHELF 04',
      },
      nacre: {
        surface: nacre,
        walker: new SurfaceController(
          nacre.getHeight,
          nacre.sampleSites,
          28,
          11,
          'INTERFACE WITH PRISM CHOIR',
        ),
        rootZ: 58,
        locationName: 'NACRE / SILICA CANYON 07',
      },
    };
    scene.add(solace.group, nacre.group);
  }

  get active() { return this.expeditions[this.session.landingTarget]; }
  get surface() { return this.active.surface; }
  get walker() { return this.active.walker; }
  get rootZ() { return this.active.rootZ; }
  get locationName() { return this.active.locationName; }

  reset() {
    Object.values(this.expeditions).forEach(({ walker }) => walker.resetExpedition());
  }

  restore(solaceSamples: number[], nacreSamples: number[]) {
    this.expeditions.solace.walker.restoreExpedition(solaceSamples);
    this.expeditions.nacre.walker.restoreExpedition(nacreSamples);
  }

  nearbyInteraction() {
    const nearby = this.walker.nearbyAction();
    return nearby ? `E  ·  ${nearby.label}` : null;
  }

  interact(input: InputController) {
    const nearby = this.walker.nearbyAction();
    if (!nearby) return this.session.audio.ui('error');
    if (nearby.action.type === 'takeoff') return this.session.beginTakeoff(input);
    this.walker.completeSample(nearby.action.index);
    this.session.recordSurfaceSample(nearby.action.index);
    this.session.audio.discovery();
    this.session.mission.showTransmission(this.sampleTransmission());
  }

  syncVisibility(mode: GameMode, progress: number, space: THREE.Object3D, ship: THREE.Object3D) {
    const surfaceVisible = mode === 'surface'
      || (mode === 'landing' && progress > 0.5)
      || (mode === 'takeoff' && progress < 0.59);
    const spaceVisible = mode !== 'surface'
      && !(mode === 'landing' && progress > 0.63)
      && !(mode === 'takeoff' && progress < 0.53);
    Object.entries(this.expeditions).forEach(([id, expedition]) => {
      expedition.surface.group.visible = id === this.session.landingTarget && surfaceVisible;
    });
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
    Object.values(this.expeditions).forEach(({ surface }) => {
      if (surface.group.visible) surface.update(time, camera);
    });
  }

  dispose() {
    Object.values(this.expeditions).forEach(({ surface }) => surface.dispose());
  }

  private sampleTransmission() {
    const count = this.walker.samples.size;
    if (this.session.landingTarget === 'nacre') {
      return count < 3
        ? `NACRE SILICA CHOIR // PRISM ${count}/3 CALIBRATED.`
        : 'NACRE SILICA CHOIR // VECTOR HARMONICS STABLE. LYRA MAY DEPART.';
    }
    return count < 3
      ? `SOLACE BIOSPHERE // ECHO BLOOM ${count}/3 CATALOGUED.`
      : 'SOLACE BIOSPHERE // THREE HARMONICS AGREE. LYRA MAY DEPART.';
  }
}

function smoothstep(start: number, end: number, value: number) {
  const ratio = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return ratio * ratio * (3 - 2 * ratio);
}
