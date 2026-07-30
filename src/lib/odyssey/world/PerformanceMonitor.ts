export interface FrameMetrics {
  averageFps: number;
  p95Milliseconds: number;
  p99Milliseconds: number;
  longFramePercent: number;
  sampleCount: number;
}

const WINDOW_SIZE = 1_800;

export class PerformanceMonitor {
  private readonly frames = new Float32Array(WINDOW_SIZE);
  private readonly ordered = new Float32Array(WINDOW_SIZE);
  private cursor = 0;
  private count = 0;
  private totalPushed = 0;
  private computedAt = -30;
  private cached: FrameMetrics = {
    averageFps: 60,
    p95Milliseconds: 16.67,
    p99Milliseconds: 16.67,
    longFramePercent: 0,
    sampleCount: 0,
  };

  push(milliseconds: number) {
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) return;
    this.frames[this.cursor] = Math.min(milliseconds, 250);
    this.cursor = (this.cursor + 1) % WINDOW_SIZE;
    this.count = Math.min(WINDOW_SIZE, this.count + 1);
    this.totalPushed += 1;
  }

  read(): FrameMetrics {
    if (this.count === 0 || this.totalPushed - this.computedAt < 30) return this.cached;
    this.ordered.set(this.frames.subarray(0, this.count));
    const samples = this.ordered.subarray(0, this.count);
    samples.sort();
    let total = 0;
    let longFrames = 0;
    for (let index = 0; index < samples.length; index += 1) {
      const value = samples[index];
      total += value;
      if (value > 33) longFrames += 1;
    }
    this.cached = {
      averageFps: 1_000 / Math.max(total / this.count, 0.001),
      p95Milliseconds: percentile(samples, 0.95),
      p99Milliseconds: percentile(samples, 0.99),
      longFramePercent: longFrames / this.count * 100,
      sampleCount: this.count,
    };
    this.computedAt = this.totalPushed;
    return this.cached;
  }
}

function percentile(sorted: Float32Array, ratio: number) {
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1);
  return sorted[Math.max(0, index)] ?? 0;
}
