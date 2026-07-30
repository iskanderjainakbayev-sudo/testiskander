import type { CSSProperties } from 'react';
import { DISCOVERIES } from '../../lib/odyssey/discoveries';
import type { GameSnapshot } from '../../lib/odyssey/types';

interface TargetMarkerProps {
  snapshot: GameSnapshot;
  onCycleTarget: () => void;
}

type MarkerStyle = CSSProperties & {
  '--odx-target-x': string;
  '--odx-target-y': string;
};

export function TargetMarker({ snapshot, onCycleTarget }: TargetMarkerProps) {
  const inRange = snapshot.targetDistance < DISCOVERIES[snapshot.target].scanRange;
  const projectedX = edgeAwareX(snapshot);
  const x = 50 + clamp(projectedX, -0.92, 0.92) * 46;
  const y = 50 - clamp(snapshot.targetScreen.y, -0.84, 0.84) * 42;
  const style: MarkerStyle = {
    '--odx-target-x': `${x}%`,
    '--odx-target-y': `${y}%`,
  };

  return (
    <button
      className={`odx-target-marker${snapshot.targetScreen.visible ? ' is-visible' : ' is-edge'}${inRange ? ' is-in-range' : ''}`}
      style={style}
      onClick={onCycleTarget}
      aria-label={`Selected target ${snapshot.targetName}, ${formatDistance(snapshot.targetDistance)} away. Cycle target.`}
    >
      <span className="odx-target-marker__bracket" aria-hidden="true"><i /><i /><i /><i /></span>
      <span className="odx-target-marker__copy">
        <b>{snapshot.targetName}</b>
        <small>{inRange ? 'SCAN WINDOW OPEN' : formatDistance(snapshot.targetDistance)}</small>
      </span>
    </button>
  );
}

function edgeAwareX(snapshot: GameSnapshot) {
  if (snapshot.targetScreen.visible || Math.abs(snapshot.targetScreen.x) > 0.2) {
    return snapshot.targetScreen.x;
  }
  return Math.sign(snapshot.targetBearing || 1);
}

export function formatDistance(distance: number) {
  const kilometers = Math.max(0, distance) * 12_500;
  if (kilometers >= 1_000_000) return `${(kilometers / 1_000_000).toFixed(2)}M km`;
  return `${Math.round(kilometers).toLocaleString('en-US')} km`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));
}
