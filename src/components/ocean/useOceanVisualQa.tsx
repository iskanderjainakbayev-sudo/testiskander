import { useState, type MutableRefObject } from 'react';
import type { OceanWorld } from '../../lib/ocean/OceanWorld';
import type { OceanQaStats } from '../../lib/ocean/OceanVisualQa';
import { OceanQaPanel } from './OceanQaPanel';
import './styles/qa.css';

const ENABLED = new URLSearchParams(window.location.search).get('oceanQa') === '1';
const EMPTY_STATS: OceanQaStats = {
  view: 'menu', phase: 'idle', secondsLeft: 0, sampleCount: 0,
  p50Ms: 0, p95Ms: 0, p99Ms: 0, averageFps: 0, onePercentLowFps: 0,
  droppedFramePercent: 0, drawCalls: 0, triangles: 0,
};

export function useOceanVisualQa(worldRef: MutableRefObject<OceanWorld | null>) {
  const [stats, setStats] = useState(EMPTY_STATS);
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
