import type { GameSnapshot } from '../../lib/odyssey/types';
import { formatDistance } from './TargetMarker';

interface PauseOverlayProps {
  snapshot: GameSnapshot;
  onResume: () => void;
  onNewGame: () => void;
  onReturnToMenu: () => void;
}

export function PauseOverlay({ snapshot, onResume, onNewGame, onReturnToMenu }: PauseOverlayProps) {
  return (
    <main className="odx-pause" aria-labelledby="pause-title">
      <section className="odx-pause__panel">
        <header>
          <span>LYRA // FLIGHT RECORDER</span>
          <p><i /> LOCAL TIME SUSPENDED</p>
        </header>
        <div className="odx-pause__title">
          <p>MISSION 07 / THE LONG SILENCE</p>
          <h1 id="pause-title">Voyage <em>on hold</em></h1>
        </div>
        <div className="odx-pause__stats">
          <Stat label="CURRENT VECTOR" value={snapshot.targetName} detail={formatDistance(snapshot.targetDistance)} />
          <Stat label="ECHOES RECOVERED" value={`${snapshot.echoes} / 3`} detail={`${snapshot.scanned.length} objects archived`} />
          <Stat label="LYRA INTEGRITY" value={`${Math.round(snapshot.hull)}%`} detail={`${Math.round(snapshot.fuel)}% reserve fuel`} />
        </div>
        <nav className="odx-pause__actions" aria-label="Pause menu">
          <button className="odx-button odx-button--primary" onClick={onResume}><span>RETURN TO LYRA</span><i>→</i></button>
          <button className="odx-button odx-button--quiet" onClick={onNewGame}>RESTART EXPEDITION</button>
          <button className="odx-menu__exit" onClick={onReturnToMenu}>ABANDON TO ARCHIVE</button>
        </nav>
        <footer>FLIGHT RECORDER READY <i /> ECHOES SAVE ON RECOVERY</footer>
      </section>
    </main>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
