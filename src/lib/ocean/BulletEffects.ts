import * as THREE from 'three';

interface Bullet {
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  trail: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  start: THREE.Vector3;
  end: THREE.Vector3;
  bornAt: number;
  life: number;
}

export class BulletEffects {
  private readonly bullets: Bullet[] = [];

  constructor(private readonly scene: THREE.Scene) {}

  spawn(now: number, start: THREE.Vector3, end: THREE.Vector3, special: boolean): void {
    const material = new THREE.MeshBasicMaterial({ color: special ? 0xffa23f : 0x9ffff4 });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(special ? 0.12 : 0.065, 8, 6), material);
    const trail = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([start, start]),
      new THREE.LineBasicMaterial({ color: material.color, transparent: true, opacity: 0.8 }),
    );
    mesh.position.copy(start);
    this.scene.add(mesh, trail);
    this.bullets.push({ mesh, trail, start, end, bornAt: now, life: special ? 340 : 230 });
  }

  update(now: number): void {
    for (let index = this.bullets.length - 1; index >= 0; index -= 1) {
      const bullet = this.bullets[index];
      const progress = Math.min(1, (now - bullet.bornAt) / bullet.life);
      bullet.mesh.position.lerpVectors(bullet.start, bullet.end, progress);
      const tail = bullet.mesh.position.clone().lerp(bullet.start, 0.08);
      bullet.trail.geometry.setFromPoints([tail, bullet.mesh.position]);
      bullet.mesh.scale.setScalar(1 + Math.sin(progress * Math.PI) * 0.8);
      if (progress < 1) continue;
      this.remove(bullet);
      this.bullets.splice(index, 1);
    }
  }

  dispose(): void {
    this.bullets.forEach((bullet) => this.remove(bullet));
    this.bullets.splice(0);
  }

  private remove(bullet: Bullet): void {
    this.scene.remove(bullet.mesh, bullet.trail);
    bullet.mesh.geometry.dispose();
    bullet.mesh.material.dispose();
    bullet.trail.geometry.dispose();
    bullet.trail.material.dispose();
  }
}
