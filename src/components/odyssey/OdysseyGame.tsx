import { useEffect, useRef, useState } from 'react';
import { OdysseyWorld } from '../../lib/odyssey/world/OdysseyWorld';
import { INITIAL_SNAPSHOT } from '../../lib/odyssey/world/snapshot';
import type { GameSnapshot } from '../../lib/odyssey/types';
import { OdysseyInterface } from './OdysseyInterface';
import '../../styles/odyssey.css';

export function OdysseyGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<OdysseyWorld | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot>(INITIAL_SNAPSHOT);
  const [pointerLocked, setPointerLocked] = useState(false);
  const [hasSave, setHasSave] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let world: OdysseyWorld;
    try {
      world = new OdysseyWorld(canvas, {
        onSnapshot: setSnapshot,
        onPointerLock: setPointerLocked,
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

  return (
    <div className="odyssey-game">
      <canvas ref={canvasRef} className="odyssey-canvas" aria-label="The Long Silence game world" />
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
        pointerLocked={pointerLocked}
        onStart={() => worldRef.current?.start()}
        onResume={() => worldRef.current?.resume()}
        onNewGame={() => {
          worldRef.current?.start(true);
          setHasSave(false);
        }}
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
