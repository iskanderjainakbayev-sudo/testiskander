import { AmbientBed, type AudioScene } from './audio/AmbientBed';

type UiSound = 'hover' | 'select' | 'error';

export class OdysseyAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null; private engine: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineTones: OscillatorNode[] = [];
  private ambient: AmbientBed | null = null;
  private noiseBuffer: AudioBuffer | null = null; private musicTimer: number | null = null;
  private musicStep = 0; private scanStep = -1;
  private throttle = 0; private boosting = false;
  async start(): Promise<void> {
    if (typeof window === 'undefined' || !window.AudioContext) return;
    if (!this.context || this.context.state === 'closed') this.createSoundscape();
    if (this.context?.state === 'suspended')
      try { await this.context.resume(); } catch { /* Autoplay may still be locked. */ }
    if (this.context?.state === 'running' && this.musicStep === 0) this.musicPhrase();
  }
  stop(): void {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    const context = this.context;
    if (context && context.state !== 'closed') {
      const now = context.currentTime;
      this.master?.gain.setTargetAtTime(0.0001, now, 0.04);
      window.setTimeout(() => { void context.close().catch(() => undefined); }, 180);
    }
    this.context = this.master = this.engine = this.engineFilter = null;
    this.ambient = null;
    this.engineTones = []; this.noiseBuffer = null; this.musicTimer = null;
    this.musicStep = 0; this.scanStep = -1;
  }
  setFlight(throttle: number, boost: boolean): void {
    this.throttle = Math.max(0, Math.min(1, throttle)); this.boosting = boost;
    const context = this.context;
    if (!context || !this.engine || !this.engineFilter) return;
    const now = context.currentTime;
    const thrust = this.throttle + (boost ? 0.45 : 0);
    this.engine.gain.setTargetAtTime(0.025 + thrust * 0.075, now, 0.12);
    this.engineFilter.frequency.setTargetAtTime(190 + thrust * 720, now, 0.15);
    this.engineTones[0]?.frequency.setTargetAtTime(34 + thrust * 31, now, 0.12);
    this.engineTones[1]?.frequency.setTargetAtTime(69 + thrust * 74, now, 0.1);
  }
  setScene(scene: AudioScene): void {
    if (this.context) this.ambient?.setScene(this.context, scene);
  }
  ui(kind: UiSound = 'select'): void {
    if (kind === 'hover') this.tone(720, 0.045, 0.018, 'sine', 870);
    if (kind === 'select') {
      this.tone(420, 0.09, 0.028, 'triangle', 620);
      this.tone(840, 0.12, 0.018, 'sine', 960, 0.045);
    }
    if (kind === 'error') this.tone(145, 0.22, 0.045, 'sawtooth', 82);
  }
  footstep(): void {
    this.noise(0.09, 330, 0.035, 'lowpass'); this.tone(76, 0.075, 0.025, 'sine', 48);
  }
  scan(progress: number): void {
    if (!this.ready()) return;
    const value = Math.max(0, Math.min(1, progress));
    if (value < 0.01) { this.scanStep = -1; return; }
    const step = Math.floor(value * 18);
    if (step === this.scanStep) return;
    this.scanStep = step;
    this.tone(390 + value * 1050, 0.065, 0.022, 'sine', 460 + value * 1250);
  }
  discovery(): void {
    [220, 329.63, 440, 659.25].forEach((note, index) =>
      this.tone(note, 1.7, 0.035, index % 2 ? 'triangle' : 'sine', note * 1.008, index * 0.13));
  }
  gate(): void {
    this.noise(1.8, 760, 0.045, 'bandpass'); this.tone(54, 2.35, 0.085, 'sine', 27);
    this.tone(108, 2.1, 0.035, 'triangle', 432, 0.12);
    this.tone(864, 1.6, 0.018, 'sine', 1296, 0.35);
  }
  private createSoundscape(): void {
    const context = new AudioContext({ latencyHint: 'interactive' });
    const master = context.createGain(); const compressor = context.createDynamicsCompressor();
    master.gain.value = 0.42; compressor.threshold.value = -18; compressor.knee.value = 18;
    compressor.ratio.value = 4; compressor.attack.value = 0.008; compressor.release.value = 0.32;
    master.connect(compressor).connect(context.destination);
    this.context = context; this.master = master;
    this.noiseBuffer = this.makeNoise(context);
    this.createEngine(context, master);
    this.ambient = new AmbientBed(context, master, this.noiseBuffer);
    this.musicPhrase();
    this.musicTimer = window.setInterval(() => this.musicPhrase(), 6800);
    this.setFlight(this.throttle, this.boosting);
  }
  private createEngine(context: AudioContext, master: GainNode): void {
    const engine = context.createGain(); const filter = context.createBiquadFilter();
    engine.gain.value = 0.025; filter.type = 'lowpass'; filter.frequency.value = 190;
    filter.Q.value = 0.7; filter.connect(engine).connect(master);
    this.engineTones = [34, 69].map((frequency, index) => {
      const tone = context.createOscillator();
      tone.type = index ? 'triangle' : 'sine'; tone.frequency.value = frequency;
      tone.connect(filter); tone.start(); return tone;
    });
    const air = context.createBufferSource(); const airGain = context.createGain();
    air.buffer = this.noiseBuffer; air.loop = true; airGain.gain.value = 0.14;
    air.connect(airGain).connect(filter); air.start();
    this.engine = engine; this.engineFilter = filter;
  }
  private musicPhrase(): void {
    const context = this.ready();
    if (!context || !this.master) return;
    const roots = [73.42, 65.41, 87.31, 55];
    const root = roots[this.musicStep++ % roots.length]; const now = context.currentTime;
    const gain = context.createGain(); const filter = context.createBiquadFilter();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.014, now + 1.8);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 7.8);
    filter.type = 'lowpass'; filter.frequency.value = 920;
    filter.connect(gain).connect(this.master);
    [1, 1.498, 2.245].forEach((ratio, index) => {
      const voice = context.createOscillator();
      voice.type = index === 1 ? 'triangle' : 'sine';
      voice.frequency.value = root * ratio; voice.detune.value = index * 3 - 3;
      voice.connect(filter); voice.start(now); voice.stop(now + 8);
    });
    this.tone(root * 6, 2.6, 0.006, 'sine', root * 6.04, 1.4);
  }
  private tone(frequency: number, life: number, level: number, type: OscillatorType,
    end = frequency, delay = 0): void {
    const context = this.ready();
    if (!context || !this.master) return;
    const start = context.currentTime + delay;
    const voice = context.createOscillator(); const gain = context.createGain();
    voice.type = type; voice.frequency.setValueAtTime(frequency, start);
    voice.frequency.exponentialRampToValueAtTime(Math.max(20, end), start + life);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + Math.min(0.035, life * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + life);
    voice.connect(gain).connect(this.master); voice.start(start); voice.stop(start + life + 0.02);
  }
  private noise(life: number, frequency: number, level: number, type: BiquadFilterType): void {
    const context = this.ready();
    if (!context || !this.master || !this.noiseBuffer) return;
    const source = context.createBufferSource(); const filter = context.createBiquadFilter();
    const gain = context.createGain(); const now = context.currentTime;
    source.buffer = this.noiseBuffer; source.loop = true;
    filter.type = type; filter.frequency.value = frequency;
    filter.Q.value = 0.8; gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + life);
    source.connect(filter).connect(gain).connect(this.master);
    source.start(now, Math.random()); source.stop(now + life);
  }
  private makeNoise(context: AudioContext): AudioBuffer {
    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const data = buffer.getChannelData(0);
    let brown = 0;
    for (let index = 0; index < data.length; index += 1) {
      brown = (brown + (Math.random() * 2 - 1) * 0.08) / 1.02;
      data[index] = brown * 2.8;
    }
    return buffer;
  }
  private ready(): AudioContext | null { return this.context?.state === 'running' ? this.context : null; }
}
