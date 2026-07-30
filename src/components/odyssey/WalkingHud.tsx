import type { GameSnapshot } from '../../lib/odyssey/types';
import { ObjectiveReadout } from './ObjectiveReadout';
import { TouchActions } from './TouchActions';
import { Transmission } from './Transmission';

interface WalkingHudProps {
  snapshot: GameSnapshot;
  onInteract: () => void;
}

export function WalkingHud({ snapshot, onInteract }: WalkingHudProps) {
  return (
    <section className="odx-walk" aria-label="LYRA suit interface">
      <header className="odx-walk__header">
        <div><i /> LYRA INTERNAL NETWORK</div>
        <span>DECK 01 · FORWARD SPINE</span>
      </header>
      <ObjectiveReadout objective={snapshot.objective} />
      <div className="odx-walk__visor" aria-hidden="true"><i /><i /></div>
      <div className="odx-walk__reticle" aria-hidden="true"><i /><i /></div>
      <aside className="odx-walk__life">
        <span>SUIT LINK</span>
        <strong>98.6</strong><small>% O₂</small>
        <i />
        <p>PRESSURE NOMINAL</p>
      </aside>
      {snapshot.nearbyInteraction && (
        <button className="odx-interact" onClick={onInteract}>
          <span className="odx-interact__key">E</span>
          <span><small>SHIP INTERFACE</small><strong>{snapshot.nearbyInteraction}</strong></span>
          <i aria-hidden="true">→</i>
        </button>
      )}
      <div className="odx-walk__hints">
        <span><kbd>WASD</kbd> MOVE</span><span><kbd>MOUSE</kbd> LOOK</span><span><kbd>E</kbd> INTERACT</span>
      </div>
      <Transmission message={snapshot.transmission} />
      <TouchActions
        mode="walking"
        canInteract={Boolean(snapshot.nearbyInteraction)}
        onInteract={onInteract}
      />
    </section>
  );
}

