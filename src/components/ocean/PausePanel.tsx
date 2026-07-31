interface PausePanelProps {
  onResume: () => void;
  onCraft: () => void;
  onPda: () => void;
  onSettings: () => void;
  onSave: () => void;
  onMenu: () => void;
}

export function PausePanel({ onResume, onCraft, onPda, onSettings, onSave, onMenu }: PausePanelProps) {
  return (
    <div className="ocean-overlay pause-panel">
      <section>
        <small>DIVE SUSPENDED</small>
        <h2>Take a breath.</h2>
        <button className="primary" onClick={onResume}>RESUME DIVE</button>
        <button onClick={onCraft}>OPEN FABRICATOR</button>
        <button onClick={onPda}>READ PDA ARCHIVE</button>
        <button onClick={onSettings}>GRAPHICS & ACCESSIBILITY</button>
        <button onClick={onSave}>MANUAL SAVE</button>
        <button className="quiet" onClick={onMenu}>RETURN TO TITLE</button>
      </section>
    </div>
  );
}
