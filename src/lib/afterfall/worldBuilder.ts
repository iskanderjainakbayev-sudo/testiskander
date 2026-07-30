import * as THREE from 'three';

export type AfterfallEnvironment = { sun: THREE.DirectionalLight; moon: THREE.DirectionalLight; rain: THREE.Points; snow: THREE.Points; lamps: THREE.PointLight[] };

const groundMaterial = new THREE.MeshStandardMaterial({ color: '#2c342b', roughness: .96 });
const concrete = new THREE.MeshStandardMaterial({ color: '#5c5a50', roughness: .82, metalness: .1 });
const rust = new THREE.MeshStandardMaterial({ color: '#704737', roughness: .78, metalness: .32 });
const foliage = new THREE.MeshStandardMaterial({ color: '#314b2e', roughness: .93 });

export function buildAfterfallWorld(scene: THREE.Scene): AfterfallEnvironment {
  scene.background = new THREE.Color('#748999'); scene.fog = new THREE.FogExp2('#6b7c85', .018);
  const ambient = new THREE.HemisphereLight('#aec5d5', '#24231e', 1.55);
  const sun = new THREE.DirectionalLight('#ffe7b8', 2.8); sun.position.set(-32, 56, 18); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  const moon = new THREE.DirectionalLight('#859ac9', .22); moon.position.set(21, 25, -30);
  scene.add(ambient, sun, moon, makeGround(), makeRoad(), makeHospital(), makeCheckpoint(), makeForest(), makeRailYard(), makeCampfire());
  const lamps = makeLamps(); scene.add(...lamps); const rain = makeParticles('#9ccde6', 340, 18); const snow = makeParticles('#eaf6ff', 230, 12); snow.visible = false; scene.add(rain, snow);
  return { sun, moon, rain, snow, lamps };
}

function makeGround() { const mesh = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), groundMaterial); mesh.rotation.x = -Math.PI / 2; mesh.receiveShadow = true; return mesh; }
function makeRoad() { const road = new THREE.Mesh(new THREE.PlaneGeometry(13, 190), concrete); road.rotation.x = -Math.PI / 2; road.position.x = 3; const group = new THREE.Group(); group.add(road); for (let z = -80; z < 90; z += 8) { const line = new THREE.Mesh(new THREE.BoxGeometry(.25, .03, 4), new THREE.MeshBasicMaterial({ color: '#c8bf8c' })); line.position.set(3, .025, z); group.add(line); } return group; }
function makeHospital() { const group = new THREE.Group(); group.add(building(12, 8, 9, '#6b716c', -21, 4, -18), building(7, 5, 5, '#656b64', -12, 2.5, -10)); const sign = new THREE.Mesh(new THREE.BoxGeometry(3.6, .8, .15), new THREE.MeshBasicMaterial({ color: '#ddd5bb' })); sign.position.set(-21, 6.5, -13.46); group.add(sign); return group; }
function makeCheckpoint() { const group = new THREE.Group(); group.add(building(5, 3, 4, '#657169', 14, 1.5, 14)); for (const x of [8, 18]) { const barrier = new THREE.Mesh(new THREE.BoxGeometry(5, .2, .35), rust); barrier.position.set(x, .75, 6); barrier.rotation.z = x === 8 ? -.18 : .14; group.add(barrier); } return group; }
function makeForest() { const group = new THREE.Group(); for (let index = 0; index < 70; index += 1) { const angle = index * 2.39; const radius = 20 + (index % 9) * 2.6; const x = -30 + Math.cos(angle) * radius; const z = 28 + Math.sin(angle) * radius; const tree = new THREE.Group(); const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.18, .3, 3.1, 6), rust); trunk.position.y = 1.55; const crown = new THREE.Mesh(new THREE.ConeGeometry(1.8 + index % 3 * .35, 4.6, 7), foliage); crown.position.y = 4.2; tree.add(trunk, crown); tree.position.set(x, 0, z); group.add(tree); } return group; }
function makeRailYard() { const group = new THREE.Group(); for (let index = 0; index < 4; index += 1) { group.add(building(9, 4 + index % 2, 7, '#594c42', 25 + index * 9, 2.5, -32 + index % 2 * 9)); } return group; }
function makeCampfire() { const group = new THREE.Group(); const fire = new THREE.Mesh(new THREE.ConeGeometry(.45, 1.2, 7), new THREE.MeshBasicMaterial({ color: '#ff9d4a' })); fire.position.set(-5, .58, 29); const light = new THREE.PointLight('#ff9a42', 3, 14, 2); light.position.copy(fire.position); group.add(fire, light); return group; }
function building(width: number, height: number, depth: number, color: string, x: number, y: number, z: number) { const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), new THREE.MeshStandardMaterial({ color, roughness: .76, metalness: .16 })); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; return mesh; }
function makeLamps() { return [[-5, 29], [-21, -12], [15, 9]].map(([x, z]) => { const lamp = new THREE.PointLight('#ffd287', 1.8, 15, 2); lamp.position.set(x, 3.2, z); return lamp; }); }
function makeParticles(color: string, count: number, height: number) { const positions = Array.from({ length: count * 3 }, (_, index) => { const axis = index % 3; const seed = Math.sin(index * 92.13) * 43758.5; return axis === 1 ? (seed - Math.floor(seed)) * height : ((seed - Math.floor(seed)) - .5) * 100; }); const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); return new THREE.Points(geometry, new THREE.PointsMaterial({ color, size: .09, transparent: true, opacity: .68 })); }
