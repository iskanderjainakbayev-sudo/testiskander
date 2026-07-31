import * as THREE from 'three';

export function animateCreature(mesh: THREE.Group, phase: number, time: number, chasing: boolean): void {
  const beat = time * (chasing ? 10 : 4.5) + phase;
  mesh.rotation.z = Math.sin(beat * 0.48) * (chasing ? 0.16 : 0.07);
  const tail = mesh.getObjectByName('swim-tail');
  if (tail) tail.rotation.y = Math.sin(beat) * (chasing ? 0.7 : 0.38);
  for (const side of [-1, 1]) {
    const fin = mesh.getObjectByName(`swim-fin-${side}`);
    if (fin) fin.rotation.y = Math.sin(beat * 0.72 + side) * 0.24;
  }
  mesh.children
    .filter((child) => child.name.startsWith('tentacle-'))
    .forEach((limb, index) => {
      limb.rotation.x = Math.sin(beat * 0.32 + index) * 0.15;
    });
  const hitScale = time < (mesh.userData.hitUntil as number | undefined ?? 0) ? 1.14 : 1;
  mesh.scale.lerp(new THREE.Vector3(hitScale, hitScale, hitScale), 0.22);
}
