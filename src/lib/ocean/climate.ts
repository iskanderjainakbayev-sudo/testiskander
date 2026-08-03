export type OceanWeather = 'Calm' | 'Cloudy' | 'Rain' | 'Storm' | 'Heavy Fog' | 'High Swell';
export type DayPhase = 'Dawn' | 'Day' | 'Sunset' | 'Night';

export interface OceanClimate {
  weather: OceanWeather;
  phase: DayPhase;
  daylight: number;
  fogMultiplier: number;
  waveStrength: number;
  sunMultiplier: number;
}

const WEATHER: OceanWeather[] = ['Calm', 'Cloudy', 'Rain', 'Storm', 'Heavy Fog', 'High Swell'];

const WEATHER_VALUES: Record<OceanWeather, { fog: number; waves: number; sun: number }> = {
  Calm: { fog: 1, waves: 0.85, sun: 1 },
  Cloudy: { fog: 1.18, waves: 0.85, sun: 0.78 },
  Rain: { fog: 1.42, waves: 1.35, sun: 0.65 },
  Storm: { fog: 1.42, waves: 2.5, sun: 0.48 },
  'Heavy Fog': { fog: 2.25, waves: 0.85, sun: 0.68 },
  'High Swell': { fog: 1, waves: 1.9, sun: 0.92 },
};

function smootherstep(value: number): number {
  const t = Math.max(0, Math.min(1, value));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function getOceanClimate(elapsed: number): OceanClimate {
  const dayProgress = (elapsed % 240) / 240;
  const daylight = Math.max(0.08, Math.sin(dayProgress * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5);
  const phase: DayPhase = dayProgress < 0.12 ? 'Dawn'
    : dayProgress < 0.56 ? 'Day'
      : dayProgress < 0.69 ? 'Sunset' : 'Night';
  const weatherProgress = Math.max(0, elapsed) / 48;
  const weatherIndex = Math.floor(weatherProgress) % WEATHER.length;
  const weather = WEATHER[weatherIndex];
  const previous = WEATHER[(weatherIndex + WEATHER.length - 1) % WEATHER.length];
  const transition = smootherstep(Math.min(1, (weatherProgress % 1) * 4));
  const fogMultiplier = WEATHER_VALUES[previous].fog
    + (WEATHER_VALUES[weather].fog - WEATHER_VALUES[previous].fog) * transition;
  const waveStrength = WEATHER_VALUES[previous].waves
    + (WEATHER_VALUES[weather].waves - WEATHER_VALUES[previous].waves) * transition;
  const sunMultiplier = WEATHER_VALUES[previous].sun
    + (WEATHER_VALUES[weather].sun - WEATHER_VALUES[previous].sun) * transition;
  return { weather, phase, daylight, fogMultiplier, waveStrength, sunMultiplier };
}
