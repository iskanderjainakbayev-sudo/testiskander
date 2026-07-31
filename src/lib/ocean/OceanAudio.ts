export class OceanAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private warningAt = 0;
  private swimAt = 0;
  private bossNear = false;

  start(): void {
    if (!window.AudioContext || this.context) return;
    const context = new AudioContext({ latencyHint: 'interactive' });
    const master = context.createGain();
    const filter = context.createBiquadFilter();
    master.gain.value = 0.32;
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.connect(master).connect(context.destination);
    this.context = context;
    this.master = master;
    this.noiseBuffer = this.makeNoise(context);
    this.ambient(context, filter);
  }

  collect(): void {
    this.tone(440, 760, 0.13, 0.055);
  }

  scan(): void {
    this.tone(180, 1100, 0.5, 0.045);
  }

  discovery(): void {
    [220, 330, 494, 740].forEach((note, index) => this.tone(note, note * 1.01, 1.4, 0.035, index * 0.12));
  }

  danger(): void {
    this.tone(92, 54, 0.45, 0.08);
  }

  gunshot(): void {
    this.noise(0.11, 0.16, 680);
    this.tone(210, 58, 0.2, 0.085);
  }

  specialShot(): void {
    this.noise(0.28, 0.22, 1100);
    [74, 148, 296].forEach((note, index) => this.tone(note, note * 0.45, 0.48, 0.075, index * 0.025));
  }

  knifeSwing(): void {
    this.noise(0.13, 0.055, 1700);
    this.tone(520, 130, 0.14, 0.035);
  }

  knifeHit(): void {
    this.noise(0.1, 0.08, 420);
    this.tone(105, 42, 0.18, 0.065);
  }

  weaponSwitch(): void {
    this.tone(280, 520, 0.09, 0.035);
    this.tone(170, 240, 0.08, 0.025, 0.07);
  }

  weaponHit(): void {
    this.noise(0.08, 0.06, 360);
    this.tone(120, 48, 0.22, 0.06);
  }

  swim(now: number, boosting: boolean): void {
    const delay = boosting ? 270 : 520;
    if (now - this.swimAt < delay) return;
    this.swimAt = now;
    this.noise(0.16, boosting ? 0.04 : 0.022, boosting ? 720 : 420);
    this.tone(boosting ? 150 : 96, 62, 0.2, boosting ? 0.025 : 0.012);
  }

  creatureAttack(boss: boolean): void {
    this.noise(boss ? 0.34 : 0.18, boss ? 0.16 : 0.08, boss ? 190 : 310);
    this.tone(boss ? 54 : 86, 34, boss ? 0.62 : 0.34, boss ? 0.1 : 0.06);
  }

  setBossNear(near: boolean): void {
    if (near && !this.bossNear) {
      this.noise(0.75, 0.12, 150);
      this.tone(42, 31, 1.35, 0.105);
    }
    this.bossNear = near;
  }

  ui(): void {
    this.tone(340, 510, 0.07, 0.022);
  }

  lights(on: boolean): void {
    this.tone(on ? 120 : 260, on ? 640 : 90, 0.18, 0.03);
  }

  lowOxygen(now: number): void {
    if (now - this.warningAt < 3200) return;
    this.warningAt = now;
    this.tone(660, 330, 0.25, 0.055);
    this.tone(660, 330, 0.25, 0.04, 0.32);
  }

  stop(): void {
    void this.context?.close();
    this.context = null;
    this.master = null;
  }

  private ambient(context: AudioContext, destination: AudioNode): void {
    const noise = context.createBufferSource();
    const gain = context.createGain();
    noise.buffer = this.noiseBuffer;
    noise.loop = true;
    gain.gain.value = 0.07;
    noise.connect(gain).connect(destination);
    noise.start();
    [48, 72, 108].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const voice = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      voice.gain.value = 0.018 / (index + 1);
      oscillator.connect(voice).connect(destination);
      oscillator.start();
    });
  }

  private tone(start: number, end: number, life: number, level: number, delay = 0): void {
    if (!this.context || !this.master) return;
    const now = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(start, now);
    oscillator.frequency.exponentialRampToValueAtTime(end, now + life);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(level, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + life);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + life);
  }

  private noise(life: number, level: number, frequency: number): void {
    if (!this.context || !this.master || !this.noiseBuffer) return;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    const now = this.context.currentTime;
    source.buffer = this.noiseBuffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + life);
    source.connect(filter).connect(gain).connect(this.master);
    source.start(now);
    source.stop(now + life);
  }

  private makeNoise(context: AudioContext): AudioBuffer {
    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const data = buffer.getChannelData(0);
    let brown = 0;
    for (let index = 0; index < data.length; index += 1) {
      brown = (brown + (Math.random() * 2 - 1) * 0.06) / 1.025;
      data[index] = brown * 3;
    }
    return buffer;
  }
}
