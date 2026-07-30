import * as THREE from 'three';
import type { InteriorMaterials } from './materials';
import {
  addCylinder,
  addRoundedBox,
  roundedInstances,
  type Placement,
} from './interiorGeometry';
import { addRing, createHologramMaterial } from './stationPrimitives';

export function buildNavigationStation(
  group: THREE.Group,
  holograms: THREE.Object3D[],
  materials: InteriorMaterials,
): void {
  const x = -1.15;
  const z = 1.25;
  const lower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.72, 0.86, 0.28, 24),
    materials.frame,
  );
  lower.position.set(x, 0.14, z);
  lower.castShadow = true;
  group.add(lower);
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(1.08, 0.82, 0.6, 32, 1, false),
    materials.panel,
  );
  body.position.set(x, 0.53, z);
  body.castShadow = true;
  group.add(body);
  addCylinder(group, 0.98, 0.08, materials.recess, {
    position: [x, 0.86, z],
  }, 32);
  addRing(group, 1.03, 0.075, materials.trim, [x, 0.87, z], [Math.PI / 2, 0, 0]);
  addControlCrown(group, materials, x, z);
  buildStarMap(group, holograms, x, z);
}

function addControlCrown(
  group: THREE.Group,
  materials: InteriorMaterials,
  centerX: number,
  centerZ: number,
): void {
  const pads: Placement[] = [];
  for (let index = 0; index < 10; index += 1) {
    const angle = index / 10 * Math.PI * 2;
    pads.push({
      position: [
        centerX + Math.cos(angle) * 0.82,
        0.93,
        centerZ + Math.sin(angle) * 0.82,
      ],
      rotation: [0, -angle, 0],
    });
  }
  roundedInstances(group, [0.25, 0.045, 0.15], materials.accent, pads, 0.018);
  addRoundedBox(group, [0.72, 0.035, 0.16], materials.cyan, {
    position: [centerX, 0.94, centerZ - 0.66],
  }, 0.014);
}

function buildStarMap(
  group: THREE.Group,
  holograms: THREE.Object3D[],
  x: number,
  z: number,
): void {
  const glow = createHologramMaterial(0x75e7e2);
  const map = new THREE.Mesh(new THREE.IcosahedronGeometry(0.66, 3), glow);
  map.position.set(x, 1.55, z);
  map.userData.spinY = 0.24;
  group.add(map);
  const orbitMaterial = new THREE.MeshBasicMaterial({
    color: 0xf3ad64,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  });
  const orbit = addRing(group, 0.92, 0.012, orbitMaterial, [x, 1.55, z], [1.12, 0.18, 0]);
  orbit.userData.spinZ = -0.14;
  const meridian = addRing(group, 0.78, 0.009, glow, [x, 1.55, z], [0.28, 1.1, 0]);
  meridian.userData.spinZ = 0.1;
  holograms.push(map, orbit, meridian);
}
