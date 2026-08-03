import type { GraphicsQuality } from '../../lib/ocean/types';

export type OceanScreen = 'menu' | 'playing' | 'pause' | 'craft' | 'pda' | 'settings' | 'ending' | 'death';

export function savedOceanQuality(): GraphicsQuality {
  const value = localStorage.getItem('ocean-graphics-quality');
  if (value === 'Low' || value === 'Medium' || value === 'High' || value === 'Ultra') return value;
  return matchMedia('(pointer: coarse)').matches ? 'Medium' : 'High';
}
