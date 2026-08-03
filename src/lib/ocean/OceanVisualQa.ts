import * as THREE from 'three';

export const OCEAN_QA_VIEWS = [
  { id: 'menu', label: 'Menu vista', position: [30, -4, 39], target: [0, -7, 8], fov: 69 },
  { id: 'intro', label: 'Intro descent', position: [42, 6.5, 55], target: [0, -8, 8], fov: 68 },
  { id: 'surface', label: 'Surface', position: [18, 5.5, 38], target: [0, -1, 8], fov: 72 },
  { id: 'reef', label: 'Coral reef', position: [18, -5, -12], target: [0, -8, 8], fov: 72 },
  { id: 'kelp', label: 'Kelp forest', position: [45, -12, -13], target: [51, -17, -25], fov: 76 },
  { id: 'abyss', label: 'Abyss', position: [-178, -39, -29], target: [-190, -53, -52], fov: 74 },
  { id: 'combat', label: 'Combat load', position: [204, -37, 22], target: [218, -47, 34], fov: 78 },
] as const;

export type OceanQaViewId = typeof OCEAN_QA_VIEWS[number]['id'];

export interface OceanQaStats {
  view: OceanQaViewId;
  phase: 'idle' | 'warmup' | 'sampling' | 'complete';
  secondsLeft: number;
  sampleCount: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  averageFps: number;
  onePercentLowFps: number;
  droppedFramePercent: number;
  drawCalls: number;
  triangles: number;
}

const EMPTY_STATS: OceanQaStats = {
  view: 'menu', phase: 'idle', secondsLeft: 0, sampleCount: 0,
  p50Ms: 0, p95Ms: 0, p99Ms: 0, averageFps: 0, onePercentLowFps: 0,
  droppedFramePercent: 0, drawCalls: 0, triangles: 0,
};

function percentile(sorted: number[], fraction: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))];
}

export class OceanVisualQa {
  private view: typeof OCEAN_QA_VIEWS[number] = OCEAN_QA_VIEWS[0];
  private phase: OceanQaStats['phase'] = 'idle';
  private phaseStarted = 0;
  private samples: number[] = [];
  private lastPublish = 0;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly renderer: THREE.WebGLRenderer,
    private readonly publish: (stats: OceanQaStats) => void,
  ) {
    this.publish({ ...EMPTY_STATS });
  }

  select(viewId: OceanQaViewId): void {
    this.view = OCEAN_QA_VIEWS.find((candidate) => candidate.id === viewId) ?? this.view;
    this.samples = [];
    this.phase = 'idle';
    this.publishStats(performance.now());
  }

  startProfile(now = performance.now()): void {
    this.samples = [];
    this.phase = 'warmup';
    this.phaseStarted = now;
    this.publishStats(now);
  }

  update(now: number, rawFrameMs: number): THREE.Vector3 {
    const { position, target, fov } = this.view;
    this.camera.position.fromArray(position);
    this.camera.lookAt(new THREE.Vector3().fromArray(target));
    if (this.camera.fov !== fov) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
    if (this.phase === 'warmup' && now - this.phaseStarted >= 2_000) {
      this.phase = 'sampling';
      this.phaseStarted = now;
    } else if (this.phase === 'sampling') {
      this.samples.push(rawFrameMs);
      if (now - this.phaseStarted >= 10_000) this.phase = 'complete';
    }
    if (now - this.lastPublish >= 120) this.publishStats(now);
    return this.camera.position;
  }

  private publishStats(now: number): void {
    this.lastPublish = now;
    const sorted = [...this.samples].sort((left, right) => left - right);
    const total = this.samples.reduce((sum, value) => sum + value, 0);
    const p99Ms = percentile(sorted, 0.99);
    const activeDuration = this.phase === 'warmup' ? 2_000 : 10_000;
    const secondsLeft = ['warmup', 'sampling'].includes(this.phase)
      ? Math.max(0, (activeDuration - (now - this.phaseStarted)) / 1000) : 0;
    this.publish({
      view: this.view.id, phase: this.phase, secondsLeft, sampleCount: this.samples.length,
      p50Ms: percentile(sorted, 0.5), p95Ms: percentile(sorted, 0.95), p99Ms,
      averageFps: total > 0 ? this.samples.length * 1000 / total : 0,
      onePercentLowFps: p99Ms > 0 ? 1000 / p99Ms : 0,
      droppedFramePercent: sorted.length > 0
        ? sorted.filter((value) => value > 16.667).length / sorted.length * 100 : 0,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
    });
  }
}
