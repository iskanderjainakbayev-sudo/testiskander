import * as THREE from 'three';
import { DISCOVERIES } from '../discoveries';
import type { LandablePlanetId } from '../types';
import type { FlightController } from './FlightController';

export class LandingController {
  progress = 0;
  readonly start = new THREE.Vector3();
  readonly atmosphere = new THREE.Vector3();
  readonly exit = new THREE.Vector3();
  private readonly normal = new THREE.Vector3();

  beginLanding(flight: FlightController, planet: LandablePlanetId) {
    const center = new THREE.Vector3(...DISCOVERIES[planet].position);
    this.start.copy(flight.position);
    this.normal.copy(flight.position).sub(center).normalize();
    this.atmosphere.copy(center).addScaledVector(this.normal, 70.5);
    this.exit.copy(center).addScaledVector(this.normal, 205);
    this.progress = 0;
    flight.throttle = 0;
    flight.speed = 0;
    flight.boost = false;
  }

  beginTakeoff() {
    this.progress = 0;
  }

  updateLanding(delta: number, flight: FlightController) {
    this.progress = Math.min(1, this.progress + delta / 7.6);
    const travel = smoothstep(0, 0.66, this.progress);
    flight.position.lerpVectors(this.start, this.atmosphere, travel);
    return this.progress >= 1;
  }

  updateTakeoff(delta: number, flight: FlightController) {
    this.progress = Math.min(1, this.progress + delta / 6.4);
    const travel = smoothstep(0.48, 1, this.progress);
    flight.position.lerpVectors(this.atmosphere, this.exit, travel);
    return this.progress >= 1;
  }

  cloudOpacity() {
    const entering = smoothstep(0.34, 0.56, this.progress);
    const clearing = 1 - smoothstep(0.69, 0.94, this.progress);
    return Math.min(1, entering * clearing * 1.42);
  }
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const ratio = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return ratio * ratio * (3 - 2 * ratio);
}
