import { integratedSmootherstep } from './easing';

const SKIP_RAMP_SECONDS = 0.72;
const SKIP_RATE = 6;

export class DirectorClock {
  elapsed = 0;
  wallElapsed = 0;
  duration = 1;
  skipRequested = false;
  private skipWall = 0;
  private skipElapsed = 0;

  reset(duration: number): void {
    this.elapsed = 0;
    this.wallElapsed = 0;
    this.duration = duration;
    this.skipRequested = false;
    this.skipWall = 0;
    this.skipElapsed = 0;
  }

  requestSkip(): void {
    if (this.skipRequested) return;
    this.skipRequested = true;
    this.skipWall = this.wallElapsed;
    this.skipElapsed = this.elapsed;
  }

  update(delta: number): number {
    this.wallElapsed += Math.max(0, Math.min(delta, 0.1));
    if (!this.skipRequested) {
      this.elapsed = this.wallElapsed;
      return Math.min(this.elapsed / this.duration, 1);
    }

    const sinceSkip = this.wallElapsed - this.skipWall;
    const rampTime = Math.min(sinceSkip, SKIP_RAMP_SECONDS);
    const rampRatio = rampTime / SKIP_RAMP_SECONDS;
    const acceleratedRamp = (SKIP_RATE - 1)
      * SKIP_RAMP_SECONDS
      * integratedSmootherstep(rampRatio);
    const afterRamp = Math.max(0, sinceSkip - SKIP_RAMP_SECONDS) * (SKIP_RATE - 1);
    this.elapsed = this.skipElapsed + sinceSkip + acceleratedRamp + afterRamp;
    return Math.min(this.elapsed / this.duration, 1);
  }
}
