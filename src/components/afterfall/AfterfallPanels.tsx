import { itemNames, type AfterfallHudSnapshot, type AfterfallSettings } from '../../lib/afterfall/types';

export type AfterfallPanelId = 'map' | 'pack' | 'craft' | 'settings';
type PanelProps = { active: AfterfallPanelId | null; snapshot: AfterfallHudSnapshot; settings: AfterfallSettings; onClose: () => void; onUse: (item: 'water' | 'canned-food' | 'bandage' | 'medkit') => void; onCraft: (recipe: 'bandage' | 'medkit' | 'fire') => void; onSettings: (next: AfterfallSettings) => void };
const usable = ['water', 'canned-food', 'bandage', 'medkit'] as const;

type MapLandmark = { id: 'camp' | 'hospital' | 'checkpoint' | 'yard' | 'relay' | 'forest'; shortLabel: string; label: string; x: number; z: number; align?: 'left' | 'right' };
type MapPoint = { left: number; top: number };

const mapBounds = { minX: -84, maxX: 78, minZ: -87, maxZ: 85 };
const mapLandmarks: MapLandmark[] = [
  { id: 'camp', shortLabel: 'CAMP', label: 'Hollow Creek Camp', x: -5, z: 29 },
  { id: 'hospital', shortLabel: 'HOSP', label: 'St. Arlo Hospital', x: -21, z: -18 },
  { id: 'checkpoint', shortLabel: 'POST', label: 'North Checkpoint', x: 14, z: 14 },
  { id: 'yard', shortLabel: 'YARD', label: 'Freight Yard', x: 39, z: -28 },
  { id: 'relay', shortLabel: 'RELAY', label: 'Evacuation Relay', x: 58, z: -29, align: 'right' },
  { id: 'forest', shortLabel: 'PINES', label: 'Pine Expanse', x: -38, z: 47 },
];

export function AfterfallPanels({ active, snapshot, settings, onClose, onUse, onCraft, onSettings }: PanelProps) {
  if (!active) return null;
  const title = active === 'map' ? 'Field map' : active === 'pack' ? 'Field pack' : active === 'craft' ? 'Handcrafting' : 'Settings';
  return <aside className="afterfall-panel" role="dialog" aria-modal="true" aria-labelledby="afterfall-panel-title"><header><div><span>AFTERFALL // {active.toUpperCase()}</span><h2 id="afterfall-panel-title">{title}</h2></div><button onClick={onClose} aria-label={`Close ${title}`}>×</button></header>{active === 'map' && <Map snapshot={snapshot} />}{active === 'pack' && <Pack snapshot={snapshot} onUse={onUse} />}{active === 'craft' && <Craft snapshot={snapshot} onCraft={onCraft} />}{active === 'settings' && <Settings settings={settings} onSettings={onSettings} />}</aside>;
}

function Map({ snapshot }: { snapshot: AfterfallHudSnapshot }) {
  const player = mapPoint(snapshot.position.x, snapshot.position.z);
  const nearest = nearestLandmark(snapshot.position.x, snapshot.position.z);
  const nearestDistance = Math.round(Math.hypot(snapshot.position.x - nearest.x, snapshot.position.z - nearest.z));

  return <section className="afterfall-map-panel">
    <div className="afterfall-map" role="img" aria-label={`Field map. You are at ${snapshot.location}, grid X ${Math.round(snapshot.position.x)}, Z ${Math.round(snapshot.position.z)}. Nearest landmark: ${nearest.label}.`}>
      <svg className="afterfall-map__terrain" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <rect className="afterfall-map__boundary" x="1" y="1" width="98" height="98" />
        <ellipse className="afterfall-map__forest" cx={mapX(-30)} cy={mapZ(28)} rx={mapWidth(39)} ry={mapDepth(38)} />
        <rect className="afterfall-map__road" x={mapX(-3.5)} y="1" width={mapWidth(13)} height="98" />
        <line className="afterfall-map__road-line" x1={mapX(3)} y1="2" x2={mapX(3)} y2="98" />
        <rect className="afterfall-map__building" x={mapX(-27)} y={mapZ(-22.5)} width={mapWidth(12)} height={mapDepth(9)} />
        <rect className="afterfall-map__building" x={mapX(-15.5)} y={mapZ(-12.5)} width={mapWidth(7)} height={mapDepth(5)} />
        <rect className="afterfall-map__building" x={mapX(11.5)} y={mapZ(12)} width={mapWidth(5)} height={mapDepth(4)} />
        {[[25, -32], [34, -23], [43, -32], [52, -23]].map(([x, z]) => <rect key={`${x}-${z}`} className="afterfall-map__yard-block" x={mapX(x - 4.5)} y={mapZ(z - 3.5)} width={mapWidth(9)} height={mapDepth(7)} />)}
      </svg>
      {mapLandmarks.map((landmark) => {
        const point = mapPoint(landmark.x, landmark.z);
        return <span key={landmark.id} className={`afterfall-map__landmark afterfall-map__landmark--${landmark.id}${landmark.align ? ` afterfall-map__landmark--${landmark.align}` : ''}`} style={{ left: `${point.left}%`, top: `${point.top}%` }} aria-hidden="true"><i>{landmark.shortLabel}</i><small>{landmark.label}</small></span>;
      })}
      <span className="afterfall-map__player" style={{ left: `${player.left}%`, top: `${player.top}%` }} aria-hidden="true"><i /><b>YOU</b></span>
      <span className="afterfall-map__north" aria-hidden="true">N ↑</span>
      <span className="afterfall-map__scale" aria-hidden="true">100 M</span>
    </div>
    <div>
      <span>LIVE POSITION // X {formatCoordinate(snapshot.position.x)} · Z {formatCoordinate(snapshot.position.z)}</span>
      <strong>{snapshot.location}</strong>
      <p>{mapLead(snapshot)} Nearest known landmark: <b>{nearest.label}</b>, {nearestDistance} m away.</p>
      <small>ROAD: OLD HIGHWAY<br />WEATHER: {snapshot.weather.toUpperCase()}<br />THREATS TRACKED: {snapshot.nearbyThreats}<br />RELAY STATUS: {relayStatus(snapshot)}</small>
    </div>
  </section>;
}

function mapX(x: number) { return ((x - mapBounds.minX) / (mapBounds.maxX - mapBounds.minX)) * 100; }
function mapZ(z: number) { return ((z - mapBounds.minZ) / (mapBounds.maxZ - mapBounds.minZ)) * 100; }
function mapWidth(width: number) { return width / (mapBounds.maxX - mapBounds.minX) * 100; }
function mapDepth(depth: number) { return depth / (mapBounds.maxZ - mapBounds.minZ) * 100; }
function mapPoint(x: number, z: number): MapPoint { return { left: clamp(mapX(x), 3, 97), top: clamp(mapZ(z), 3, 97) }; }
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function nearestLandmark(x: number, z: number) { return mapLandmarks.reduce((nearest, landmark) => Math.hypot(x - landmark.x, z - landmark.z) < Math.hypot(x - nearest.x, z - nearest.z) ? landmark : nearest); }
function formatCoordinate(value: number) { return `${value >= 0 ? '+' : '−'}${Math.round(Math.abs(value))}`; }
function relayStatus(snapshot: AfterfallHudSnapshot) { return snapshot.questStep === 0 ? 'KEY REQUIRED' : snapshot.enemiesDefeated < 2 ? 'ROUTE CONTESTED' : 'ROUTE OPEN'; }
function mapLead(snapshot: AfterfallHudSnapshot) { return snapshot.questStep === 0 ? 'The relay key is still logged at St. Arlo Hospital.' : snapshot.enemiesDefeated < 2 ? 'Hostiles still block the safest route to the evacuation relay.' : 'The evacuation relay is reachable beyond the freight yard.'; }
function Pack({ snapshot, onUse }: { snapshot: AfterfallHudSnapshot; onUse: PanelProps['onUse'] }) { return <section className="afterfall-pack"><p>PACK WEIGHT <b>{packWeight(snapshot)}/18 KG</b></p>{Object.entries(snapshot.inventory).filter(([, quantity]) => quantity > 0).map(([id, quantity]) => <article key={id}><b>{iconFor(id)}</b><div><strong>{itemNames[id as keyof typeof itemNames]}</strong><small>{descriptionFor(id)}</small></div><span>×{quantity}</span>{usable.includes(id as typeof usable[number]) && <button onClick={() => onUse(id as typeof usable[number])}>Use</button>}</article>)}</section>; }
function Craft({ snapshot, onCraft }: { snapshot: AfterfallHudSnapshot; onCraft: PanelProps['onCraft'] }) { const recipes: { id: 'bandage' | 'medkit' | 'fire'; name: string; detail: string; parts: string; can: boolean }[] = [{ id: 'bandage', name: 'Bandage', detail: 'Stops bleeding and restores 22 health.', parts: '2 cloth', can: snapshot.inventory.cloth >= 2 }, { id: 'medkit', name: 'Field medkit', detail: 'A strong recovery kit for serious injuries.', parts: '2 cloth · 1 scrap', can: snapshot.inventory.cloth >= 2 && snapshot.inventory.scrap >= 1 }, { id: 'fire', name: 'Campfire', detail: 'Restore warmth and energy at your current shelter.', parts: '2 scrap', can: snapshot.inventory.scrap >= 2 }]; return <section className="afterfall-craft"><p>PARTS <b>{snapshot.inventory.cloth} CLOTH</b><b>{snapshot.inventory.scrap} SCRAP</b></p>{recipes.map((recipe) => <article key={recipe.id}><b>✦</b><div><strong>{recipe.name}</strong><small>{recipe.detail}</small><em>{recipe.parts}</em></div><button disabled={!recipe.can} onClick={() => onCraft(recipe.id)}>{recipe.can ? 'Craft' : 'Missing'}</button></article>)}</section>; }
function Settings({ settings, onSettings }: { settings: AfterfallSettings; onSettings: PanelProps['onSettings'] }) { return <section className="afterfall-settings"><label>Master volume <output>{Math.round(settings.masterVolume * 100)}%</output><input type="range" min="0" max="100" value={settings.masterVolume * 100} onChange={(event) => onSettings({ ...settings, masterVolume: Number(event.currentTarget.value) / 100 })} /></label><label>Look sensitivity <output>{settings.sensitivity.toFixed(1)}</output><input type="range" min="0.5" max="2" step="0.1" value={settings.sensitivity} onChange={(event) => onSettings({ ...settings, sensitivity: Number(event.currentTarget.value) })} /></label><div><button aria-pressed={settings.quality === 'cinematic'} onClick={() => onSettings({ ...settings, quality: settings.quality === 'cinematic' ? 'balanced' : 'cinematic' })}>GRAPHICS <b>{settings.quality.toUpperCase()}</b></button><button aria-pressed={settings.reducedMotion} onClick={() => onSettings({ ...settings, reducedMotion: !settings.reducedMotion })}>MOTION <b>{settings.reducedMotion ? 'REDUCED' : 'FULL'}</b></button></div></section>; }
function packWeight(snapshot: AfterfallHudSnapshot) { return Object.values(snapshot.inventory).reduce((total, quantity) => total + quantity * .4, 3).toFixed(1); }
function iconFor(id: string) { return ({ water: '◒', 'canned-food': '▣', bandage: '✚', scrap: '◆', cloth: '≈', ammo: '•', medkit: '✚', 'signal-key': '⌁' } as Record<string, string>)[id] ?? '·'; }
function descriptionFor(id: string) { return ({ water: 'Purified in the field.', 'canned-food': 'Keeps hunger away.', bandage: 'Quick wound dressing.', scrap: 'Useful repair material.', cloth: 'Clean and durable.', ammo: 'Rifle cartridge.', medkit: 'Emergency treatment.', 'signal-key': 'Opens the evacuation relay.' } as Record<string, string>)[id] ?? ''; }
