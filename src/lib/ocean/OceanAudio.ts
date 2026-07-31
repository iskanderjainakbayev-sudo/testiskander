export class OceanAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private warningAt = 0;

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

  harpoon(): void {
    this.tone(180, 72, 0.16, 0.075);
  }

  weaponHit(): void {
    this.tone(120, 48, 0.22, 0.06);
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
