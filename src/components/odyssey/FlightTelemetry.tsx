import type { CSSProperties } from 'react';
import type { GameSnapshot } from '../../lib/odyssey/types';

interface FlightTelemetryProps {
  snapshot: GameSnapshot;
}

type ThrottleStyle = CSSProperties & { '--odx-throttle': string };

export function FlightTelemetry({ snapshot }: FlightTelemetryProps) {
  const throttle = normalizePercent(snapshot.throttle);
  const heading = Math.round(((snapshot.targetBearing % 360) + 360) % 360);
  const style: ThrottleStyle = { '--odx-throttle': `${throttle}%` };

  return (
    <aside className="odx-telemetry" aria-label="Flight telemetry">
      <div className="odx-telemetry__speed">
        <span>RELATIVE VELOCITY</span>
        <strong>{Math.round(snapshot.speed).toLocaleString('en-US')}</strong>
        <small>M · S<sup>−1</sup></small>
      </div>
      <div className="odx-telemetry__throttle" style={style}>
        <span>THRUST</span>
        <div aria-hidden="true"><i /></div>
        <b>{Math.round(throttle).toString().padStart(2, '0')}%</b>
      </div>
      <div className="odx-telemetry__vector">
        <span>VECTOR</span>
        <strong>{heading.toString().padStart(3, '0')}°</strong>
        <small>SHIP TIME 03:17:42</small>
      </div>
      {snapshot.boost && <p className="odx-boost"><i /> CRUISE BURN</p>}
    </aside>
  );
}

export function normalizePercent(value: number) {
  const percent = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
}

