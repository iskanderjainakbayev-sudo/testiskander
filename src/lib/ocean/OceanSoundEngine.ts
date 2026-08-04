export class OceanSoundEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

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

  stop(): void {
    void this.context?.close();
    this.context = null;
    this.master = null;
  }

  tone(start: number, end: number, life: number, level: number, delay = 0, wave: OscillatorType = 'sine'): void {
    if (!this.context || !this.master) return;
    const now = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(start, now);
    oscillator.frequency.exponentialRampToValueAtTime(end, now + life);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(level, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + life);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + life);
  }

  noise(life: number, level: number, frequency: number, delay = 0, kind: BiquadFilterType = 'lowpass'): void {
    if (!this.context || !this.master || !this.noiseBuffer) return;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    const now = this.context.currentTime + delay;
    source.buffer = this.noiseBuffer;
    filter.type = kind;
    filter.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + life);
    source.connect(filter).connect(gain).connect(this.master);
    source.start(now);
    source.stop(now + life);
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
