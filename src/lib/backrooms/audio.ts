export class BackroomsAudio {
  private context?: AudioContext;
  private gain?: GainNode;
  private drone?: OscillatorNode;
  private volume = 0.45;

  start(volume: number) {
    this.volume = volume;
    this.context ??= new AudioContext();
    if (this.drone) return;
    this.gain = this.context.createGain(); this.gain.gain.value = volume * 0.08; this.gain.connect(this.context.destination);
    this.drone = this.context.createOscillator(); this.drone.type = 'sawtooth'; this.drone.frequency.value = 47;
    const filter = this.context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 150;
    this.drone.connect(filter); filter.connect(this.gain); this.drone.start();
  }

  setVolume(value: number) { this.volume = value; if (this.gain) this.gain.gain.value = value * 0.08; }
  tone(frequency: number, length = 0.12, volume = 0.18) {
    if (!this.context) return;
    const oscillator = this.context.createOscillator(); const gain = this.context.createGain();
    oscillator.frequency.value = frequency; oscillator.type = 'sine'; gain.gain.value = volume * this.volume;
    oscillator.connect(gain); gain.connect(this.context.destination); oscillator.start(); gain.gain.exponentialRampToValueAtTime(.001, this.context.currentTime + length); oscillator.stop(this.context.currentTime + length);
  }
  footsteps() { this.tone(70 + Math.random() * 20, .07, .1); }
  scare() { this.tone(90, .8, .3); this.tone(810, .12, .12); }
  dispose() { this.drone?.stop(); void this.context?.close(); }
}
