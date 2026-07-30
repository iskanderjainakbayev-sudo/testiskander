import * as THREE from 'three';
import { AfterfallAudio } from './audio';
import { animateEnemy, makeEnemy, makeLoot, markEnemyHit, type AfterfallEnemy, type AfterfallLoot } from './entities';
import { WeaponViewModel } from './WeaponViewModel';
import { buildAfterfallWorld, type AfterfallEnvironment } from './worldBuilder';
import { createDefaultAfterfallSave, itemNames, type AfterfallHudSnapshot, type AfterfallItemId, type AfterfallSave, type AfterfallSettings, type AfterfallSnapshot } from './types';

type WorldOptions = { canvas: HTMLCanvasElement; save: AfterfallSave; onUpdate: (snapshot: AfterfallHudSnapshot) => void; onDefeat: () => void };
type InputKey = 'KeyW' | 'KeyA' | 'KeyS' | 'KeyD' | 'ShiftLeft' | 'ShiftRight' | 'KeyC';
const weather = ['Clear', 'Cloudy', 'Rain', 'Storm', 'Fog', 'Snow'] as const;

export class AfterfallWorld {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(72, 1, .1, 160);
  private readonly environment: AfterfallEnvironment;
  private readonly audio = new AfterfallAudio();
  private readonly weapon = new WeaponViewModel();
  private readonly keys = new Set<InputKey>();
  private readonly enemies: AfterfallEnemy[];
  private readonly loot: AfterfallLoot[];
  private readonly raycaster = new THREE.Raycaster();
  private readonly velocity = new THREE.Vector3();
  private snapshot: AfterfallSnapshot;
  private settings: AfterfallSettings;
  private frame = 0; private lastFrame = 0; private elapsed = 0; private weatherElapsed = 0; private publishedAt = 0;
  private yaw = 0; private pitch = 0; private running = false; private reloadingUntil = 0; private reloadStartedAt = 0; private lastShot = 0;
  private toast: string | null = 'You reached Hollow Creek. Search the hospital for the relay key.'; private toastUntil = 7;

  constructor(private readonly options: WorldOptions) {
    this.snapshot = structuredClone(options.save.snapshot); this.settings = options.save.settings;
    this.renderer = new THREE.WebGLRenderer({ canvas: options.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.shadowMap.enabled = true;
    this.environment = buildAfterfallWorld(this.scene); this.camera.position.set(this.snapshot.position.x, this.snapshot.position.y, this.snapshot.position.z);
    this.scene.add(this.camera); this.camera.add(this.weapon.group);
    this.enemies = [['raider-a', 'Scavenger', -10, -6, false], ['raider-b', 'Scavenger', 13, -18, false], ['stalker', 'Feral Stalker', -36, 5, true], ['raider-c', 'Scavenger', 35, -28, false]].map(([id, label, x, z, special]) => makeEnemy(String(id), String(label), Number(x), Number(z), Boolean(special)));
    this.loot = [['water-cache', 'water', 2, -3, 25], ['cloth-locker', 'cloth', 2, -16, -14], ['hospital-key', 'signal-key', 1, -26, -17], ['food-van', 'canned-food', 2, 10, 6], ['ammo-depot', 'ammo', 8, 30, -26], ['scrap-yard', 'scrap', 3, 27, -31]].map(([id, item, amount, x, z]) => makeLoot(String(id), item as AfterfallItemId, Number(amount), Number(x), Number(z)));
    this.scene.add(...this.enemies.map((entry) => entry.mesh), ...this.loot.map((entry) => entry.mesh));
    this.applySavedWorld(); this.setSettings(this.settings); this.bind(); this.resize(); this.animate(0);
  }

  async start() { await this.audio.unlock(); this.audio.setVolume(this.settings.masterVolume); this.running = true; this.lastFrame = performance.now(); this.options.canvas.requestPointerLock(); }
  pause(value: boolean) { this.running = !value; if (!value) this.lastFrame = performance.now(); }
  dispose() { cancelAnimationFrame(this.frame); this.unbind(); this.weapon.dispose(); this.audio.dispose(); this.renderer.dispose(); }
  setSettings(settings: AfterfallSettings) { this.settings = settings; this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.quality === 'performance' ? 1 : settings.quality === 'cinematic' ? 2 : 1.5)); this.renderer.shadowMap.enabled = settings.quality !== 'performance'; this.audio.setVolume(settings.masterVolume); }
  getSave(): AfterfallSave { return { version: 1, savedAt: Date.now(), settings: this.settings, snapshot: { ...this.snapshot, position: { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z } } }; }
  restart() { const fresh = createDefaultAfterfallSave(); this.snapshot = fresh.snapshot; this.camera.position.set(-4, 1.7, 34); this.toast = 'Field save restored at the campfire.'; this.toastUntil = this.elapsed + 4; }

  craft(recipe: 'bandage' | 'medkit' | 'fire') {
    const items = this.snapshot.inventory;
    if (recipe === 'bandage' && items.cloth >= 2) { items.cloth -= 2; items.bandage += 1; this.notice('Bandage crafted.'); }
    else if (recipe === 'medkit' && items.cloth >= 2 && items.scrap >= 1) { items.cloth -= 2; items.scrap -= 1; items.medkit += 1; this.notice('Field medkit crafted.'); }
    else if (recipe === 'fire' && items.scrap >= 2) { items.scrap -= 2; this.snapshot.energy = Math.min(100, this.snapshot.energy + 32); this.snapshot.temperature = Math.min(22, this.snapshot.temperature + 4); this.notice('A small campfire restores your warmth.'); }
    else this.notice('Not enough materials.');
    this.audio.click('craft');
  }

  useItem(item: 'water' | 'canned-food' | 'bandage' | 'medkit') {
    if (this.snapshot.inventory[item] < 1) return this.notice(`No ${itemNames[item].toLowerCase()} in your pack.`);
    this.snapshot.inventory[item] -= 1;
    if (item === 'water') this.snapshot.thirst = Math.min(100, this.snapshot.thirst + 36);
    if (item === 'canned-food') this.snapshot.hunger = Math.min(100, this.snapshot.hunger + 30);
    if (item === 'bandage') this.snapshot.health = Math.min(100, this.snapshot.health + 22);
    if (item === 'medkit') { this.snapshot.health = Math.min(100, this.snapshot.health + 55); this.snapshot.energy = Math.min(100, this.snapshot.energy + 12); }
    this.notice(`${itemNames[item]} used.`); this.audio.click('loot');
  }

  private bind() { window.addEventListener('resize', this.resize); window.addEventListener('keydown', this.keyDown); window.addEventListener('keyup', this.keyUp); window.addEventListener('mousemove', this.mouseMove); window.addEventListener('mousedown', this.mouseDown); }
  private unbind() { window.removeEventListener('resize', this.resize); window.removeEventListener('keydown', this.keyDown); window.removeEventListener('keyup', this.keyUp); window.removeEventListener('mousemove', this.mouseMove); window.removeEventListener('mousedown', this.mouseDown); }
  private keyDown = (event: KeyboardEvent) => { if (!this.running) return; if (event.code === 'KeyR') { this.reload(); return; } if (event.code === 'KeyE') { this.interact(); return; } if (event.code === 'Escape') { this.running = false; return; } if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 'KeyC'].includes(event.code)) this.keys.add(event.code as InputKey); };
  private keyUp = (event: KeyboardEvent) => { this.keys.delete(event.code as InputKey); };
  private mouseMove = (event: MouseEvent) => { if (this.running && document.pointerLockElement === this.options.canvas) { const scale = .00165 * this.settings.sensitivity; this.yaw -= event.movementX * scale; this.pitch = THREE.MathUtils.clamp(this.pitch - event.movementY * scale, -1.28, 1.28); } };
  private mouseDown = () => { if (!this.running) return; if (document.pointerLockElement !== this.options.canvas) { this.options.canvas.requestPointerLock(); return; } this.fire(); };

  private animate = (time: number) => { this.frame = requestAnimationFrame(this.animate); const delta = Math.min(.05, (time - this.lastFrame) / 1000 || 0); this.lastFrame = time; if (this.running) this.update(delta); this.renderer.render(this.scene, this.camera); };
  private update(delta: number) {
    this.elapsed += delta; this.updatePlayer(delta); this.updateWeapon(delta); this.updateSurvival(delta); this.updateWorld(delta); this.updateEnemies(delta); this.updateWeather(delta);
    if (this.elapsed - this.publishedAt > .11) { this.publishedAt = this.elapsed; this.options.onUpdate(this.hud()); }
    if (this.snapshot.health <= 0) { this.running = false; document.exitPointerLock(); this.options.onDefeat(); }
  }
  private updatePlayer(delta: number) {
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); const right = new THREE.Vector3(forward.z, 0, -forward.x);
    this.velocity.set(0, 0, 0); if (this.keys.has('KeyW')) this.velocity.add(forward); if (this.keys.has('KeyS')) this.velocity.sub(forward); if (this.keys.has('KeyD')) this.velocity.add(right); if (this.keys.has('KeyA')) this.velocity.sub(right);
    const crouching = this.keys.has('KeyC'); const sprinting = (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) && this.snapshot.energy > 5 && !crouching && this.velocity.lengthSq() > 0;
    if (this.velocity.lengthSq()) this.velocity.normalize().multiplyScalar((sprinting ? 7.7 : crouching ? 2.2 : 4.4) * delta); this.camera.position.add(this.velocity);
    this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x, -84, 78); this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, -87, 85); this.camera.position.y = crouching ? 1.1 : 1.7;
    if (sprinting) this.snapshot.energy = Math.max(0, this.snapshot.energy - delta * 8); else this.snapshot.energy = Math.min(100, this.snapshot.energy + delta * (crouching ? 3 : 4.8));
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
  private updateWeapon(delta: number) {
    const reloadProgress = this.elapsed < this.reloadingUntil ? (this.elapsed - this.reloadStartedAt) / 1.35 : 0;
    this.weapon.setReloadProgress(reloadProgress);
    this.weapon.update(delta, this.velocity.lengthSq() > 0, this.keys.has('KeyC'));
  }
  private updateSurvival(delta: number) { this.snapshot.hunger = Math.max(0, this.snapshot.hunger - delta * .13); this.snapshot.thirst = Math.max(0, this.snapshot.thirst - delta * .2); if (this.snapshot.hunger < 12 || this.snapshot.thirst < 10) this.snapshot.health = Math.max(0, this.snapshot.health - delta * .75); this.snapshot.playtimeSeconds += delta; this.snapshot.timeMinutes = (this.snapshot.timeMinutes + delta * 3.5) % 1440; }
  private updateWorld(delta: number) { for (const loot of this.loot) if (!loot.taken) { loot.mesh.rotation.y += delta; loot.mesh.children[1].position.y = .76 + Math.sin(this.elapsed * 2 + loot.mesh.position.x) * .05; } }
  private updateEnemies(delta: number) {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const distance = enemy.mesh.position.distanceTo(this.camera.position);
      const moving = distance < 27 && distance > 1.6;
      if (distance < 27) {
        const direction = this.camera.position.clone().sub(enemy.mesh.position); direction.y = 0;
        if (moving) enemy.mesh.position.addScaledVector(direction.normalize(), enemy.speed * delta);
        enemy.mesh.rotation.y = Math.atan2(direction.x, direction.z);
      }
      const attacking = distance < 2.1 && this.elapsed + .23 > enemy.attackAt;
      animateEnemy(enemy, this.elapsed, moving, attacking);
      if (distance < 2.1 && this.elapsed > enemy.attackAt) { enemy.attackAt = this.elapsed + 1.1; this.snapshot.health = Math.max(0, this.snapshot.health - enemy.damage); this.notice(`${enemy.label} hit you — patch up soon.`); this.audio.click('hit'); }
    }
  }
  private updateWeather(delta: number) { const phase = this.snapshot.timeMinutes / 1440; const day = Math.sin((phase - .25) * Math.PI * 2) * .5 + .5; const kind = weather[this.snapshot.weatherIndex]; this.environment.sun.intensity = .15 + day * 2.8; this.environment.moon.intensity = .08 + (1 - day) * .65; this.environment.rain.visible = kind === 'Rain' || kind === 'Storm'; this.environment.snow.visible = kind === 'Snow'; this.environment.rain.position.y = 11 + Math.sin(this.elapsed) * .4; this.environment.snow.position.y = 9 + Math.sin(this.elapsed * .3); if (kind === 'Storm' && Math.floor(this.elapsed) % 21 === 0 && Math.sin(this.elapsed * 5) > .96) this.audio.click('thunder'); if (kind === 'Snow') this.snapshot.temperature = THREE.MathUtils.lerp(this.snapshot.temperature, -4, delta * .06); else this.snapshot.temperature = THREE.MathUtils.lerp(this.snapshot.temperature, day > .45 ? 17 : 8, delta * .05); this.weatherElapsed += delta; if (this.weatherElapsed > 95) { this.snapshot.weatherIndex = (this.snapshot.weatherIndex + 1) % weather.length; this.weatherElapsed = 0; this.notice(`Weather shift: ${weather[this.snapshot.weatherIndex]}.`); } }
  private fire() { if (this.elapsed < this.lastShot || this.elapsed < this.reloadingUntil) return; if (this.snapshot.ammo < 1) return this.notice('Magazine empty — press R to reload.'); this.lastShot = this.elapsed + .18; this.snapshot.ammo -= 1; this.weapon.fire(); this.audio.click('shot'); this.raycaster.setFromCamera(new THREE.Vector2(), this.camera); const hits = this.raycaster.intersectObjects(this.enemies.filter((enemy) => enemy.alive).map((enemy) => enemy.mesh), true); const id = hits[0]?.object.userData.enemyId as string | undefined; const enemy = this.enemies.find((entry) => entry.id === id); if (!enemy) return; markEnemyHit(enemy, this.elapsed); enemy.health -= 18; if (enemy.health > 0) return this.notice(`${enemy.label} wounded.`); enemy.alive = false; this.scene.remove(enemy.mesh); this.snapshot.enemiesDefeated += 1; this.snapshot.inventory.scrap += 1; this.notice(`${enemy.label} down. Salvaged scrap.`); }
  private reload() { if (this.snapshot.reserveAmmo < 1 || this.snapshot.ammo >= 8 || this.elapsed < this.reloadingUntil) return; this.reloadStartedAt = this.elapsed; this.reloadingUntil = this.elapsed + 1.35; window.setTimeout(() => { const needed = 8 - this.snapshot.ammo; const amount = Math.min(needed, this.snapshot.reserveAmmo); this.snapshot.ammo += amount; this.snapshot.reserveAmmo -= amount; this.notice('Magazine reloaded.'); }, 1350); }
  private interact() { const nearby = this.loot.find((entry) => !entry.taken && entry.mesh.position.distanceTo(this.camera.position) < 2.7); if (nearby) { nearby.taken = true; this.scene.remove(nearby.mesh); this.snapshot.inventory[nearby.item] += nearby.amount; if (nearby.item === 'ammo') this.snapshot.reserveAmmo += nearby.amount; this.snapshot.lootCollected += 1; if (nearby.item === 'signal-key') this.snapshot.questStep = Math.max(1, this.snapshot.questStep); this.notice(`Recovered ${nearby.amount}× ${itemNames[nearby.item]}.`); this.audio.click('loot'); return; }
    if (this.camera.position.distanceTo(new THREE.Vector3(-5, 0, 29)) < 3.2) { this.snapshot.energy = Math.min(100, this.snapshot.energy + 22); this.snapshot.temperature = Math.max(this.snapshot.temperature, 17); this.notice('You rest by the fire.'); }
  }
  private hud(): AfterfallHudSnapshot { const position = this.camera.position; const currentWeather = weather[this.snapshot.weatherIndex]; const hour = Math.floor(this.snapshot.timeMinutes / 60); const minute = Math.floor(this.snapshot.timeMinutes % 60); const nearLoot = this.loot.find((entry) => !entry.taken && entry.mesh.position.distanceTo(position) < 2.7); const atFire = position.distanceTo(new THREE.Vector3(-5, 0, 29)) < 3.2; const objective = this.snapshot.questStep === 0 ? 'Search St. Arlo Hospital for the emergency relay key.' : this.snapshot.enemiesDefeated < 2 ? 'Clear a path through Hollow Creek and reach the highway relay.' : 'Reach the evacuation relay beyond the rail yard.'; return { ...this.snapshot, location: locationFor(position), weather: currentWeather, timeLabel: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`, objective, nearbyThreats: this.enemies.filter((enemy) => enemy.alive && enemy.mesh.position.distanceTo(position) < 34).length, prompt: nearLoot ? `E · Search ${itemNames[nearLoot.item]}` : atFire ? 'E · Warm yourself at the campfire' : null, toast: this.elapsed < this.toastUntil ? this.toast : null, isReloading: this.elapsed < this.reloadingUntil, isCrouching: this.keys.has('KeyC') }; }
  private applySavedWorld() { this.loot.slice(0, Math.min(this.snapshot.lootCollected, this.loot.length)).forEach((entry) => { entry.taken = true; this.scene.remove(entry.mesh); }); this.enemies.slice(0, Math.min(this.snapshot.enemiesDefeated, this.enemies.length)).forEach((entry) => { entry.alive = false; this.scene.remove(entry.mesh); }); }
  private notice(text: string) { this.toast = text; this.toastUntil = this.elapsed + 3.2; }
  private resize = () => { const { clientWidth: width, clientHeight: height } = this.options.canvas; this.renderer.setSize(Math.max(1, width), Math.max(1, height), false); this.camera.aspect = width / Math.max(1, height); this.camera.updateProjectionMatrix(); };
}

function locationFor(position: THREE.Vector3) { if (position.x < -9 && position.z < 6) return 'ST. ARLO HOSPITAL'; if (position.z > 16) return 'HOLLOW CREEK CAMP'; if (position.x > 19 && position.z < -12) return 'FREIGHT YARD'; if (position.x > 4) return 'NORTH CHECKPOINT'; return 'OLD HIGHWAY'; }
