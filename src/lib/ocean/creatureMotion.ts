import * as THREE from 'three';
import type { CreatureMode } from './creatureRuntime';

export function animateCreature(
  mesh: THREE.Group,
  phase: number,
  time: number,
  mode: CreatureMode,
  healthRatio: number,
): void {
  const fast = ['flee', 'chase', 'attack', 'hunt', 'retreat'].includes(mode);
  const sleeping = mode === 'sleep';
  const beat = time * (fast ? 10 : sleeping ? 1.2 : 4.5) + phase;
  const injury = healthRatio < .45 ? .58 : 1;
  mesh.rotation.z = mode === 'dead' ? THREE.MathUtils.lerp(mesh.rotation.z, Math.PI * .72, .04)
    : Math.sin(beat * .48) * (fast ? .16 : .07);
  const tail = mesh.getObjectByName('swim-tail');
  if (tail) tail.rotation.y = Math.sin(beat) * (fast ? .7 : .38) * injury;
  for (const side of [-1, 1]) {
    const fin = mesh.getObjectByName(`swim-fin-${side}`);
    if (fin) fin.rotation.y = Math.sin(beat * 0.72 + side) * 0.24;
  }
  mesh.children
    .filter((child) => child.name.startsWith('tentacle-'))
    .forEach((limb, index) => {
      limb.rotation.x = Math.sin(beat * 0.32 + index) * 0.15;
    });
  mesh.traverse((child) => {
    if (!child.name.startsWith('dragon-segment-')) return;
    const index = Number(child.name.slice(-2));
    const restX = child.userData.restX as number | undefined ?? 0;
    const restY = child.userData.restY as number | undefined ?? 0;
    const wave = time * (fast ? 4.4 : 2.2) - index * 0.48 + phase;
    child.position.x = restX + Math.sin(wave) * Math.min(1.45, index * 0.085);
    child.position.y = restY + Math.cos(wave * 0.72) * Math.min(0.55, index * 0.035);
    child.rotation.y = Math.sin(wave) * 0.16;
  });
  mesh.traverse((child) => {
    if (!child.name.startsWith('eel-segment-')) return;
    const index = Number(child.name.slice(-2));
    const restX = child.userData.restX as number | undefined ?? 0;
    const restY = child.userData.restY as number | undefined ?? 0;
    child.position.x = restX + Math.sin(beat * 0.55 - index * 0.7) * index * 0.025;
    child.position.y = restY + Math.cos(beat * 0.42 - index * 0.55) * index * 0.012;
  });
  mesh.children.filter((child) => child.name.startsWith('leg-')).forEach((leg, index) => {
    leg.rotation.x = Math.sin(beat * .72 + index) * (fast ? .42 : .18);
  });
  if (mode === 'warn') mesh.scale.setScalar(1 + Math.sin(time * 9) * .045);
  const hitScale = time < (mesh.userData.hitUntil as number | undefined ?? 0) ? 1.14 : 1;
  if (mode !== 'warn') mesh.scale.lerp(new THREE.Vector3(hitScale, hitScale, hitScale), 0.22);
}
