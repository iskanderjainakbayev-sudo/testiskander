import { clearSave, loadSave } from '../save';
import type { SaveData } from '../types';
import type { InputController } from './InputController';
import type { OdysseySession } from './OdysseySession';
import type { VoyageProgress } from './VoyageProgress';

const LOCKED_MODES = ['walking', 'flight', 'cinematic', 'surface', 'landing', 'takeoff'];

export function startVoyage(
  session: OdysseySession,
  progress: VoyageProgress,
  newGame: boolean,
  input: InputController,
): SaveData | null {
  void session.audio.start();
  input.clear();
  session.manualScanUntil = 0;
  session.endingTimer = 0;
  session.flight.reset();
  const save = newGame ? null : loadSave();
  if (newGame) clearSave();
  if (save) {
    session.mission.restore(
      save.scanned,
      save.target,
      save.solaceSurveyed,
      save.nacreSurveyed,
    );
    session.flight.position.set(...save.shipPosition);
    session.mode = 'flight';
  } else {
    session.mission.reset();
    session.walking.reset();
    session.mode = 'walking';
  }
  progress.restore(save);
  session.pausedFrom = session.mode;
  session.fuel = 100;
  input.requestLock();
  session.audio.ui('select');
  return save;
}

export function resumeVoyage(session: OdysseySession, input: InputController) {
  if (session.mode === 'paused') session.mode = session.pausedFrom;
  input.requestLock();
  session.audio.ui('select');
}

export function handleVoyagePointerLock(session: OdysseySession, locked: boolean) {
  if (locked || !LOCKED_MODES.includes(session.mode)) return;
  session.pausedFrom = session.mode;
  session.mode = 'paused';
  session.flight.boost = false;
  session.audio.setFlight(0, false);
}
