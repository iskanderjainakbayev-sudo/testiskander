import { useState } from 'react';
import {
  OCEAN_QA_VIEWS,
  type OceanQaStats,
  type OceanQaViewId,
} from '../../lib/ocean/OceanVisualQa';

interface Props {
  stats: OceanQaStats;
  cleanFrame: boolean;
  onCleanFrame: (clean: boolean) => void;
  onSelect: (view: OceanQaViewId) => void;
  onProfile: () => void;
}

function metric(value: number, suffix = ''): string {
  return value > 0 ? `${value.toFixed(1)}${suffix}` : '—';
}

export function OceanQaPanel({ stats, cleanFrame, onCleanFrame, onSelect, onProfile }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const busy = stats.phase === 'warmup' || stats.phase === 'sampling';

  return (
    <aside className={`ocean-qa-panel${collapsed ? ' is-collapsed' : ''}`}>
      <header>
        <div><strong>VISUAL QA</strong><small>{stats.phase}</small></div>
        <button type="button" onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? 'OPEN' : 'HIDE'}
        </button>
      </header>
      {!collapsed && (
        <>
          <nav aria-label="QA camera waypoints">
            {OCEAN_QA_VIEWS.map((view) => (
              <button
                type="button"
                className={stats.view === view.id ? 'is-active' : ''}
                key={view.id}
                onClick={() => onSelect(view.id)}
              >
                {view.label}
              </button>
            ))}
          </nav>
          <div className="ocean-qa-metrics">
            <span>P50 <b>{metric(stats.p50Ms, 'ms')}</b></span>
            <span>P95 <b>{metric(stats.p95Ms, 'ms')}</b></span>
            <span>P99 <b>{metric(stats.p99Ms, 'ms')}</b></span>
            <span>AVG <b>{metric(stats.averageFps, ' fps')}</b></span>
            <span>1% LOW <b>{metric(stats.onePercentLowFps, ' fps')}</b></span>
            <span>&gt;16.7 <b>{metric(stats.droppedFramePercent, '%')}</b></span>
            <span>CALLS <b>{stats.drawCalls.toLocaleString()}</b></span>
            <span>TRIS <b>{stats.triangles.toLocaleString()}</b></span>
          </div>
          <p>{busy ? `${stats.phase} · ${stats.secondsLeft.toFixed(1)}s · ${stats.sampleCount} frames`
            : stats.phase === 'complete' ? `${stats.sampleCount} measured frames` : '2s warmup + 10s sample'}</p>
          <div className="ocean-qa-runtime">
            <b>{stats.quality} · {stats.resolution} · DPR {stats.pixelRatioRange}</b>
            <span>{stats.renderer}</span>
            <small title={stats.browser}>{stats.browser}</small>
          </div>
          <footer>
            <button type="button" disabled={busy} onClick={onProfile}>PROFILE VIEW</button>
            <label>
              <input type="checkbox" checked={cleanFrame}
                onChange={(event) => onCleanFrame(event.target.checked)} /> CLEAN FRAME
            </label>
          </footer>
        </>
      )}
    </aside>
  );
}
