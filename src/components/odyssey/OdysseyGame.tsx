import { useEffect, useRef, useState } from 'react';
import { OdysseyWorld } from '../../lib/odyssey/world/OdysseyWorld';
import { INITIAL_SNAPSHOT } from '../../lib/odyssey/world/snapshot';
import { getObjective } from '../../lib/odyssey/discoveries';
import type { GameMode, GameSnapshot } from '../../lib/odyssey/types';
import { OdysseyInterface } from './OdysseyInterface';
import '../../styles/odyssey.css';

export function OdysseyGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<OdysseyWorld | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(INITIAL_SNAPSHOT);
  const [hasSave, setHasSave] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let world: OdysseyWorld;
    try {
      world = new OdysseyWorld(canvas, {
        onSnapshot: setSnapshot,
        onPointerLock: () => undefined,
        onComplete: () => undefined,
      });
    } catch (error) {
      setStartupError(error instanceof Error ? error.message : 'Unknown graphics error');
      return;
    }
    worldRef.current = world;
    setHasSave(world.hasSave);
    return () => {
      world.dispose();
      worldRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (snapshot.scanned.length > 0) setHasSave(true);
  }, [snapshot.scanned.length]);

  const syncMode = (mode: GameMode) => {
    setSnapshot((current) => ({
      ...current,
      mode,
      objective: getObjective(
        current.scanned,
        mode,
        current.surfaceSamples,
        current.solaceSurveyed,
        current.nacreSurveyed,
        current.landingSiteName.toLowerCase().startsWith('nacre') ? 'nacre' : 'solace',
      ),
    }));
  };

  const beginVoyage = (newGame: boolean) => {
    const world = worldRef.current;
    if (!world) return setStartupError('Flight controls are still initializing. Please try again.');
    setStartupError(null);
    world.start(newGame);
    syncMode(world.mode);
    if (newGame) setHasSave(false);
  };

  return (
    <div className="odyssey-game">
      <canvas
        ref={canvasRef}
        className="odyssey-canvas"
        tabIndex={0}
        aria-label="The Long Silence game world"
      />
      {startupError && (
        <div className="odx-startup-error">
          <strong>GRAPHICS LINK INTERRUPTED</strong>
          <span>{startupError}</span>
          <button type="button" onClick={() => window.location.reload()}>RELOAD</button>
        </div>
      )}
      <OdysseyInterface
        snapshot={snapshot}
        hasSave={hasSave}
        onStart={() => beginVoyage(false)}
        onResume={() => {
          worldRef.current?.resume();
          if (worldRef.current) syncMode(worldRef.current.mode);
        }}
        onNewGame={() => beginVoyage(true)}
        onInteract={() => worldRef.current?.interact()}
        onScan={() => worldRef.current?.scan()}
        onCycleTarget={() => worldRef.current?.cycleTarget()}
        onLand={() => worldRef.current?.land()}
        onSkipCinematic={() => worldRef.current?.skipCinematic()}
        onReturnToMenu={() => worldRef.current?.returnToMenu()}
      />
    </div>
  );
}
