import * as THREE from 'three';
import { ECLIPSE_REGIONS, type EclipseRegion } from './regions';

export type WorldEnvironment = {
  sun: THREE.DirectionalLight;
  moon: THREE.PointLight;
  water: THREE.Mesh<THREE.CircleGeometry, THREE.MeshPhysicalMaterial>;
  stars: THREE.Points;
};

const palette = ['#162e5a', '#7c4c73', '#2d5a79', '#2f644f', '#4c3d86', '#71383b'];

export function buildWorld(scene: THREE.Scene): WorldEnvironment {
  scene.background = new THREE.Color('#060d22');
  scene.fog = new THREE.FogExp2('#101938', .012);
  const ambient = new THREE.HemisphereLight('#6f9fff', '#171328', 1.65);
  const sun = new THREE.DirectionalLight('#fff0c5', 2.4);
  sun.position.set(28, 45, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  const moon = new THREE.PointLight('#8c7dff', 11, 78, 2);
  moon.position.set(0, 18, 0);
  scene.add(ambient, sun, moon, makeGround(), makeWater());
  ECLIPSE_REGIONS.forEach((region, index) => scene.add(makeRegion(region, palette[index])));
  scene.add(makeRiftSky(), makeSkyTemple(), makeVolcano());
  const water = scene.children.find((child): child is THREE.Mesh<THREE.CircleGeometry, THREE.MeshPhysicalMaterial> => child.name === 'eclipse-water' && child instanceof THREE.Mesh) ?? makeWater();
  const stars = makeStars();
  scene.add(stars);
  return { sun, moon, water, stars };
}

function makeGround() {
  const ground = new THREE.Mesh(new THREE.CircleGeometry(118, 96), new THREE.MeshStandardMaterial({ color: '#101b35', roughness: .88, metalness: .05 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  return ground;
}

function makeWater() {
  const water = new THREE.Mesh(new THREE.CircleGeometry(165, 96), new THREE.MeshPhysicalMaterial({ color: '#17385a', emissive: '#0a2346', emissiveIntensity: .7, roughness: .2, metalness: .25, transparent: true, opacity: .9 }));
  water.name = 'eclipse-water';
  water.rotation.x = -Math.PI / 2;
  water.position.y = -.52;
  return water;
}

function makeRegion(region: EclipseRegion, color: string) {
  const group = new THREE.Group();
  const pad = new THREE.Mesh(new THREE.CircleGeometry(region.radius, 40), new THREE.MeshStandardMaterial({ color, roughness: .78, metalness: .13, transparent: true, opacity: .88 }));
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(region.center.x, .025, region.center.y);
  pad.receiveShadow = true;
  group.add(pad);
  const beacon = new THREE.PointLight(region.accent, 2.8, region.radius * 1.4, 2);
  beacon.position.set(region.center.x, 4, region.center.y);
  group.add(beacon);
  for (let index = 0; index < 10; index += 1) {
    const a = index * 2.399;
    const r = 5 + ((index * 7) % 15);
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(.6 + (index % 3) * .35, 0), new THREE.MeshStandardMaterial({ color: index % 2 ? '#26304c' : region.accent, emissive: index % 2 ? '#000000' : region.accent, emissiveIntensity: .32, roughness: .65 }));
    rock.position.set(region.center.x + Math.cos(a) * r, .45, region.center.y + Math.sin(a) * r);
    rock.rotation.set(a, a * .3, 0);
    rock.castShadow = true;
    group.add(rock);
  }
  group.add(makeLandmark(region));
  return group;
}

function makeLandmark(region: EclipseRegion) {
  const landmark = new THREE.Group();
  const frame = new THREE.MeshStandardMaterial({ color: '#253457', metalness: .55, roughness: .3 });
  const glow = new THREE.MeshStandardMaterial({ color: region.accent, emissive: region.accent, emissiveIntensity: 1.4, roughness: .25 });
  if (region.id === 'crystal-desert') {
    for (let index = 0; index < 5; index += 1) {
      const crystal = new THREE.Mesh(new THREE.ConeGeometry(.5, 3 + index * .4, 5), glow);
      crystal.position.set(index - 2, 1.5 + index * .2, (index % 2) - .5);
      landmark.add(crystal);
    }
  } else if (region.id === 'sky-breach') {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3, .18, 8, 30), glow);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 3;
    landmark.add(ring);
  } else {
    for (let index = 0; index < 3; index += 1) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(.8, 5 - index, .8), frame);
      pillar.position.set((index - 1) * 1.55, (5 - index) / 2, 0);
      landmark.add(pillar);
    }
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(.7, 1), glow);
    core.position.y = 3.2;
    landmark.add(core);
  }
  landmark.position.set(region.center.x, 0, region.center.y);
  landmark.traverse((child) => { if (child instanceof THREE.Mesh) child.castShadow = true; });
  return landmark;
}

function makeRiftSky() {
  const rift = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(8, 28, 18), new THREE.MeshBasicMaterial({ color: '#372454', transparent: true, opacity: .48 }));
  core.position.set(0, 38, -30);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(9.5, .24, 8, 48), new THREE.MeshBasicMaterial({ color: '#bc8cff', transparent: true, opacity: .85 }));
  ring.position.copy(core.position);
  ring.rotation.x = Math.PI / 2;
  rift.add(core, ring);
  return rift;
}

function makeSkyTemple() {
  const temple = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: '#343c68', metalness: .4, roughness: .5 });
  for (let index = 0; index < 4; index += 1) {
    const island = new THREE.Mesh(new THREE.ConeGeometry(2.6 + index, 5 + index, 7), material);
    island.position.set(24 + index * 4.2, 12 + index * 3.6, 35 + (index % 2) * 5);
    island.rotation.x = Math.PI;
    temple.add(island);
  }
  return temple;
}

function makeVolcano() {
  const volcano = new THREE.Mesh(new THREE.ConeGeometry(9, 20, 10), new THREE.MeshStandardMaterial({ color: '#30202c', roughness: .9, flatShading: true }));
  volcano.position.set(5, 10, 69);
  volcano.castShadow = true;
  return volcano;
}

function makeStars() {
  const vertices = Array.from({ length: 240 }, (_, index) => [Math.sin(index * 4.71) * (80 + index % 30), 15 + (index * 19) % 48, Math.cos(index * 2.13) * (80 + index % 30)]).flat();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#d8e5ff', size: .42, sizeAttenuation: true, transparent: true, opacity: .82 }));
}

export function updateEnvironment(environment: WorldEnvironment, elapsed: number, weather: string) {
  const daylight = .5 + Math.sin(elapsed * .018) * .5;
  environment.sun.intensity = .65 + daylight * 2.25;
  environment.moon.intensity = 4 + (1 - daylight) * 9;
  environment.water.material.opacity = weather === 'Ion rain' ? .74 : .9;
  environment.water.position.y = -.52 + Math.sin(elapsed * 1.1) * .06;
  environment.stars.rotation.y = elapsed * .008;
}
