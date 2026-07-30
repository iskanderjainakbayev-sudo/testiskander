import * as THREE from 'three';
import { makeScreenTexture } from './materials';

function box(size: readonly [number, number, number], material: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function screen(title: string, size: readonly [number, number], accent?: string) {
  const material = new THREE.MeshStandardMaterial({
    color: 0xbfeff0,
    map: makeScreenTexture(title, accent),
    emissive: 0x3dbdc6,
    emissiveIntensity: 1.25,
    roughness: 0.28,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(...size), material);
}

export function buildCockpit(group: THREE.Group, holograms: THREE.Object3D[]) {
  const consoleMaterial = new THREE.MeshStandardMaterial({
    color: 0x151d21,
    roughness: 0.48,
    metalness: 0.72,
  });
  const leather = new THREE.MeshStandardMaterial({
    color: 0x151719,
    roughness: 0.92,
  });
  const console = box([5.1, 0.62, 1.45], consoleMaterial);
  console.position.set(0, 0.55, -5.4);
  console.rotation.x = -0.18;
  group.add(console);

  for (const x of [-1.45, 0, 1.45]) {
    const panel = screen(x === 0 ? 'NAV / HELM' : 'FLIGHT SYSTEMS', [1.25, 0.48]);
    panel.position.set(x, 0.97, -4.79);
    panel.rotation.x = -Math.PI / 2.65;
    group.add(panel);
    holograms.push(panel);
  }

  const seat = box([1.05, 0.22, 1.2], leather);
  seat.position.set(0, 0.48, -3.45);
  group.add(seat);
  const back = box([1.05, 1.4, 0.2], leather);
  back.position.set(0, 1.08, -2.95);
  back.rotation.x = -0.18;
  group.add(back);
  const base = box([0.38, 0.5, 0.38], consoleMaterial);
  base.position.set(0, 0.2, -3.3);
  group.add(base);
}

export function buildNavTable(group: THREE.Group, holograms: THREE.Object3D[]) {
  const metal = new THREE.MeshStandardMaterial({
    color: 0x172226,
    roughness: 0.4,
    metalness: 0.84,
  });
  const glow = new THREE.MeshBasicMaterial({
    color: 0x75e7e6,
    transparent: true,
    opacity: 0.36,
    wireframe: true,
  });
  const table = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 0.9, 0.82, 10), metal);
  table.position.set(-1.15, 0.42, 1.25);
  group.add(table);
  const map = new THREE.Mesh(new THREE.IcosahedronGeometry(0.68, 2), glow);
  map.position.set(-1.15, 1.55, 1.25);
  map.userData.spinY = 0.34;
  group.add(map);
  const orbit = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.012, 5, 90),
    new THREE.MeshBasicMaterial({ color: 0xffa65e, transparent: true, opacity: 0.78 }),
  );
  orbit.position.copy(map.position);
  orbit.rotation.x = 1.15;
  orbit.userData.spinZ = -0.16;
  group.add(orbit);
  holograms.push(map, orbit);
}

export function buildArchiveAndReactor(group: THREE.Group, holograms: THREE.Object3D[]) {
  const casing = new THREE.MeshStandardMaterial({
    color: 0x171f23,
    roughness: 0.55,
    metalness: 0.7,
  });
  const archive = box([0.45, 1.75, 2.2], casing);
  archive.position.set(2.65, 1.18, 3.8);
  group.add(archive);
  const display = screen('ARCHIVE / ECHO LOG', [1.6, 0.8], '#8fe9e5');
  display.position.set(2.41, 1.47, 3.8);
  display.rotation.y = -Math.PI / 2;
  group.add(display);
  holograms.push(display);

  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0x213238,
    emissive: 0x4ebfb6,
    emissiveIntensity: 1.7,
    roughness: 0.25,
    metalness: 0.8,
  });
  for (let i = 0; i < 3; i += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.55 + i * 0.16, 0.12, 10, 50), ringMaterial);
    ring.position.set(0, 1.58, 9.5);
    ring.rotation.y = Math.PI / 2;
    ring.rotation.x = i * 0.27;
    ring.userData.spinZ = 0.08 + i * 0.025;
    group.add(ring);
    holograms.push(ring);
  }
  const core = new THREE.PointLight(0x79d9cf, 7, 9, 2);
  core.position.set(0, 1.6, 9.25);
  group.add(core);
}
