import { STORY_LOGS } from '../../lib/ocean/content';

export function PdaPanel({ logs, onClose }: { logs: string[]; onClose: () => void }) {
  return (
    <div className="ocean-overlay">
      <section className="ocean-panel pda-panel">
        <header>
          <div><small>WAYFARER PDA</small><h2>Recovered Memory</h2></div>
          <button onClick={onClose} aria-label="Close PDA">×</button>
        </header>
        <div className="pda-log-list">
          {Object.entries(STORY_LOGS).map(([id, log], index) => {
            const found = logs.includes(id);
            return (
              <article className={found ? '' : 'unknown'} key={id}>
                <b>{found ? log.title : `0${index + 1} · SIGNAL LOST`}</b>
                <p>{found ? log.body : 'Archive location has not been discovered.'}</p>
              </article>
            );
          })}
        </div>
        <footer>{logs.length} / {Object.keys(STORY_LOGS).length} archives recovered</footer>
      </section>
    </div>
  );
}

