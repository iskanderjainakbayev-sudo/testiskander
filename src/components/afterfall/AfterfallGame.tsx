import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { AfterfallWorld } from '../../lib/afterfall/AfterfallWorld';
import { createAfterfallAutosave, loadAfterfallSave } from '../../lib/afterfall/save';
import { createDefaultAfterfallSave, type AfterfallHudSnapshot, type AfterfallSave } from '../../lib/afterfall/types';
import { AfterfallHud } from './AfterfallHud';
import { AfterfallMenu } from './AfterfallMenu';
import { AfterfallPanels, type AfterfallPanelId } from './AfterfallPanels';
import '../../styles/afterfall.css';

type Mode = 'start' | 'play' | 'pause' | 'defeat';

export function AfterfallGame() {
  const canvas = useRef<HTMLCanvasElement>(null); const world = useRef<AfterfallWorld>(); const autosave = useRef(createAfterfallAutosave());
  const saveRef = useRef<AfterfallSave>(createDefaultAfterfallSave()); const [, navigate] = useLocation(); const panelWasPlaying = useRef(false);
  const [save, setSave] = useState(saveRef.current); const [hud, setHud] = useState<AfterfallHudSnapshot>(() => toHud(saveRef.current)); const [loaded, setLoaded] = useState(false); const [mode, setMode] = useState<Mode>('start'); const [panel, setPanel] = useState<AfterfallPanelId | null>(null);
  const checkpoint = useCallback(() => { const next = world.current?.getSave(); if (!next) return; saveRef.current = next; setSave(next); autosave.current.schedule(next); }, []);
  const update = useCallback((next: AfterfallHudSnapshot) => { setHud(next); checkpoint(); }, [checkpoint]);

  useEffect(() => { void loadAfterfallSave().then((next) => { saveRef.current = next; setSave(next); setHud(toHud(next)); setLoaded(true); }); return () => { void autosave.current.flush(); }; }, []);
  useEffect(() => { if (!loaded || !canvas.current) return; const instance = new AfterfallWorld({ canvas: canvas.current, save: saveRef.current, onUpdate: update, onDefeat: () => { checkpoint(); setMode('defeat'); } }); world.current = instance; return () => instance.dispose(); }, [loaded, update, checkpoint]);
  useEffect(() => { const onHidden = () => { if (document.visibilityState === 'hidden') checkpoint(); }; document.addEventListener('visibilitychange', onHidden); return () => document.removeEventListener('visibilitychange', onHidden); }, [checkpoint]);

  const start = async () => { await world.current?.start(); setMode('play'); };
  const resume = () => { world.current?.pause(false); canvas.current?.requestPointerLock(); setMode('play'); };
  const pause = () => { world.current?.pause(true); document.exitPointerLock(); checkpoint(); setMode('pause'); };
  const restart = () => { world.current?.restart(); world.current?.pause(false); canvas.current?.requestPointerLock(); checkpoint(); setMode('play'); };
  const openPanel = (next: AfterfallPanelId) => { panelWasPlaying.current = mode === 'play'; if (panelWasPlaying.current) { world.current?.pause(true); document.exitPointerLock(); } setPanel(next); };
  const closePanel = () => { setPanel(null); if (panelWasPlaying.current) { world.current?.pause(false); canvas.current?.requestPointerLock(); } panelWasPlaying.current = false; checkpoint(); };

  useEffect(() => {
    const openShortcut = (event: KeyboardEvent) => {
      if (event.repeat || mode !== 'play' || panel) return;
      const panelForKey: Partial<Record<string, AfterfallPanelId>> = { KeyM: 'map', KeyI: 'pack', KeyB: 'craft' };
      const target = panelForKey[event.code];
      if (!target) return;
      event.preventDefault(); openPanel(target);
    };
    window.addEventListener('keydown', openShortcut);
    return () => window.removeEventListener('keydown', openShortcut);
  }, [mode, panel]);

  return <section className="afterfall-shell">
    <canvas ref={canvas} className="afterfall-canvas" tabIndex={0} aria-label="Afterfall first person survival game" />
    {mode === 'play' && !panel && <AfterfallHud snapshot={hud} onPause={pause} onPanel={openPanel} />}
    <AfterfallPanels active={panel} snapshot={hud} settings={save.settings} onClose={closePanel} onUse={(item) => { world.current?.useItem(item); checkpoint(); }} onCraft={(recipe) => { world.current?.craft(recipe); checkpoint(); }} onSettings={(settings) => { world.current?.setSettings(settings); const next = { ...saveRef.current, settings }; saveRef.current = next; setSave(next); autosave.current.schedule(next); }} />
    {mode !== 'play' && !panel && <AfterfallMenu mode={mode} loaded={loaded} playtime={formatPlaytime(save.snapshot.playtimeSeconds)} onStart={() => void start()} onResume={resume} onRestart={restart} onPanel={() => openPanel('settings')} onExit={() => navigate('/')} />}
    {!loaded && <p className="afterfall-loading">OPENING FIELD LOG…</p>}
  </section>;
}

function toHud(save: AfterfallSave): AfterfallHudSnapshot { const { snapshot } = save; return { ...snapshot, location: 'HOLLOW CREEK CAMP', weather: 'Clear', timeLabel: '17:20', objective: 'Search St. Arlo Hospital for the emergency relay key.', nearbyThreats: 0, prompt: null, toast: null, isReloading: false, isCrouching: false }; }
function formatPlaytime(seconds: number) { const minutes = Math.floor(seconds / 60); return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`; }
