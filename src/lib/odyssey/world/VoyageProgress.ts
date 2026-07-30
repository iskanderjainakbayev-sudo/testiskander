import { storeSave } from '../save';
import type { SaveData } from '../types';
import type { FlightController } from './FlightController';
import type { MissionController } from './MissionController';

export class VoyageProgress {
  surfaceSamples: number[] = [];
  nacreSurfaceSamples: number[] = [];

  restore(save: SaveData | null) {
    this.surfaceSamples = save?.surfaceSamples
      ?? (save?.scanned.includes('solace') ? [0, 1, 2] : []);
    this.nacreSurfaceSamples = save?.nacreSurfaceSamples
      ?? (save?.scanned.includes('nacre') ? [0, 1, 2] : []);
  }

  recordNacreSample(
    index: number,
    mission: MissionController,
    flight: FlightController,
  ) {
    if (!this.nacreSurfaceSamples.includes(index)) this.nacreSurfaceSamples.push(index);
    if (this.nacreSurfaceSamples.length >= 3) mission.completeNacreExpedition();
    this.persist(mission, flight);
  }

  recordSurfaceSample(
    index: number,
    mission: MissionController,
    flight: FlightController,
  ) {
    if (!this.surfaceSamples.includes(index)) this.surfaceSamples.push(index);
    if (this.surfaceSamples.length >= 3) mission.completeSolaceExpedition();
    this.persist(mission, flight);
  }

  persist(mission: MissionController, flight: FlightController) {
    storeSave({
      scanned: mission.scanned,
      echoes: mission.echoes,
      target: mission.target,
      shipPosition: flight.position.toArray(),
      solaceSurveyed: mission.solaceSurveyed,
      surfaceSamples: [...this.surfaceSamples],
      nacreSurveyed: mission.nacreSurveyed,
      nacreSurfaceSamples: [...this.nacreSurfaceSamples],
    });
  }
}
