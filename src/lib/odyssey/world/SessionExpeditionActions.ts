import type { LandablePlanetId } from '../types';
import type { InputController } from './InputController';
import type { OdysseySession } from './OdysseySession';
import type { VoyageProgress } from './VoyageProgress';

export function findLandableTarget(session: OdysseySession): LandablePlanetId | null {
  if (session.mode !== 'flight') return null;
  if (session.mission.solaceSurveyed && session.flight.distanceTo('solace') < 220) {
    return 'solace';
  }
  if (session.mission.nacreSurveyed && session.flight.distanceTo('nacre') < 220) {
    return 'nacre';
  }
  return null;
}

export function beginPlanetLanding(session: OdysseySession, input: InputController) {
  const target = findLandableTarget(session);
  if (!target) return false;
  session.landingTarget = target;
  session.landing.beginLanding(session.flight, target);
  session.mode = 'landing';
  input.clear();
  session.audio.discovery();
  session.mission.showTransmission(
    `${target.toUpperCase()} CONTROL // DESCENT CORRIDOR ACQUIRED.`,
  );
  return true;
}

export function beginPlanetTakeoff(session: OdysseySession, input: InputController) {
  session.landing.beginTakeoff();
  session.mode = 'takeoff';
  input.clear();
  session.audio.gate();
  session.persist();
}

export function recordPlanetSample(
  session: OdysseySession,
  progress: VoyageProgress,
  index: number,
) {
  if (session.landingTarget === 'nacre') {
    progress.recordNacreSample(index, session.mission, session.flight);
  } else {
    progress.recordSurfaceSample(index, session.mission, session.flight);
  }
}
