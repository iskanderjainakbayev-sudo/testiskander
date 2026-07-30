import type * as THREE from 'three';
import type { CinematicState } from '../cinematics';
import type { TrafficUpdate } from '../space/traffic/createTrafficSystem';
import type { WorldCallbacks } from '../types';
import type { OdysseySession } from './OdysseySession';
import type { FrameMetrics } from './PerformanceMonitor';
import type { PlanetExpeditions } from './PlanetExpeditions';
import { createSnapshot } from './snapshot';

export class SnapshotPublisher {
  private elapsed = 0;

  constructor(private readonly callbacks: WorldCallbacks) {}

  update(
    delta: number,
    session: OdysseySession,
    camera: THREE.PerspectiveCamera,
    expedition: PlanetExpeditions,
    traffic: TrafficUpdate,
    metrics: FrameMetrics,
    cinematic: CinematicState,
  ) {
    this.elapsed += delta;
    if (this.elapsed < 0.075) return;
    this.elapsed = 0;
    const { mission, flight, mode, fuel } = session;
    this.callbacks.onSnapshot(createSnapshot({
      mode,
      mission,
      flight,
      camera,
      nearbyInteraction: mode === 'surface'
        ? expedition.nearbyInteraction()
        : session.nearbyInteraction(),
      fuel,
      frameRate: metrics.averageFps,
      frameTimeP95: metrics.p95Milliseconds,
      frameTimeP99: metrics.p99Milliseconds,
      longFramePercent: metrics.longFramePercent,
      transitionProgress: session.landing.progress,
      surfaceSamples: expedition.walker.samples.size,
      locationName: mode === 'surface' ? expedition.locationName : undefined,
      landingSiteName: expedition.locationName,
      nearestShipName: traffic.nearestShipName,
      nearestShipDistance: traffic.nearestShipDistance,
      canLand: session.canLand(),
      cinematicCaption: cinematic.caption,
      cinematicProgress: cinematic.progress,
      cinematicShot: cinematic.currentShot,
    }));
  }
}
