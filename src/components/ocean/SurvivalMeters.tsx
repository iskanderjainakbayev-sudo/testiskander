interface SurvivalMetersProps {
  health: number;
  stamina: number;
  maxStamina: number;
  accelerating: boolean;
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

export function SurvivalMeters({ health, stamina, maxStamina, accelerating, oxygen, maxOxygen, hunger, water }: SurvivalMetersProps) {
  const values = { health, stamina: stamina / maxStamina * 100, oxygen: oxygen / maxOxygen * 100, hunger, water };
  const meters = [
    ...METERS.slice(0, 1),
    [accelerating ? 'BOOSTING' : 'STAMINA', 'stamina', '#7fffd4'] as const,
    ...METERS.slice(1),
  ];
  return (
    <div className="ocean-meters">
      {meters.map(([label, key, color]) => (
        <div className="ocean-meter" key={key}>
          <span>{label}</span>
          <div><i style={{ width: `${Math.max(0, values[key])}%`, background: color }} /></div>
          <b>{Math.ceil(key === 'oxygen' ? oxygen : key === 'stamina' ? stamina : values[key])}</b>
        </div>
      ))}
    </div>
  );
}
