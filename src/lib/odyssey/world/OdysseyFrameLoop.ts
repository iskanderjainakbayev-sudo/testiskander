import * as THREE from 'three';
import { audioSceneFor } from '../audio/AmbientBed';
import type { LyraExterior } from '../ship/createLyraExterior';
import type { SpaceSceneRig } from '../space/createSpaceScene';
import type { TrafficUpdate } from '../space/traffic/createTrafficSystem';
import type { ShipInterior } from './createShipInterior';
import type { RenderRig } from './createRenderer';
import type { OdysseyCinematics } from './OdysseyCinematics';
import type { OdysseyModeUpdater } from './OdysseyModeUpdater';
import type { OdysseySession } from './OdysseySession';
import { PerformanceMonitor } from './PerformanceMonitor';
import type { PlanetExpeditions } from './PlanetExpeditions';
import type { SnapshotPublisher } from './SnapshotPublisher';

export class OdysseyFrameLoop {
  private frameId = 0;
  private lastTime = performance.now();
  private readonly performanceMonitor = new PerformanceMonitor();
  private traffic: TrafficUpdate = {
    nearestShipName: null,
    nearestShipDistance: Number.POSITIVE_INFINITY,
    encounterMessage: null,
  };
  private readonly inverseQuaternion = new THREE.Quaternion();

  constructor(
    private readonly render: RenderRig,
    private readonly space: SpaceSceneRig,
    private readonly ship: ShipInterior,
    private readonly exterior: LyraExterior,
    private readonly expedition: PlanetExpeditions,
    private readonly session: OdysseySession,
    private readonly modeUpdater: OdysseyModeUpdater,
    private readonly cinematics: OdysseyCinematics,
    private readonly snapshots: SnapshotPublisher,
  ) {
    this.frameId = requestAnimationFrame(this.animate);
  }

  dispose() {
    cancelAnimationFrame(this.frameId);
  }

  private readonly animate = (time: number) => {
    this.frameId = requestAnimationFrame(this.animate);
    const elapsed = time - this.lastTime;
    const delta = Math.min(elapsed / 1000, 0.05);
    this.lastTime = time;
    this.performanceMonitor.push(elapsed);
    const { mode, flight } = this.session;
    this.modeUpdater.update(delta, time);
    this.session.audio.setScene(audioSceneFor(this.session.mode, this.session.landingTarget));
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
}
