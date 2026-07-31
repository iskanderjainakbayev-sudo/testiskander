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

  shot(isAiming: boolean) {
    const tone = isAiming ? 150 : 128;
    this.tone(tone, 0.05, "square", 0.16);
    this.tone(tone * 1.8, 0.03, "triangle", 0.08);
    this.tone(tone * 0.65, 0.06, "sawtooth", 0.11);
  }
  reload() {
    this.tone(420, 0.04, "square", 0.08);
    this.tone(220, 0.06, "sawtooth", 0.11);
  }
  hit() {
    this.tone(210, 0.06, "triangle", 0.12);
    this.tone(330, 0.03, "sine", 0.08);
  }
  melee() {
    this.tone(138, 0.09, "square", 0.13);
    this.tone(88, 0.05, "triangle", 0.1);
  }
  damage() {
    this.tone(62, 0.13, "sine", 0.16);
    this.tone(95, 0.1, "square", 0.11);
  }
  jump() { this.tone(280, 0.04, "triangle", 0.13); }
  land() { this.tone(95, 0.06, "square", 0.1); }
  step(sprinting: boolean) {
    this.tone(sprinting ? 190 : 160, 0.04, "sine", 0.09);
    this.tone(sprinting ? 300 : 220, 0.02, "triangle", 0.06);
  }
  sprintStart() { this.tone(120, 0.05, "triangle", 0.13); }
  sprintStop() { this.tone(95, 0.07, "triangle", 0.09); }
  weaponEquip() { this.tone(470, 0.08, "square", 0.08); }

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
