import type { GameSnapshot } from '../../lib/odyssey/types';
import { expeditionPresentation } from './expeditionPresentation';
import { ObjectiveReadout } from './ObjectiveReadout';
import { Transmission } from './Transmission';

interface SurfaceHudProps {
  snapshot: GameSnapshot;
  onInteract: () => void;
}

export function SurfaceHud({ snapshot, onInteract }: SurfaceHudProps) {
  const interaction = snapshot.nearbyInteraction?.replace(/^E\s*[·:—-]\s*/i, '') ?? null;
  const expedition = expeditionPresentation(snapshot);

  return (
    <section
      className={`odx-surface odx-surface--${expedition.theme}`}
      aria-label={`${expedition.planet} expedition suit interface`}
    >
      <header className="odx-surface__header">
        <div><i /> EXTRAVEHICULAR LINK / LIVE</div>
        <span>{expedition.location}</span>
      </header>
      <ObjectiveReadout objective={snapshot.objective} />
      <div className="odx-surface__reticle" aria-hidden="true"><i /><b /></div>
      <aside className="odx-surface__vitals">
        <span>ENVIRONMENT</span>
        <strong>{expedition.atmosphere} <small>ATM</small></strong>
        <p>{expedition.weather}</p>
        <i />
        <b>O₂ 98</b><b>SEAL 100</b>
      </aside>
      <aside className="odx-surface__samples">
        <span>{expedition.archiveLabel}</span>
        <strong>{snapshot.surfaceSamples}<small>/03</small></strong>
        <p>{expedition.sampleLabel}</p>
      </aside>
      {interaction && (
        <button className="odx-interact odx-interact--surface" onClick={onInteract}>
          <span className="odx-interact__key">E</span>
          <span><small>FIELD ACTION</small><strong>{interaction}</strong></span>
          <i aria-hidden="true">→</i>
        </button>
      )}
      <div className="odx-surface__hints">
        <span><kbd>WASD</kbd> TRAVERSE</span>
        <span><kbd>SHIFT</kbd> SPRINT</span>
        <span><kbd>E</kbd> {expedition.interactionVerb}</span>
      </div>
      <Transmission message={snapshot.transmission} />
    </section>
  );
}
