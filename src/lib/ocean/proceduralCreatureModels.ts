import * as THREE from 'three';
import type { Species } from './creatureCatalog';
import { addCrest, addEyes, addFins, addTeeth, cone, ellipsoid } from './creatureModelParts';

function fishLike(species: Species, skin: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  const { size, silhouette, bodyPlan } = species;
  const round = bodyPlan === 'puffer' ? 1.28 : bodyPlan === 'whale' ? 1.15 : 1;
  const body = ellipsoid(size, [
    silhouette.width * .68 * round,
    silhouette.height * .54 * round,
    silhouette.length * (bodyPlan === 'whale' ? 1.45 : 1.08),
  ], skin);
  group.add(body);
  addFins(group, species, skin);
  addCrest(group, species, skin);
  addEyes(group, species, bodyPlan === 'whale' ? .58 : .44, bodyPlan === 'whale' ? -1.25 : -1);
  addTeeth(group, species);
  return group;
}

function ray(species: Species, skin: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  const { size, silhouette } = species;
  group.add(ellipsoid(size, [silhouette.width * 1.5, .18, silhouette.length], skin));
  for (const side of [-1, 1]) {
    const wing = cone(size * 1.05, size * (1.55 + silhouette.crest), skin, 3);
    wing.name = `swim-fin-${side}`;
    wing.position.x = side * size * 1.2 * silhouette.width;
    wing.rotation.z = side * Math.PI / 2;
    group.add(wing);
  }
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(.02, size * .08, size * 3.2, 6), skin);
  tail.name = 'swim-tail';
  tail.rotation.x = Math.PI / 2;
  tail.position.z = size * 1.9;
  group.add(tail);
  addEyes(group, species, .45, -.85);
  return group;
}

function longBody(species: Species, skin: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  const count = 7 + species.silhouette.appendages;
  for (let index = 0; index < count; index += 1) {
    const taper = 1 - index / (count * 1.16);
    const segment = ellipsoid(species.size * taper, [.5, .42, .72], skin, 10);
    segment.name = `eel-segment-${String(index).padStart(2, '0')}`;
    segment.position.z = index * species.size * .62;
    segment.userData.restX = 0;
    segment.userData.restY = 0;
    group.add(segment);
  }
  addEyes(group, species, .3, -.48);
  addCrest(group, species, skin);
  addTeeth(group, species);
  return group;
}

function jelly(species: Species, skin: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  const bell = new THREE.Mesh(
    new THREE.SphereGeometry(species.size, 16, 9, 0, Math.PI * 2, 0, Math.PI * .62),
    skin,
  );
  bell.scale.set(species.silhouette.width, species.silhouette.height, species.silhouette.width);
  group.add(bell);
  const count = species.silhouette.appendages;
  for (let index = 0; index < count; index += 1) {
    const tentacle = new THREE.Mesh(
      new THREE.CylinderGeometry(.018 * species.size, .045 * species.size, species.size * 1.7, 5),
      skin,
    );
    const angle = index / count * Math.PI * 2;
    tentacle.name = `tentacle-${index}`;
    tentacle.position.set(Math.cos(angle) * species.size * .48, -species.size, Math.sin(angle) * species.size * .48);
    group.add(tentacle);
  }
  return group;
}

function turtle(species: Species, skin: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  const shell = ellipsoid(species.size, [species.silhouette.width, .42, species.silhouette.length], skin);
  group.add(shell);
  const head = ellipsoid(species.size * .42, [.72, .72, 1], skin, 10);
  head.position.z = -species.size * 1.12;
  group.add(head);
  addFins(group, species, skin);
  addCrest(group, species, skin);
  addEyes(group, species, .2, -1.36);
  return group;
}

function arthropod(species: Species, skin: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  group.add(ellipsoid(species.size, [species.silhouette.width, .48, .82], skin));
  const legs = Math.max(4, species.silhouette.appendages);
  for (let index = 0; index < legs; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.035 * species.size, .07 * species.size, species.size * 1.3, 5), skin);
    leg.name = `leg-${index}`;
    leg.position.set(side * species.size * .85, -.16 * species.size, (index / legs - .5) * species.size);
    leg.rotation.z = side * 1.05;
    group.add(leg);
  }
  addEyes(group, species, .35, -.74);
  addCrest(group, species, skin);
  return group;
}

function squid(species: Species, skin: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  const mantle = ellipsoid(species.size, [.62 * species.silhouette.width, .7, 1.18], skin);
  group.add(mantle);
  for (let index = 0; index < species.silhouette.appendages; index += 1) {
    const limb = cone(species.size * .1, species.size * 1.65, skin, 6);
    limb.name = `tentacle-${index}`;
    limb.rotation.x = -Math.PI / 2;
    limb.position.set((index % 3 - 1) * species.size * .22, -.2 * species.size, -species.size * 1.35);
    group.add(limb);
  }
  addEyes(group, species, .38, -.72);
  return group;
}

function slug(species: Species, skin: THREE.Material): THREE.Group {
  const group = fishLike(species, skin);
  group.scale.set(1, .42, 1.1);
  for (const side of [-1, 1]) {
    const feeler = cone(species.size * .055, species.size * .82, skin, 5);
    feeler.name = `swim-fin-${side}`;
    feeler.position.set(side * species.size * .35, species.size * .34, -species.size * .72);
    group.add(feeler);
  }
  return group;
}

export function createProceduralBody(species: Species, skin: THREE.Material): THREE.Group {
  if (species.bodyPlan === 'ray') return ray(species, skin);
  if (species.bodyPlan === 'eel' || species.bodyPlan === 'serpent') return longBody(species, skin);
  if (species.bodyPlan === 'jelly') return jelly(species, skin);
  if (species.bodyPlan === 'turtle') return turtle(species, skin);
  if (species.bodyPlan === 'crab' || species.bodyPlan === 'shrimp') return arthropod(species, skin);
  if (species.bodyPlan === 'squid') return squid(species, skin);
  if (species.bodyPlan === 'slug') return slug(species, skin);
  return fishLike(species, skin);
}
