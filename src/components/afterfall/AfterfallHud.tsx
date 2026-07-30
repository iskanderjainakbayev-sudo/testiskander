import type { AfterfallHudSnapshot } from '../../lib/afterfall/types';

type HudProps = { snapshot: AfterfallHudSnapshot; onPause: () => void; onPanel: (panel: 'map' | 'pack' | 'craft') => void };

export function AfterfallHud({ snapshot, onPause, onPanel }: HudProps) {
  return <div className="afterfall-hud">
    <header className="afterfall-brand"><div><span>FIELD LOG // DAY 14</span><strong>AFTERFALL</strong></div><p>{snapshot.location} <i>·</i> {snapshot.weather.toUpperCase()} <i>·</i> {snapshot.timeLabel}</p><button onClick={onPause} aria-label="Pause expedition">Ⅱ</button></header>
    <section className="afterfall-vitals" aria-label="Survival status"><Meter label="HEALTH" value={snapshot.health} tone="health" /><Meter label="HUNGER" value={snapshot.hunger} tone="hunger" /><Meter label="THIRST" value={snapshot.thirst} tone="thirst" /><Meter label="ENERGY" value={snapshot.energy} tone="energy" /><p>BODY {Math.round(snapshot.temperature)}°C {snapshot.isCrouching && <b>CROUCHED</b>}</p></section>
    <section className="afterfall-objective"><span>ACTIVE MISSION</span><strong>{snapshot.objective}</strong><small>{snapshot.questStep ? 'RELAY KEY SECURED' : 'HOLLOW CREEK EVACUATION NETWORK'}</small></section>
    <nav className="afterfall-tools"><button onClick={() => onPanel('map')}>M <span>MAP</span></button><button onClick={() => onPanel('pack')}>I <span>PACK</span></button><button onClick={() => onPanel('craft')}>B <span>CRAFT</span></button></nav>
    <aside className="afterfall-threats"><div><i /><i /><i /><b /></div><span>{snapshot.nearbyThreats} HOSTILES</span><small>NOISE: LOW</small></aside>
    <aside className="afterfall-ammo"><span>HOLLOW RIFLE</span><strong>{snapshot.ammo}</strong><i>/ {snapshot.reserveAmmo}</i>{snapshot.isReloading && <b>RELOADING</b>}</aside>
    <div className="afterfall-crosshair" aria-hidden="true" />
    {snapshot.prompt && <p className="afterfall-prompt"><kbd>E</kbd> {snapshot.prompt.replace('E · ', '')}</p>}
    {snapshot.toast && <p className="afterfall-toast" role="status">{snapshot.toast}</p>}
    <footer><kbd>WASD</kbd> MOVE <kbd>SHIFT</kbd> SPRINT <kbd>C</kbd> CROUCH <kbd>R</kbd> RELOAD <kbd>E</kbd> INTERACT</footer>
  </div>;
}

function Meter({ label, value, tone }: { label: string; value: number; tone: string }) { return <div className={`afterfall-meter afterfall-meter--${tone}`}><span>{label}</span><i><b style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></i><strong>{Math.round(value)}</strong></div>; }
