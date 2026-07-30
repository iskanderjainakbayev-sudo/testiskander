export class AfterfallAudio {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;

  async unlock() {
    this.context ??= new AudioContext();
    this.gain ??= this.context.createGain();
    this.gain.connect(this.context.destination);
    await this.context.resume();
  }

  setVolume(value: number) { if (this.gain) this.gain.gain.value = Math.max(0, Math.min(1, value)) * .17; }
  click(kind: 'shot' | 'loot' | 'craft' | 'hit' | 'thunder') {
    if (!this.context || !this.gain) return;
    const oscillator = this.context.createOscillator();
    const volume = this.context.createGain();
    const tones = { shot: [110, .07], loot: [660, .11], craft: [420, .18], hit: [190, .1], thunder: [64, .24] } as const;
    const [frequency, life] = tones[kind];
    oscillator.type = kind === 'thunder' ? 'sawtooth' : kind === 'shot' ? 'square' : 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(28, frequency * .38), this.context.currentTime + life);
    volume.gain.setValueAtTime(kind === 'shot' ? .75 : .35, this.context.currentTime);
    volume.gain.exponentialRampToValueAtTime(.001, this.context.currentTime + life);
    oscillator.connect(volume).connect(this.gain);
    oscillator.start(); oscillator.stop(this.context.currentTime + life);
  }

  dispose() { void this.context?.close(); this.context = null; this.gain = null; }
}
