export type EclipseSound = 'attack' | 'dash' | 'pickup' | 'hurt' | 'enemy' | 'beacon' | 'victory' | 'click';

export class EclipseAudio {
  private context: AudioContext | null = null;
  private volume = .45;

  setVolume(value: number) { this.volume = Math.max(0, Math.min(1, value)); }
  async unlock() {
    this.context ??= new AudioContext();
    if (this.context.state === 'suspended') await this.context.resume();
  }
  play(sound: EclipseSound) {
    if (!this.context || this.volume === 0) return;
    const options: Record<EclipseSound, [number, number, OscillatorType]> = {
      attack: [180, .08, 'sawtooth'], dash: [290, .1, 'triangle'], pickup: [660, .13, 'sine'], hurt: [94, .18, 'square'],
      enemy: [132, .14, 'sawtooth'], beacon: [440, .35, 'sine'], victory: [740, .42, 'triangle'], click: [380, .05, 'sine'],
    };
    const [frequency, duration, type] = options[sound];
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(45, frequency * 1.8), this.context.currentTime + duration);
    gain.gain.setValueAtTime(this.volume * .1, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, this.context.currentTime + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);
  }
  dispose() { void this.context?.close(); this.context = null; }
}
