import '../../styles/eclipse.css';
import type { EclipsePanelId } from './EclipsePanels';

export type EclipseMenuMode = 'start' | 'pause' | 'victory' | 'defeat';
export type EclipseMenuProgress = { level: number; shards: number; alloy: number; region: string; questTitle?: string; playtime?: string };
export type EclipseMenuProps = {
  mode: EclipseMenuMode; progress: EclipseMenuProgress; onStart?: () => void; onResume?: () => void;
  onRestart?: () => void; onExit?: () => void; onOpenPanel?: (panel: EclipsePanelId) => void;
};

const copy: Record<EclipseMenuMode, { eyebrow: string; title: string; accent: string; body: string; action: string }> = {
  start: { eyebrow: 'RIFTFALL // EXPEDITION 01', title: 'PROJECT', accent: 'ECLIPSE', body: 'The signal is awake. Find the broken sky temple before the Rift consumes the last refuge.', action: 'Begin expedition' },
  pause: { eyebrow: 'RUNNER LINK // PAUSED', title: 'TIME', accent: 'FROZEN', body: 'Your companion is holding position. The riftlands will wait while you prepare.', action: 'Return to riftlands' },
  victory: { eyebrow: 'ECLIPSE WARDEN // DEFEATED', title: 'BREACH', accent: 'SEALED', body: 'The Sky Temple is safe—for now. A new signal is already surfacing beyond the dunes.', action: 'Explore again' },
  defeat: { eyebrow: 'RUNNER LINK // LOST', title: 'RIFT', accent: 'FALL', body: 'The Eclipse pushed back this time. Recalibrate your build and make another run.', action: 'Re-enter riftlands' },
};

export function EclipseMenu({ mode, progress, onStart, onResume, onRestart, onExit, onOpenPanel }: EclipseMenuProps) {
  const text = copy[mode];
  const primary = mode === 'start' ? onStart : mode === 'pause' ? onResume : onRestart;
  return <div className={`eclipse-menu eclipse-menu--${mode}`} role="dialog" aria-modal="true" aria-labelledby="eclipse-menu-title"><div className="eclipse-menu__glow" /><section className="eclipse-menu__card"><header><span>{text.eyebrow}</span><h1 id="eclipse-menu-title">{text.title} <i>{text.accent}</i></h1><p>{text.body}</p></header><Progress progress={progress} /><button className="eclipse-primary" onClick={primary} disabled={!primary}>{text.action}<b>→</b></button>{mode === 'pause' && <button className="eclipse-secondary" onClick={onRestart} disabled={!onRestart}>Restart checkpoint</button>}{mode === 'start' && <MenuActions onOpenPanel={onOpenPanel} />}{mode === 'pause' && <MenuActions onOpenPanel={onOpenPanel} compact />}{onExit && <button className="eclipse-text-button" onClick={onExit}>{mode === 'start' ? 'Exit to refuge' : 'Leave expedition'}</button>}<small className="eclipse-menu__hint">WASD move · click blade · K rift bolt · Q roll · SPACE double jump</small></section></div>;
}

function Progress({ progress }: { progress: EclipseMenuProgress }) {
  return <section className="eclipse-menu__progress" aria-label="Current expedition progress"><article><span>RUNNER LEVEL</span><strong>{String(progress.level).padStart(2, '0')}</strong></article><article><span>RECOVERED</span><strong>✦ {progress.shards}</strong><small>⬡ {progress.alloy} alloy</small></article><article><span>LAST SIGNAL</span><strong>{progress.region}</strong><small>{progress.questTitle ?? 'No active signal'}</small></article>{progress.playtime && <article><span>TIME IN RIFT</span><strong>{progress.playtime}</strong></article>}</section>;
}

function MenuActions({ onOpenPanel, compact = false }: { onOpenPanel?: (panel: EclipsePanelId) => void; compact?: boolean }) {
  const actions: readonly { panel: EclipsePanelId; icon: string; label: string; detail: string }[] = compact ? [{ panel: 'map', icon: '⌖', label: 'Atlas', detail: 'Plot a route' }, { panel: 'inventory', icon: '▣', label: 'Field pack', detail: 'Review gear' }, { panel: 'settings', icon: '◌', label: 'Settings', detail: 'Tune the link' }] : [{ panel: 'map', icon: '⌖', label: 'Atlas', detail: 'Survey the rift' }, { panel: 'crafting', icon: '✦', label: 'Fabricator', detail: 'Upgrade your kit' }, { panel: 'settings', icon: '◌', label: 'Settings', detail: 'Accessibility & audio' }];
  return <nav className="eclipse-menu__actions" aria-label="Expedition tools">{actions.map((item) => <button key={item.panel} onClick={() => onOpenPanel?.(item.panel)} disabled={!onOpenPanel}><b aria-hidden="true">{item.icon}</b><span>{item.label}</span><small>{item.detail}</small></button>)}</nav>;
}
