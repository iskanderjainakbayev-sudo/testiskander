import type { Objective } from '../../lib/odyssey/types';

interface ObjectiveReadoutProps {
  objective: Objective;
  compact?: boolean;
}

export function ObjectiveReadout({ objective, compact = false }: ObjectiveReadoutProps) {
  return (
    <section className={`odx-objective${compact ? ' odx-objective--compact' : ''}`} aria-label="Current objective">
      <div className="odx-objective__eyebrow">
        <i aria-hidden="true" />
        <span>{objective.eyebrow}</span>
      </div>
      <h2>{objective.title}</h2>
      <p>{objective.detail}</p>
    </section>
  );
}

