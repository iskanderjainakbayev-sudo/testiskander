import type { CSSProperties } from 'react';
import { DISCOVERIES } from '../../lib/odyssey/discoveries';
import type { GameSnapshot } from '../../lib/odyssey/types';
import { normalizePercent, FlightTelemetry } from './FlightTelemetry';
import { ObjectiveReadout } from './ObjectiveReadout';
import { ShipSystems } from './ShipSystems';
import { TargetMarker } from './TargetMarker';
import { TouchActions } from './TouchActions';
import { TrafficContact } from './TrafficContact';
import { Transmission } from './Transmission';
import { expeditionPresentation } from './expeditionPresentation';

interface FlightHudProps {
  snapshot: GameSnapshot;
  onInteract: () => void;
  onScan: () => void;
  onCycleTarget: () => void;
  onLand: () => void;
}

type ScanStyle = CSSProperties & { '--odx-scan': string };

export function FlightHud({ snapshot, onInteract, onScan, onCycleTarget, onLand }: FlightHudProps) {
  const scan = normalizePercent(snapshot.scanProgress);
  const inRange = snapshot.targetDistance < DISCOVERIES[snapshot.target].scanRange;
  const targetSurveyed = (snapshot.target === 'solace' && snapshot.solaceSurveyed)
    || (snapshot.target === 'nacre' && snapshot.nacreSurveyed);
  const awaitingLanding = targetSurveyed && !snapshot.scanned.includes(snapshot.target);
  const expedition = expeditionPresentation(snapshot);
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
      <TrafficContact snapshot={snapshot} />
      <button
        className={`odx-scan${scan > 0 ? ' is-scanning' : ''}`}
        style={scanStyle}
        onClick={onScan}
        disabled={awaitingLanding}
      >
        <span className="odx-scan__ring" aria-hidden="true"><i /><b /></span>
        <span>
          <small>{scan > 0 ? 'SPECTRAL RESOLUTION' : awaitingLanding ? expedition.surveyLabel : 'DEEP FIELD ARRAY'}</small>
          <strong>{scan > 0 ? `${Math.round(scan)}%` : awaitingLanding ? expedition.vectorLabel : inRange ? 'HOLD Q · ACQUIRE ECHO' : 'APPROACH TARGET'}</strong>
        </span>
      </button>
      <div className="odx-flight__hints">
        <span><kbd>MOUSE</kbd> STEER</span><span><kbd>W S</kbd> THRUST</span><span><kbd>A D</kbd> ROLL</span><span><kbd>SPACE</kbd> BRAKE</span><span><kbd>SHIFT</kbd> PULSE</span><span><kbd>F</kbd> ALIGN</span><span><kbd>T</kbd> TARGET</span>{snapshot.canLand && <span><kbd>L</kbd> LAND</span>}
      </div>
      {snapshot.canLand && (
        <button
          className={`odx-land odx-land--${expedition.theme}`}
          onClick={onLand}
          aria-label={expedition.landingAction}
        >
          <span><small>{expedition.corridorLabel}</small><strong>{expedition.landingAction}</strong></span>
          <i aria-hidden="true">↓</i>
        </button>
      )}
      {snapshot.nearbyInteraction && (
        <button className="odx-helm-exit" onClick={onInteract}><kbd>E</kbd> LEAVE HELM</button>
      )}
      <Transmission message={snapshot.transmission} />
      <TouchActions
        mode="flight"
        canInteract={Boolean(snapshot.nearbyInteraction)}
        onInteract={onInteract}
        onScan={onScan}
        onCycleTarget={onCycleTarget}
      />
    </section>
  );
}

function formatBearing(bearing: number) {
  const normalized = Math.round(((bearing % 360) + 360) % 360);
  return `${normalized.toString().padStart(3, '0')}°`;
}
