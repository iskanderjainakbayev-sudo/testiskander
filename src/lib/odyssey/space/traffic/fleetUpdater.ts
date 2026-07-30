import * as THREE from 'three';
import { HULL_PROFILES } from './fleetManifest';
import type { FleetVisuals } from './fleetVisuals';
import type { VesselRuntime } from './fleetRuntime';
import { TRAIL_SEGMENTS, trailOffset } from './trafficEffects';
import type { TrafficMaterials, TrafficUpdate } from './types';

const FORWARD = new THREE.Vector3(0, 0, 1);
const scale = new THREE.Vector3();
const effectScale = new THREE.Vector3();
const enginePosition = new THREE.Vector3();
const strobePosition = new THREE.Vector3();
const effectMatrix = new THREE.Matrix4();
const roll = new THREE.Quaternion();
const zeroRotation = new THREE.Quaternion();
const trailPoint = new THREE.Vector3();
const previousTrailPoint = new THREE.Vector3();

function wrap(value: number): number {
  return ((value % 1) + 1) % 1;
}

function updateHull(runtime: VesselRuntime, visuals: FleetVisuals, time: number): number {
  const { spec, route } = runtime;
  const progress = wrap(spec.phase + time * spec.speed);
  route.curve.getPointAt(progress, runtime.position);
  route.curve.getTangentAt(progress, runtime.tangent);
  runtime.quaternion.setFromUnitVectors(FORWARD, runtime.tangent);
  const bankAmount = spec.class === 'freighter' ? .06 : spec.class === 'surveyor' ? .12 : .22;
  roll.setFromAxisAngle(FORWARD, Math.sin(progress * Math.PI * 4 + spec.phase) * bankAmount);
  runtime.quaternion.multiply(roll);
  scale.setScalar(spec.scale);
  runtime.matrix.compose(runtime.position, runtime.quaternion, scale);
  const meshes = visuals.hulls.get(spec.hull);
  if (!meshes) throw new Error(`Missing traffic hull instances for ${spec.hull}`);
  meshes.hull.setMatrixAt(runtime.instanceIndex, runtime.matrix);
  meshes.detail.setMatrixAt(runtime.instanceIndex, runtime.matrix);
  meshes.glass.setMatrixAt(runtime.instanceIndex, runtime.matrix);
  return progress;
}

function updateEffects(
  runtime: VesselRuntime,
  vesselIndex: number,
  progress: number,
  visuals: FleetVisuals,
  time: number,
): void {
  const { spec, matrix, quaternion } = runtime;
  const profile = HULL_PROFILES[spec.hull];
  profile.engines.forEach((offset, engineIndex) => {
    enginePosition.copy(offset).applyMatrix4(matrix);
    const flicker = .48 + .07 * Math.sin(time * 23 + vesselIndex * 2.7 + engineIndex);
    effectScale.set(spec.scale * flicker, spec.scale * flicker, spec.scale * (.72 + flicker));
    effectMatrix.compose(enginePosition, quaternion, effectScale);
    visuals.effects.plumes.setMatrixAt(runtime.plumeStart + engineIndex, effectMatrix);
  });

  const flash = Math.pow(
    Math.max(0, Math.sin(time * 5.7 + vesselIndex * 1.71)),
    24,
  );
  effectScale.setScalar(.04 + flash * (1.6 + spec.scale * .3));
  strobePosition.copy(profile.portStrobe).applyMatrix4(matrix);
  effectMatrix.compose(strobePosition, zeroRotation, effectScale);
  visuals.effects.portStrobes.setMatrixAt(vesselIndex, effectMatrix);
  strobePosition.copy(profile.starboardStrobe).applyMatrix4(matrix);
  effectMatrix.compose(strobePosition, zeroRotation, effectScale);
  visuals.effects.starboardStrobes.setMatrixAt(vesselIndex, effectMatrix);

  routeTrail(runtime, vesselIndex, progress, visuals);
}

function routeTrail(
  runtime: VesselRuntime,
  vesselIndex: number,
  progress: number,
  visuals: FleetVisuals,
): void {
  const attribute = visuals.effects.trailPositions;
  runtime.route.curve.getPointAt(progress, previousTrailPoint);
  for (let segment = 0; segment < TRAIL_SEGMENTS; segment += 1) {
    runtime.route.curve.getPointAt(
      wrap(progress - trailOffset(runtime.spec, segment + 1)),
      trailPoint,
    );
    const index = (vesselIndex * TRAIL_SEGMENTS + segment) * 2;
    attribute.setXYZ(index, previousTrailPoint.x, previousTrailPoint.y, previousTrailPoint.z);
    attribute.setXYZ(index + 1, trailPoint.x, trailPoint.y, trailPoint.z);
    previousTrailPoint.copy(trailPoint);
  }
}

function markUpdates(visuals: FleetVisuals): void {
  visuals.hulls.forEach((meshes) => {
    meshes.hull.instanceMatrix.needsUpdate = true;
    meshes.detail.instanceMatrix.needsUpdate = true;
    meshes.glass.instanceMatrix.needsUpdate = true;
  });
  visuals.effects.plumes.instanceMatrix.needsUpdate = true;
  visuals.effects.portStrobes.instanceMatrix.needsUpdate = true;
  visuals.effects.starboardStrobes.instanceMatrix.needsUpdate = true;
  visuals.effects.trailPositions.needsUpdate = true;
}

export function createFleetUpdater(
  runtimes: VesselRuntime[],
  visuals: FleetVisuals,
  materials: TrafficMaterials,
): (time: number, shipPosition: THREE.Vector3) => TrafficUpdate {
  return (time, shipPosition) => {
    let nearest: VesselRuntime | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    let encounterMessage: string | null = null;
    runtimes.forEach((runtime, vesselIndex) => {
      const progress = updateHull(runtime, visuals, time);
      updateEffects(runtime, vesselIndex, progress, visuals, time);
      const distance = runtime.position.distanceTo(shipPosition);
      if (distance < nearestDistance) {
        nearest = runtime;
        nearestDistance = distance;
      }
      const encounterRange = runtime.spec.class === 'freighter' ? 76 : 58;
      if (distance < encounterRange && !runtime.wasNear && !encounterMessage) {
        encounterMessage = `${runtime.spec.name} // ${runtime.spec.transmission}`;
      }
      runtime.wasNear = distance < encounterRange * 1.7;
    });
    materials.plume.uniforms.uTime.value = time;
    materials.lane.uniforms.uTime.value = time;
    markUpdates(visuals);
    return {
      nearestShipName: nearest ? nearest.spec.name : null,
      nearestShipDistance: nearestDistance,
      encounterMessage,
    };
  };
}
