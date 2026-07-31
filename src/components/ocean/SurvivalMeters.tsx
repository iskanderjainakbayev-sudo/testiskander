interface SurvivalMetersProps {
  health: number;
  oxygen: number;
  maxOxygen: number;
  hunger: number;
  water: number;
}

const METERS = [
  ['HEALTH', 'health', '#ff7668'],
  ['OXYGEN', 'oxygen', '#71ecff'],
  ['FOOD', 'hunger', '#f5cb69'],
  ['WATER', 'water', '#66baff'],
] as const;

export function SurvivalMeters({ health, oxygen, maxOxygen, hunger, water }: SurvivalMetersProps) {
  const values = { health, oxygen: oxygen / maxOxygen * 100, hunger, water };
  return (
    <div className="ocean-meters">
      {METERS.map(([label, key, color]) => (
        <div className="ocean-meter" key={key}>
          <span>{label}</span>
          <div><i style={{ width: `${Math.max(0, values[key])}%`, background: color }} /></div>
          <b>{Math.ceil(key === 'oxygen' ? oxygen : values[key])}</b>
        </div>
      ))}
    </div>
  );
}

