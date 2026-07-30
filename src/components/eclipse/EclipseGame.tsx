import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLocation } from 'wouter';
import { EclipseWorld, type EclipseWorldSnapshot } from '../../lib/eclipse/EclipseWorld';
import { createEclipseAutosave, loadEclipseSave, type EclipseAutosave } from '../../lib/eclipse/save';
import { createDefaultEclipseSave, type EclipseSave } from '../../lib/eclipse/types';
import { EclipseHud, type EclipseHudSnapshot } from './EclipseHud';
import { EclipseMenu, type EclipseMenuMode } from './EclipseMenu';
import { EclipsePanels, type EclipsePanelId, type EclipseSettings } from './EclipsePanels';
import { formatPlaytime, fromUiSettings, initialHud, inventoryFor, mapFor, recipesFor, resourcesFor, toUiSettings } from './eclipseGameData';
import '../../styles/eclipse.css';

type EclipseStyle = CSSProperties & { '--eclipse-ui-scale': string };
type GameMode = EclipseMenuMode | 'play';

export function EclipseGame() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<EclipseWorld>();
  const autosave = useRef<EclipseAutosave>();
  const saveRef = useRef(createDefaultEclipseSave());
  const playingBeforePanel = useRef(false);
  const lastCheckpoint = useRef(0);
  const [, navigate] = useLocation();
  const [save, setSave] = useState<EclipseSave>(saveRef.current);
  const [hud, setHud] = useState<EclipseHudSnapshot>(() => initialHud(saveRef.current));
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<GameMode>('start');
  const [panel, setPanel] = useState<EclipsePanelId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkpoint = useCallback((force = false) => {
    const activeWorld = world.current;
    if (!activeWorld || (!force && performance.now() - lastCheckpoint.current < 1500)) return;
    lastCheckpoint.current = performance.now();
    const next = { ...saveRef.current, savedAt: Date.now(), snapshot: activeWorld.getSaveSnapshot() };
    saveRef.current = next;
    setSave(next);
    autosave.current?.schedule(next);
  }, []);

  const receiveUpdate = useCallback((next: EclipseWorldSnapshot) => {
    setHud(next);
    checkpoint();
  }, [checkpoint]);

  useEffect(() => {
    autosave.current = createEclipseAutosave();
    void loadEclipseSave().then((next) => { saveRef.current = next; setSave(next); setHud(initialHud(next)); setLoaded(true); });
    const onVisibility = () => { if (document.visibilityState === 'hidden') checkpoint(true); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { document.removeEventListener('visibilitychange', onVisibility); void autosave.current?.dispose(); };
  }, [checkpoint]);

  useEffect(() => {
    if (!loaded || !canvas.current) return;
    try {
      const next = new EclipseWorld({ canvas: canvas.current, snapshot: saveRef.current.snapshot, settings: saveRef.current.settings, onUpdate: receiveUpdate, onOutcome: (outcome) => { checkpoint(true); setMode(outcome === 'victory' ? 'victory' : 'defeat'); } });
      world.current = next;
      return () => next.dispose();
    } catch {
      setError('WebGL could not start on this device. Try updating your browser or graphics settings.');
    }
  }, [loaded, receiveUpdate, checkpoint]);

  const play = async () => { await world.current?.start(); setMode('play'); };
  const resume = () => { world.current?.pause(false); setMode('play'); };
  const pause = () => { checkpoint(true); world.current?.pause(true); setMode('pause'); };
  const restart = () => { world.current?.restart(); setMode('play'); checkpoint(true); };
  const openPanel = (next: EclipsePanelId) => { playingBeforePanel.current = mode === 'play'; if (playingBeforePanel.current) world.current?.pause(true); setPanel(next); };
  const closePanel = () => { setPanel(null); if (playingBeforePanel.current) world.current?.pause(false); playingBeforePanel.current = false; checkpoint(true); };
  const updateSettings = (next: EclipseSettings) => {
    const settings = fromUiSettings(next, saveRef.current.settings);
    const updated = { ...saveRef.current, settings };
    saveRef.current = updated;
    setSave(updated);
    world.current?.setSettings(settings);
    autosave.current?.schedule(updated);
  };

  const showHud = mode === 'play' && !panel;
  const style: EclipseStyle = { '--eclipse-ui-scale': String(save.settings.uiScale) };
  if (error) return <main className="eclipse-error"><h1>PROJECT ECLIPSE</h1><p>{error}</p><button onClick={() => navigate('/')}>Return home</button></main>;
  return <section className="eclipse-shell" style={style}>
    <canvas ref={canvas} className="eclipse-canvas" tabIndex={0} aria-label="Project Eclipse exploration world" />
    {showHud && <EclipseHud snapshot={hud} onPause={pause} onOpenPanel={openPanel} />}
    <EclipsePanels activePanel={panel} resources={resourcesFor(hud)} inventory={inventoryFor(hud)} recipes={recipesFor()} settings={toUiSettings(save.settings)} map={mapFor(hud, save)} onClose={closePanel} onCraft={(recipe) => { world.current?.craft(recipe); checkpoint(true); }} onSettingsChange={updateSettings} />
    {mode !== 'play' && !panel && <EclipseMenu mode={mode} progress={{ level: hud.level, shards: hud.shards, alloy: hud.alloy, region: hud.region, questTitle: hud.quest?.title, playtime: formatPlaytime(save.snapshot.playtimeSeconds) }} onStart={loaded ? play : undefined} onResume={resume} onRestart={restart} onExit={() => navigate('/')} onOpenPanel={openPanel} />}
    {!loaded && <div className="eclipse-loading">SYNCING ECLIPSE LINK…</div>}
  </section>;
}
