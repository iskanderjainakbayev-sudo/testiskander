import type { CSSProperties } from 'react';
import type { GameSnapshot } from '../../lib/odyssey/types';
import { normalizePercent, FlightTelemetry } from './FlightTelemetry';
import { ObjectiveReadout } from './ObjectiveReadout';
import { ShipSystems } from './ShipSystems';
import { TargetMarker } from './TargetMarker';
import { TouchActions } from './TouchActions';
import { Transmission } from './Transmission';

interface FlightHudProps {
  snapshot: GameSnapshot;
  onScan: () => void;
  onCycleTarget: () => void;
}

type ScanStyle = CSSProperties & { '--odx-scan': string };

export function FlightHud({ snapshot, onScan, onCycleTarget }: FlightHudProps) {
  const scan = normalizePercent(snapshot.scanProgress);
  const scanStyle: ScanStyle = { '--odx-scan': `${scan * 3.6}deg` };

  return (
    <section className="odx-flight" aria-label="LYRA flight heads-up display">
      <ObjectiveReadout objective={snapshot.objective} compact />
      <div className="odx-flight__compass" aria-hidden="true">
        <span>330</span><i /><span>N</span><i /><b>{formatBearing(snapshot.targetBearing)}</b><i /><span>060</span>
      </div>
      <TargetMarker snapshot={snapshot} onCycleTarget={onCycleTarget} />
      <div className="odx-reticle" aria-hidden="true"><i /><i /><i /><i /><b /></div>
      <FlightTelemetry snapshot={snapshot} />
      <ShipSystems
        hull={snapshot.hull}
        fuel={snapshot.fuel}
        echoes={snapshot.echoes}
        scannedCount={snapshot.scanned.length}
      />
      <button className={`odx-scan${scan > 0 ? ' is-scanning' : ''}`} style={scanStyle} onClick={onScan}>
        <span className="odx-scan__ring" aria-hidden="true"><i /><b /></span>
        <span><small>{scan > 0 ? 'SPECTRAL RESOLUTION' : 'DEEP FIELD ARRAY'}</small><strong>{scan > 0 ? `${Math.round(scan)}%` : 'HOLD Q TO SCAN'}</strong></span>
      </button>
      <div className="odx-flight__hints">
        <span><kbd>MOUSE</kbd> STEER</span><span><kbd>W S</kbd> THRUST</span><span><kbd>A D</kbd> ROLL</span><span><kbd>SHIFT</kbd> PULSE</span><span><kbd>T</kbd> TARGET</span>
      </div>
      <Transmission message={snapshot.transmission} />
      <TouchActions mode="flight" onScan={onScan} onCycleTarget={onCycleTarget} />
    </section>
  );
}

function formatBearing(bearing: number) {
  const normalized = Math.round(((bearing % 360) + 360) % 360);
  return `${normalized.toString().padStart(3, '0')}°`;
}
