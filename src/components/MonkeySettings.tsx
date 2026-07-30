import type { Weather } from '../lib/monkey/types';

type Props = { weather: Weather; onWeather: (weather: Weather) => void };
export function MonkeySettings({ weather, onWeather }: Props) {
  return <section className="overlay-panel settings"><p>EXPEDITION SETTINGS</p><h2>Atmosphere</h2><label>Weather<select value={weather} onChange={(event) => onWeather(event.target.value as Weather)}><option>Sunny</option><option>Rain</option><option>Golden hour</option></select></label><label>Ambient audio <input type="range" defaultValue="55" /></label><label>Camera sensitivity <input type="range" defaultValue="62" /></label><p className="settings-copy">Your discoveries are automatically saved after every pickup.</p></section>;
}
