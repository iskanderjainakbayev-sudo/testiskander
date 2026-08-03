import { useState, type MutableRefObject } from 'react';
import type { OceanWorld } from '../../lib/ocean/OceanWorld';
import { EMPTY_OCEAN_QA_STATS } from '../../lib/ocean/OceanVisualQa';
import { OceanQaPanel } from './OceanQaPanel';
import './styles/qa.css';

const ENABLED = new URLSearchParams(window.location.search).get('oceanQa') === '1';
export function useOceanVisualQa(worldRef: MutableRefObject<OceanWorld | null>) {
  const [stats, setStats] = useState(EMPTY_OCEAN_QA_STATS);
  const [cleanFrame, setCleanFrame] = useState(false);
  const panel = ENABLED ? (
    <OceanQaPanel
      stats={stats}
      cleanFrame={cleanFrame}
      onCleanFrame={setCleanFrame}
      onSelect={(view) => worldRef.current?.visualQa?.select(view)}
      onProfile={() => worldRef.current?.visualQa?.startProfile()}
    />
  ) : null;

  return {
    className: cleanFrame ? ' ocean-qa-clean' : '',
    onSnapshot: ENABLED ? setStats : undefined,
    panel,
  };
}
