export type OceanWeather = 'Calm' | 'Cloudy' | 'Rain' | 'Storm' | 'Heavy Fog' | 'High Swell';
export type DayPhase = 'Dawn' | 'Day' | 'Sunset' | 'Night';

export interface OceanClimate {
  weather: OceanWeather;
  phase: DayPhase;
  daylight: number;
  fogMultiplier: number;
  waveStrength: number;
}

const WEATHER: OceanWeather[] = ['Calm', 'Cloudy', 'Rain', 'Storm', 'Heavy Fog', 'High Swell'];

export function getOceanClimate(elapsed: number): OceanClimate {
  const dayProgress = (elapsed % 240) / 240;
  const daylight = Math.max(0.08, Math.sin(dayProgress * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5);
  const phase: DayPhase = dayProgress < 0.12 ? 'Dawn'
    : dayProgress < 0.56 ? 'Day'
      : dayProgress < 0.69 ? 'Sunset' : 'Night';
  const weather = WEATHER[Math.floor(elapsed / 48) % WEATHER.length];
  const fogMultiplier = weather === 'Heavy Fog' ? 2.25
    : weather === 'Storm' || weather === 'Rain' ? 1.42
      : weather === 'Cloudy' ? 1.18 : 1;
  const waveStrength = weather === 'Storm' ? 2.5
    : weather === 'High Swell' ? 1.9
      : weather === 'Rain' ? 1.35 : 0.85;
  return { weather, phase, daylight, fogMultiplier, waveStrength };
}
