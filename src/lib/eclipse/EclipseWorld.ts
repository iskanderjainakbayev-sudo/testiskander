import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { EclipseAudio } from './audio';
import { EclipseCombat } from './combat';
import { createEncounters, summonWarden, type EclipseEncounters } from './encounters';
import { loadDecorationLayout } from './layout';
import { makeCompanion, makeRunner } from './models';
import { EclipsePlayer, type PlayerAction, type PlayerFrame } from './player';
import { regionAt } from './regions';
import { EclipseSession } from './session';
import type { GameSettings } from './types';
import { addLayoutDecorations } from './decorations';
import { buildWorld, updateEnvironment, type WorldEnvironment } from './world';
import { collectNearbyResources, interactionPrompt, updateMobilityVisuals, useGrapple } from './worldBehaviors';
import type { EclipseWorldOptions, EclipseWorldSnapshot } from './worldTypes';
export type { EclipseWorldSnapshot } from './worldTypes';

export class EclipseWorld {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(52, 1, .1, 270);
  private readonly composer: EffectComposer;
  private readonly bloom: UnrealBloomPass;
  private readonly environment: WorldEnvironment;
  private readonly runner = makeRunner();
  private readonly player = new EclipsePlayer(this.runner);
  private readonly companion = makeCompanion();
  private readonly audio = new EclipseAudio();
  private readonly session: EclipseSession;
  private readonly encounters: EclipseEncounters;
  private readonly combat: EclipseCombat;
  private frame = 0; private lastFrame = 0; private elapsed = 0; private lastPublish = 0;
  private running = false; private toast: string | null = null; private toastUntil = 0;
  private currentFrame: PlayerFrame | null = null;
  private latestRegion = regionAt(new THREE.Vector3());

  constructor(private options: EclipseWorldOptions) {
    this.session = new EclipseSession(options.snapshot);
    this.renderer = new THREE.WebGLRenderer({ canvas: options.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.environment = buildWorld(this.scene);
    this.scene.add(this.runner, this.companion);
    this.runner.position.set(options.snapshot.position.x, 0, options.snapshot.position.z);
    this.companion.visible = this.session.beaconOnline;
    this.encounters = createEncounters(this.scene);
    this.encounters.resources.forEach((resource) => {
      if (this.session.flags.has(`resource:${resource.id}`)) { resource.taken = true; this.scene.remove(resource.mesh); }
    });
    if (this.session.beaconOnline && !this.session.wardenDefeated) summonWarden(this.scene, this.encounters.enemies);
    this.combat = new EclipseCombat(this.scene, this.encounters.enemies);
    this.camera.position.set(8, 11, 16);
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .68, .55, .7);
    this.composer.addPass(this.bloom);
    this.setSettings(options.settings);
    void loadDecorationLayout().then((points) => addLayoutDecorations(this.scene, points));
    window.addEventListener('resize', this.resize);
    this.resize();
    this.animate(0);
  }

  async start() { await this.audio.unlock(); this.audio.play('click'); this.running = true; this.player.setEnabled(true); this.lastFrame = performance.now(); }
  pause(value: boolean) { this.running = !value; this.player.setEnabled(!value); if (!value) this.lastFrame = performance.now(); }
  restart() { this.session.health = this.session.maxHealth; this.runner.position.set(0, 0, 0); this.setToast('Runner link restored at Neon Refuge.'); this.pause(false); }
  craft(recipeId: string) {
    if (recipeId === 'tonic' && this.session.craftTonic()) { this.audio.play('beacon'); this.setToast('Lumen tonic fabricated — vitality restored.'); return; }
    this.setToast(recipeId === 'tonic' ? 'Need 2 shards and missing vitality to craft.' : 'That schematic is not recovered yet.');
  }
  setSettings(settings: GameSettings) {
    const pixelRatio = settings.graphicsQuality === 'performance' ? 1 : settings.graphicsQuality === 'cinematic' ? 2 : 1.5;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatio));
    this.bloom.strength = settings.graphicsQuality === 'performance' ? 0 : settings.graphicsQuality === 'cinematic' ? 1 : .68;
    this.renderer.shadowMap.enabled = settings.graphicsQuality !== 'performance';
    this.audio.setVolume(settings.masterVolume * settings.effectsVolume);
  }
  getSaveSnapshot() { return this.session.toSnapshot(this.runner.position, this.latestRegion.id); }
  dispose() { cancelAnimationFrame(this.frame); this.player.dispose(); this.audio.dispose(); window.removeEventListener('resize', this.resize); this.composer.dispose(); this.renderer.dispose(); }
  private animate = (time: number) => {
    this.frame = requestAnimationFrame(this.animate);
    const delta = Math.min(.045, (time - this.lastFrame) / 1000 || 0);
    this.lastFrame = time;
    if (this.running) this.update(delta);
    this.composer.render();
  };
  private update(delta: number) {
    this.elapsed += delta;
    this.session.playtime += delta;
    const frame = this.player.update(delta);
    this.currentFrame = frame;
    this.handleActions(this.player.consumeActions(), frame);
    collectNearbyResources(this.scene, this.encounters, frame, this.session, this.audio, this.elapsed, (message) => this.setToast(message));
    updateMobilityVisuals(this.encounters, this.runner, this.companion, frame, this.session);
    this.latestRegion = regionAt(frame.position);
    this.session.discover(this.latestRegion.id);
    const weather = this.weather();
    updateEnvironment(this.environment, this.elapsed, weather);
    const followPosition = new THREE.Vector3(frame.position.x + 8, frame.position.y + 11, frame.position.z + 16);
    this.camera.position.lerp(followPosition, Math.min(1, delta * 3));
    this.camera.lookAt(frame.position.x, frame.position.y + 1.2, frame.position.z - 1);
    const damage = this.combat.update(delta, this.elapsed, frame);
    if (damage > 0) { this.session.takeDamage(damage); this.audio.play('hurt'); }
    this.handleCombatEvents();
    this.updateInteraction(frame);
    if (this.session.health <= 0) { this.pause(true); this.options.onOutcome('defeat'); }
    if (this.elapsed - this.lastPublish > .1) { this.lastPublish = this.elapsed; this.options.onUpdate(this.snapshot(frame)); }
  }
  private handleActions(actions: PlayerAction[], frame: PlayerFrame) {
    actions.forEach((action) => {
      if (action === 'interact') this.interact();
      else if (action === 'grapple') this.grapple(frame);
      else if (action === 'vehicle') this.toggleVehicle();
      else if (action === 'pulse' && !this.session.beaconOnline) this.setToast('Eclipse Pulse unlocks with the Beacon.');
      else { this.combat.perform(action, frame, this.elapsed); this.audio.play(action === 'attack' ? 'attack' : action === 'pulse' ? 'beacon' : 'enemy'); }
    });
  }
  private interact() {
    if (this.encounters.beacon.position.distanceTo(this.runner.position) < 2.9 && this.session.activateBeacon()) {
      summonWarden(this.scene, this.encounters.enemies);
      this.companion.visible = true;
      this.audio.play('beacon');
      this.setToast('Beacon online — Astra marks the Warden at Sky Breach.');
    } else if (!this.currentFrame?.mounted && this.encounters.hoverbike.position.distanceTo(this.runner.position) < 3.2) this.toggleVehicle();
    else this.setToast(this.session.shards < 6 ? `Beacon needs ${6 - this.session.shards} more Lunar Shards.` : 'No compatible signal nearby.');
  }
  private grapple(frame: PlayerFrame) { useGrapple(this.encounters, this.player, frame, this.audio, (message) => this.setToast(message)); }
  private toggleVehicle() {
    if (this.currentFrame?.mounted) { this.player.setMounted(false); this.setToast('Hoverbike parked.'); return; }
    if (this.encounters.hoverbike.position.distanceTo(this.runner.position) < 3.2) { this.player.setMounted(true); this.setToast('Hoverbike linked — sprint speed increased.'); }
    else this.setToast('Find the hoverbike at Neon Refuge.');
  }
  private handleCombatEvents() {
    this.combat.drainEvents().forEach((event) => {
      if (event.type === 'defeat' && event.enemy) { this.session.addExperience(event.enemy.xp); this.session.alloy += 1; this.audio.play('enemy'); }
      if (event.type === 'boss') { this.session.defeatWarden(); this.session.addExperience(250); this.audio.play('victory'); this.pause(true); this.options.onOutcome('victory'); }
      this.setToast(event.text);
    });
  }
  private updateInteraction(frame: PlayerFrame) { this.toast = interactionPrompt(this.encounters, frame, this.session) ?? (this.toastUntil < this.elapsed ? null : this.toast); }
  private snapshot(frame: PlayerFrame): EclipseWorldSnapshot {
    const boss = this.combat.getBoss();
    return { health: this.session.health, maxHealth: this.session.maxHealth, stamina: frame.stamina, maxStamina: 100, level: this.session.level, xp: this.session.xp % 100, xpToNextLevel: 100, shards: this.session.shards, alloy: this.session.alloy, region: this.latestRegion.name, weather: this.weather(), timeLabel: this.timeLabel(), objective: this.session.objective, enemies: this.encounters.enemies.filter((enemy) => enemy.alive && enemy.mesh.position.distanceTo(frame.position) < 26).length, quest: this.session.quest, interaction: this.toast?.startsWith('Press') ? this.toast.replace('Press E to ', '') : null, toast: this.toast?.startsWith('Press') ? null : this.toast, boss: boss ? { name: 'Eclipse Warden', health: Math.max(0, boss.health), maxHealth: boss.maxHealth, phase: boss.phase } : null, weaponName: 'Starfall Blade', ammo: this.session.beaconOnline ? 8 : 4, reserveAmmo: 12, abilityReady: this.session.beaconOnline };
  }
  private weather() { return ['Clear Eclipse', 'Ion Rain', 'Stardust Fog'][Math.floor(this.elapsed / 26) % 3]; }
  private timeLabel() { const hour = Math.floor((18 + this.elapsed * .35) % 24); return `${String(hour).padStart(2, '0')}:00`; }
  private setToast(message: string) { this.toast = message; this.toastUntil = this.elapsed + 3.4; }
  private resize = () => { const { clientWidth, clientHeight } = this.renderer.domElement; this.renderer.setSize(clientWidth, clientHeight, false); this.composer.setSize(clientWidth, clientHeight); this.camera.aspect = clientWidth / Math.max(clientHeight, 1); this.camera.updateProjectionMatrix(); };
}
