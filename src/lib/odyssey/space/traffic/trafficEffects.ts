import * as THREE from 'three';
import type { Route, TrafficMaterials, VesselSpec } from './types';

const TRAIL_SEGMENTS = 7;

export interface TrafficEffects {
  group: THREE.Group;
  plumes: THREE.InstancedMesh;
  portStrobes: THREE.InstancedMesh;
  starboardStrobes: THREE.InstancedMesh;
  trails: THREE.LineSegments;
  trailPositions: THREE.BufferAttribute;
}

export function createTrafficEffects(
  plumeCount: number,
  vesselCount: number,
  materials: TrafficMaterials,
): TrafficEffects {
  const group = new THREE.Group();
  group.name = 'Traffic navigation lights and wakes';
  const plumeGeometry = new THREE.CylinderGeometry(.04, 1.05, 13, 12, 1, true);
  plumeGeometry.rotateX(Math.PI / 2);
  plumeGeometry.translate(0, 0, -6.5);
  const plumes = new THREE.InstancedMesh(plumeGeometry, materials.plume, plumeCount);
  plumes.name = 'Ion drive plumes';

  const strobeGeometry = new THREE.IcosahedronGeometry(.3, 1);
  const portStrobes = new THREE.InstancedMesh(strobeGeometry, materials.port, vesselCount);
  const starboardStrobes = new THREE.InstancedMesh(
    strobeGeometry.clone(),
    materials.starboard,
    vesselCount,
  );
  portStrobes.name = 'Port navigation strobes';
  starboardStrobes.name = 'Starboard navigation strobes';

  const trailPositions = new THREE.BufferAttribute(
    new Float32Array(vesselCount * TRAIL_SEGMENTS * 2 * 3),
    3,
  );
  trailPositions.setUsage(THREE.DynamicDrawUsage);
  const trailGeometry = new THREE.BufferGeometry();
  trailGeometry.setAttribute('position', trailPositions);
  const trails = new THREE.LineSegments(trailGeometry, materials.contrail);
  trails.name = 'Traffic ion contrails';
  group.add(plumes, portStrobes, starboardStrobes, trails);
  group.children.forEach((child) => {
    child.frustumCulled = false;
    child.renderOrder = 5;
  });
  return { group, plumes, portStrobes, starboardStrobes, trails, trailPositions };
}

export function createDistantLanes(
  routes: Map<string, Route>,
  material: THREE.ShaderMaterial,
): THREE.LineSegments {
  const positions: number[] = [];
  const phases: number[] = [];
  const sample = new THREE.Vector3();
  routes.forEach((route, routeIndex) => {
    const samples = route.id === 'long-haul' ? 144 : 72;
    for (let index = 0; index < samples; index += 1) {
      const start = index / samples;
      const end = (index + .68) / samples;
      route.curve.getPointAt(start, sample);
      positions.push(sample.x, sample.y, sample.z);
      phases.push(start + routeIndex * .17);
      route.curve.getPointAt(end, sample);
      positions.push(sample.x, sample.y, sample.z);
      phases.push(end + routeIndex * .17);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));
  const lanes = new THREE.LineSegments(geometry, material);
  lanes.name = 'Faint interstellar navigation lanes';
  lanes.renderOrder = 2;
  return lanes;
}

export function trailOffset(spec: VesselSpec, segment: number): number {
  const classLength = spec.class === 'freighter' ? .0027 : .0017;
  return segment * classLength / spec.scale / TRAIL_SEGMENTS;
}

export { TRAIL_SEGMENTS };
