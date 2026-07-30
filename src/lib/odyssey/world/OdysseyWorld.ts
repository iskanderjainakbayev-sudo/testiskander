import * as THREE from 'three';
import { OdysseyAudio } from '../audio';
import { DISCOVERIES } from '../discoveries';
import { clearSave, loadSave, storeSave } from '../save';
import { createSpaceScene, type SpaceSceneRig } from '../space/createSpaceScene';
import type { DiscoveryId, GameMode, WorldCallbacks } from '../types';
import { createRenderer, type RenderRig } from './createRenderer';
import { createShipInterior, type ShipInterior } from './createShipInterior';
import { FlightController } from './FlightController';
import { InputController } from './InputController';
import { MissionController } from './MissionController';
import { createSnapshot } from './snapshot';
import { WalkingController, type StationId } from './WalkingController';

const FORWARD = new THREE.Vector3(0, 0, -1);

export class OdysseyWorld {
  readonly hasSave = Boolean(loadSave());
  private readonly render: RenderRig;
  private readonly space: SpaceSceneRig;
  private readonly ship: ShipInterior;
  private readonly input: InputController;
  private readonly audio = new OdysseyAudio();
  private readonly flight = new FlightController();
  private readonly walking = new WalkingController();
  private readonly mission = new MissionController();
  private mode: GameMode = 'menu';
  private pausedFrom: GameMode = 'walking';
  private frameId = 0;
  private lastTime = performance.now();
  private snapshotTime = 0;
  private fps = 60;
  private fuel = 100;
  private manualScanUntil = 0;
  private endingTimer = 0;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly callbacks: WorldCallbacks) {
    this.render = createRenderer(canvas);
    this.ship = createShipInterior(this.render.scene);
    this.space = createSpaceScene();
    this.render.scene.add(this.space.group);
    this.input = new InputController(canvas, this.handlePointerLock);
    this.placeMenuCamera();
    this.frameId = requestAnimationFrame(this.animate);
  }

  start = (newGame = false) => {
    void this.audio.start();
    const save = newGame ? null : loadSave();
    if (newGame) clearSave();
    if (save) {
      this.mission.restore(save.scanned, save.target);
      this.flight.position.set(...save.shipPosition);
      this.mode = 'flight';
    } else {
      this.mission.reset();
      this.walking.reset();
      this.flight.position.set(0, 0, 0);
      this.flight.quaternion.identity();
      this.flight.throttle = 0;
      this.flight.speed = 0;
      this.mode = 'walking';
    }
    this.fuel = 100;
    this.input.requestLock();
    this.audio.ui('select');
  };

  resume = () => {
    this.mode = this.pausedFrom;
    this.input.requestLock();
    this.audio.ui('select');
  };

  interact = () => this.handleInteraction();
  scan = () => { this.manualScanUntil = performance.now() + 2500; };
  cycleTarget = () => { this.mission.cycleTarget(); this.audio.ui('select'); };

  returnToMenu = () => {
    this.mode = 'menu';
    this.audio.setFlight(0, false);
    this.input.releaseLock();
    this.placeMenuCamera();
  };

  dispose() {
    cancelAnimationFrame(this.frameId);
    this.input.dispose();
    this.audio.stop();
    this.space.dispose();
    this.ship.dispose();
    this.render.dispose();
  }

  private readonly animate = (time: number) => {
    this.frameId = requestAnimationFrame(this.animate);
    const delta = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    this.fps = THREE.MathUtils.lerp(this.fps, 1 / Math.max(delta, 0.001), 0.05);
    if (this.mode === 'walking') this.updateWalking(delta);
    if (this.mode === 'flight') this.updateFlight(delta, time);
    if (this.mode === 'menu') this.updateMenu(time);
    if (this.mode === 'ending') this.updateEnding(delta, time);
    const inverse = this.flight.getInverseQuaternion();
    this.space.update(time / 1000, this.render.camera, this.flight.position, inverse);
    this.space.setWarp?.(this.flight.boost ? this.flight.throttle : 0);
    this.ship.update(time / 1000);
    this.render.render();
    this.publishSnapshot(delta);
  };

  private updateWalking(delta: number) {
    this.walking.update(delta, this.input, this.render.camera, () => this.audio.footstep());
    if (this.input.consume('KeyE')) this.handleInteraction();
  }

  private updateFlight(delta: number, time: number) {
    this.flight.update(delta, this.input);
    this.audio.setFlight(this.flight.throttle, this.flight.boost);
    if (this.flight.boost) this.fuel = Math.max(12, this.fuel - delta * 0.22);
    const shake = this.flight.boost ? Math.sin(time * 0.04) * 0.006 : 0;
    this.render.camera.position.set(shake, 1.58 + shake, -3.9);
    this.render.camera.rotation.set(shake * 0.2, 0, shake * 0.3);
    if (this.input.consume('KeyT')) this.cycleTarget();
    if (this.input.consume('KeyE') && this.flight.speed < 3) this.leaveHelm();
    const scanning = this.input.isDown('KeyQ') || performance.now() < this.manualScanUntil;
    const direction = this.flight.directionTo(this.mission.target);
    const alignment = direction.dot(FORWARD.clone().applyQuaternion(this.flight.quaternion));
    const completed = this.mission.update(
      delta,
      scanning,
      this.flight.distanceTo(this.mission.target),
      alignment,
    );
    if (scanning) this.audio.scan(this.mission.scanProgress);
    if (completed) this.finishDiscovery(completed);
  }

  private finishDiscovery(id: DiscoveryId) {
    if (id === 'atlas') {
      this.audio.gate();
      this.mode = 'ending';
      this.endingTimer = 0;
      this.callbacks.onComplete();
    } else {
      this.audio.discovery();
      storeSave({
        scanned: this.mission.scanned,
        echoes: this.mission.echoes,
        target: this.mission.target,
        shipPosition: this.flight.position.toArray(),
      });
    }
  }

  private handleInteraction() {
    if (this.mode === 'flight' && this.flight.speed < 3) return this.leaveHelm();
    if (this.mode !== 'walking') return;
    const station = this.walking.nearbyStation();
    if (!station) return this.audio.ui('error');
    this.audio.ui('select');
    this.interactWithStation(station.id);
  }

  private interactWithStation(station: StationId) {
    if (station === 'helm') {
      this.mode = 'flight';
      this.render.camera.position.set(0, 1.58, -3.9);
      this.render.camera.rotation.set(0, 0, 0);
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

  private updateMenu(time: number) {
    this.render.camera.position.x = 0.42 + Math.sin(time * 0.00013) * 0.09;
    this.render.camera.position.y = 1.48 + Math.sin(time * 0.00021) * 0.025;
    this.render.camera.lookAt(0, 1.35, -10);
  }

  private updateEnding(delta: number, time: number) {
    this.endingTimer += delta;
    this.flight.throttle = Math.min(1, this.endingTimer / 4);
    this.flight.boost = this.endingTimer > 3.5;
    this.flight.speed = THREE.MathUtils.damp(this.flight.speed, 420, 0.55, delta);
    this.flight.position.add(
      FORWARD.clone().applyQuaternion(this.flight.quaternion).multiplyScalar(this.flight.speed * delta),
    );
    this.render.camera.position.set(0, 1.58, -3.9 + Math.sin(time * 0.03) * 0.01);
    this.audio.setFlight(1, true);
  }

  private publishSnapshot(delta: number) {
    this.snapshotTime += delta;
    if (this.snapshotTime < 0.075) return;
    this.snapshotTime = 0;
    const nearby = this.mode === 'walking' ? this.walking.nearbyStation() : null;
    this.callbacks.onSnapshot(createSnapshot({
      mode: this.mode,
      mission: this.mission,
      flight: this.flight,
      camera: this.render.camera,
      nearbyInteraction: nearby ? `E  ·  ${nearby.label}` : this.mode === 'flight' && this.flight.speed < 3 ? 'E  ·  LEAVE HELM' : null,
      fuel: this.fuel,
      frameRate: this.fps,
    }));
  }

  private placeMenuCamera() {
    this.render.camera.position.set(0.42, 1.48, -3.6);
    this.render.camera.lookAt(0, 1.35, -10);
  }

  private readonly handlePointerLock = (locked: boolean) => {
    this.callbacks.onPointerLock(locked);
    if (!locked && (this.mode === 'walking' || this.mode === 'flight')) {
      this.pausedFrom = this.mode;
      this.mode = 'paused';
    }
  };
}
