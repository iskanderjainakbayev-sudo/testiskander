import '../../styles/eclipse.css';
import type { EclipsePanelId } from './EclipsePanels';

export type EclipseHudSnapshot = {
  health: number; maxHealth: number; stamina: number; maxStamina: number;
  level: number; xp: number; xpToNextLevel: number; shards: number; alloy: number;
  region: string; weather: string; timeLabel: string; objective: string; enemies: number;
  quest: { title: string; current: number; target: number } | null; interaction: string | null;
  boss: { name: string; health: number; maxHealth: number; phase: number } | null;
  toast: string | null; weaponName: string; ammo: number; reserveAmmo: number; abilityReady: boolean;
};
export type EclipseHudProps = {
  snapshot: EclipseHudSnapshot; onPause: () => void; onOpenPanel: (panel: EclipsePanelId) => void;
};

export function EclipseHud({ snapshot, onPause, onOpenPanel }: EclipseHudProps) {
  const questPercent = ratio(snapshot.quest?.current ?? 0, snapshot.quest?.target ?? 1);
  return <div className="eclipse-hud" aria-label="Project Eclipse heads-up display">
    <header className="eclipse-hud__brand"><div><span>PROJECT</span><strong>ECLIPSE</strong></div><p>{snapshot.region} <i>·</i> {snapshot.weather} <i>·</i> {snapshot.timeLabel}</p><button className="eclipse-icon-button" onClick={onPause} aria-label="Pause game">Ⅱ</button></header>
    <section className="eclipse-vitals" aria-label="Player vitals"><Meter label="Vitality" value={snapshot.health} max={snapshot.maxHealth} tone="health" /><Meter label="Stamina" value={snapshot.stamina} max={snapshot.maxStamina} tone="stamina" /><div className="eclipse-level"><span>LVL {snapshot.level}</span><div className="eclipse-meter"><i style={{ width: `${ratio(snapshot.xp, snapshot.xpToNextLevel)}%` }} /></div><small>{snapshot.xp}/{snapshot.xpToNextLevel} XP</small></div></section>
    <section className="eclipse-objective"><span>ACTIVE SIGNAL</span><strong>{snapshot.objective}</strong>{snapshot.quest && <p>{snapshot.quest.title}<b>{snapshot.quest.current}/{snapshot.quest.target}</b><i style={{ width: `${questPercent}%` }} /></p>}</section>
    <nav className="eclipse-quick-nav" aria-label="Game panels"><button onClick={() => onOpenPanel('map')}><b>⌖</b>Map</button><button onClick={() => onOpenPanel('inventory')}><b>▣</b>Pack</button><button onClick={() => onOpenPanel('crafting')}><b>✦</b>Craft</button></nav>
    <aside className="eclipse-radar" aria-label={`${snapshot.enemies} nearby threats`}><div className="eclipse-radar__rings" aria-hidden="true"><i /><i /><i /><b /></div><span>{snapshot.enemies} THREATS</span><small>RIFTLANDS</small></aside>
    <aside className="eclipse-resources" aria-label="Materials"><span>✦ {snapshot.shards}<small> SHARDS</small></span><span>⬡ {snapshot.alloy}<small> ALLOY</small></span></aside>
    <aside className="eclipse-weapon"><span>{snapshot.weaponName.toUpperCase()}</span><strong>{snapshot.ammo}</strong><i>/ {snapshot.reserveAmmo}</i><em className={snapshot.abilityReady ? 'is-ready' : ''} aria-label={snapshot.abilityReady ? 'Eclipse pulse ready' : 'Eclipse pulse charging'}><b>X</b> PULSE</em></aside>
    {snapshot.boss && <section className="eclipse-boss" aria-label={`${snapshot.boss.name} boss health`}><span>PHASE {snapshot.boss.phase} · {snapshot.boss.name}</span><div className="eclipse-meter"><i style={{ width: `${ratio(snapshot.boss.health, snapshot.boss.maxHealth)}%` }} /></div></section>}
    <div className="eclipse-crosshair" aria-hidden="true" />
    {snapshot.interaction && <p className="eclipse-interaction"><kbd>E</kbd> {snapshot.interaction}</p>}
    {snapshot.toast && <p className="eclipse-toast" role="status">{snapshot.toast}</p>}
    <footer className="eclipse-controls"><kbd>WASD</kbd> move <kbd>SHIFT</kbd> sprint <kbd>SPACE</kbd> jump <kbd>Q</kbd> roll <kbd>F</kbd> grapple <kbd>G</kbd> glide</footer>
  </div>;
}

function Meter({ label, value, max, tone }: { label: string; value: number; max: number; tone: 'health' | 'stamina' }) {
  const percent = ratio(value, max);
  return <div className={`eclipse-vital eclipse-vital--${tone}`}><span>{label}</span><div className="eclipse-meter" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}><i style={{ width: `${percent}%` }} /></div><b>{Math.ceil(value)}</b></div>;
}

function ratio(value: number, max: number) {
  return Math.max(0, Math.min(100, Math.round((value / Math.max(max, 1)) * 100)));
}
