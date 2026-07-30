import type * as THREE from 'three';
import { DISCOVERIES } from '../discoveries';
import type { OdysseySession } from './OdysseySession';
import type { StationId } from './WalkingController';

export function useShipStation(
  session: OdysseySession,
  station: StationId,
  camera: THREE.PerspectiveCamera,
) {
  if (station === 'helm') {
    session.mode = 'flight';
    camera.position.set(0, 1.58, -3.9);
    camera.rotation.set(0, 0, 0);
  } else if (station === 'navigation') {
    session.cycleTarget();
    session.mission.showTransmission(
      `NAVIGATION // VECTOR LOCKED: ${DISCOVERIES[session.mission.target].name}`,
    );
  } else if (station === 'archive') {
    session.mission.showTransmission(
      'ARCHIVE // Captain Aster: “Three voices remain. Bring them to Atlas.”',
    );
  } else {
    session.fuel = 100;
    session.mission.showTransmission(
      'PULSE CORE // FIELD COHERENCE RESTORED. RANGE: UNBOUNDED.',
    );
  }
}
