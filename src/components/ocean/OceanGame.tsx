import { useEffect, useRef, useState } from 'react';
import { hasOceanSave } from '../../lib/ocean/save';
import type { OceanWorld as OceanWorldType } from '../../lib/ocean/OceanWorld';
import type { RecipeId, WorldEvent } from '../../lib/ocean/types';
import { CraftingPanel } from './CraftingPanel';
import { DEFAULT_SNAPSHOT } from './defaultSnapshot';
import { EndingScreen } from './EndingScreen';
import { OceanHud } from './OceanHud';
import { OceanMenu } from './OceanMenu';
import { PausePanel } from './PausePanel';
import { PdaPanel } from './PdaPanel';
import { TouchControls } from './TouchControls';
import './styles/foundation.css';
import './styles/hud.css';
import './styles/survival.css';
import './styles/effects.css';
import './styles/panels.css';
import './styles/touch.css';
import './styles/navigation.css';

type Screen = 'menu' | 'playing' | 'pause' | 'craft' | 'pda' | 'ending';

export function OceanGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<OceanWorldType | null>(null);
  const [screen, setScreen] = useState<Screen>('menu');
  const [snapshot, setSnapshot] = useState(DEFAULT_SNAPSHOT);
  const [bootAttempt, setBootAttempt] = useState(0);
  const [bootState, setBootState] = useState<'loading' | 'ready' | 'failed'>('loading');

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
        );
        setBootState('ready');
      })
      .catch(() => {
        if (active) setBootState('failed');
      });
    return () => {
      active = false;
      worldRef.current?.dispose();
      worldRef.current = null;
    };
  }, [bootAttempt]);

  const play = (continued: boolean) => {
    if (!worldRef.current || bootState !== 'ready') return;
    if (continued) worldRef.current?.continue();
    else worldRef.current?.startNew();
    setScreen('playing');
  };

  const resume = () => {
    setScreen('playing');
    worldRef.current?.setPaused(false);
  };

  const open = (next: Screen) => {
    worldRef.current?.setPaused(true);
    setScreen(next);
  };

  const craft = (id: RecipeId) => {
    worldRef.current?.craft(id);
  };

  return (
    <div className="ocean-game">
      <canvas
        ref={canvasRef}
        className="ocean-canvas"
        tabIndex={0}
        onClick={() => worldRef.current?.requestInput()}
        aria-label="First-person underwater game"
      />
      {screen !== 'menu' && <OceanHud snapshot={snapshot} />}
      {screen === 'playing' && (
        <TouchControls onKey={(code, active) => worldRef.current?.setVirtualKey(code, active)} />
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
          onSave={() => worldRef.current?.save()}
          onMenu={() => open('menu')}
        />
      )}
      {screen === 'craft' && <CraftingPanel snapshot={snapshot} onCraft={craft} onClose={resume} />}
      {screen === 'pda' && <PdaPanel logs={snapshot.logs} onClose={resume} />}
      {screen === 'ending' && <EndingScreen elapsed={snapshot.elapsed} onRestart={() => play(false)} />}
    </div>
  );
}
