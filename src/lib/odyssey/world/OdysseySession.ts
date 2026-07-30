import type * as THREE from 'three';
import { OdysseyAudio } from '../audio';
import { clearSave, loadSave } from '../save';
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
    void this.audio.start();
    input.clear();
    this.manualScanUntil = 0;
    this.endingTimer = 0;
    this.flight.reset();
    const save = newGame ? null : loadSave();
    if (newGame) clearSave();
    if (save) {
      this.mission.restore(
        save.scanned,
        save.target,
        save.solaceSurveyed,
        save.nacreSurveyed,
      );
      this.flight.position.set(...save.shipPosition);
      this.mode = 'flight';
    } else {
      this.mission.reset();
      this.walking.reset();
      this.mode = 'walking';
    }
    this.progress.restore(save);
    this.pausedFrom = this.mode;
    this.fuel = 100;
    input.requestLock();
    this.audio.ui('select');
    return save;
  }

  resume(input: InputController) {
    if (this.mode === 'paused') this.mode = this.pausedFrom;
    input.requestLock();
    this.audio.ui('select');
  }

  scan() {
    this.manualScanUntil = performance.now() + 2500;
  }

  canLand() {
    return this.landableTarget() !== null;
  }

  landableTarget(): LandablePlanetId | null {
    if (this.mode !== 'flight') return null;
    if (this.mission.solaceSurveyed && this.flight.distanceTo('solace') < 220) return 'solace';
    if (this.mission.nacreSurveyed && this.flight.distanceTo('nacre') < 220) return 'nacre';
    return null;
  }

  beginLanding(input: InputController) {
    const target = this.landableTarget();
    if (!target) return false;
    this.landingTarget = target;
    this.landing.beginLanding(this.flight, target);
    this.mode = 'landing';
    input.clear();
    this.audio.discovery();
    this.mission.showTransmission(`${target.toUpperCase()} CONTROL // DESCENT CORRIDOR ACQUIRED.`);
    return true;
  }

  beginTakeoff(input: InputController) {
    this.landing.beginTakeoff();
    this.mode = 'takeoff';
    input.clear();
    this.audio.gate();
    this.persist();
  }

  recordSurfaceSample(index: number) {
    if (this.landingTarget === 'nacre') {
      this.progress.recordNacreSample(index, this.mission, this.flight);
    } else {
      this.progress.recordSurfaceSample(index, this.mission, this.flight);
    }
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
    if (!locked && ['walking', 'flight', 'cinematic', 'surface', 'landing', 'takeoff'].includes(this.mode)) {
      this.pausedFrom = this.mode;
      this.mode = 'paused';
      this.flight.boost = false;
      this.audio.setFlight(0, false);
    }
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
