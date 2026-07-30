import * as THREE from 'three';
import { addLighting, applyWeather } from './lighting';
import { makeBanana, makeChest, makeGuardian, makeMonkey, type Chest, type Collectible } from './entities';
import { createIsland, populateJungle } from './world';
import { playTone } from './sound';
import type { GameStats, WorldSnapshot } from './types';

type GameWorldOptions = { canvas: HTMLCanvasElement; stats: GameStats; onUpdate: (snapshot: WorldSnapshot) => void; onReward: (kind: 'banana' | 'chest', amount: number) => void };

export class GameWorld {
  private renderer: THREE.WebGLRenderer; private scene = new THREE.Scene(); private camera = new THREE.PerspectiveCamera(52, 1, .1, 500);
  private player: THREE.Group; private sun: THREE.DirectionalLight; private water: THREE.Mesh; private bananas: Collectible[] = []; private chests: Chest[] = [];
  private guardian: THREE.Group; private keys = new Set<string>(); private frame = 0; private last = 0; private pulse = 0; private previousDamage = 0; private running = true;
  private stats: GameStats; private onUpdate: GameWorldOptions['onUpdate']; private onReward: GameWorldOptions['onReward'];

  constructor(options: GameWorldOptions) {
    this.stats = options.stats; this.onUpdate = options.onUpdate; this.onReward = options.onReward;
    this.renderer = new THREE.WebGLRenderer({ canvas: options.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7)); this.renderer.shadowMap.enabled = true; this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.water = createIsland(this.scene); populateJungle(this.scene); this.sun = addLighting(this.scene); applyWeather(this.scene, this.sun, this.stats.weather);
    this.player = makeMonkey(skinColor(this.stats.equippedSkin)); this.player.position.set(0, 0, 8); this.scene.add(this.player);
    bananaPositions().forEach(([x, z], index) => { const item = makeBanana(`banana-${index}`, x, z); item.collected = index < this.stats.bananas; if (!item.collected) this.scene.add(item.mesh); this.bananas.push(item); });
    [[-12, -15], [25, 9], [39, -20]].forEach(([x, z], index) => { const chest = makeChest(`chest-${index}`, x, z); chest.opened = this.stats.openedChests.includes(chest.id); if (!chest.opened) this.scene.add(chest.mesh); this.chests.push(chest); });
    this.guardian = makeGuardian(18, -11); this.scene.add(this.guardian); this.camera.position.set(0, 8, 16);
    window.addEventListener('keydown', this.keyDown); window.addEventListener('keyup', this.keyUp); this.resize(); window.addEventListener('resize', this.resize); this.animate(0);
  }

  setWeather(weather: GameStats['weather']) { this.stats.weather = weather; applyWeather(this.scene, this.sun, weather); }
  setSkin(skin: string) { this.stats.equippedSkin = skin; this.player.children.forEach((child) => { if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial && child.material.color.getHexString() !== 'e7b980') child.material.color.set(skinColor(skin)); }); }
  pause(value: boolean) { this.running = !value; if (!value) this.last = performance.now(); }
  dispose() { cancelAnimationFrame(this.frame); window.removeEventListener('keydown', this.keyDown); window.removeEventListener('keyup', this.keyUp); window.removeEventListener('resize', this.resize); this.renderer.dispose(); }
  private keyDown = (event: KeyboardEvent) => { this.keys.add(event.key.toLowerCase()); if (event.key.toLowerCase() === 'e') this.openChest(); };
  private keyUp = (event: KeyboardEvent) => this.keys.delete(event.key.toLowerCase());
  private resize = () => { const { clientWidth, clientHeight } = this.renderer.domElement; this.renderer.setSize(clientWidth, clientHeight, false); this.camera.aspect = clientWidth / clientHeight; this.camera.updateProjectionMatrix(); };
  private animate = (time: number) => { this.frame = requestAnimationFrame(this.animate); const delta = Math.min(.04, (time - this.last) / 1000 || 0); this.last = time; if (this.running) this.update(delta, time); this.renderer.render(this.scene, this.camera); };
  private update(delta: number, time: number) {
    const direction = new THREE.Vector3(Number(this.keys.has('d') || this.keys.has('arrowright')) - Number(this.keys.has('a') || this.keys.has('arrowleft')), 0, Number(this.keys.has('s') || this.keys.has('arrowdown')) - Number(this.keys.has('w') || this.keys.has('arrowup')));
    if (direction.lengthSq()) { direction.normalize(); const speed = this.keys.has('shift') ? 11 : 6.8; this.player.position.addScaledVector(direction, speed * delta); this.player.rotation.y = Math.atan2(direction.x, direction.z); this.player.position.x = THREE.MathUtils.clamp(this.player.position.x, -66, 66); this.player.position.z = THREE.MathUtils.clamp(this.player.position.z, -66, 66); }
    this.player.position.y = Math.max(0, Math.sin(time / 105) * .07); this.water.position.y = -2.4 + Math.sin(time / 900) * .12;
    this.bananas.forEach((banana, index) => { if (!banana.collected) { banana.mesh.rotation.y += delta * 2.3; banana.mesh.position.y = 1.25 + Math.sin(time / 230 + index) * .22; if (banana.mesh.position.distanceTo(this.player.position) < 1.45) { banana.collected = true; this.scene.remove(banana.mesh); this.stats.bananas += 1; this.stats.coins += 2; this.stats.xp += 8; this.stats.level = 1 + Math.floor(this.stats.xp / 100); playTone('banana'); this.onReward('banana', 1); } } });
    const guardianDistance = this.guardian.position.distanceTo(this.player.position); if (guardianDistance < 9) this.guardian.position.lerp(this.player.position, delta * .12); if (guardianDistance < 2.6 && time - this.previousDamage > 850) { this.previousDamage = time; playTone('hurt'); this.stats.health = Math.max(0, this.stats.health - 8); }
    this.camera.position.lerp(new THREE.Vector3(this.player.position.x, this.player.position.y + 8.5, this.player.position.z + 13), delta * 3.2); this.camera.lookAt(this.player.position.x, this.player.position.y + 1, this.player.position.z - 2);
    if (time - this.pulse > 120) { this.pulse = time; const nearbyChest = this.chests.some((chest) => !chest.opened && chest.mesh.position.distanceTo(this.player.position) < 2.3); this.onUpdate({ bananas: this.stats.bananas, coins: this.stats.coins, xp: this.stats.xp, health: this.stats.health, level: this.stats.level, weather: this.stats.weather, nearbyChest, enemyDistance: guardianDistance, position: { x: this.player.position.x, z: this.player.position.z } }); }
  }
  private openChest() { const chest = this.chests.find((item) => !item.opened && item.mesh.position.distanceTo(this.player.position) < 2.3); if (chest) { chest.opened = true; this.stats.coins += 25; this.stats.xp += 20; this.stats.level = 1 + Math.floor(this.stats.xp / 100); this.scene.remove(chest.mesh); playTone('chest'); this.onReward('chest', 25); } }
}

function skinColor(skin: string) { return ({ 'Jungle Scout': '#704226', 'Golden Monkey': '#d7a724', 'Galaxy Monkey': '#503d89' } as Record<string, string>)[skin] ?? '#704226'; }
function bananaPositions(): [number, number][] { return Array.from({ length: 48 }, (_, index) => { const a = index * 2.399; const r = 8 + Math.sqrt(index) * 7; return [Math.cos(a) * r, Math.sin(a) * r]; }); }
