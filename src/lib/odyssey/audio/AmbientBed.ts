import type { GameMode } from '../types';
import type { LandablePlanetId } from '../types';

export type AudioScene = 'interior' | 'space' | 'solace' | 'nacre' | 'cinematic';

interface SceneMix {
  noise: number;
  cutoff: number;
  tone: number;
  pitch: number;
  weather: number;
  weatherCutoff: number;
}

const MIXES: Record<AudioScene, SceneMix> = {
  interior: {
    noise: 0.008, cutoff: 680, tone: 0.016, pitch: 52,
    weather: 0.001, weatherCutoff: 1_400,
  },
  space: {
    noise: 0.002, cutoff: 240, tone: 0.008, pitch: 38,
    weather: 0, weatherCutoff: 500,
  },
  solace: {
    noise: 0.048, cutoff: 3_400, tone: 0.004, pitch: 46,
    weather: 0.034, weatherCutoff: 4_800,
  },
  nacre: {
    noise: 0.036, cutoff: 1_500, tone: 0.006, pitch: 33,
    weather: 0.026, weatherCutoff: 880,
  },
  cinematic: {
    noise: 0.009, cutoff: 1_100, tone: 0.019, pitch: 42,
    weather: 0.004, weatherCutoff: 1_900,
  },
};

export class AmbientBed {
  private readonly noiseGain: GainNode;
  private readonly noiseFilter: BiquadFilterNode;
  private readonly weatherGain: GainNode;
  private readonly weatherFilter: BiquadFilterNode;
  private readonly toneGain: GainNode;
  private readonly tone: OscillatorNode;
  private scene: AudioScene | null = null;

  constructor(context: AudioContext, master: AudioNode, noiseBuffer: AudioBuffer) {
    const noise = context.createBufferSource();
    this.noiseGain = context.createGain();
    this.noiseFilter = context.createBiquadFilter();
    this.weatherGain = context.createGain();
    this.weatherFilter = context.createBiquadFilter();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    this.noiseFilter.type = 'lowpass';
    this.weatherFilter.type = 'bandpass';
    this.weatherFilter.Q.value = 0.7;
    noise.connect(this.noiseFilter).connect(this.noiseGain).connect(master);
    noise.connect(this.weatherFilter).connect(this.weatherGain).connect(master);
    noise.start();

    this.tone = context.createOscillator();
    this.toneGain = context.createGain();
    this.tone.type = 'sine';
    this.tone.connect(this.toneGain).connect(master);
    this.tone.start();
    this.setScene(context, 'interior');
  }

  setScene(context: AudioContext, scene: AudioScene) {
    if (scene === this.scene) return;
    this.scene = scene;
    const mix = MIXES[scene];
    const now = context.currentTime;
    this.noiseGain.gain.setTargetAtTime(mix.noise, now, 0.65);
    this.noiseFilter.frequency.setTargetAtTime(mix.cutoff, now, 0.72);
    this.toneGain.gain.setTargetAtTime(mix.tone, now, 0.8);
    this.tone.frequency.setTargetAtTime(mix.pitch, now, 0.9);
    this.weatherGain.gain.setTargetAtTime(mix.weather, now, 0.72);
    this.weatherFilter.frequency.setTargetAtTime(mix.weatherCutoff, now, 0.82);
  }
}

export function audioSceneFor(mode: GameMode, planet: LandablePlanetId): AudioScene {
  if (mode === 'surface' || mode === 'landing' || mode === 'takeoff') return planet;
  if (mode === 'cinematic' || mode === 'ending') return 'cinematic';
  if (mode === 'flight') return 'space';
  return 'interior';
}
