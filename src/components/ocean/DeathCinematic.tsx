import { useEffect } from 'react';

export function DeathCinematic({ onRecovered }: { onRecovered: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onRecovered, 5200);
    return () => window.clearTimeout(timer);
  }, [onRecovered]);
  return (
    <div className="death-cinematic ocean-overlay">
      <section>
        <small>VITAL LINK LOST</small>
        <h2>THE OCEAN<br />LET YOU GO.</h2>
        <p>Emergency beacon acquired · pod med-system recovering diver</p>
      </section>
    </div>
  );
}
