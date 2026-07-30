export class TacticalAudio {
  private context?: AudioContext;
  private master?: GainNode;

  unlock() {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.65;
      this.master.connect(this.context.destination);
    }
    void this.context.resume();
  }

  setVolume(volume: number) {
    if (this.master) this.master.gain.value = volume;
  }

  shot() { this.tone(92, 0.07, "sawtooth", 0.18); }
  reload() { this.tone(420, 0.04, "square", 0.08); }
  hit() { this.tone(210, 0.06, "triangle", 0.12); }
  melee() { this.tone(138, 0.09, "square", 0.13); }
  damage() { this.tone(62, 0.13, "sine", 0.16); }

  dispose() { void this.context?.close(); }

  private tone(frequency: number, duration: number, type: OscillatorType, volume: number) {
    if (!this.context || !this.master) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    oscillator.connect(gain).connect(this.master);
    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);
  }
}
