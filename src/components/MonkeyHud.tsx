import type { WorldSnapshot } from '../lib/monkey/types';

type Props = { snapshot: WorldSnapshot; onPause: () => void };

export function MonkeyHud({ snapshot, onPause }: Props) {
  const xpPercent = snapshot.xp % 100;
  return <>
    <div className="game-brand"><span>✦</span> MONKEY ADVENTURE</div>
    <div className="vitals">
      <div><span>HEALTH</span><b className="health"><i style={{ width: `${snapshot.health}%` }} /></b></div>
      <div><span>LVL {snapshot.level} · XP</span><b className="xp"><i style={{ width: `${xpPercent}%` }} /></b></div>
    </div>
    <div className="resources"><span>🍌 {snapshot.bananas}</span><span>◈ {snapshot.coins}</span><button onClick={onPause} aria-label="Pause game">Ⅱ</button></div>
    <div className="compass"><span>N</span><i /><span>JUNGLE HEART</span></div>
    <div className="mini-map"><div className="map-water" /><i className="map-player" /><b>VOLCANO</b></div>
    <div className="controls"><kbd>WASD</kbd> Move <kbd>SHIFT</kbd> Sprint <kbd>E</kbd> Open</div>
    {snapshot.nearbyChest && <div className="interact">Press <kbd>E</kbd> to open the ancient chest</div>}
    {snapshot.enemyDistance < 5 && <div className="danger">Stone guardian is close!</div>}
  </>;
}
