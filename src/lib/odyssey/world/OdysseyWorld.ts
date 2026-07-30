import * as THREE from 'three';
import { loadSave } from '../save';
import { createSpaceScene, type SpaceSceneRig } from '../space/createSpaceScene';
import type { TrafficUpdate } from '../space/traffic/createTrafficSystem';
import type { WorldCallbacks } from '../types';
import { createRenderer, type RenderRig } from './createRenderer';
import { createShipInterior, type ShipInterior } from './createShipInterior';
import { InputController } from './InputController';
import { OdysseySession } from './OdysseySession';
import { PerformanceMonitor } from './PerformanceMonitor';
import { SnapshotPublisher } from './SnapshotPublisher';
import { SolaceExpedition } from './SolaceExpedition';
import { updateLandingSequence, updateTakeoffSequence } from './updateLanding';
import { updateEnding, updateFlight, updateMenu, updateSurface, updateWalking } from './updateWorld';

export class OdysseyWorld {
  readonly hasSave = Boolean(loadSave());
  private readonly render: RenderRig;
  private readonly space: SpaceSceneRig;
  private readonly ship: ShipInterior;
  private readonly expedition: SolaceExpedition;
  private readonly input: InputController;
  private readonly session = new OdysseySession();
  private readonly snapshots: SnapshotPublisher;
  private frameId = 0;
  private lastTime = performance.now();
  private readonly performanceMonitor = new PerformanceMonitor();
  private traffic: TrafficUpdate = {
    nearestShipName: null,
    nearestShipDistance: Number.POSITIVE_INFINITY,
    encounterMessage: null,
  };
  private readonly inverseQuaternion = new THREE.Quaternion();

  constructor(canvas: HTMLCanvasElement, private readonly callbacks: WorldCallbacks) {
    this.render = createRenderer(canvas);
    this.ship = createShipInterior(this.render.scene);
    this.space = createSpaceScene();
    this.render.scene.add(this.space.group);
    this.expedition = new SolaceExpedition(this.render.scene);
    this.snapshots = new SnapshotPublisher(callbacks);
    this.input = new InputController(canvas, this.handlePointerLock);
    this.placeMenuCamera();
    this.frameId = requestAnimationFrame(this.animate);
  }

  start = (newGame = false) => {
    if (newGame) this.expedition.reset();
    this.session.start(newGame, this.input);
  };
  resume = () => this.session.resume(this.input);
  interact = () => {
    if (this.session.mode === 'surface') this.expedition.interact(this.session, this.input);
    else this.session.interact(this.render.camera);
  };
  scan = () => this.session.scan();
  cycleTarget = () => this.session.cycleTarget();
  land = () => this.session.beginLanding(this.input);
  private readonly handleSurfaceInteraction = () => {
    this.expedition.interact(this.session, this.input);
  };

  returnToMenu = () => {
    this.session.returnToMenu(this.input);
    this.placeMenuCamera();
  };

  dispose() {
    cancelAnimationFrame(this.frameId);
    this.session.mode = 'menu';
    this.input.releaseLock();
    this.input.dispose();
    this.session.audio.stop();
    this.space.dispose();
    this.expedition.dispose();
    this.ship.dispose();
    this.render.dispose();
  }

  private readonly animate = (time: number) => {
    this.frameId = requestAnimationFrame(this.animate);
    const elapsed = time - this.lastTime;
    const delta = Math.min(elapsed / 1000, 0.05);
    this.lastTime = time;
    this.performanceMonitor.push(elapsed);
    const { mode, flight } = this.session;
    if (mode === 'walking') updateWalking(this.session, this.input, this.render.camera, delta);
    if (mode === 'flight') {
      updateFlight(
        this.session,
        this.input,
        this.render.camera,
        this.callbacks,
        this.land,
        delta,
        time,
      );
    }
    if (mode === 'landing') {
      updateLandingSequence(
        this.session,
        this.expedition.surface,
        this.expedition.walker,
        this.render.camera,
        delta,
      );
    }
    if (mode === 'surface') {
      updateSurface(
        this.session,
        this.expedition.walker,
        this.input,
        this.render.camera,
        delta,
        this.handleSurfaceInteraction,
      );
    }
    if (mode === 'takeoff') {
      updateTakeoffSequence(this.session, this.expedition.surface, this.render.camera, delta);
    }
    if (mode === 'menu') updateMenu(this.render.camera, time);
    if (mode === 'ending') updateEnding(this.session, this.render.camera, delta, time);
    this.expedition.syncVisibility(
      this.session.mode,
      this.session.landing.progress,
      this.space.group,
      this.ship.group,
    );
    this.render.setAtmosphere(
      this.expedition.atmosphereBlend(this.session.mode, this.session.landing.progress),
    );
    flight.getInverseQuaternion(this.inverseQuaternion);
    if (this.space.group.visible) {
      this.traffic = this.space.update(
        time / 1000,
        this.render.camera,
        flight.position,
        this.inverseQuaternion,
      );
      if (mode === 'flight' && this.traffic.encounterMessage) {
        this.session.mission.showTransmission(this.traffic.encounterMessage, 6);
      }
    }
    this.expedition.update(time / 1000, this.render.camera);
    this.space.setWarp?.(flight.boost ? flight.throttle : 0);
    if (this.ship.group.visible) this.ship.update(time / 1000);
    this.render.render();
    this.snapshots.update(
      delta,
      this.session,
      this.render.camera,
      this.expedition,
      this.traffic,
      this.performanceMonitor.read(),
    );
  };

  private placeMenuCamera() {
    this.render.camera.position.set(0.42, 1.48, -3.6);
    this.render.camera.lookAt(0, 1.35, -10);
  }

  private readonly handlePointerLock = (locked: boolean) => {
    this.callbacks.onPointerLock(locked);
    this.session.handlePointerLock(locked);
  };
}
