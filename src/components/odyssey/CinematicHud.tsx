import type { CSSProperties } from 'react';
import type { GameSnapshot } from '../../lib/odyssey/types';

interface CinematicHudProps {
  snapshot: GameSnapshot;
  onSkip: () => void;
}

type CinematicStyle = CSSProperties & { '--odx-cinema-progress': string };

export function CinematicHud({ snapshot, onSkip }: CinematicHudProps) {
  const style: CinematicStyle = {
    '--odx-cinema-progress': `${Math.round(snapshot.cinematicProgress * 100)}%`,
  };

  return (
    <section className="odx-cinema" style={style} aria-label="Cinematic observation sequence">
      <div className="odx-cinema__bar odx-cinema__bar--top" />
      <div className="odx-cinema__bar odx-cinema__bar--bottom" />
      <aside className="odx-cinema__caption">
        <span>{snapshot.cinematicShot.toUpperCase()} / OPTICAL RECORD</span>
        <strong>{snapshot.cinematicCaption || 'LYRA // EXTERNAL APERTURE'}</strong>
        <div><i /></div>
      </aside>
      <button className="odx-cinema__skip" onClick={onSkip}>
        <span>SMOOTH ADVANCE</span><kbd>SPACE</kbd>
      </button>
    </section>
  );
}
