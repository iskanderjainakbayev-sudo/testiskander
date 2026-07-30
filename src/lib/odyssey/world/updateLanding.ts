import * as THREE from 'three';
import type { OdysseySession } from './OdysseySession';
import type { PlanetSurface } from './PlanetExpeditions';
import type { SurfaceController } from './SurfaceController';

export function updateLandingSequence(
  session: OdysseySession,
  surface: PlanetSurface,
  walker: SurfaceController,
  camera: THREE.PerspectiveCamera,
  delta: number,
) {
  const complete = session.landing.updateLanding(delta, session.flight);
  const progress = session.landing.progress;
  if (progress < 0.59) {
    camera.position.set(0, 1.58 - progress * 0.08, -3.9 - progress * 0.72);
    camera.rotation.set(-progress * 0.12, 0, Math.sin(progress * 31) * progress * 0.004);
  } else {
    const descent = smoothstep(0.59, 1, progress);
    const ground = surface.getHeight(0, walker.spawnZ);
    camera.position.set(
      0,
      THREE.MathUtils.lerp(ground + 38, ground + 1.68, descent),
      walker.spawnZ + 16 - descent * 16,
    );
    camera.lookAt(0, ground + 1.1, walker.spawnZ - 42);
  }
  camera.fov = 68 + Math.sin(progress * Math.PI) * 8;
  camera.updateProjectionMatrix();
  if (complete) {
    walker.reset();
    camera.position.copy(walker.position);
    camera.rotation.set(walker.pitch, walker.yaw, 0, 'YXZ');
    camera.fov = 68;
    camera.updateProjectionMatrix();
    session.mode = 'surface';
  }
}

export function updateTakeoffSequence(
  session: OdysseySession,
  surface: PlanetSurface,
  walker: SurfaceController,
  camera: THREE.PerspectiveCamera,
  delta: number,
) {
  const complete = session.landing.updateTakeoff(delta, session.flight);
  const progress = session.landing.progress;
  if (progress < 0.51) {
    const ascent = smoothstep(0, 0.51, progress);
    const ground = surface.getHeight(0, walker.spawnZ);
    camera.position.set(0, ground + 1.68 + ascent * 39, walker.spawnZ + ascent * 16);
    camera.lookAt(0, ground + 1.2, walker.spawnZ - 46);
  } else {
    camera.position.set(0, 1.52, -4.45 + smoothstep(0.51, 1, progress) * 0.55);
    camera.rotation.set(-0.1 * (1 - progress), 0, Math.sin(progress * 28) * 0.003);
  }
  camera.fov = 68 + Math.sin(progress * Math.PI) * 7;
  camera.updateProjectionMatrix();
  if (complete) {
    camera.position.set(0, 1.58, -3.9);
    camera.rotation.set(0, 0, 0);
    camera.fov = 68;
    camera.updateProjectionMatrix();
    session.mode = 'flight';
  }
}

function smoothstep(start: number, end: number, value: number) {
  const ratio = THREE.MathUtils.clamp((value - start) / (end - start), 0, 1);
  return ratio * ratio * (3 - 2 * ratio);
}
