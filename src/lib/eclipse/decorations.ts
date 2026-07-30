import * as THREE from 'three';
import type { LayoutPoint } from './layout.worker';

export function addLayoutDecorations(scene: THREE.Scene, points: LayoutPoint[]) {
  const geometry = new THREE.ConeGeometry(.42, 1.7, 5);
  const materials = [new THREE.MeshStandardMaterial({ color: '#1c304b', roughness: .8 }), new THREE.MeshStandardMaterial({ color: '#543761', roughness: .7 })];
  points.forEach((point, index) => {
    const rock = new THREE.Mesh(geometry, materials[index % materials.length]);
    rock.position.set(point.x, point.size * .75, point.z);
    rock.scale.setScalar(point.size);
    rock.rotation.y = point.tone * Math.PI;
    rock.castShadow = true;
    scene.add(rock);
  });
}
