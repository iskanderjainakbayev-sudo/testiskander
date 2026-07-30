import type { CSSProperties } from 'react';
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
  const projectedX = edgeAwareX(snapshot);
  const x = 50 + clamp(projectedX, -0.92, 0.92) * 46;
  const y = 50 - clamp(snapshot.targetScreen.y, -0.84, 0.84) * 42;
  const style: MarkerStyle = {
    '--odx-target-x': `${x}%`,
    '--odx-target-y': `${y}%`,
  };

  return (
    <button
      className={`odx-target-marker${snapshot.targetScreen.visible ? ' is-visible' : ' is-edge'}`}
      style={style}
      onClick={onCycleTarget}
      aria-label={`Selected target ${snapshot.targetName}, ${formatDistance(snapshot.targetDistance)} away. Cycle target.`}
    >
      <span className="odx-target-marker__bracket" aria-hidden="true"><i /><i /><i /><i /></span>
      <span className="odx-target-marker__copy">
        <b>{snapshot.targetName}</b>
        <small>{formatDistance(snapshot.targetDistance)}</small>
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
  if (distance >= 1000) return `${(distance / 1000).toFixed(distance >= 10000 ? 0 : 1)} km`;
  return `${Math.max(0, Math.round(distance))} m`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));
}
