import type { Species } from '../../lib/ocean/creatureCatalog';

const threatLabel = ['Harmless', 'Low', 'Guarded', 'Dangerous', 'Severe', 'Leviathan'];

export function CreatureCard({ species }: { species: Species }) {
  const color = `#${species.color.toString(16).padStart(6, '0')}`;
  return (
    <article className="creature-card" style={{ '--species-color': color } as React.CSSProperties}>
      <div className="creature-card-heading">
        <i />
        <div>
          <b>{species.name}</b>
          <em>{species.scientificName}</em>
        </div>
        <strong>THREAT {species.threat} · {threatLabel[species.threat]}</strong>
      </div>
      <p>{species.scannerEntry}</p>
      <dl>
        <div><dt>HABITAT</dt><dd>{species.habitat}</dd></div>
        <div><dt>DIET</dt><dd>{species.diet}</dd></div>
        <div><dt>LENGTH</dt><dd>{species.length}</dd></div>
        <div><dt>SILHOUETTE</dt><dd>{species.bodyPlan} · {species.silhouette.appendages} appendages</dd></div>
        <div><dt>STRENGTH</dt><dd>{species.strengths.join(' · ')}</dd></div>
        <div><dt>WEAKNESS</dt><dd>{species.weaknesses.join(' · ')}</dd></div>
        <div><dt>MOTION</dt><dd>{species.animations.slice(0, 5).join(' · ')}</dd></div>
        <div><dt>CALL</dt><dd>{species.soundSet.family} · {species.soundSet.callHz} Hz</dd></div>
        <div><dt>PALETTE</dt><dd>{species.palette.map((tone) => `#${tone.toString(16).padStart(6, '0')}`).join(' · ')}</dd></div>
      </dl>
    </article>
  );
}
