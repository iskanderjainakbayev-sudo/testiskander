import * as THREE from 'three';

export type Temperament = 'passive' | 'neutral' | 'aggressive';

export interface Species {
  name: string;
  color: number;
  glow: number;
  size: number;
  speed: number;
  temperament: Temperament;
  band: [number, number];
}

export const SPECIES: Species[] = [
  { name: 'Lantern Sprat', color: 0x8dfff1, glow: 0x36bbaa, size: 0.35, speed: 1.5, temperament: 'passive', band: [8, 30] },
  { name: 'Mosaic Shellwing', color: 0xffb96b, glow: 0x6b3011, size: 0.72, speed: 0.55, temperament: 'passive', band: [12, 36] },
  { name: 'Bubblefin', color: 0xbda4ff, glow: 0x4e2b8f, size: 0.48, speed: 0.8, temperament: 'passive', band: [8, 40] },
  { name: 'Sunveil Ray', color: 0xfff09a, glow: 0x7e6a18, size: 1.1, speed: 1.0, temperament: 'passive', band: [18, 55] },
  { name: 'Volt Ribbon', color: 0x65dbff, glow: 0x146fba, size: 0.8, speed: 1.3, temperament: 'neutral', band: [45, 78] },
  { name: 'Rootback Crab', color: 0xc87556, glow: 0x46190d, size: 0.65, speed: 0.35, temperament: 'neutral', band: [38, 78] },
  { name: 'Needle Dart', color: 0xa9ff77, glow: 0x3c7c21, size: 0.42, speed: 2.4, temperament: 'neutral', band: [42, 82] },
  { name: 'Night Kite', color: 0x6f86c9, glow: 0x243467, size: 1.25, speed: 1.15, temperament: 'neutral', band: [65, 98] },
  { name: 'Rift Stalker', color: 0xf05f54, glow: 0x6f130e, size: 1.35, speed: 2.0, temperament: 'aggressive', band: [55, 92] },
  { name: 'Ink Maw', color: 0x7532a5, glow: 0x341050, size: 1.65, speed: 1.55, temperament: 'aggressive', band: [88, 125] },
  { name: 'Glassjaw', color: 0x8bc5d2, glow: 0x2b6877, size: 1.8, speed: 2.1, temperament: 'aggressive', band: [100, 138] },
  { name: 'Gloom Crown', color: 0x17223f, glow: 0x2f76ff, size: 3.6, speed: 1.3, temperament: 'aggressive', band: [120, 140] },
];

export function createCreatureModel(species: Species): THREE.Group {
  const group = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({
    color: species.color,
    emissive: species.glow,
    emissiveIntensity: 1.2,
    roughness: 0.48,
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(species.size, 10, 7), skin);
  body.scale.set(1, 0.55, 1.65);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(species.size * 0.7, species.size * 1.3, 3), skin);
  tail.rotation.x = Math.PI / 2;
  tail.position.z = species.size * 2;
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(species.size * 0.11, 6, 4),
    new THREE.MeshBasicMaterial({ color: 0xeaffff }),
  );
  eye.position.set(species.size * 0.42, species.size * 0.16, -species.size * 1.22);
  group.add(body, tail, eye);
  if (species.name === 'Gloom Crown') {
    for (let tentacle = 0; tentacle < 6; tentacle += 1) {
      const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 3.4, 5), skin);
      limb.position.set((tentacle - 2.5) * 0.48, -1.9, 0.8);
      limb.rotation.z = (tentacle - 2.5) * 0.08;
      group.add(limb);
    }
  }
  return group;
}

