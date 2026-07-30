import { useEffect, useRef, useState } from 'react';
import { BackroomsWorld } from '../lib/backrooms/gameWorld';
import { LEVELS, levelFor } from '../lib/backrooms/levels';
import { clearGame, defaultSave, loadGame, saveGame } from '../lib/backrooms/save';
import type { GameState, InventoryItem } from '../lib/backrooms/types';

const initial = (): GameState => ({ ...loadGame(), stamina: 100, objective: levelFor(loadGame().level).objective, message: 'Click to enter the rooms.', enemyNear: false, paused: true });
const descriptions: Record<InventoryItem, string> = { flashlight: 'Cuts a small path through darkness.', battery: 'Restores 40% flashlight charge.', key: 'A cold brass key with no label.', note: 'The handwriting looks familiar.', medkit: 'Restore 30 health.' };

export function GameArena() {
  const canvas = useRef<HTMLCanvasElement>(null); const world = useRef<BackroomsWorld>(); const [game, setGame] = useState<GameState>(initial); const gameRef = useRef(game); const [screen, setScreen] = useState<'menu' | 'play' | 'pause' | 'inventory' | 'settings' | 'levels'>('menu');
  useEffect(() => { if (!canvas.current) return; world.current = new BackroomsWorld({ canvas: canvas.current, state: game, onChange: (next) => setGame((current) => ({ ...current, ...next })), onExit: exitLevel }); return () => world.current?.dispose(); }, []);
  useEffect(() => { gameRef.current = game; }, [game]);
  useEffect(() => { saveGame(game); }, [game]);
  const begin = () => { setScreen('play'); world.current?.start(); };
  const pause = () => { setScreen('pause'); world.current?.pause(true); };
  const resume = () => { setScreen('play'); world.current?.pause(false); };
  const exitLevel = () => { const next = (gameRef.current.level + 1) % LEVELS.length; setGame((current) => ({ ...current, level: next, message: 'The door closes behind you.' })); world.current?.loadLevel(next); };
  const selectLevel = (id: number) => { setGame((current) => ({ ...current, level: id, health: 100, message: 'Loading sector...' })); world.current?.loadLevel(id); resume(); };
  const reset = () => { clearGame(); setGame({ ...defaultSave, stamina: 100, objective: levelFor(0).objective, message: 'Progress erased.', enemyNear: false, paused: true }); world.current?.loadLevel(0); setScreen('menu'); };
  return <section className={`backrooms-shell ${game.settings.grain ? 'has-grain' : ''}`}>
    <canvas ref={canvas} className="world-canvas" aria-label="The Backrooms 3D game" />
    {screen === 'play' && <Hud game={game} onPause={pause} onInventory={() => { world.current?.pause(true); setScreen('inventory'); }} />}
    {screen === 'play' && <div className="reticle" />}
    {screen !== 'play' && <Overlay screen={screen} game={game} onBegin={begin} onResume={resume} onScreen={setScreen} onLevel={selectLevel} onReset={reset} onSettings={(settings) => { setGame((current) => ({ ...current, settings: { ...current.settings, ...settings } })); if (settings.sound !== undefined) world.current?.setVolume(settings.sound); }} />}
  </section>;
}

function Hud({ game, onPause, onInventory }: { game: GameState; onPause: () => void; onInventory: () => void }) {
  return <><header className="game-header"><div><span>{levelFor(game.level).title}</span><b>{levelFor(game.level).subtitle}</b></div><button onClick={onPause}>Ⅱ PAUSE</button></header><aside className="vital-panel"><Meter label="HEALTH" value={game.health} tone="health" /><Meter label="STAMINA" value={game.stamina} tone="stamina" /></aside><aside className="objective"><span>CURRENT OBJECTIVE</span><b>{game.objective}</b></aside><div className="battery">▰ <b>{Math.ceil(game.battery)}%</b></div><button className="inventory-button" onClick={onInventory}>▣ INVENTORY <i>{game.inventory.length}</i></button><div className={`threat ${game.enemyNear ? 'visible' : ''}`}>◉ SOMETHING IS NEAR</div><p className="whisper">{game.message}</p><footer className="controls">WASD MOVE · SHIFT RUN · E INTERACT · F FLASHLIGHT · C CROUCH</footer></>;
}
function Meter({ label, value, tone }: { label: string; value: number; tone: string }) { return <label><span>{label}</span><i><b className={tone} style={{ width: `${value}%` }} /></i><em>{Math.ceil(value)}</em></label>; }

type OverlayProps = { screen: 'menu' | 'pause' | 'inventory' | 'settings' | 'levels'; game: GameState; onBegin: () => void; onResume: () => void; onScreen: (screen: OverlayProps['screen']) => void; onLevel: (level: number) => void; onReset: () => void; onSettings: (settings: Partial<GameState['settings']>) => void };
function Overlay({ screen, game, onBegin, onResume, onScreen, onLevel, onReset, onSettings }: OverlayProps) {
  if (screen === 'inventory') return <div className="overlay"><section className="panel inventory"><button className="close" onClick={onResume}>×</button><p>RECOVERED ITEMS</p><h2>Inventory</h2><div className="items">{game.inventory.map((item, index) => <article draggable key={`${item}-${index}`}><strong>{symbol(item)}</strong><b>{item}</b><small>{descriptions[item]}</small></article>)}</div><small className="panel-note">Drag items to rearrange them · E picks up nearby objects</small></section></div>;
  if (screen === 'settings') return <div className="overlay"><section className="panel settings"><button className="close" onClick={() => onScreen('pause')}>×</button><p>SYSTEM</p><h2>Settings</h2><label>Sound <input type="range" min="0" max="1" step=".05" value={game.settings.sound} onChange={(e) => onSettings({ sound: Number(e.target.value) })} /></label><label className="check"><input type="checkbox" checked={game.settings.grain} onChange={(e) => onSettings({ grain: e.target.checked })} /> VHS film grain</label></section></div>;
  if (screen === 'levels') return <div className="overlay"><section className="panel level-select"><button className="close" onClick={() => onScreen('pause')}>×</button><p>KNOWN SECTORS</p><h2>Choose a level</h2>{LEVELS.map((level) => <button key={level.id} onClick={() => onLevel(level.id)}><span>{level.title}</span><b>{level.subtitle}</b></button>)}</section></div>;
  return <div className="overlay"><section className="title-card"><p>ARCHIVE // EXPERIMENT 06</p><h1>THE <i>BACKROOMS</i></h1><h2>LOST LEVELS</h2><span className="rule" />{screen === 'menu' ? <><b>You slipped through reality. Do not let it notice you.</b><button className="primary" onClick={onBegin}>ENTER THE ROOMS</button><small>HEADPHONES RECOMMENDED · CLICK TO ENABLE AUDIO</small></> : <><b>THE ROOMS ARE WAITING.</b><button className="primary" onClick={onResume}>RESUME</button><button onClick={() => onScreen('inventory')}>INVENTORY</button><button onClick={() => onScreen('levels')}>LEVEL SELECT</button><button onClick={() => onScreen('settings')}>SETTINGS</button><button className="danger-button" onClick={onReset}>ERASE SAVE</button></>}</section></div>;
}
function symbol(item: InventoryItem) { return ({ flashlight: '⌁', battery: '▰', key: '⚿', note: '▤', medkit: '✚' })[item]; }
