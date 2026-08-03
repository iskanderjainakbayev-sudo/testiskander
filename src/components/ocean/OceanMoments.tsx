import { useEffect, useRef, useState } from 'react';
import type { OceanSnapshot } from '../../lib/ocean/types';

interface Moment {
  kicker: string;
  title: string;
  detail: string;
}

export function OceanMoments({ snapshot, active }: { snapshot: OceanSnapshot; active: boolean }) {
  const [moment, setMoment] = useState<Moment | null>(null);
  const previousBiome = useRef(snapshot.biome);
  const previousSite = useRef('');
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (!active) return;
    let next: Moment | null = null;
    if (snapshot.biome !== previousBiome.current) {
      next = { kicker: 'NEW BIOME', title: snapshot.biome, detail: `${snapshot.depth.toFixed(0)} meters below Pelagos` };
      previousBiome.current = snapshot.biome;
    } else if (snapshot.nearbySiteDistance < 18 && snapshot.nearbySite !== previousSite.current) {
      next = { kicker: 'DISCOVERY LOGGED', title: snapshot.nearbySite, detail: 'Cartographic signature archived' };
      previousSite.current = snapshot.nearbySite;
    }
    if (!next) return;
    setMoment(next);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setMoment(null), 3800);
  }, [active, snapshot.biome, snapshot.depth, snapshot.nearbySite, snapshot.nearbySiteDistance]);

  if (!moment) return null;
  return (
    <aside className="ocean-moment" aria-live="polite">
      <i />
      <small>{moment.kicker}</small>
      <h2>{moment.title}</h2>
      <p>{moment.detail}</p>
    </aside>
  );
}
