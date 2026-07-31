import * as THREE from 'three';
import { seededRandom } from './terrain';

interface ParticleLayer {
  points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  positions: Float32Array;
}

function createLayer(count: number, radius: number, size: number, opacity: number, color: number): ParticleLayer {
  const random = seededRandom(count * 871);
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < positions.length; index += 3) {
    positions[index] = (random() - 0.5) * radius;
    positions[index + 1] = (random() - 0.5) * radius;
    positions[index + 2] = (random() - 0.5) * radius;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  return { points: new THREE.Points(geometry, material), positions };
}

export class WaterParticles {
  private readonly bubbles = createLayer(150, 95, 0.16, 0.5, 0xc8ffff);
  private readonly marineSnow = createLayer(340, 72, 0.055, 0.34, 0xb8e8d9);

  constructor(scene: THREE.Scene) {
    scene.add(this.bubbles.points, this.marineSnow.points);
  }

  update(time: number, camera: THREE.Camera): void {
    this.moveLayer(this.bubbles, 0.035, 47);
    this.moveLayer(this.marineSnow, -0.004, 36);
    this.bubbles.points.position.copy(camera.position).multiplyScalar(0.42);
    this.marineSnow.points.position.copy(camera.position).multiplyScalar(0.7);
    this.marineSnow.points.rotation.y = time * 0.012;
    this.marineSnow.points.position.x += Math.sin(time * 0.08) * 1.2;
  }

  private moveLayer(layer: ParticleLayer, rise: number, limit: number): void {
    for (let index = 1; index < layer.positions.length; index += 3) {
      layer.positions[index] += rise;
      if (layer.positions[index] > limit) layer.positions[index] = -limit;
      if (layer.positions[index] < -limit) layer.positions[index] = limit;
    }
    layer.points.geometry.attributes.position.needsUpdate = true;
  }
}
