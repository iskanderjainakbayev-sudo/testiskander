import type * as THREE from 'three';
import { OdysseyAudio } from '../audio';
import type {
  DiscoveryId,
  GameMode,
  LandablePlanetId,
  SaveData,
  WorldCallbacks,
} from '../types';
import { FlightController } from './FlightController';
import type { InputController } from './InputController';
import { LandingController } from './LandingController';
import { MissionController } from './MissionController';
import {
  beginPlanetLanding,
  beginPlanetTakeoff,
  findLandableTarget,
  recordPlanetSample,
} from './SessionExpeditionActions';
import {
  handleVoyagePointerLock,
  resumeVoyage,
  startVoyage,
} from './SessionLifecycleActions';
import { enterCinematic, enterFinale, enterMenu } from './SessionTransitions';
import { useShipStation } from './ShipStationInteractions';
import { VoyageProgress } from './VoyageProgress';
import { WalkingController } from './WalkingController';

export class OdysseySession {
  readonly audio = new OdysseyAudio();
  readonly flight = new FlightController();
  readonly walking = new WalkingController();
  readonly mission = new MissionController();
  readonly landing = new LandingController();
  private readonly progress = new VoyageProgress();
  mode: GameMode = 'menu';
  pausedFrom: GameMode = 'walking';
  fuel = 100;
  manualScanUntil = 0;
  endingTimer = 0;
  landingTarget: LandablePlanetId = 'solace';

  start(newGame: boolean, input: InputController): SaveData | null {
    return startVoyage(this, this.progress, newGame, input);
  }

  resume(input: InputController) {
    resumeVoyage(this, input);
  }

  scan() {
    this.manualScanUntil = performance.now() + 2500;
  }

  canLand() {
    return findLandableTarget(this) !== null;
  }

  landableTarget(): LandablePlanetId | null {
    return findLandableTarget(this);
  }

  beginLanding(input: InputController) {
    return beginPlanetLanding(this, input);
  }

  beginTakeoff(input: InputController) {
    beginPlanetTakeoff(this, input);
  }

  recordSurfaceSample(index: number) {
    recordPlanetSample(this, this.progress, index);
  }

  cycleTarget() {
    this.mission.cycleTarget();
    this.audio.ui('select');
  }

  returnToMenu(input: InputController) {
    enterMenu(this, input);
  }

  interact(camera: THREE.PerspectiveCamera) {
    if (this.mode === 'flight' && this.flight.speed < 3) return this.leaveHelm();
    if (this.mode !== 'walking') return;
    const station = this.walking.nearbyStation();
    if (!station) return this.audio.ui('error');
    this.audio.ui('select');
    useShipStation(this, station.id, camera);
  }

  finishDiscovery(id: DiscoveryId) {
    if (id === 'atlas') this.audio.gate();
    else this.audio.discovery();
    this.persist();
  }

  beginCinematic(input: InputController) {
    enterCinematic(this, input);
  }

  returnFromCinematic() {
    this.mode = 'flight';
  }

  finishFinale(input: InputController, callbacks: WorldCallbacks) {
    enterFinale(this, input, callbacks);
  }

  persist() {
    this.progress.persist(this.mission, this.flight);
  }

  handlePointerLock(locked: boolean) {
    handleVoyagePointerLock(this, locked);
  }

  nearbyInteraction() {
    if (this.mode === 'walking') {
      const nearby = this.walking.nearbyStation();
      return nearby ? `E  ·  ${nearby.label}` : null;
    }
    return this.mode === 'flight' && this.flight.speed < 3 ? 'E  ·  LEAVE HELM' : null;
  }

  get surfaceSamples() {
    return this.landingTarget === 'nacre'
      ? this.progress.nacreSurfaceSamples
      : this.progress.surfaceSamples;
  }

  get solaceSurfaceSamples() { return this.progress.surfaceSamples; }
  get nacreSurfaceSamples() { return this.progress.nacreSurfaceSamples; }

  private leaveHelm() {
    this.flight.throttle = 0;
    this.flight.speed = 0;
    this.mode = 'walking';
    this.walking.leaveHelm();
  }
}
