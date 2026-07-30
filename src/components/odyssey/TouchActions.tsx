interface TouchActionsProps {
  mode: 'walking' | 'flight';
  canInteract?: boolean;
  onInteract?: () => void;
  onScan?: () => void;
  onCycleTarget?: () => void;
}

export function TouchActions({
  mode,
  canInteract = false,
  onInteract,
  onScan,
  onCycleTarget,
}: TouchActionsProps) {
  return (
    <div className={`odx-touch odx-touch--${mode}`} aria-label="Touch controls">
      <div className="odx-touch__stick" aria-hidden="true"><i /></div>
      <div className="odx-touch__actions">
        {mode === 'walking' && (
          <button onClick={onInteract} disabled={!canInteract}>
            <i>◇</i><span>{canInteract ? 'USE' : 'LOOK'}</span>
          </button>
        )}
        {mode === 'flight' && (
          <>
            <button onClick={onCycleTarget}><i>⌁</i><span>TARGET</span></button>
            <button className="is-primary" onClick={onScan}><i>◉</i><span>SCAN</span></button>
          </>
        )}
      </div>
    </div>
  );
}

