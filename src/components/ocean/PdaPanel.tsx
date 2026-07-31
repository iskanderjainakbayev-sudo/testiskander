import { useState } from 'react';
import { SPECIES } from '../../lib/ocean/creatureCatalog';
import { STORY_LOGS } from '../../lib/ocean/content';
import { CreatureCard } from './CreatureCard';

export function PdaPanel({ logs, onClose }: { logs: string[]; onClose: () => void }) {
  const [tab, setTab] = useState<'fauna' | 'memory'>('fauna');
  const [category, setCategory] = useState<'all' | 'passive' | 'neutral' | 'aggressive'>('all');
  const visibleSpecies = category === 'all'
    ? SPECIES : SPECIES.filter((species) => species.temperament === category);
  return (
    <div className="ocean-overlay">
      <section className="ocean-panel pda-panel">
        <header>
          <div><small>WAYFARER PDA · {SPECIES.length} SPECIES</small><h2>{tab === 'fauna' ? 'Fauna Archive' : 'Recovered Memory'}</h2></div>
          <button onClick={onClose} aria-label="Close PDA">×</button>
        </header>
        <nav className="pda-tabs">
          <button className={tab === 'fauna' ? 'active' : ''} onClick={() => setTab('fauna')}>FAUNA</button>
          <button className={tab === 'memory' ? 'active' : ''} onClick={() => setTab('memory')}>MEMORY</button>
        </nav>
        {tab === 'fauna' ? (
          <>
            <nav className="fauna-filters">
              {(['all', 'passive', 'neutral', 'aggressive'] as const).map((item) => (
                <button className={category === item ? 'active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>
              ))}
            </nav>
            <div className="creature-list">{visibleSpecies.map((species) => <CreatureCard species={species} key={species.assetId} />)}</div>
          </>
        ) : (
          <div className="pda-log-list">
            {Object.entries(STORY_LOGS).map(([id, log], index) => {
              const found = logs.includes(id);
              return <article className={found ? '' : 'unknown'} key={id}><b>{found ? log.title : `0${index + 1} · SIGNAL LOST`}</b><p>{found ? log.body : 'Archive location has not been discovered.'}</p></article>;
            })}
          </div>
        )}
        <footer>{tab === 'fauna' ? `${visibleSpecies.length} entries displayed` : `${logs.length} / ${Object.keys(STORY_LOGS).length} archives recovered`}</footer>
      </section>
    </div>
  );
}
