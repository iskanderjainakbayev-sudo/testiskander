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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const world = new OdysseyWorld(canvas, {
      onSnapshot: setSnapshot,
      onPointerLock: setPointerLocked,
      onComplete: () => undefined,
    });
    worldRef.current = world;
    setHasSave(world.hasSave);
    return () => {
      world.dispose();
      worldRef.current = null;
    };
  }, []);

  return (
    <div className="odyssey-game">
      <canvas ref={canvasRef} className="odyssey-canvas" aria-label="The Long Silence game world" />
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
        onReturnToMenu={() => worldRef.current?.returnToMenu()}
      />
    </div>
  );
}
