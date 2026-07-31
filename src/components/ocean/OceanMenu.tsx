import { Link } from "wouter";

interface OceanMenuProps {
  canContinue: boolean;
  ready: boolean;
  failed: boolean;
  onNew: () => void;
  onContinue: () => void;
  onRetry: () => void;
}

export function OceanMenu({ canContinue, ready, failed, onNew, onContinue, onRetry }: OceanMenuProps) {
  const primaryAction = failed ? onRetry : canContinue ? onContinue : onNew;
  const primaryLabel = failed
    ? 'RETRY OCEAN LINK'
    : ready
      ? canContinue ? 'CONTINUE DIVE' : 'BEGIN DIVE'
      : 'CALIBRATING OCEAN…';
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
          <button className="primary" disabled={!ready && !failed} onClick={primaryAction}>
            {primaryLabel} <span>→</span>
          </button>
          {ready && canContinue && <button onClick={onNew}>NEW EXPEDITION</button>}
          <Link className="menu-auth" href="/signup">
            <b>REGISTRATION</b> WITH GOOGLE
          </Link>
        </div>
        {failed && <strong className="menu-error">3D startup failed. Retry, or enable WebGL in your browser.</strong>}
        <small>AN ORIGINAL COMPACT SURVIVAL ADVENTURE</small>
      </section>
      <div className="menu-coordinate">PELAGOS<br />0° 17' 42" S</div>
    </div>
  );
}
