import type { GameSnapshot } from '../../lib/odyssey/types';

interface TrafficContactProps {
  snapshot: GameSnapshot;
}

export function TrafficContact({ snapshot }: TrafficContactProps) {
  if (!snapshot.nearestShipName || snapshot.nearestShipDistance > 700) return null;
  const distance = Math.max(0, Math.round(snapshot.nearestShipDistance));
  const proximity = Math.max(0, 1 - distance / 700);

  return (
    <aside className="odx-contact">
      <header><i /> CIVIL TRAFFIC / VERIFIED</header>
      <strong>{snapshot.nearestShipName}</strong>
      <div><i style={{ width: `${proximity * 100}%` }} /></div>
      <footer><span>{distance.toString().padStart(3, '0')} KM</span><b>PASSIVE IFF</b></footer>
    </aside>
  );
}
