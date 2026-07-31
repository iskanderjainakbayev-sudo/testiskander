import { formatTime } from '../../lib/ocean/progression';

export function EndingScreen({ elapsed, onRestart }: { elapsed: number; onRestart: () => void }) {
  return (
    <div className="ending-screen ocean-overlay">
      <section>
        <div className="launch-orbit"><i /><i /><i /></div>
        <small>ASTER TELEMETRY // ESCAPE VELOCITY</small>
        <h2>The ocean<br />remembers.</h2>
        <p>
          The Aster rises on a pillar of white fire. Below, Pelagos becomes
          a single blue eye — still alive because its vanished gardeners chose memory over monuments.
        </p>
        <b>EXPEDITION COMPLETE · {formatTime(elapsed)}</b>
        <button onClick={onRestart}>DIVE AGAIN</button>
      </section>
    </div>
  );
}
