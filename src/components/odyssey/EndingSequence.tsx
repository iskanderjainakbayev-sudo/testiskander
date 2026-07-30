interface EndingSequenceProps {
  onNewGame: () => void;
  onReturnToMenu: () => void;
}

export function EndingSequence({ onNewGame, onReturnToMenu }: EndingSequenceProps) {
  return (
    <main className="odx-ending" aria-labelledby="ending-title">
      <div className="odx-ending__flare" aria-hidden="true" />
      <section className="odx-ending__story">
        <span>TRANSMISSION 001 // ORIGIN: BEYOND ATLAS</span>
        <h1 id="ending-title">The silence<br /><em>was listening.</em></h1>
        <p>
          The Gate does not open onto a place. It opens onto a memory:
          every world that looked into the dark, and chose to answer.
        </p>
        <blockquote>
          “LYRA, record this. Humanity was never alone.<br />
          We were only the first to arrive.”
        </blockquote>
        <div className="odx-ending__rule"><i /><span>NEW VECTOR RECEIVED</span><i /></div>
        <div className="odx-ending__actions">
          <button className="odx-button odx-button--primary" onClick={onReturnToMenu}><span>COMPLETE TRANSMISSION</span><i>→</i></button>
          <button className="odx-button odx-button--quiet" onClick={onNewGame}>BEGIN ANOTHER VOYAGE</button>
        </div>
      </section>
      <footer className="odx-ending__credit">
        <span>THE LONG SILENCE</span>
        <small>AN ODYSSEY ABOARD THE ARK LYRA</small>
      </footer>
    </main>
  );
}

