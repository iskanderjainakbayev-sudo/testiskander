interface MainMenuProps {
  hasSave: boolean;
  onStart: () => void;
  onNewGame: () => void;
  onReturnToMenu: () => void;
}

export function MainMenu({ hasSave, onStart, onNewGame, onReturnToMenu }: MainMenuProps) {
  return (
    <main className="odx-menu" aria-labelledby="odyssey-title">
      <header className="odx-menu__masthead">
        <span className="odx-kicker">AN INTERSTELLAR ODYSSEY</span>
        <span className="odx-menu__registry">ARK LYRA · MISSION 07 · 2189</span>
      </header>

      <section className="odx-menu__hero">
        <div className="odx-menu__signal" aria-hidden="true"><i /><i /><i /></div>
        <p className="odx-menu__pretitle">BEYOND THE LAST HUMAN VOICE</p>
        <h1 id="odyssey-title"><span>THE LONG</span> SILENCE</h1>
        <p className="odx-menu__lede">
          Three impossible signals are calling from the uncharted dark.
          Your crew never woke. Your ship remembers why.
        </p>
        <div className="odx-menu__actions">
          <button className="odx-button odx-button--primary" onClick={onStart}>
            <span>{hasSave ? 'CONTINUE VOYAGE' : 'BEGIN TRANSMISSION'}</span>
            <i aria-hidden="true">↗</i>
          </button>
          {hasSave && (
            <button className="odx-button odx-button--quiet" onClick={onNewGame}>
              NEW EXPEDITION
            </button>
          )}
          <button className="odx-menu__exit" onClick={onReturnToMenu}>RETURN TO ARCHIVE</button>
        </div>
      </section>

      <footer className="odx-menu__footer">
        <div><span>CURRENT VECTOR</span><strong>HELIOS NULL / UNCHARTED</strong></div>
        <div><span>VESSEL</span><strong>LYRA · EXPLORER CLASS</strong></div>
        <p><i /> AUDIO LINK READY</p>
      </footer>
    </main>
  );
}

