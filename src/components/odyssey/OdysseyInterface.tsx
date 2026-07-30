import type { GameSnapshot } from '../../lib/odyssey/types';
import '../../styles/odyssey.css';
import { CinematicFrame } from './CinematicFrame';
import { EndingSequence } from './EndingSequence';
import { FlightHud } from './FlightHud';
import { FocusPrompt } from './FocusPrompt';
import { MainMenu } from './MainMenu';
import { PauseOverlay } from './PauseOverlay';
import { WalkingHud } from './WalkingHud';

export interface OdysseyInterfaceProps {
  snapshot: GameSnapshot;
  hasSave: boolean;
  pointerLocked: boolean;
  onStart: () => void;
  onResume: () => void;
  onNewGame: () => void;
  onInteract: () => void;
  onScan: () => void;
  onCycleTarget: () => void;
  onReturnToMenu: () => void;
}

export function OdysseyInterface({
  snapshot,
  hasSave,
  pointerLocked,
  onStart,
  onResume,
  onNewGame,
  onInteract,
  onScan,
  onCycleTarget,
  onReturnToMenu,
}: OdysseyInterfaceProps) {
  const isActive = snapshot.mode === 'walking' || snapshot.mode === 'flight';

  return (
    <div className={`odx-interface odx-interface--${snapshot.mode}`}>
      <CinematicFrame frameRate={snapshot.frameRate} />
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
          onScan={onScan}
          onCycleTarget={onCycleTarget}
        />
      )}
      {snapshot.mode === 'walking' && (
        <WalkingHud snapshot={snapshot} onInteract={onInteract} />
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
      {isActive && !pointerLocked && <FocusPrompt onResume={onResume} />}
    </div>
  );
}
