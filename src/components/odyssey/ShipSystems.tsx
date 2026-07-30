import type { CSSProperties } from 'react';
import { normalizePercent } from './FlightTelemetry';

interface ShipSystemsProps {
  hull: number;
  fuel: number;
  echoes: number;
  scannedCount: number;
}

type GaugeStyle = CSSProperties & { '--odx-level': string };

export function ShipSystems({ hull, fuel, echoes, scannedCount }: ShipSystemsProps) {
  return (
    <aside className="odx-systems" aria-label="Ship systems">
      <header><span>LYRA // VITAL SYSTEMS</span><i /></header>
      <div className="odx-systems__gauges">
        <SystemGauge label="HULL" value={hull} />
        <SystemGauge label="HE-3" value={fuel} />
      </div>
      <div className="odx-systems__echoes">
        <span>ECHO KEY</span>
        <div aria-label={`${echoes} of 3 signal echoes recovered`}>
          {[0, 1, 2].map((index) => <i className={index < echoes ? 'is-found' : ''} key={index} />)}
        </div>
        <b>{scannedCount.toString().padStart(2, '0')} ARCHIVED</b>
      </div>
    </aside>
  );
}

function SystemGauge({ label, value }: { label: string; value: number }) {
  const level = normalizePercent(value);
  const style: GaugeStyle = { '--odx-level': `${level * 3.6}deg` };

  return (
    <div className="odx-gauge" style={style} role="meter" aria-label={label} aria-valuenow={Math.round(level)} aria-valuemin={0} aria-valuemax={100}>
      <div><i /></div>
      <span>{label}</span>
      <strong>{Math.round(level)}</strong><small>%</small>
    </div>
  );
}

