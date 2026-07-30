import { DISCOVERIES, TARGET_ORDER } from '../discoveries';
import type { DiscoveryId } from '../types';

const TRANSMISSIONS: Record<DiscoveryId, string> = {
  solace: 'ECHO 01 // “We found rain beneath the ice. It falls upward.”',
  veil: 'ECHO 02 // “The dark is not empty. It is listening between seconds.”',
  pilgrim: 'ECHO 03 // “Atlas was never a monument. Atlas is a departure.”',
  atlas: 'ATLAS KEY ACCEPTED // A path opens beyond the local universe.',
};

export class MissionController {
  scanned: DiscoveryId[] = [];
  target: DiscoveryId = 'solace';
  scanProgress = 0;
  transmission: string | null = null;
  private transmissionTime = 0;

  reset() {
    this.scanned = [];
    this.target = 'solace';
    this.scanProgress = 0;
    this.transmission = null;
  }

  restore(scanned: DiscoveryId[], target: DiscoveryId) {
    this.scanned = [...scanned];
    this.target = target;
  }

  cycleTarget() {
    const unlocked = TARGET_ORDER.filter((id) => id !== 'atlas' || this.echoes >= 3);
    const index = unlocked.indexOf(this.target);
    this.target = unlocked[(index + 1) % unlocked.length] ?? 'solace';
    this.scanProgress = 0;
  }

  update(delta: number, scanning: boolean, distance: number, alignment: number) {
    if (this.transmissionTime > 0) {
      this.transmissionTime -= delta;
      if (this.transmissionTime <= 0) this.transmission = null;
    }
    if (this.scanned.includes(this.target)) {
      this.scanProgress = 0;
      return null;
    }
    const discovery = DISCOVERIES[this.target];
    const canScan = distance < discovery.scanRange && alignment > 0.91;
    this.scanProgress = scanning && canScan
      ? Math.min(1, this.scanProgress + delta / 2.25)
      : Math.max(0, this.scanProgress - delta * 0.72);
    if (this.scanProgress < 1) return null;
    this.scanned.push(this.target);
    this.transmission = TRANSMISSIONS[this.target];
    this.transmissionTime = this.target === 'atlas' ? 12 : 8;
    const completed = this.target;
    const next = TARGET_ORDER.find((id) => id !== 'atlas' && !this.scanned.includes(id));
    this.target = next ?? 'atlas';
    this.scanProgress = 0;
    return completed;
  }

  showTransmission(text: string, seconds = 7) {
    this.transmission = text;
    this.transmissionTime = seconds;
  }

  get echoes() {
    return this.scanned.filter((id) => id !== 'atlas').length;
  }
}
