import '../../styles/eclipse.css';

export type EclipsePanelId = 'map' | 'inventory' | 'crafting' | 'settings';
export type EclipseResources = { shards: number; alloy: number };
export type EclipseInventoryItem = {
  id: string; name: string; description: string; quantity: number; icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic'; equipped?: boolean;
};
export type EclipseRecipe = {
  id: string; name: string; description: string; icon: string; unlocked: boolean;
  requirements: readonly { resource: keyof EclipseResources; amount: number }[];
};
export type EclipseSettings = {
  masterVolume: number; musicVolume: number; sfxVolume: number; uiScale: number;
  reducedMotion: boolean; colorblindMode: 'off' | 'protanopia' | 'deuteranopia';
  quality: 'balanced' | 'high';
};
export type EclipseMapDetails = {
  region: string; landmark: string; discovered: number; total: number; event?: string | null;
};
export type EclipsePanelsProps = {
  activePanel: EclipsePanelId | null; resources: EclipseResources; inventory: readonly EclipseInventoryItem[];
  recipes: readonly EclipseRecipe[]; settings: EclipseSettings; map: EclipseMapDetails;
  onClose: () => void; onCraft?: (recipeId: string) => void;
  onSettingsChange?: (settings: EclipseSettings) => void;
};

export function EclipsePanels(props: EclipsePanelsProps) {
  const { activePanel } = props;
  if (!activePanel) return null;
  const title = activePanel === 'map' ? 'Atlas' : activePanel === 'inventory' ? 'Field pack' : activePanel === 'crafting' ? 'Fabricator' : 'Settings';
  return <aside className="eclipse-panel" role="dialog" aria-modal="true" aria-labelledby="eclipse-panel-title">
    <header className="eclipse-panel__header"><div><span>RUNNER OS // {activePanel.toUpperCase()}</span><h2 id="eclipse-panel-title">{title}</h2></div><button className="eclipse-icon-button" onClick={props.onClose} aria-label={`Close ${title}`}>×</button></header>
    {activePanel === 'map' && <MapPanel map={props.map} />}
    {activePanel === 'inventory' && <InventoryPanel inventory={props.inventory} />}
    {activePanel === 'crafting' && <CraftingPanel resources={props.resources} recipes={props.recipes} onCraft={props.onCraft} />}
    {activePanel === 'settings' && <SettingsPanel settings={props.settings} onChange={props.onSettingsChange} />}
  </aside>;
}

function MapPanel({ map }: { map: EclipseMapDetails }) {
  const percent = map.total ? Math.round((map.discovered / map.total) * 100) : 0;
  return <section className="eclipse-map-panel"><div className="eclipse-map" role="img" aria-label={`Map of ${map.region}, current landmark ${map.landmark}`}><svg viewBox="0 0 420 250" aria-hidden="true"><path d="M21 190 87 80l65 24 51-75 61 63 95-27 37 120-74 45-86-20-66 24-92-16Z" /><path className="eclipse-map__route" d="M55 184C95 147 124 184 154 140s52 32 90-31 77 20 130-10" /><circle className="eclipse-map__player" cx="183" cy="136" r="8" /><circle cx="302" cy="104" r="5" /><circle cx="110" cy="156" r="5" /></svg><b>YOU</b></div><div className="eclipse-map-panel__info"><span>CURRENT REGION</span><strong>{map.region}</strong><p>{map.landmark}</p><div className="eclipse-meter"><i style={{ width: `${percent}%` }} /></div><small>{map.discovered}/{map.total} landmarks surveyed</small>{map.event && <em>◈ WORLD EVENT: {map.event}</em>}</div></section>;
}

function InventoryPanel({ inventory }: { inventory: readonly EclipseInventoryItem[] }) {
  return <section className="eclipse-inventory" aria-label="Inventory items">{inventory.length ? inventory.map((item) => <article className={`eclipse-item eclipse-item--${item.rarity}`} key={item.id}><b aria-hidden="true">{item.icon}</b><div><strong>{item.name}{item.equipped && <small> EQUIPPED</small>}</strong><p>{item.description}</p></div><span>×{item.quantity}</span></article>) : <p className="eclipse-empty">Your pack is clear. Gather materials from the riftlands.</p>}</section>;
}

function CraftingPanel({ resources, recipes, onCraft }: Pick<EclipsePanelsProps, 'resources' | 'recipes' | 'onCraft'>) {
  return <section className="eclipse-crafting"><div className="eclipse-resource-row"><span>✦ {resources.shards} Lumen shards</span><span>⬡ {resources.alloy} Scrap alloy</span></div>{recipes.map((recipe) => { const canCraft = recipe.unlocked && recipe.requirements.every((entry) => resources[entry.resource] >= entry.amount); return <article className="eclipse-recipe" key={recipe.id}><b aria-hidden="true">{recipe.icon}</b><div><strong>{recipe.name}</strong><p>{recipe.description}</p><small>{recipe.requirements.map((entry) => `${entry.amount} ${entry.resource}`).join(' · ')}</small></div><button onClick={() => onCraft?.(recipe.id)} disabled={!canCraft || !onCraft}>{recipe.unlocked ? canCraft ? 'Craft' : 'Need parts' : 'Locked'}</button></article>; })}</section>;
}

function SettingsPanel({ settings, onChange }: { settings: EclipseSettings; onChange?: (settings: EclipseSettings) => void }) {
  const enabled = Boolean(onChange);
  const update = (next: EclipseSettings) => onChange?.(next);
  return <section className="eclipse-settings"><Volume label="Master volume" value={settings.masterVolume} disabled={!enabled} onChange={(masterVolume) => update({ ...settings, masterVolume })} /><Volume label="Music" value={settings.musicVolume} disabled={!enabled} onChange={(musicVolume) => update({ ...settings, musicVolume })} /><Volume label="Effects" value={settings.sfxVolume} disabled={!enabled} onChange={(sfxVolume) => update({ ...settings, sfxVolume })} /><label>Interface scale <output>{settings.uiScale}%</output><input type="range" min="80" max="125" value={settings.uiScale} disabled={!enabled} onChange={(event) => update({ ...settings, uiScale: Number(event.currentTarget.value) })} /></label><div className="eclipse-setting-options"><button disabled={!enabled} aria-pressed={settings.reducedMotion} onClick={() => update({ ...settings, reducedMotion: !settings.reducedMotion })}>Reduced motion <small>{settings.reducedMotion ? 'On' : 'Off'}</small></button><button disabled={!enabled} aria-pressed={settings.quality === 'high'} onClick={() => update({ ...settings, quality: settings.quality === 'high' ? 'balanced' : 'high' })}>Graphics <small>{settings.quality}</small></button></div><label>Color vision<select value={settings.colorblindMode} disabled={!enabled} onChange={(event) => update({ ...settings, colorblindMode: event.currentTarget.value as EclipseSettings['colorblindMode'] })}><option value="off">Standard</option><option value="protanopia">Protanopia</option><option value="deuteranopia">Deuteranopia</option></select></label></section>;
}

function Volume({ label, value, disabled, onChange }: { label: string; value: number; disabled: boolean; onChange: (value: number) => void }) {
  return <label>{label}<output>{value}%</output><input type="range" min="0" max="100" value={value} disabled={disabled} onChange={(event) => onChange(Number(event.currentTarget.value))} /></label>;
}
