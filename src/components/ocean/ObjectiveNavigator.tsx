import type { OceanSnapshot } from '../../lib/ocean/types';

export function ObjectiveNavigator({ snapshot }: { snapshot: OceanSnapshot }) {
  const angle = snapshot.objectiveAngle;
  const arrowRotation = angle * 180 / Math.PI;
  const markerRadius = Math.min(38, 10 + snapshot.objectiveDistance * 0.26);
  const markerX = 50 + Math.sin(angle) * markerRadius;
  const markerY = 50 - Math.cos(angle) * markerRadius;
  return (
    <>
      <section className="objective-arrow" aria-label={`Objective ${snapshot.objectiveLabel}`}>
        <div style={{ transform: `rotate(${arrowRotation}deg)` }}>
          <i />
        </div>
        <span>{snapshot.objectiveLabel}</span>
        <b>{Math.round(snapshot.objectiveDistance)}M</b>
      </section>
      <section className="ocean-sonar" aria-label="Navigation map">
        <div className="sonar-ring sonar-ring--outer" />
        <div className="sonar-ring sonar-ring--inner" />
        <i className="sonar-heading" />
        <span
          className="sonar-objective"
          style={{ left: `${markerX}%`, top: `${markerY}%` }}
          title={snapshot.objectiveLabel}
        />
        <b>YOU</b>
        <small>{snapshot.biome.toUpperCase()}</small>
      </section>
    </>
  );
}
