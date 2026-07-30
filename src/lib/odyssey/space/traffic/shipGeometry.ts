import type { HullId, ShipGeometrySet } from './types';
import { createEscortGeometry } from './escortGeometry';
import { createFreighterGeometry } from './freighterGeometry';
import { createSurveyorGeometry } from './surveyorGeometry';

export function createShipGeometry(id: HullId): ShipGeometrySet {
  if (id === 'arkose' || id === 'caravel') return createFreighterGeometry(id);
  if (id === 'orison' || id === 'kestrel') return createSurveyorGeometry(id);
  return createEscortGeometry(id);
}
