import * as THREE from 'three';
import type { Weather } from './types';

export function addLighting(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight('#b8efff', '#355b35', 2.1));
  const sun = new THREE.DirectionalLight('#ffe8a6', 3.2);
  sun.position.set(35, 55, 20); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); scene.add(sun);
  return sun;
}

export function applyWeather(scene: THREE.Scene, sun: THREE.DirectionalLight, weather: Weather) {
  const themes = {
    Sunny: { sky: '#79cce3', fog: '#79cce3', intensity: 3.2, color: '#ffe8a6' },
    Rain: { sky: '#587887', fog: '#587887', intensity: 1.35, color: '#b5c2c5' },
    'Golden hour': { sky: '#d98766', fog: '#d98766', intensity: 2.25, color: '#ffad62' },
  } as const;
  const theme = themes[weather];
  scene.background = new THREE.Color(theme.sky);
  scene.fog = new THREE.Fog(theme.fog, 45, 160);
  sun.intensity = theme.intensity; sun.color.set(theme.color);
}
