import type { CSSProperties } from 'react';
import type { GameMode } from '../../lib/odyssey/types';

interface LandingSequenceProps {
  mode: Extract<GameMode, 'landing' | 'takeoff'>;
  progress: number;
}

type TransitionStyle = CSSProperties & {
  '--odx-cloud': string;
  '--odx-transition': string;
};

function cloudOpacity(progress: number) {
  const fadeIn = smoothstep(0.3, 0.55, progress);
  const fadeOut = 1 - smoothstep(0.66, 0.94, progress);
  return Math.min(1, fadeIn * fadeOut * 1.38);
}

export function LandingSequence({ mode, progress }: LandingSequenceProps) {
  const isLanding = mode === 'landing';
  const style: TransitionStyle = {
    '--odx-cloud': cloudOpacity(progress).toFixed(3),
    '--odx-transition': `${Math.round(progress * 100)}%`,
  };

  return (
    <section className={`odx-landing odx-landing--${mode}`} style={style}>
      <div className="odx-landing__clouds" aria-hidden="true"><i /><i /><i /></div>
      <header>
        <span>LYRA FLIGHT COMPUTER</span>
        <strong>{isLanding ? 'SOLACE ATMOSPHERIC INSERTION' : 'SOLACE ASCENT VECTOR'}</strong>
      </header>
      <aside>
        <span>{isLanding ? 'DESCENT' : 'ASCENT'}</span>
        <b>{Math.round(progress * 100).toString().padStart(2, '0')}</b>
        <small>{isLanding ? 'LANDING CORRIDOR STABLE' : 'ESCAPE ENVELOPE STABLE'}</small>
      </aside>
      <div className="odx-landing__rule"><i /></div>
    </section>
  );
}

function smoothstep(start: number, end: number, value: number) {
  const ratio = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return ratio * ratio * (3 - 2 * ratio);
}
