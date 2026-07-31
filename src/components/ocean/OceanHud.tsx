import { RESOURCE_NAMES } from '../../lib/ocean/content';
import { formatTime } from '../../lib/ocean/progression';
import type { OceanSnapshot, ResourceId } from '../../lib/ocean/types';
import { SurvivalMeters } from './SurvivalMeters';

const QUICK_RESOURCES: ResourceId[] = ['copper', 'crystal', 'oil', 'scrap', 'gem'];

function compassPoint(heading: number): string {
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return points[Math.round(heading / 45) % 8];
}

export function OceanHud({ snapshot }: { snapshot: OceanSnapshot }) {
  return (
    <div className="ocean-hud" aria-live="polite">
      <div className="ocean-lens" />
      <section className="ocean-objective">
        <small>CURRENT DIVE</small>
        <b>{snapshot.objective}</b>
      </section>
      <section className="ocean-compass">
        <i>{compassPoint(snapshot.heading)}</i>
        <div><span style={{ transform: `translateX(${-(snapshot.heading % 45) * 1.4}px)` }} /></div>
        <b>{Math.round(snapshot.heading).toString().padStart(3, '0')}°</b>
      </section>
      <section className="ocean-depth">
        <b>{snapshot.depth.toFixed(1)}</b>
        <span>METERS</span>
        <i>{snapshot.biome}</i>
      </section>
      <SurvivalMeters
        health={snapshot.health}
        oxygen={snapshot.oxygen}
        maxOxygen={snapshot.maxOxygen}
        hunger={snapshot.hunger}
        water={snapshot.water}
      />
      <section className="ocean-quickbar">
        {QUICK_RESOURCES.map((id, index) => (
          <div key={id} title={RESOURCE_NAMES[id]}>
            <small>{index + 1}</small>
            <span>{RESOURCE_NAMES[id].slice(0, 2).toUpperCase()}</span>
            <b>{snapshot.inventory[id]}</b>
          </div>
        ))}
      </section>
      {snapshot.inSub && (
        <section className="sub-readout">
          <span>NEREID // ONLINE</span>
          <b>{Math.ceil(snapshot.subBattery)}%</b>
          <i>CRUSH {snapshot.crushDepth}M</i>
        </section>
      )}
      {snapshot.prompt && <div className="ocean-prompt">{snapshot.prompt}</div>}
      {snapshot.toast && <div className="ocean-toast">{snapshot.toast}</div>}
      {snapshot.threatName && (
        <div className={`predator-alert${snapshot.threatAttacking ? ' is-attacking' : ''}`}>
          <small>{snapshot.threatAttacking ? 'PREDATOR ATTACKING' : 'PREDATOR DETECTED'}</small>
          <b>{snapshot.threatName}</b>
          <span>{Math.max(0, Math.round(snapshot.threatDistance))}M</span>
        </div>
      )}
      <div className="ocean-reticle"><i /></div>
      {snapshot.damageFlash && <div className="damage-flash" />}
      <div className="ocean-controls">C CRAFT · J PDA · F LIGHTS · Q SCAN · ESC PAUSE · {formatTime(snapshot.elapsed)}</div>
      {snapshot.inSub && <div className="sub-frame" />}
      {snapshot.oxygen < 22 && !snapshot.inSub && <div className="oxygen-warning">OXYGEN CRITICAL</div>}
    </div>
  );
}
