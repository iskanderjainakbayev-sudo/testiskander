import { useCallback, useEffect, useRef, useState } from 'react';
import { hasOceanSave } from '../../lib/ocean/save';
import type { OceanWorld as OceanWorldType } from '../../lib/ocean/OceanWorld';
import type { GraphicsQuality, RecipeId, WorldEvent } from '../../lib/ocean/types';
import type { OceanQaStats } from '../../lib/ocean/OceanVisualQa';
import { CraftingPanel } from './CraftingPanel';
import { DeathCinematic } from './DeathCinematic';
import { DiveCinematicOverlay } from './DiveCinematicOverlay';
import { DEFAULT_SNAPSHOT } from './defaultSnapshot';
import { EndingScreen } from './EndingScreen';
import { GraphicsSettings } from './GraphicsSettings';
import { OceanHud } from './OceanHud';
import { OceanCanvas } from './OceanCanvas';
import { OceanMenu } from './OceanMenu';
import { OceanMoments } from './OceanMoments';
import { OceanQaPanel } from './OceanQaPanel';
import { PausePanel } from './PausePanel';
import { PdaPanel } from './PdaPanel';
import { TouchControls } from './TouchControls';
import { savedOceanQuality, type OceanScreen } from './oceanUiState';
import './styles/foundation.css';
import './styles/hud.css';
import './styles/survival.css';
import './styles/effects.css';
import './styles/panels.css';
import './styles/navigation.css';
import './styles/touch.css';
import './styles/mobile.css';
import './styles/moments.css';
import './styles/qa.css';

const QA_ENABLED = new URLSearchParams(window.location.search).get('oceanQa') === '1';
const EMPTY_QA_STATS: OceanQaStats = {
  view: 'menu', phase: 'idle', secondsLeft: 0, sampleCount: 0,
  p50Ms: 0, p95Ms: 0, p99Ms: 0, averageFps: 0, onePercentLowFps: 0,
  droppedFramePercent: 0, drawCalls: 0, triangles: 0,
};

export function OceanGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<OceanWorldType | null>(null);
  const [screen, setScreen] = useState<OceanScreen>('menu');
  const [snapshot, setSnapshot] = useState(DEFAULT_SNAPSHOT);
  const [bootAttempt, setBootAttempt] = useState(0);
  const [bootState, setBootState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [quality, setQuality] = useState<GraphicsQuality>(savedOceanQuality);
  const [showDiveCinematic, setShowDiveCinematic] = useState(false);
  const cinematicTimer = useRef<number | null>(null);
  const [qaStats, setQaStats] = useState(EMPTY_QA_STATS);
  const [cleanQaFrame, setCleanQaFrame] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    let active = true;
    setBootState('loading');
    void import('../../lib/ocean/OceanWorld')
      .then(({ OceanWorld }) => {
        if (!active || !canvasRef.current) return;
        worldRef.current = new OceanWorld(
          canvasRef.current,
          setSnapshot,
          (event: WorldEvent) => {
            if (event === 'fatal') {
              setBootState('failed');
              setScreen('menu');
            } else {
              setScreen(event);
            }
          },
          QA_ENABLED ? setQaStats : undefined,
        );
        worldRef.current.setQuality(quality);
        setBootState('ready');
      })
      .catch(() => {
        if (active) setBootState('failed');
      });
    return () => {
      active = false;
      if (cinematicTimer.current !== null) window.clearTimeout(cinematicTimer.current);
      worldRef.current?.dispose();
      worldRef.current = null;
    };
  }, [bootAttempt]);

  const play = (continued: boolean) => {
    if (!worldRef.current || bootState !== 'ready') return;
    if (continued) worldRef.current?.continue();
    else worldRef.current?.startNew();
    setShowDiveCinematic(true);
    if (cinematicTimer.current !== null) window.clearTimeout(cinematicTimer.current);
    cinematicTimer.current = window.setTimeout(() => setShowDiveCinematic(false), 6200);
    setScreen('playing');
  };

  const resume = () => {
    setScreen('playing');
    worldRef.current?.setPaused(false);
  };

  const open = (next: OceanScreen) => {
    worldRef.current?.setPaused(true);
    setScreen(next);
  };

  const craft = (id: RecipeId) => {
    worldRef.current?.craft(id);
  };

  const changeQuality = (next: GraphicsQuality) => {
    localStorage.setItem('ocean-graphics-quality', next);
    setQuality(next);
    worldRef.current?.setQuality(next);
  };

  const recover = useCallback(() => {
    worldRef.current?.recover();
    setScreen('playing');
  }, []);

  return (
    <div className={`ocean-game${cleanQaFrame ? ' ocean-qa-clean' : ''}`}>
      <OceanCanvas canvasRef={canvasRef} onRequestInput={() => worldRef.current?.requestInput()} />
      {screen !== 'menu' && <OceanHud snapshot={snapshot} />}
      <DiveCinematicOverlay visible={showDiveCinematic && screen === 'playing'} />
      <OceanMoments snapshot={snapshot} active={screen === 'playing' && !showDiveCinematic} />
      {screen === 'playing' && (
        <TouchControls
          activeWeapon={snapshot.activeWeapon}
          onKey={(code, active) => worldRef.current?.setVirtualKey(code, active)}
          onMove={(x, forward) => worldRef.current?.setVirtualMove(x, forward)}
          onPause={() => open('pause')}
        />
      )}
      {screen === 'menu' && (
        <OceanMenu
          canContinue={hasOceanSave()}
          ready={bootState === 'ready'}
          failed={bootState === 'failed'}
          onNew={() => play(false)}
          onContinue={() => play(true)}
          onRetry={() => setBootAttempt((attempt) => attempt + 1)}
        />
      )}
      {screen === 'pause' && (
        <PausePanel
          onResume={resume}
          onCraft={() => open('craft')}
          onPda={() => open('pda')}
          onSettings={() => open('settings')}
          onSave={() => worldRef.current?.save()}
          onMenu={() => open('menu')}
        />
      )}
      {screen === 'craft' && <CraftingPanel snapshot={snapshot} onCraft={craft} onClose={resume} />}
      {screen === 'pda' && <PdaPanel logs={snapshot.logs} onClose={resume} />}
      {screen === 'settings' && (
        <GraphicsSettings quality={quality} onChange={changeQuality} onClose={resume} />
      )}
      {screen === 'ending' && <EndingScreen elapsed={snapshot.elapsed} onRestart={() => play(false)} />}
      {screen === 'death' && <DeathCinematic onRecovered={recover} />}
      {QA_ENABLED && (
        <OceanQaPanel
          stats={qaStats}
          cleanFrame={cleanQaFrame}
          onCleanFrame={setCleanQaFrame}
          onSelect={(view) => worldRef.current?.selectQaView(view)}
          onProfile={() => worldRef.current?.profileQaView()}
        />
      )}
    </div>
  );
}
