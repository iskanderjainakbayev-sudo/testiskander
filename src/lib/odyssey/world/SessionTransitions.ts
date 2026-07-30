import type { WorldCallbacks } from '../types';
import type { InputController } from './InputController';
import type { OdysseySession } from './OdysseySession';

export function enterCinematic(session: OdysseySession, input: InputController) {
  session.mode = 'cinematic';
  session.flight.boost = false;
  session.flight.throttle = 0;
  session.flight.speed = 0;
  session.audio.setFlight(0, false);
  input.clear();
}

export function enterMenu(session: OdysseySession, input: InputController) {
  session.mode = 'menu';
  session.flight.boost = false;
  session.flight.throttle = 0;
  session.audio.setFlight(0, false);
  input.releaseLock();
}

export function enterFinale(
  session: OdysseySession,
  input: InputController,
  callbacks: WorldCallbacks,
) {
  session.mode = 'ending';
  input.releaseLock();
  session.endingTimer = 0;
  callbacks.onComplete();
}
