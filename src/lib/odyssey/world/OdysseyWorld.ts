import * as THREE from 'three';
import { loadSave } from '../save';
import { createSpaceScene, type SpaceSceneRig } from '../space/createSpaceScene';
import { createSolaceSurface, type SolaceSurface } from '../surface/createSolaceSurface';
import type { WorldCallbacks } from '../types';
import { createRenderer, type RenderRig } from './createRenderer';
import { createShipInterior, type ShipInterior } from './createShipInterior';
import { InputController } from './InputController';
import { OdysseySession } from './OdysseySession';
import { createSnapshot } from './snapshot';
import { SurfaceController } from './SurfaceController';
import { updateLandingSequence, updateTakeoffSequence } from './updateLanding';
import { updateEnding, updateFlight, updateMenu, updateSurface, updateWalking } from './updateWorld';

export class OdysseyWorld {
  readonly hasSave = Boolean(loadSave());
  private readonly render: RenderRig;
  private readonly space: SpaceSceneRig;
  private readonly ship: ShipInterior;
  private readonly surface: SolaceSurface;
  private readonly surfaceController: SurfaceController;
  private readonly input: InputController;
  private readonly session = new OdysseySession();
  private frameId = 0;
  private lastTime = performance.now();
  private snapshotTime = 0;
  private fps = 60;
  private readonly inverseQuaternion = new THREE.Quaternion();

  constructor(canvas: HTMLCanvasElement, private readonly callbacks: WorldCallbacks) {
    this.render = createRenderer(canvas);
    this.ship = createShipInterior(this.render.scene);
    this.space = createSpaceScene();
    this.render.scene.add(this.space.group);
    this.surface = createSolaceSurface();
    this.surfaceController = new SurfaceController(
      this.surface.getHeight,
      this.surface.sampleSites,
    );
    this.render.scene.add(this.surface.group);
    this.input = new InputController(canvas, this.handlePointerLock);
    this.placeMenuCamera();
    this.frameId = requestAnimationFrame(this.animate);
  }

  start = (newGame = false) => {
    if (newGame) this.surfaceController.resetExpedition();
    this.session.start(newGame, this.input);
  };
  resume = () => this.session.resume(this.input);
  interact = () => {
    if (this.session.mode === 'surface') this.handleSurfaceInteraction();
    else this.session.interact(this.render.camera);
  };
  scan = () => this.session.scan();
  cycleTarget = () => this.session.cycleTarget();
  land = () => this.session.beginLanding(this.input);

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
    this.surface.dispose();
    this.ship.dispose();
    this.render.dispose();
  }

  private readonly animate = (time: number) => {
    this.frameId = requestAnimationFrame(this.animate);
    const delta = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    this.fps = THREE.MathUtils.lerp(this.fps, 1 / Math.max(delta, 0.001), 0.05);
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
        this.surface,
        this.surfaceController,
        this.render.camera,
        delta,
      );
    }
    if (mode === 'surface') {
      updateSurface(
        this.session,
        this.surfaceController,
        this.input,
        this.render.camera,
        delta,
        this.handleSurfaceInteraction,
      );
    }
    if (mode === 'takeoff') {
      updateTakeoffSequence(this.session, this.surface, this.render.camera, delta);
    }
    if (mode === 'menu') updateMenu(this.render.camera, time);
    if (mode === 'ending') updateEnding(this.session, this.render.camera, delta, time);
    this.syncEnvironment();
    flight.getInverseQuaternion(this.inverseQuaternion);
    if (this.space.group.visible) {
      this.space.update(time / 1000, this.render.camera, flight.position, this.inverseQuaternion);
    }
    if (this.surface.group.visible) this.surface.update(time / 1000, this.render.camera);
    this.space.setWarp?.(flight.boost ? flight.throttle : 0);
    if (this.ship.group.visible) this.ship.update(time / 1000);
    this.render.render();
    this.publishSnapshot(delta);
  };

  private publishSnapshot(delta: number) {
    this.snapshotTime += delta;
    if (this.snapshotTime < 0.075) return;
    this.snapshotTime = 0;
    const { mission, flight, mode, fuel } = this.session;
    const surfaceAction = mode === 'surface' ? this.surfaceController.nearbyAction() : null;
    this.callbacks.onSnapshot(createSnapshot({
      mode,
      mission,
      flight,
      camera: this.render.camera,
      nearbyInteraction: surfaceAction ? `E  ·  ${surfaceAction.label}` : this.session.nearbyInteraction(),
      fuel,
      frameRate: this.fps,
      transitionProgress: this.session.landing.progress,
      surfaceSamples: this.surfaceController.samples.size,
      locationName: mode === 'surface' ? 'SOLACE / RAINSHELF 04' : undefined,
      canLand: this.session.canLand(),
    }));
  }

  private readonly handleSurfaceInteraction = () => {
    const nearby = this.surfaceController.nearbyAction();
    if (!nearby) return this.session.audio.ui('error');
    if (nearby.action.type === 'takeoff') {
      this.session.beginTakeoff(this.input);
      return;
    }
    this.surfaceController.completeSample(nearby.action.index);
    this.session.audio.discovery();
    const count = this.surfaceController.samples.size;
    const message = count < 3
      ? `SOLACE BIOSPHERE // ECHO BLOOM ${count}/3 CATALOGUED.`
      : 'SOLACE BIOSPHERE // THREE HARMONICS AGREE. LYRA MAY DEPART.';
    this.session.mission.showTransmission(message);
  };

  private syncEnvironment() {
    const { mode, landing } = this.session;
    const surfaceVisible = mode === 'surface'
      || (mode === 'landing' && landing.progress > 0.5)
      || (mode === 'takeoff' && landing.progress < 0.59);
    const spaceVisible = mode !== 'surface'
      && !(mode === 'landing' && landing.progress > 0.63)
      && !(mode === 'takeoff' && landing.progress < 0.53);
    this.surface.group.visible = surfaceVisible;
    this.space.group.visible = spaceVisible;
    this.ship.group.visible = spaceVisible;
  }

  private placeMenuCamera() {
    this.render.camera.position.set(0.42, 1.48, -3.6);
    this.render.camera.lookAt(0, 1.35, -10);
  }

  private readonly handlePointerLock = (locked: boolean) => {
    this.callbacks.onPointerLock(locked);
    this.session.handlePointerLock(locked);
  };
}
