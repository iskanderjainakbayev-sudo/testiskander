import * as THREE from 'three';
import { audioSceneFor } from '../audio/AmbientBed';
import { loadSave } from '../save';
import { createLyraExterior, type LyraExterior } from '../ship/createLyraExterior';
import { createSpaceScene, type SpaceSceneRig } from '../space/createSpaceScene';
import type { TrafficUpdate } from '../space/traffic/createTrafficSystem';
import type { WorldCallbacks } from '../types';
import { installCaptureConsole } from './CaptureConsole';
import { createRenderer, type RenderRig } from './createRenderer';
import { createShipInterior, type ShipInterior } from './createShipInterior';
import { InputController } from './InputController';
import { OdysseyCinematics } from './OdysseyCinematics';
import { OdysseyModeUpdater } from './OdysseyModeUpdater';
import { OdysseySession } from './OdysseySession';
import { PerformanceMonitor } from './PerformanceMonitor';
import { PlanetExpeditions } from './PlanetExpeditions';
import { SnapshotPublisher } from './SnapshotPublisher';

export class OdysseyWorld {
  readonly hasSave = Boolean(loadSave());
  private readonly render: RenderRig;
  private readonly space: SpaceSceneRig;
  private readonly ship: ShipInterior;
  private readonly exterior: LyraExterior;
  private readonly expedition: PlanetExpeditions;
  private readonly input: InputController;
  private readonly session = new OdysseySession();
  private readonly snapshots: SnapshotPublisher;
  private readonly cinematics: OdysseyCinematics;
  private readonly modeUpdater: OdysseyModeUpdater;
  private frameId = 0;
  private captureCleanup = () => undefined;
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
    this.expedition = new PlanetExpeditions(this.render.scene, this.session);
    this.exterior = createLyraExterior(
      this.render.scene,
      this.render.renderer.capabilities.getMaxAnisotropy(),
    );
    this.snapshots = new SnapshotPublisher(callbacks);
    this.input = new InputController(canvas, this.handlePointerLock);
    this.cinematics = new OdysseyCinematics(
      this.render.camera,
      this.input,
      this.session,
      callbacks,
      this.exterior,
    );
    this.modeUpdater = new OdysseyModeUpdater(
      this.session,
      this.input,
      this.render.camera,
      this.cinematics,
      this.expedition,
    );
    this.captureCleanup = installCaptureConsole(
      this.session,
      this.input,
      this.render.camera,
      this.expedition,
      this.cinematics,
      () => this.placeMenuCamera(),
    );
    this.placeMenuCamera();
    this.frameId = requestAnimationFrame(this.animate);
  }

  start = (newGame = false) => {
    const save = this.session.start(newGame, this.input);
    if (newGame) this.expedition.reset();
    else {
      this.expedition.restore(
        save?.surfaceSamples ?? this.session.solaceSurfaceSamples,
        save?.nacreSurfaceSamples ?? this.session.nacreSurfaceSamples,
      );
    }
  };
  resume = () => this.session.resume(this.input);
  interact = () => {
    if (this.session.mode === 'surface') this.expedition.interact(this.input);
    else this.session.interact(this.render.camera);
  };
  scan = () => this.session.scan();
  cycleTarget = () => this.session.cycleTarget();
  land = () => this.cinematics.beginLanding();
  skipCinematic = () => this.cinematics.skip();
  returnToMenu = () => {
    this.cinematics.cancel();
    this.session.returnToMenu(this.input);
    this.placeMenuCamera();
  };

  dispose() {
    cancelAnimationFrame(this.frameId);
    this.session.mode = 'menu';
    this.captureCleanup();
    this.input.releaseLock();
    this.input.dispose();
    this.session.audio.stop();
    this.cinematics.cancel();
    this.space.dispose();
    this.expedition.dispose();
    this.exterior.dispose();
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
    this.modeUpdater.update(delta, time);
    this.session.audio.setScene(audioSceneFor(this.session.mode));
    this.expedition.syncVisibility(
      this.session.mode,
      this.session.landing.progress,
      this.space.group,
      this.ship.group,
    );
    this.cinematics.syncShipVisibility(this.ship.group);
    this.render.setAtmosphere(
      this.expedition.atmosphereBlend(this.session.mode, this.session.landing.progress),
      this.session.landingTarget,
    );
    this.exterior.update(
      this.render.camera,
      this.session.mode,
      this.session.landing.progress,
      this.expedition.surface.getHeight,
      this.expedition.rootZ,
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
      this.cinematics.state,
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
