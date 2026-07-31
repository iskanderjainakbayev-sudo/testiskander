import { useMemo, useState } from 'react';
import { SPECIES, type Temperament } from '../../lib/ocean/creatureCatalog';

type Filter = 'all' | Temperament;

export function AdminCreatureTable() {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const creatures = useMemo(() => {
    const query = search.trim().toLowerCase();
    return SPECIES.filter((species) => {
      const categoryMatches = filter === 'all' || species.temperament === filter;
      const textMatches = !query
        || species.name.toLowerCase().includes(query)
        || species.scientificName.toLowerCase().includes(query);
      return categoryMatches && textMatches;
    });
  }, [filter, search]);

  return (
    <section className="admin-creatures">
      <header>
        <div><small>ECOSYSTEM CATALOG</small><h2>Creature Registry</h2></div>
        <b>{creatures.length} / {SPECIES.length}</b>
      </header>
      <div className="admin-filters">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search species…" />
        {(['all', 'passive', 'neutral', 'aggressive'] as const).map((category) => (
          <button className={filter === category ? 'active' : ''} onClick={() => setFilter(category)} key={category}>
            {category}
          </button>
        ))}
      </div>
      <div className="admin-creature-list">
        {creatures.map((species) => (
          <article key={species.assetId}>
            <i style={{ background: `#${species.color.toString(16).padStart(6, '0')}` }} />
            <div><strong>{species.name}</strong><em>{species.scientificName}</em></div>
            <span>{species.habitat}</span>
            <span>{species.bodyPlan}</span>
            <span>THREAT {species.threat}</span>
            <b>{species.attack.toUpperCase()}</b>
          </article>
        ))}
      </div>
    </section>
  );
}
