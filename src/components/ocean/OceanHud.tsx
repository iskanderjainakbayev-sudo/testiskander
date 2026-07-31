import { RESOURCE_NAMES } from '../../lib/ocean/content';
import { formatTime } from '../../lib/ocean/progression';
import type { OceanSnapshot, ResourceId } from '../../lib/ocean/types';
import { SurvivalMeters } from './SurvivalMeters';
import { ObjectiveNavigator } from './ObjectiveNavigator';

const QUICK_RESOURCES: ResourceId[] = ['copper', 'crystal', 'oil', 'scrap', 'gem', 'meat'];

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
      <ObjectiveNavigator snapshot={snapshot} />
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
      <section className="ocean-climate">
        <small>{snapshot.dayPhase}</small>
        <b>{snapshot.weather}</b>
      </section>
      {snapshot.nearbySiteDistance < 70 && (
        <section className="ocean-site">
          <small>NEARBY DISCOVERY</small>
          <b>{snapshot.nearbySite}</b>
          <span>{Math.round(snapshot.nearbySiteDistance)}M</span>
        </section>
      )}
      <SurvivalMeters
        health={snapshot.health}
        stamina={snapshot.stamina}
        maxStamina={snapshot.maxStamina}
        accelerating={snapshot.accelerating}
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
        <div className={`predator-alert${snapshot.threatAttacking ? ' is-attacking' : ''}${snapshot.threatIsBoss ? ' is-boss' : ''}`}>
          <small>
            {snapshot.threatIsBoss ? 'APEX BOSS' : snapshot.threatAttacking ? 'PREDATOR ATTACKING' : 'PREDATOR DETECTED'}
          </small>
          <b>{snapshot.threatName}</b>
          <span>{Math.max(0, Math.round(snapshot.threatDistance))}M</span>
          {snapshot.threatIsBoss && (
            <div className="boss-health">
              <i style={{ width: `${snapshot.threatHealth / Math.max(1, snapshot.threatMaxHealth) * 100}%` }} />
            </div>
          )}
        </div>
      )}
      <div className="ocean-reticle"><i /></div>
      {snapshot.damageFlash && <div className="damage-flash" />}
      <div className={`weapon-status${snapshot.weaponReady ? ' is-ready' : ''}`}>
        {snapshot.activeWeapon === 'gun' ? '1 · ABYSS ARC CANNON' : '2 · PRESSURE KNIFE'}
        <b>{snapshot.weaponReady ? 'READY' : snapshot.activeWeapon === 'gun' ? 'CYCLING' : 'RECOVERING'}</b>
        {snapshot.activeWeapon === 'gun' && (
          <small className={snapshot.specialWeaponReady ? 'is-ready' : ''}>
            [ X ] DRAGONBREAKER {snapshot.specialWeaponReady ? 'CHARGED' : 'RECHARGING'}
          </small>
        )}
      </div>
      <div className="ocean-controls">1 GUN · 2 KNIFE · LMB / R USE · X DRAGONBREAKER · H EAT MEAT · SHIFT ACCELERATE · {formatTime(snapshot.elapsed)}</div>
      {snapshot.inSub && <div className="sub-frame" />}
      {snapshot.oxygen < 22 && !snapshot.inSub && <div className="oxygen-warning">OXYGEN CRITICAL</div>}
    </div>
  );
}
