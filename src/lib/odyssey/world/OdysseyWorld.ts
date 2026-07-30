import * as THREE from 'three';
import { loadSave } from '../save';
import { createSpaceScene, type SpaceSceneRig } from '../space/createSpaceScene';
import type { WorldCallbacks } from '../types';
import { createRenderer, type RenderRig } from './createRenderer';
import { createShipInterior, type ShipInterior } from './createShipInterior';
import { InputController } from './InputController';
import { OdysseySession } from './OdysseySession';
import { createSnapshot } from './snapshot';
import { updateEnding, updateFlight, updateMenu, updateWalking } from './updateWorld';

export class OdysseyWorld {
  readonly hasSave = Boolean(loadSave());
  private readonly render: RenderRig;
  private readonly space: SpaceSceneRig;
  private readonly ship: ShipInterior;
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
    this.input = new InputController(canvas, this.handlePointerLock);
    this.placeMenuCamera();
    this.frameId = requestAnimationFrame(this.animate);
  }

  start = (newGame = false) => this.session.start(newGame, this.input);
  resume = () => this.session.resume(this.input);
  interact = () => this.session.interact(this.render.camera);
  scan = () => this.session.scan();
  cycleTarget = () => this.session.cycleTarget();

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
      updateFlight(this.session, this.input, this.render.camera, this.callbacks, delta, time);
    }
    if (mode === 'menu') updateMenu(this.render.camera, time);
    if (mode === 'ending') updateEnding(this.session, this.render.camera, delta, time);
    flight.getInverseQuaternion(this.inverseQuaternion);
    this.space.update(time / 1000, this.render.camera, flight.position, this.inverseQuaternion);
    this.space.setWarp?.(flight.boost ? flight.throttle : 0);
    this.ship.update(time / 1000);
    this.render.render();
    this.publishSnapshot(delta);
  };

  private publishSnapshot(delta: number) {
    this.snapshotTime += delta;
    if (this.snapshotTime < 0.075) return;
    this.snapshotTime = 0;
    const { mission, flight, mode, fuel } = this.session;
    this.callbacks.onSnapshot(createSnapshot({
      mode,
      mission,
      flight,
      camera: this.render.camera,
      nearbyInteraction: this.session.nearbyInteraction(),
      fuel,
      frameRate: this.fps,
    }));
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
