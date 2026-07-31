import { loadSave } from '../save';
import { createLyraExterior, type LyraExterior } from '../ship/createLyraExterior';
import { createSpaceScene, type SpaceSceneRig } from '../space/createSpaceScene';
import type { WorldCallbacks } from '../types';
import { installCaptureConsole } from './CaptureConsole';
import { createRenderer, type RenderRig } from './createRenderer';
import { createShipInterior, type ShipInterior } from './createShipInterior';
import { InputController } from './InputController';
import { OdysseyCinematics } from './OdysseyCinematics';
import { OdysseyFrameLoop } from './OdysseyFrameLoop';
import { OdysseyModeUpdater } from './OdysseyModeUpdater';
import { OdysseySession } from './OdysseySession';
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
  private readonly frameLoop: OdysseyFrameLoop;
  private captureCleanup: () => void = () => undefined;

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
      this.expedition,
      this.cinematics,
      () => this.placeMenuCamera(),
    );
    this.placeMenuCamera();
    this.frameLoop = new OdysseyFrameLoop(
      this.render,
      this.space,
      this.ship,
      this.exterior,
      this.expedition,
      this.session,
      this.modeUpdater,
      this.cinematics,
      this.snapshots,
    );
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
    this.frameLoop.dispose();
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

  private placeMenuCamera() {
    this.render.camera.position.set(0.42, 1.48, -3.6);
    this.render.camera.lookAt(0, 1.35, -10);
  }

  private readonly handlePointerLock = (locked: boolean) => {
    this.callbacks.onPointerLock(locked);
    this.session.handlePointerLock(locked);
  };
}
