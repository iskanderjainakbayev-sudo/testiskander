import * as THREE from 'three';
import { HULL_IDS, VESSELS } from './fleetManifest';
import { createShipGeometry } from './shipGeometry';
import { createTrafficEffects, type TrafficEffects } from './trafficEffects';
import type { HullId, TrafficMaterials } from './types';

export interface HullMeshes {
  hull: THREE.InstancedMesh;
  detail: THREE.InstancedMesh;
  glass: THREE.InstancedMesh;
}

export interface FleetVisuals {
  group: THREE.Group;
  hulls: Map<HullId, HullMeshes>;
  effects: TrafficEffects;
}

function configure(mesh: THREE.InstancedMesh, name: string): void {
  mesh.name = name;
  mesh.frustumCulled = false;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
}

export function createFleetVisuals(materials: TrafficMaterials): FleetVisuals {
  const group = new THREE.Group();
  group.name = 'Civilian and expedition traffic';
  const hulls = new Map<HullId, HullMeshes>();

  HULL_IDS.forEach((id) => {
    const specs = VESSELS.filter((spec) => spec.hull === id);
    const geometry = createShipGeometry(id);
    const hull = new THREE.InstancedMesh(geometry.hull, materials.hull, specs.length);
    const detail = new THREE.InstancedMesh(geometry.detail, materials.detail, specs.length);
    const glass = new THREE.InstancedMesh(geometry.glass, materials.glass, specs.length);
    configure(hull, `${id} hull instances`);
    configure(detail, `${id} armor instances`);
    configure(glass, `${id} window instances`);
    specs.forEach((spec, index) => {
      hull.setColorAt(index, new THREE.Color(spec.tint));
      glass.setColorAt(index, new THREE.Color(
        spec.class === 'freighter' ? 0x9dbea9
          : spec.class === 'surveyor' ? 0x78c1cd : 0x81a6c8,
      ));
    });
    if (hull.instanceColor) hull.instanceColor.needsUpdate = true;
    if (glass.instanceColor) glass.instanceColor.needsUpdate = true;
    hulls.set(id, { hull, detail, glass });
    group.add(hull, detail, glass);
  });

  const plumeCount = VESSELS.reduce(
    (count, spec) => count + (
      spec.hull === 'orison' ? 1 : 2
    ),
    0,
  );
  const effects = createTrafficEffects(plumeCount, VESSELS.length, materials);
  group.add(effects.group);
  return { group, hulls, effects };
}
