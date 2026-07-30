import * as THREE from "three";
import { Atmosphere } from "./atmosphere";
import type { WeaponFinish } from "./armory";
import { addEnemies, type Enemy, updateEnemies } from "./enemies";
import { LevelManager } from "./levelManager";
import { TacticalMap } from "./maps/TacticalMap";
import { createJumpState, movePlayer } from "./playerMotion";
import { ProjectileSystem } from "./projectiles";
import { Rifle } from "./rifle";
import { TacticalAudio } from "./sound";
import type { ShooterWorldOptions } from "./types";
import { WeaponViewModel } from "./weapons/WeaponViewModel";
import { ShooterInput } from "./worldInput";
import { createWorldSnapshot } from "./worldSnapshot";

const maxHealth = 160;

export class ShooterWorld {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(72, 1, 0.1, 140);
  private readonly enemies: Enemy[];
  private readonly input: ShooterInput;
  private readonly shots: ProjectileSystem;
  private readonly rifle = new Rifle();
  private readonly weaponView: WeaponViewModel;
  private readonly audio = new TacticalAudio();
  private readonly map: TacticalMap;
  private readonly levelManager: LevelManager;
  private readonly atmosphere: Atmosphere;
  private readonly jump = createJumpState();
  private frame = 0;
  private previous = 0;
  private score = 0;
  private health = maxHealth;
  private nextDamage = 0;
  private running = false;
  constructor(private readonly options: ShooterWorldOptions) {
    this.renderer = new THREE.WebGLRenderer({
      canvas: options.canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
    this.renderer.shadowMap.enabled = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.camera.rotation.order = "YXZ";
    this.scene.add(this.camera);
    this.weaponView = new WeaponViewModel(this.camera);
    this.map = new TacticalMap(this.scene, options.mapId);
    this.atmosphere = new Atmosphere(this.scene);
    this.enemies = addEnemies(this.scene, 9);
    this.levelManager = new LevelManager(this.enemies);
    this.shots = new ProjectileSystem(this.scene);
    this.input = new ShooterInput({
      renderer: this.renderer,
      camera: this.camera,
      isRunning: () => this.running,
      onAction: this.handleAction,
    });
    this.animate(0);
  }
  start(missionId = 1) {
    this.audio.unlock();
    this.score = 0;
    this.health = maxHealth;
    this.input.firing = false;
    this.input.aiming = false;
    this.camera.fov = 72;
    this.camera.updateProjectionMatrix();
    this.rifle.reset();
    this.weaponView.equip(this.rifle.definition);
    const spawn = this.map.definition.spawnPoints[0];
    this.camera.position.set(...spawn.position);
    this.camera.rotation.set(-0.04, spawn.facing, 0);
    this.levelManager.start(missionId);
    this.atmosphere.setMission(this.levelManager.current);
    this.atmosphere.setWeather(this.map.definition.weather);
    this.shots.clear();
    this.running = true;
    this.emit();
  }
  pause(value: boolean) {
    this.running = !value;
    this.input.firing = false;
    this.input.aiming = false;
    this.previous = performance.now();
  }
  dispose() {
    cancelAnimationFrame(this.frame);
    this.renderer.dispose();
    this.atmosphere.dispose();
    this.audio.dispose();
    this.input.dispose();
  }
  private animate = (time: number) => {
    this.frame = requestAnimationFrame(this.animate);
    const delta = Math.min(0.04, (time - this.previous) / 1000 || 0);
    this.previous = time;
    if (this.running) this.update(delta, time);
    this.renderer.render(this.scene, this.camera);
  };
  private update(delta: number, time: number) {
    movePlayer(this.camera, this.input.keys, delta, this.jump, this.map.definition.surfaces, this.map.collision, this.map.definition.climbables, this.map.definition.bounds);
    this.updateAim(delta);
    this.map.update(delta);
    this.atmosphere.update(delta, time, this.camera.position);
    updateEnemies(this.enemies, this.camera, delta, time, this.enemyShot);
    this.shots.update(delta, this.camera.position, this.takeDamage);
    if (this.input.firing || this.rifle.isBursting) {
      const shot = this.rifle.fire(time, this.camera, this.enemies, this.shots, this.map.breakableGlass, this.map.breakGlass, this.input.aiming);
      if (shot.fired) {
        this.audio.shot();
        this.weaponView.fire(this.rifle.definition, time);
      }
      if (shot.killed) { this.score += 100; this.audio.hit(); }
    }
    this.rifle.update(time);
    this.weaponView.update(time);
    if (this.levelManager.advance(time)) {
      this.running = false;
      this.options.onUpdate({ ...this.snapshot(), gameComplete: true });
      return;
    }
    this.emit();
    if (this.health <= 0) {
      this.running = false;
      this.options.onUpdate({ ...this.snapshot(), health: 0, gameOver: true });
    }
  }
  private enemyShot = (enemy: Enemy) => {
    const origin = enemy.model.muzzle.getWorldPosition(new THREE.Vector3());
    const aim = new THREE.Vector3(
      (Math.random() - 0.5) * 0.55,
      (Math.random() - 0.5) * 0.35,
      (Math.random() - 0.5) * 0.55,
    );
    this.shots.add(
      origin,
      this.camera.position.clone().add(aim).sub(origin).normalize(),
      true,
    );
  };
  private takeDamage = () => {
    if (performance.now() > this.nextDamage) {
      this.health = Math.max(0, this.health - 10);
      this.audio.damage();
      this.nextDamage = performance.now() + 260;
    }
  };
  private snapshot() {
    const snapshot = createWorldSnapshot({ score: this.score, health: this.health, maxHealth, enemies: this.enemies, rifle: this.rifle, levelManager: this.levelManager });
    return { ...snapshot, isAiming: this.input.aiming, mapName: this.map.definition.name, mapSubtitle: this.map.definition.subtitle };
  }
  private emit() {
    this.options.onUpdate(this.snapshot());
  }
  private handleAction = (key: string) => {
    if (key === "r" && this.rifle.reload()) {
      this.audio.reload();
      this.weaponView.reload(performance.now(), this.rifle.definition.stats.reloadTime);
    }
    if (key === "f") this.weaponView.inspect(performance.now());
    if (key === "v") {
      const result = this.rifle.melee(performance.now(), this.camera, this.enemies);
      this.weaponView.melee(performance.now());
      if (result.hit) this.audio.melee();
      if (result.killed) { this.score += 125; this.audio.hit(); }
    }
    if (key === "e") this.map.toggleNearestDoor(this.camera);
    const slot = key === "0" ? 10 : Number(key);
    if (Number.isInteger(slot) && slot > 0 && this.rifle.select(slot)) this.weaponView.equip(this.rifle.definition);
  };
  private updateAim(delta: number) {
    this.weaponView.setAiming(this.input.aiming, delta);
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, this.input.aiming ? 56 : 72, 14, delta);
    this.camera.updateProjectionMatrix();
  }
  setQuality(quality: "balanced" | "high") {
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, quality === "high" ? 1.7 : 1));
  }
  setMasterVolume(volume: number) { this.audio.setVolume(volume); }
  setWeaponFinish(finish: WeaponFinish) {
    this.weaponView.setFinish(finish);
    this.weaponView.equip(this.rifle.definition);
  }
}
