import * as THREE from 'three';
import type { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import type { GraphicsQuality } from './types';

const QUALITY_CEILING: Record<GraphicsQuality, number> = {
  Low: 0.75,
  Medium: 1,
  High: 1.35,
  Ultra: 1.65,
};

export class OceanResolutionScaler {
  private ceiling = QUALITY_CEILING.High;
  private ratio = this.ceiling;
  private sampleTime = 0;
  private frameCount = 0;

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly composer: EffectComposer,
  ) {
    this.applyRatio();
  }

  setQuality(quality: GraphicsQuality): void {
    this.ceiling = QUALITY_CEILING[quality];
    this.ratio = this.ceiling;
    this.sampleTime = 0;
    this.frameCount = 0;
    this.applyRatio();
  }

  sample(delta: number): void {
    if (delta <= 0 || delta >= 0.1) return;
    this.sampleTime += delta;
    this.frameCount += 1;
    if (this.sampleTime < 2) return;
    const fps = this.frameCount / this.sampleTime;
    const correction = fps < 52 ? -0.12 : fps < 57 ? -0.06 : fps > 59.5 ? 0.04 : 0;
    const next = THREE.MathUtils.clamp(this.ratio + correction, 0.72, this.ceiling);
    if (Math.abs(next - this.ratio) >= 0.025) {
      this.ratio = next;
      this.applyRatio();
    }
    this.sampleTime = 0;
    this.frameCount = 0;
  }

  private applyRatio(): void {
    const effective = Math.min(devicePixelRatio, this.ratio);
    this.renderer.setPixelRatio(effective);
    this.composer.setPixelRatio(effective);
  }
}
