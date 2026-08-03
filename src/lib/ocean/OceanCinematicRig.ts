import * as THREE from 'three';

const MENU_CENTER = new THREE.Vector3(0, -7, 8);
const INTRO_DURATION = 6.2;

function smootherStep(value: number): number {
  const x = THREE.MathUtils.clamp(value, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

export class OceanCinematicRig {
  private introElapsed = 0;
  private introActive = false;
  private readonly start = new THREE.Vector3();
  private readonly control = new THREE.Vector3();
  private readonly destination = new THREE.Vector3();
  private readonly lookTarget = new THREE.Vector3();

  get active(): boolean {
    return this.introActive;
  }

  beginIntro(destination: THREE.Vector3): void {
    this.introElapsed = 0;
    this.introActive = true;
    this.destination.copy(destination);
    this.start.set(destination.x + 42, 6.5, destination.z + 53);
    this.control.set(destination.x - 16, -10, destination.z + 24);
  }

  updateIntro(delta: number, camera: THREE.PerspectiveCamera): boolean {
    if (!this.introActive) return false;
    this.introElapsed = Math.min(INTRO_DURATION, this.introElapsed + delta);
    const t = smootherStep(this.introElapsed / INTRO_DURATION);
    const inverse = 1 - t;
    camera.position.set(
      inverse * inverse * this.start.x + 2 * inverse * t * this.control.x + t * t * this.destination.x,
      inverse * inverse * this.start.y + 2 * inverse * t * this.control.y + t * t * this.destination.y,
      inverse * inverse * this.start.z + 2 * inverse * t * this.control.z + t * t * this.destination.z,
    );
    this.lookTarget.set(
      THREE.MathUtils.lerp(0, this.destination.x, t),
      THREE.MathUtils.lerp(-8, this.destination.y + 0.42, t),
      THREE.MathUtils.lerp(8, this.destination.z + 8, t),
    );
    camera.lookAt(this.lookTarget);
    camera.fov = THREE.MathUtils.lerp(68, 76, smootherStep(Math.max(0, (t - 0.58) / 0.42)));
    camera.updateProjectionMatrix();
    if (this.introElapsed >= INTRO_DURATION) this.introActive = false;
    return true;
  }

  updateMenu(time: number, camera: THREE.PerspectiveCamera): void {
    const orbit = time * 0.055;
    const radius = 31 + Math.sin(time * 0.11) * 4;
    camera.position.set(
      Math.sin(orbit) * radius,
      -4.8 + Math.sin(time * 0.17) * 2.2,
      8 + Math.cos(orbit) * radius,
    );
    this.lookTarget.copy(MENU_CENTER);
    this.lookTarget.x += Math.sin(time * 0.09) * 5;
    camera.lookAt(this.lookTarget);
    camera.fov = 69 + Math.sin(time * 0.08) * 2;
    camera.updateProjectionMatrix();
  }
}
