import * as THREE from 'three';
import { BackroomsAudio } from './audio';
import { addAtmosphere, makeStalker } from './effects';
import { levelFor } from './levels';
import { createMap, type GeneratedMap } from './mapGenerator';
import { FirstPersonPlayer } from './player';
import type { GameState, Interactable } from './types';

type WorldOptions = { canvas: HTMLCanvasElement; state: GameState; onChange: (next: Partial<GameState>) => void; onExit: () => void };

export class BackroomsWorld {
  private renderer: THREE.WebGLRenderer; private scene = new THREE.Scene(); private player: FirstPersonPlayer; private map?: GeneratedMap; private stalker = makeStalker();
  private flashlight = new THREE.SpotLight(0xeaf6ff, 0, 30, .46, .6); private light = new THREE.HemisphereLight(0xffffff, 0x1b1611, .3);
  private audio = new BackroomsAudio(); private frame = 0; private previous = 0; private running = false; private state: GameState; private lastStep = 0; private lastHit = 0; private lastMessage = 0;

  constructor(private readonly options: WorldOptions) {
    this.state = options.state; this.renderer = new THREE.WebGLRenderer({ canvas: options.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); this.renderer.shadowMap.enabled = true; this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.player = new FirstPersonPlayer(options.canvas, { interact: () => this.interact(), flashlight: () => this.toggleFlashlight() });
    this.flashlight.position.set(0, -.12, 0); this.flashlight.target.position.set(0, 0, -8); this.player.camera.add(this.flashlight); this.player.camera.add(this.flashlight.target);
    this.resize(); window.addEventListener('resize', this.resize); this.loadLevel(this.state.level); this.animate(0);
  }
  start() { this.running = true; this.audio.start(this.state.settings.sound); }
  pause(value: boolean) { this.running = !value; }
  setVolume(volume: number) { this.audio.setVolume(volume); }
  loadLevel(id: number) {
    this.state.level = id; this.scene.clear(); const level = levelFor(id); this.scene.background = new THREE.Color(level.palette.fog); this.scene.add(this.light);
    this.light.intensity = id === 6 ? .03 : .42; const overhead = new THREE.PointLight(level.palette.light, id === 6 ? .1 : 16, 15, 1.7); overhead.position.set(0, 4.25, 0); overhead.castShadow = true; this.scene.add(overhead);
    for (let x = -30; x <= 30; x += 20) for (let z = -30; z <= 30; z += 20) { const lamp = overhead.clone(); lamp.position.set(x, 4.25, z); lamp.intensity = Math.random() > .18 ? overhead.intensity : .25; this.scene.add(lamp); }
    addAtmosphere(this.scene, level.palette.fog); this.map = createMap(this.scene, level, id * 71 + 13); this.scene.add(this.stalker); this.stalker.position.set(-25, 0, -23); this.player.position.copy(this.map.spawn);
    this.options.onChange({ level: id, objective: level.objective, message: `${level.title}: ${level.subtitle}` });
  }
  dispose() { cancelAnimationFrame(this.frame); window.removeEventListener('resize', this.resize); this.player.dispose(); this.audio.dispose(); this.renderer.dispose(); }
  private animate = (time: number) => { this.frame = requestAnimationFrame(this.animate); const delta = Math.min(.05, (time - this.previous) / 1000 || 0); this.previous = time; if (this.running) this.update(delta, time); this.renderer.render(this.scene, this.player.camera); };
  private update(delta: number, time: number) {
    this.player.update(delta, (point) => !this.map?.solids.some((solid) => solid.clone().expandByScalar(.35).containsPoint(new THREE.Vector3(point.x, 1.5, point.z))));
    const sprinting = this.player.isSprinting && this.player.isMoving && this.state.stamina > 0; const stamina = THREE.MathUtils.clamp(this.state.stamina + (sprinting ? -24 : 15) * delta, 0, 100);
    const battery = this.flashlight.intensity ? Math.max(0, this.state.battery - delta * (this.state.level === 6 ? 2.4 : .55)) : this.state.battery;
    if (battery <= 0) this.flashlight.intensity = 0;
    if (this.player.isMoving && time - this.lastStep > (sprinting ? 270 : 460)) { this.lastStep = time; this.audio.footsteps(); }
    this.updateStalker(delta, time); this.floatItems(time); this.options.onChange({ stamina, battery, enemyNear: this.stalker.position.distanceTo(this.player.position) < 10 }); this.state.stamina = stamina; this.state.battery = battery;
    if (Math.random() < delta * .025 && time - this.lastMessage > 6000) { this.lastMessage = time; this.options.onChange({ message: Math.random() > .5 ? 'Something moved behind the wall.' : 'The fluorescent hum changes pitch.' }); }
  }
  private updateStalker(delta: number, time: number) {
    const distance = this.stalker.position.distanceTo(this.player.position); const lit = this.flashlight.intensity > 0 && distance < 7;
    if (distance < 16 && !lit) this.stalker.position.lerp(this.player.position, delta * .18);
    this.stalker.lookAt(this.player.position.x, this.stalker.position.y, this.player.position.z); this.stalker.children[0].position.y = 1.25 + Math.sin(time * .006) * .08;
    if (distance < 1.6 && time - this.lastHit > 900) { this.lastHit = time; const health = Math.max(0, this.state.health - 16); this.state.health = health; this.audio.scare(); this.options.onChange({ health, message: health ? 'RUN.' : 'THE STALKER FOUND YOU.' }); if (!health) window.setTimeout(() => { this.state.health = 100; this.options.onChange({ health: 100, message: 'You wake up where you started.' }); this.loadLevel(this.state.level); }, 1300); }
  }
  private floatItems(time: number) { this.map?.items.forEach((item, index) => { item.mesh.rotation.y += .012; item.mesh.position.y = Math.sin(time * .002 + index) * .08; }); }
  private interact() {
    if (!this.map) return; const item = this.nearestItem();
    if (item) { this.scene.remove(item.mesh); this.map.items = this.map.items.filter((entry) => entry.id !== item.id); const inventory = item.kind === 'switch' ? this.state.inventory : [...this.state.inventory, item.kind]; const battery = item.kind === 'battery' ? Math.min(100, this.state.battery + 40) : this.state.battery; const health = item.kind === 'medkit' ? Math.min(100, this.state.health + 30) : this.state.health; this.state.inventory = inventory; this.state.battery = battery; this.state.health = health; this.audio.tone(520, .15); this.options.onChange({ inventory, battery, health, message: item.kind === 'switch' ? 'Power restored. The exit is unlocked.' : `${item.kind.toUpperCase()} ACQUIRED` }); return; }
    if (this.map.exit.position.distanceTo(this.player.position) < 3.1) { this.audio.tone(740, .5); this.options.onExit(); }
  }
  private nearestItem(): Interactable & { mesh: THREE.Group; kind: 'battery' | 'key' | 'note' | 'medkit' | 'switch' } | undefined { const item = this.map?.items.map((entry) => ({ ...entry, label: `Take ${entry.kind}`, distance: entry.mesh.position.distanceTo(this.player.position) })).sort((a, b) => a.distance - b.distance)[0]; return item && item.distance < 2.1 ? item : undefined; }
  private toggleFlashlight() { if (!this.state.inventory.includes('flashlight') || !this.state.battery) return; this.flashlight.intensity = this.flashlight.intensity ? 0 : 14; this.audio.tone(this.flashlight.intensity ? 370 : 140, .07); }
  private resize = () => { const { clientWidth, clientHeight } = this.renderer.domElement; this.renderer.setSize(clientWidth, clientHeight, false); this.player.camera.aspect = clientWidth / clientHeight; this.player.camera.updateProjectionMatrix(); };
}
