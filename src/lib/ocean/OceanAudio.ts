import { OceanSoundEngine } from './OceanSoundEngine';

export class OceanAudio {
  private readonly engine = new OceanSoundEngine();
  private warningAt = 0;
  private swimAt = 0;
  private creatureCallAt = 0;
  private bossNear = false;

  start(): void {
    this.engine.start();
  }

  collect(): void {
    this.engine.tone(440, 760, 0.13, 0.055);
  }

  scan(): void {
    this.engine.tone(180, 1100, 0.5, 0.045);
  }

  discovery(): void {
    [220, 330, 494, 740].forEach((note, index) => this.engine.tone(note, note * 1.01, 1.4, 0.035, index * 0.12));
  }

  danger(): void {
    this.engine.tone(92, 54, 0.45, 0.08);
  }

  gunshot(): void {
    this.engine.noise(.07, .15, 1450, 0, 'bandpass');
    this.engine.tone(760, 95, .16, .07, 0, 'sawtooth');
    this.engine.tone(118, 48, .26, .08, .018);
    this.engine.noise(.18, .045, 420, .035);
    this.engine.tone(980, 420, .1, .025, .07, 'triangle');
  }

  specialShot(): void {
    this.engine.tone(90, 880, .38, .07, 0, 'sawtooth');
    this.engine.noise(.34, .2, 1350, .08, 'bandpass');
    [82, 164, 328].forEach((note, index) =>
      this.engine.tone(note * 3.5, note * .42, .58, .065, .1 + index * .025, 'triangle'));
    this.engine.tone(54, 38, .72, .11, .12);
    this.engine.noise(.42, .045, 260, .2);
  }

  knifeSwing(): void {
    this.engine.noise(0.13, 0.055, 1700);
    this.engine.tone(520, 130, 0.14, 0.035);
  }

  knifeHit(): void {
    this.engine.noise(0.1, 0.08, 420);
    this.engine.tone(105, 42, 0.18, 0.065);
  }

  weaponSwitch(): void {
    this.engine.tone(210, 560, .1, .035, 0, 'triangle');
    this.engine.tone(480, 760, .08, .025, .08, 'square');
    this.engine.noise(.045, .035, 900, .045, 'bandpass');
  }

  weaponHit(): void {
    this.engine.noise(0.08, 0.06, 360);
    this.engine.tone(120, 48, 0.22, 0.06);
  }

  swim(now: number, boosting: boolean): void {
    const delay = boosting ? 270 : 520;
    if (now - this.swimAt < delay) return;
    this.swimAt = now;
    this.engine.noise(0.16, boosting ? 0.04 : 0.022, boosting ? 720 : 420);
    this.engine.tone(boosting ? 150 : 96, 62, 0.2, boosting ? 0.025 : 0.012);
  }

  creatureAttack(boss: boolean, voiceHz: number, attack: string): void {
    const noisy = attack === 'bite' || attack === 'ram' || attack === 'charge';
    this.engine.noise(boss ? .34 : .18, noisy ? .12 : .07, attack === 'shock' ? 1200 : 310);
    this.engine.tone(boss ? 42 : voiceHz, attack === 'shock' ? voiceHz * 2.4 : voiceHz * .48, boss ? .72 : .38, boss ? .1 : .055);
    if (attack === 'shock') this.engine.tone(voiceHz * 1.5, voiceHz * .6, .22, .035, .06);
  }

  creatureNearby(now: number, voiceHz: number, mode: string): void {
    if (now - this.creatureCallAt < (mode === 'warn' ? 2400 : 4800)) return;
    this.creatureCallAt = now;
    const urgent = mode === 'warn' || mode === 'chase' || mode === 'attack';
    this.engine.tone(voiceHz, urgent ? voiceHz * .62 : voiceHz * 1.18, urgent ? .42 : .7, urgent ? .035 : .018);
  }

  setBossNear(near: boolean): void {
    if (near && !this.bossNear) {
      this.engine.noise(0.75, 0.12, 150);
      this.engine.tone(42, 31, 1.35, 0.105);
    }
    this.bossNear = near;
  }

  ui(): void {
    this.engine.tone(340, 510, 0.07, 0.022);
  }

  lights(on: boolean): void {
    this.engine.tone(on ? 120 : 260, on ? 640 : 90, 0.18, 0.03);
  }

  lowOxygen(now: number): void {
    if (now - this.warningAt < 3200) return;
    this.warningAt = now;
    this.engine.tone(660, 330, 0.25, 0.055);
    this.engine.tone(660, 330, 0.25, 0.04, 0.32);
  }

  stop(): void {
    this.engine.stop();
  }
}
