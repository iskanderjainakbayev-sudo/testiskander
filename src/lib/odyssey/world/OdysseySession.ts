import type * as THREE from 'three';
import { OdysseyAudio } from '../audio';
import { DISCOVERIES } from '../discoveries';
import { clearSave, loadSave, storeSave } from '../save';
import type { DiscoveryId, GameMode, SaveData, WorldCallbacks } from '../types';
import { FlightController } from './FlightController';
import type { InputController } from './InputController';
import { LandingController } from './LandingController';
import { MissionController } from './MissionController';
import { WalkingController, type StationId } from './WalkingController';

export class OdysseySession {
  readonly audio = new OdysseyAudio();
  readonly flight = new FlightController();
  readonly walking = new WalkingController();
  readonly mission = new MissionController();
  readonly landing = new LandingController();
  mode: GameMode = 'menu';
  pausedFrom: GameMode = 'walking';
  fuel = 100;
  manualScanUntil = 0;
  endingTimer = 0;
  surfaceSamples: number[] = [];

  start(newGame: boolean, input: InputController): SaveData | null {
    void this.audio.start();
    input.clear();
    this.manualScanUntil = 0;
    this.endingTimer = 0;
    this.flight.reset();
    const save = newGame ? null : loadSave();
    if (newGame) clearSave();
    if (save) {
      this.mission.restore(save.scanned, save.target, save.solaceSurveyed);
      this.surfaceSamples = save.surfaceSamples
        ?? (save.scanned.includes('solace') ? [0, 1, 2] : []);
      this.flight.position.set(...save.shipPosition);
      this.mode = 'flight';
    } else {
      this.mission.reset();
      this.surfaceSamples = [];
      this.walking.reset();
      this.mode = 'walking';
    }
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
    return this.mode === 'flight'
      && this.mission.solaceSurveyed
      && this.flight.distanceTo('solace') < 220;
  }

  beginLanding(input: InputController) {
    if (!this.canLand()) return false;
    this.landing.beginLanding(this.flight);
    this.mode = 'landing';
    input.clear();
    this.audio.discovery();
    this.mission.showTransmission('SOLACE CONTROL // DESCENT CORRIDOR ACQUIRED.');
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
    if (!this.surfaceSamples.includes(index)) this.surfaceSamples.push(index);
    if (this.surfaceSamples.length >= 3) this.mission.completeSolaceExpedition();
    this.persist();
  }

  cycleTarget() {
    this.mission.cycleTarget();
    this.audio.ui('select');
  }

  returnToMenu(input: InputController) {
    this.mode = 'menu';
    this.flight.boost = false;
    this.flight.throttle = 0;
    this.audio.setFlight(0, false);
    input.releaseLock();
  }

  interact(camera: THREE.PerspectiveCamera) {
    if (this.mode === 'flight' && this.flight.speed < 3) return this.leaveHelm();
    if (this.mode !== 'walking') return;
    const station = this.walking.nearbyStation();
    if (!station) return this.audio.ui('error');
    this.audio.ui('select');
    this.interactWithStation(station.id, camera);
  }

  finishDiscovery(id: DiscoveryId, input: InputController, callbacks: WorldCallbacks) {
    if (id === 'atlas') {
      this.audio.gate();
      this.mode = 'ending';
      input.releaseLock();
      this.endingTimer = 0;
      callbacks.onComplete();
      return;
    }
    this.audio.discovery();
    this.persist();
  }

  persist() {
    storeSave({
      scanned: this.mission.scanned,
      echoes: this.mission.echoes,
      target: this.mission.target,
      shipPosition: this.flight.position.toArray(),
      solaceSurveyed: this.mission.solaceSurveyed,
      surfaceSamples: [...this.surfaceSamples],
    });
  }

  handlePointerLock(locked: boolean) {
    if (!locked && ['walking', 'flight', 'surface', 'landing', 'takeoff'].includes(this.mode)) {
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

  private interactWithStation(station: StationId, camera: THREE.PerspectiveCamera) {
    if (station === 'helm') {
      this.mode = 'flight';
      camera.position.set(0, 1.58, -3.9);
      camera.rotation.set(0, 0, 0);
    } else if (station === 'navigation') {
      this.cycleTarget();
      this.mission.showTransmission(`NAVIGATION // VECTOR LOCKED: ${DISCOVERIES[this.mission.target].name}`);
    } else if (station === 'archive') {
      this.mission.showTransmission('ARCHIVE // Captain Aster: “Three voices remain. Bring them to Atlas.”');
    } else {
      this.fuel = 100;
      this.mission.showTransmission('PULSE CORE // FIELD COHERENCE RESTORED. RANGE: UNBOUNDED.');
    }
  }

  private leaveHelm() {
    this.flight.throttle = 0;
    this.flight.speed = 0;
    this.mode = 'walking';
    this.walking.leaveHelm();
  }
}
