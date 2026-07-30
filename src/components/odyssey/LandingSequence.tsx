import type { CSSProperties } from 'react';
import type { GameSnapshot } from '../../lib/odyssey/types';
import { expeditionPresentation } from './expeditionPresentation';

interface LandingSequenceProps {
  snapshot: GameSnapshot;
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

export function LandingSequence({ snapshot }: LandingSequenceProps) {
  const { mode, transitionProgress: progress } = snapshot;
  const isLanding = mode === 'landing';
  const expedition = expeditionPresentation(snapshot);
  const style: TransitionStyle = {
    '--odx-cloud': cloudOpacity(progress).toFixed(3),
    '--odx-transition': `${Math.round(progress * 100)}%`,
  };

  return (
    <section
      className={`odx-landing odx-landing--${mode} odx-landing--${expedition.theme}`}
      style={style}
      aria-label={`${expedition.planet} ${isLanding ? 'landing' : 'takeoff'} sequence`}
    >
      <div className="odx-landing__clouds" aria-hidden="true"><i /><i /><i /></div>
      <header>
        <span>LYRA FLIGHT COMPUTER · {expedition.site}</span>
        <strong>{expedition.planet} {isLanding ? 'ATMOSPHERIC INSERTION' : 'ASCENT VECTOR'}</strong>
      </header>
      <aside>
        <span>{isLanding ? 'DESCENT' : 'ASCENT'} / {expedition.site}</span>
        <b>{Math.round(progress * 100).toString().padStart(2, '0')}</b>
        <small>{isLanding ? expedition.landingStatus : expedition.ascentStatus}</small>
      </aside>
      <div className="odx-landing__rule"><i /></div>
    </section>
  );
}

function smoothstep(start: number, end: number, value: number) {
  const ratio = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return ratio * ratio * (3 - 2 * ratio);
}
