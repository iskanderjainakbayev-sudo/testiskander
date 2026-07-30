import * as THREE from 'three';
import { CinematicDirector, type CinematicFrame, type CinematicState } from '../cinematics';
import { DISCOVERIES } from '../discoveries';
import type { LyraExterior } from '../ship/createLyraExterior';
import type { DiscoveryId, WorldCallbacks } from '../types';
import type { InputController } from './InputController';
import type { OdysseySession } from './OdysseySession';

type Outcome = { type: 'discovery'; id: DiscoveryId } | { type: 'landing' };

const TARGET_RADII: Record<DiscoveryId, number> = {
  solace: 62,
  nacre: 64,
  veil: 74,
  pilgrim: 48,
  atlas: 108,
};

export class OdysseyCinematics {
  private readonly director: CinematicDirector;
  private readonly target = new THREE.Vector3();
  private readonly frame: CinematicFrame;
  private outcome: Outcome | null = null;

  constructor(
    camera: THREE.PerspectiveCamera,
    private readonly input: InputController,
    private readonly session: OdysseySession,
    private readonly callbacks: WorldCallbacks,
    private readonly exterior: LyraExterior,
  ) {
    this.director = new CinematicDirector(camera);
    this.frame = {
      shipPosition: session.flight.position,
      shipQuaternion: session.flight.quaternion,
      targetPosition: this.target,
    };
  }

  readonly beginDiscovery = (id: DiscoveryId) => {
    this.outcome = { type: 'discovery', id };
    this.play(id, false);
  };

  beginLanding = () => {
    const target = this.session.landableTarget();
    if (!target) return;
    this.outcome = { type: 'landing' };
    this.play(target, true);
  };

  skip = () => this.director.skip();

  update(delta: number) {
    if (this.input.consume('Space') || this.input.consume('KeyX')) this.director.skip();
    const state = this.director.update(delta, this.frame);
    if (!state.justCompleted) return;
    this.exterior.setSpaceVisible(false);
    const outcome = this.outcome;
    this.outcome = null;
    if (outcome?.type === 'landing') {
      this.session.returnFromCinematic();
      this.session.beginLanding(this.input);
    } else if (outcome?.type === 'discovery' && outcome.id === 'atlas') {
      this.session.finishFinale(this.input, this.callbacks);
    } else {
      this.session.returnFromCinematic();
    }
  }

  syncShipVisibility(interior: THREE.Object3D) {
    const { active, progress } = this.director.state;
    this.exterior.setSpaceVisible(active && progress >= 0.07 && progress <= 0.92);
    if (active) interior.visible = progress < 0.025 || progress > 0.97;
  }

  cancel() {
    this.director.cancel();
    this.outcome = null;
    this.exterior.setSpaceVisible(false);
  }

  get state(): CinematicState {
    return this.director.state;
  }

  private play(id: DiscoveryId, landing: boolean) {
    this.target.fromArray(DISCOVERIES[id].position);
    this.session.beginCinematic(this.input);
    this.director.play(
      landing ? 'landing-companion' : id === 'atlas' ? 'atlas-finale' : 'discovery-flyby',
      { subjectName: DISCOVERIES[id].name, targetRadius: TARGET_RADII[id], shipScale: 8 },
    );
  }
}
