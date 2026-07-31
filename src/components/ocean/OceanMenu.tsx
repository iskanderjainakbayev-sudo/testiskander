interface OceanMenuProps {
  canContinue: boolean;
  onNew: () => void;
  onContinue: () => void;
}

export function OceanMenu({ canContinue, onNew, onContinue }: OceanMenuProps) {
  return (
    <div className="ocean-menu ocean-overlay">
      <section>
        <div className="menu-kicker"><i /> KEPLER SURVEY // 07</div>
        <h1>OCEAN<br /><em>DEPTHS</em></h1>
        <p>
          Stranded above the living ocean of Pelagos, you have one pod,
          one signal, and a world of blue between you and home.
        </p>
        <div className="menu-actions">
          <button className="primary" onClick={canContinue ? onContinue : onNew}>
            {canContinue ? 'CONTINUE DIVE' : 'BEGIN DIVE'} <span>→</span>
          </button>
          {canContinue && <button onClick={onNew}>NEW EXPEDITION</button>}
        </div>
        <small>AN ORIGINAL COMPACT SURVIVAL ADVENTURE</small>
      </section>
      <div className="menu-coordinate">PELAGOS<br />0° 17' 42" S</div>
    </div>
  );
}

