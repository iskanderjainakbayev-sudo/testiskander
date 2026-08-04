import * as THREE from 'three';

interface Effect { object: THREE.Object3D; born: number; life: number; update: (age: number) => void }

export class MultiToolEffects {
  private readonly effects: Effect[] = [];
  private readonly material = new THREE.MeshBasicMaterial({ color: 0x68fff0, transparent: true, opacity: .8, depthWrite: false });

  constructor(private readonly scene: THREE.Scene) {}

  beam(now: number, start: THREE.Vector3, end: THREE.Vector3, color: number): void {
    const direction = end.clone().sub(start);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.018, .032, direction.length(), 7), this.material.clone());
    (beam.material as THREE.MeshBasicMaterial).color.setHex(color);
    beam.position.copy(start).add(end).multiplyScalar(.5);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    this.add(beam, now, 120, (age) => { beam.scale.set(1 - age * .7, 1, 1 - age * .7); });
    this.sparks(now, end, color, 7);
  }

  harpoon(now: number, start: THREE.Vector3, end: THREE.Vector3, color: number): void {
    this.beam(now, start, end, color);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(.075, .32, 6), this.material.clone());
    (tip.material as THREE.MeshBasicMaterial).color.setHex(color);
    tip.position.copy(end);
    this.add(tip, now, 520, (age) => tip.scale.setScalar(1 - age * .8));
  }

  pulse(now: number, origin: THREE.Vector3, color: number): void {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, .08, 8, 44), this.material.clone());
    (ring.material as THREE.MeshBasicMaterial).color.setHex(color);
    ring.position.copy(origin);
    ring.rotation.x = Math.PI / 2;
    this.add(ring, now, 720, (age) => {
      ring.scale.setScalar(1 + age * 13);
      (ring.material as THREE.MeshBasicMaterial).opacity = 1 - age;
    });
  }

  scan(now: number, origin: THREE.Vector3, color: number): void {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10), this.material.clone());
    const material = sphere.material as THREE.MeshBasicMaterial;
    material.color.setHex(color);
    material.wireframe = true;
    material.opacity = .32;
    sphere.position.copy(origin);
    this.add(sphere, now, 850, (age) => { sphere.scale.setScalar(1 + age * 18); sphere.rotation.y = age * 2; material.opacity = .32 * (1 - age); });
  }

  sparks(now: number, point: THREE.Vector3, color: number, count: number): void {
    for (let index = 0; index < count; index += 1) {
      const spark = new THREE.Mesh(new THREE.IcosahedronGeometry(.025, 0), this.material.clone());
      (spark.material as THREE.MeshBasicMaterial).color.setHex(color);
      const velocity = new THREE.Vector3((Math.random() - .5), (Math.random() - .5), (Math.random() - .5)).normalize();
      spark.position.copy(point);
      this.add(spark, now, 430, (age) => spark.position.addScaledVector(velocity, .035 * (1 - age)));
    }
  }

  update(now: number): void {
    for (let index = this.effects.length - 1; index >= 0; index -= 1) {
      const effect = this.effects[index];
      const age = (now - effect.born) / effect.life;
      if (age >= 1) {
        this.scene.remove(effect.object);
        dispose(effect.object);
        this.effects.splice(index, 1);
      } else effect.update(age);
    }
  }

  dispose(): void { this.effects.forEach((effect) => { this.scene.remove(effect.object); dispose(effect.object); }); this.effects.length = 0; }
  private add(object: THREE.Object3D, born: number, life: number, update: Effect['update']): void { this.scene.add(object); this.effects.push({ object, born, life, update }); }
}

function dispose(object: THREE.Object3D): void {
  if (!(object instanceof THREE.Mesh)) return;
  object.geometry.dispose();
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  materials.forEach((material) => material.dispose());
}
