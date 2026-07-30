import type { GameSnapshot } from '../../lib/odyssey/types';
import '../../styles/odyssey.css';
import { CinematicFrame } from './CinematicFrame';
import { CinematicHud } from './CinematicHud';
import { EndingSequence } from './EndingSequence';
import { FlightHud } from './FlightHud';
import { FocusPrompt } from './FocusPrompt';
import { LandingSequence } from './LandingSequence';
import { MainMenu } from './MainMenu';
import { PauseOverlay } from './PauseOverlay';
import { SurfaceHud } from './SurfaceHud';
import { WalkingHud } from './WalkingHud';

export interface OdysseyInterfaceProps {
  snapshot: GameSnapshot;
  hasSave: boolean;
  pointerLocked: boolean;
  suppressFocusPrompt?: boolean;
  onStart: () => void;
  onResume: () => void;
  onNewGame: () => void;
  onInteract: () => void;
  onScan: () => void;
  onCycleTarget: () => void;
  onLand: () => void;
  onSkipCinematic: () => void;
  onReturnToMenu: () => void;
}

export function OdysseyInterface({
  snapshot,
  hasSave,
  pointerLocked,
  suppressFocusPrompt = false,
  onStart,
  onResume,
  onNewGame,
  onInteract,
  onScan,
  onCycleTarget,
  onLand,
  onSkipCinematic,
  onReturnToMenu,
}: OdysseyInterfaceProps) {
  const isActive = ['walking', 'flight', 'surface'].includes(snapshot.mode);

  return (
    <div className={`odx-interface odx-interface--${snapshot.mode}`}>
      <CinematicFrame
        frameRate={snapshot.frameRate}
        frameTimeP95={snapshot.frameTimeP95}
        frameTimeP99={snapshot.frameTimeP99}
        longFramePercent={snapshot.longFramePercent}
        drawCalls={snapshot.drawCalls}
        triangles={snapshot.triangles}
      />
      {snapshot.mode === 'menu' && (
        <MainMenu
          hasSave={hasSave}
          onStart={onStart}
          onNewGame={onNewGame}
        />
      )}
      {snapshot.mode === 'flight' && (
        <FlightHud
          snapshot={snapshot}
          onInteract={onInteract}
          onScan={onScan}
          onCycleTarget={onCycleTarget}
          onLand={onLand}
        />
      )}
      {snapshot.mode === 'cinematic' && (
        <CinematicHud snapshot={snapshot} onSkip={onSkipCinematic} />
      )}
      {snapshot.mode === 'walking' && (
        <WalkingHud snapshot={snapshot} onInteract={onInteract} />
      )}
      {snapshot.mode === 'surface' && (
        <SurfaceHud snapshot={snapshot} onInteract={onInteract} />
      )}
      {(snapshot.mode === 'landing' || snapshot.mode === 'takeoff') && (
        <LandingSequence snapshot={snapshot} />
      )}
      {snapshot.mode === 'paused' && (
        <PauseOverlay
          snapshot={snapshot}
          onResume={onResume}
          onNewGame={onNewGame}
          onReturnToMenu={onReturnToMenu}
        />
      )}
      {snapshot.mode === 'ending' && (
        <EndingSequence onNewGame={onNewGame} onReturnToMenu={onReturnToMenu} />
      )}
      {isActive && !pointerLocked && !suppressFocusPrompt && (
        <FocusPrompt onResume={onResume} />
      )}
    </div>
  );
}
