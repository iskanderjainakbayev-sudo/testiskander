import { DISCOVERIES, TARGET_ORDER } from '../discoveries';
import type { DiscoveryId } from '../types';

const TRANSMISSIONS: Record<DiscoveryId, string> = {
  solace: 'ECHO 01 // “We found rain beneath the ice. It falls upward.”',
  nacre: 'NACRE CALIBRATION // “Stone remembers every color that crossed it.”',
  veil: 'ECHO 02 // “The dark is not empty. It is listening between seconds.”',
  pilgrim: 'ECHO 03 // “Atlas was never a monument. Atlas is a departure.”',
  atlas: 'ATLAS KEY ACCEPTED // A path opens beyond the local universe.',
};

export class MissionController {
  scanned: DiscoveryId[] = [];
  target: DiscoveryId = 'solace';
  scanProgress = 0;
  transmission: string | null = null;
  solaceSurveyed = false;
  nacreSurveyed = false;
  private transmissionTime = 0;

  reset() {
    this.scanned = [];
    this.target = 'solace';
    this.scanProgress = 0;
    this.transmission = null;
    this.solaceSurveyed = false;
    this.nacreSurveyed = false;
    this.transmissionTime = 0;
  }

  restore(
    scanned: DiscoveryId[],
    target: DiscoveryId,
    solaceSurveyed = false,
    nacreSurveyed = false,
  ) {
    this.scanned = [...scanned];
    this.target = target;
    this.scanProgress = 0;
    this.transmission = null;
    this.solaceSurveyed = solaceSurveyed || scanned.includes('solace');
    this.nacreSurveyed = nacreSurveyed || scanned.includes('nacre');
    this.transmissionTime = 0;
  }

  cycleTarget() {
    if (this.solaceSurveyed && !this.scanned.includes('solace')) return;
    if (this.nacreSurveyed && !this.scanned.includes('nacre')) return;
    const unlocked = TARGET_ORDER.filter((id) => (
      (id !== 'atlas' || (this.echoes >= 3 && this.scanned.includes('nacre')))
      && !this.scanned.includes(id)
    ));
    if (unlocked.length === 0) return;
    const index = unlocked.indexOf(this.target);
    this.target = unlocked[(index + 1) % unlocked.length] ?? 'solace';
    this.scanProgress = 0;
  }

  update(delta: number, scanning: boolean, distance: number, alignment: number) {
    this.updateTime(delta);
    if (this.target === 'solace' && this.solaceSurveyed) {
      this.scanProgress = 0;
      return null;
    }
    if (this.target === 'nacre' && this.nacreSurveyed) {
      this.scanProgress = 0;
      return null;
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
    if (this.target === 'solace') this.solaceSurveyed = true;
    else if (this.target === 'nacre') this.nacreSurveyed = true;
    else this.scanned.push(this.target);
    this.transmission = TRANSMISSIONS[this.target];
    this.transmissionTime = this.target === 'atlas' ? 12 : 8;
    const completed = this.target;
    if (completed !== 'solace' && completed !== 'nacre') {
      const next = TARGET_ORDER.find((id) => id !== 'atlas' && !this.scanned.includes(id));
      this.target = next ?? 'atlas';
    }
    this.scanProgress = 0;
    return completed;
  }

  completeSolaceExpedition() {
    if (!this.scanned.includes('solace')) this.scanned.push('solace');
    this.target = TARGET_ORDER.find((id) => id !== 'atlas' && !this.scanned.includes(id)) ?? 'atlas';
  }

  completeNacreExpedition() {
    if (!this.scanned.includes('nacre')) this.scanned.push('nacre');
    this.target = TARGET_ORDER.find((id) => id !== 'atlas' && !this.scanned.includes(id)) ?? 'atlas';
  }

  updateTime(delta: number) {
    if (this.transmissionTime > 0) {
      this.transmissionTime -= delta;
      if (this.transmissionTime <= 0) this.transmission = null;
    }
  }

  showTransmission(text: string, seconds = 7) {
    this.transmission = text;
    this.transmissionTime = seconds;
  }

  get echoes() {
    return this.scanned.filter((id) => id !== 'atlas' && id !== 'nacre').length;
  }
}
