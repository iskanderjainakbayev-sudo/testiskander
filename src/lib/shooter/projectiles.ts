import * as THREE from "three";

type Projectile = {
  mesh: THREE.Mesh;
  direction: THREE.Vector3;
  life: number;
  hostile: boolean;
};

export class ProjectileSystem {
  private readonly shots: Projectile[] = [];
  constructor(private readonly scene: THREE.Scene) {}
  add(origin: THREE.Vector3, direction: THREE.Vector3, hostile: boolean) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(hostile ? 0.09 : 0.07, 6, 6),
      new THREE.MeshBasicMaterial({ color: hostile ? 0xff5e62 : 0x9afff2 }),
    );
    mesh.position.copy(origin);
    this.scene.add(mesh);
    this.shots.push({ mesh, direction, life: hostile ? 2.2 : 0.12, hostile });
  }
  update(delta: number, playerPosition: THREE.Vector3, onHit: () => void) {
    for (let index = this.shots.length - 1; index >= 0; index -= 1) {
      const shot = this.shots[index];
      shot.life -= delta;
      shot.mesh.position.addScaledVector(
        shot.direction,
        (shot.hostile ? 32 : 60) * delta,
      );
      if (
        shot.hostile &&
        shot.mesh.position.distanceTo(playerPosition) < 0.75
      ) {
        onHit();
        shot.life = 0;
      }
      if (shot.life <= 0) {
        this.scene.remove(shot.mesh);
        this.shots.splice(index, 1);
      }
    }
  }
  clear() {
    this.shots.forEach((shot) => this.scene.remove(shot.mesh));
    this.shots.splice(0);
  }
}
