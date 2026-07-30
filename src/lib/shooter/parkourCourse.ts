import * as THREE from "three";
import type { Mission, PlatformSpec } from "./levels";

export class ParkourCourse {
  private readonly group = new THREE.Group();
  platforms: PlatformSpec[] = [];
  constructor(scene: THREE.Scene) {
    scene.add(this.group);
  }
  load(level: Mission) {
    this.group.clear();
    this.platforms = level.platforms;
    const material = new THREE.MeshStandardMaterial({
      color: level.tint,
      emissive: level.tint,
      emissiveIntensity: 0.26,
      roughness: 0.35,
      metalness: 0.56,
    });
    level.platforms.forEach((platform, index) =>
      this.addPlatform(platform, material, index),
    );
    this.addExitGate(level.platforms[level.platforms.length - 1], level.tint);
  }
  private addPlatform(
    platform: PlatformSpec,
    material: THREE.MeshStandardMaterial,
    index: number,
  ) {
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(platform.width, platform.height, platform.depth),
      material,
    );
    block.position.set(platform.x, platform.height / 2, platform.z);
    block.castShadow = true;
    block.receiveShadow = true;
    this.group.add(block);
    const light = new THREE.Mesh(
      new THREE.BoxGeometry(platform.width + 0.08, 0.08, platform.depth + 0.08),
      new THREE.MeshBasicMaterial({ color: index % 2 ? 0xffffff : 0x89fff5 }),
    );
    light.position.set(platform.x, platform.height + 0.05, platform.z);
    this.group.add(light);
  }
  private addExitGate(platform: PlatformSpec, tint: number) {
    const gate = new THREE.Mesh(
      new THREE.TorusGeometry(0.72, 0.07, 8, 24),
      new THREE.MeshBasicMaterial({ color: tint }),
    );
    gate.position.set(platform.x, platform.height + 0.84, platform.z);
    this.group.add(gate);
  }
}
