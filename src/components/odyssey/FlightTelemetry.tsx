import type { CSSProperties } from 'react';
import type { GameSnapshot } from '../../lib/odyssey/types';

interface FlightTelemetryProps {
  snapshot: GameSnapshot;
}

type ThrottleStyle = CSSProperties & { '--odx-throttle': string };

export function FlightTelemetry({ snapshot }: FlightTelemetryProps) {
  const throttle = normalizePercent(snapshot.throttle);
  const heading = Math.round(((snapshot.targetBearing % 360) + 360) % 360);
  const lightSpeed = snapshot.speed * 12_500 / 299_792;
  const style: ThrottleStyle = { '--odx-throttle': `${throttle}%` };

  return (
    <aside className="odx-telemetry" aria-label="Flight telemetry">
      <div className="odx-telemetry__speed">
        <span>PHASE VELOCITY</span>
        <strong>{lightSpeed.toFixed(lightSpeed < 10 ? 2 : 1)}</strong>
        <small>C · LOCAL</small>
      </div>
      <div className="odx-telemetry__throttle" style={style}>
        <span>THRUST</span>
        <div aria-hidden="true"><i /></div>
        <b>{Math.round(throttle).toString().padStart(2, '0')}%</b>
      </div>
      <div className="odx-telemetry__vector">
        <span>VECTOR</span>
        <strong>{heading.toString().padStart(3, '0')}°</strong>
        <small>LOCAL NAV · INERTIAL</small>
      </div>
      {snapshot.boost && <p className="odx-boost"><i /> CRUISE BURN</p>}
    </aside>
  );
}

export function normalizePercent(value: number) {
  const percent = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
}
