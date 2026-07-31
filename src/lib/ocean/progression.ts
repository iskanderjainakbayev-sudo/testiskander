import type { RecipeId } from './types';

export function getObjective(crafted: RecipeId[], logs: string[]): string {
  if (!logs.includes('pod')) return 'Recover the damaged PDA on the reef below';
  if (!crafted.includes('tank')) return 'Craft a high-capacity oxygen tank';
  if (!crafted.includes('repair')) return 'Build an Arc Repair Tool';
  if (!crafted.includes('submarine')) return 'Gather kelp resources and build the Nereid sub';
  if (!logs.includes('kelp')) return 'Find the glowing archive in the Lumen Kelp';
  if (!crafted.includes('depthModule')) return 'Harvest abyssal gems for a pressure lattice';
  if (!logs.includes('vault')) return 'Search the western abyss for the Quiet Vault';
  if (!logs.includes('heart')) return 'Reach the warm current in the eastern trench';
  const escapeParts: RecipeId[] = ['rocketHull', 'rocketCore', 'rocketFuel'];
  if (!escapeParts.every((part) => crafted.includes(part))) return 'Fabricate all three Aster escape assemblies';
  return 'Return to the escape pod and launch the Aster';
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

