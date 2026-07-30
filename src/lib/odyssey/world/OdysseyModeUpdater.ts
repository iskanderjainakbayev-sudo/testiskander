import type * as THREE from 'three';
import type { InputController } from './InputController';
import type { OdysseyCinematics } from './OdysseyCinematics';
import type { OdysseySession } from './OdysseySession';
import type { PlanetExpeditions } from './PlanetExpeditions';
import { updateLandingSequence, updateTakeoffSequence } from './updateLanding';
import { updateEnding, updateFlight, updateMenu, updateSurface, updateWalking } from './updateWorld';

export class OdysseyModeUpdater {
  constructor(
    private readonly session: OdysseySession,
    private readonly input: InputController,
    private readonly camera: THREE.PerspectiveCamera,
    private readonly cinematics: OdysseyCinematics,
    private readonly expedition: PlanetExpeditions,
  ) {}

  update(delta: number, time: number) {
    const { mode } = this.session;
    if (mode === 'walking') updateWalking(this.session, this.input, this.camera, delta);
    if (mode === 'flight') {
      updateFlight(
        this.session,
        this.input,
        this.camera,
        this.cinematics.beginLanding,
        this.cinematics.beginDiscovery,
        delta,
        time,
      );
    }
    if (mode === 'cinematic') this.cinematics.update(delta);
    if (mode === 'landing') {
      updateLandingSequence(
        this.session,
        this.expedition.surface,
        this.expedition.walker,
        this.camera,
        delta,
      );
    }
    if (mode === 'surface') {
      updateSurface(
        this.session,
        this.expedition.walker,
        this.input,
        this.camera,
        delta,
        this.handleSurfaceInteraction,
      );
    }
    if (mode === 'takeoff') {
      updateTakeoffSequence(
        this.session,
        this.expedition.surface,
        this.expedition.walker,
        this.camera,
        delta,
      );
    }
    if (mode === 'menu') updateMenu(this.camera, time);
    if (mode === 'ending') updateEnding(this.session, this.camera, delta, time);
  }

  private readonly handleSurfaceInteraction = () => {
    this.expedition.interact(this.input);
  };
}
