import * as THREE from "three";
import { hitEnemy, type Enemy } from "./enemies";
import { ProjectileSystem } from "./projectiles";
import { getWeapon, weaponCatalog, type WeaponDefinition } from "./weapons/weaponCatalog";
type FireResult = { fired: boolean; killed: boolean };
type MeleeResult = { hit: boolean; killed: boolean };
export class Rifle {
  private readonly raycaster = new THREE.Raycaster();
  private ammo = getWeapon(1).stats.magazine;
  private reserveAmmo = getWeapon(1).stats.reserve;
  private reloadingUntil = 0;
  private lastShot = 0;
  private weaponSlot = 1;
  private burstRemaining = 0;
  private nextBurstShot = 0;
  private lastMelee = 0;
  reset() {
    this.weaponSlot = 1;
    this.ammo = this.weapon.stats.magazine;
    this.reserveAmmo = this.weapon.stats.reserve;
    this.reloadingUntil = 0;
    this.burstRemaining = 0;
  }
  update(time: number) {
    if (!this.reloadingUntil || time < this.reloadingUntil) return;
    const loaded = Math.min(this.weapon.stats.magazine - this.ammo, this.reserveAmmo);
    this.ammo += loaded;
    this.reserveAmmo -= loaded;
    this.reloadingUntil = 0;
  }
  fire(time: number, camera: THREE.Camera, enemies: Enemy[], shots: ProjectileSystem, glass: THREE.Object3D[], breakGlass: (object: THREE.Object3D) => void, aiming: boolean): FireResult {
    if (this.reloadingUntil) return { fired: false, killed: false };
    if (this.burstRemaining) return this.fireBurstRound(time, camera, enemies, shots, glass, breakGlass, aiming);
    if (time - this.lastShot < this.weapon.stats.fireDelay) return { fired: false, killed: false };
    if (!this.ammo) {
      this.reload();
      return { fired: false, killed: false };
    }
    this.lastShot = time;
    if (this.weapon.stats.fireMode === "BURST") {
      this.burstRemaining = Math.min(2, this.ammo - 1);
      this.nextBurstShot = time + 78;
    }
    return this.fireRound(camera, enemies, shots, glass, breakGlass, aiming);
  }

  reload() {
    if (!this.reloadingUntil && this.ammo < this.weapon.stats.magazine && this.reserveAmmo) {
      this.reloadingUntil = performance.now() + this.weapon.stats.reloadTime;
      this.burstRemaining = 0;
      return true;
    }
    return false;
  }

  select(slot: number) {
    if (slot === this.weaponSlot || slot < 1 || slot > weaponCatalog.length) return false;
    this.weaponSlot = slot;
    this.ammo = this.weapon.stats.magazine;
    this.reserveAmmo = this.weapon.stats.reserve;
    this.reloadingUntil = 0;
    this.burstRemaining = 0;
    return true;
  }

  snapshot() {
    return { ammo: this.ammo, reserveAmmo: this.reserveAmmo, isReloading: Boolean(this.reloadingUntil), weapon: this.weapon.name, fireMode: this.weapon.stats.fireMode };
  }

  get definition(): WeaponDefinition { return this.weapon; }
  get isBursting() { return this.burstRemaining > 0; }
  melee(time: number, camera: THREE.Camera, enemies: Enemy[]): MeleeResult {
    if (time - this.lastMelee < 620) return { hit: false, killed: false };
    this.lastMelee = time;
    this.raycaster.setFromCamera(new THREE.Vector2(), camera);
    const targets = enemies.filter((enemy) => enemy.model.group.visible).map((enemy) => enemy.model.group);
    const impact = this.raycaster.intersectObjects(targets, true).find((item) => item.distance < 3.2);
    if (!impact) return { hit: false, killed: false };
    return { hit: true, killed: hitEnemy(enemies, impact.object, 3) };
  }
  private get weapon() { return getWeapon(this.weaponSlot); }

  private fireBurstRound(time: number, camera: THREE.Camera, enemies: Enemy[], shots: ProjectileSystem, glass: THREE.Object3D[], breakGlass: (object: THREE.Object3D) => void, aiming = false): FireResult {
    if (time < this.nextBurstShot) return { fired: false, killed: false };
    if (!this.ammo) {
      this.burstRemaining = 0;
      this.reload();
      return { fired: false, killed: false };
    }
    this.burstRemaining -= 1;
    this.nextBurstShot = time + 78;
    if (!this.burstRemaining) this.lastShot = time;
    return this.fireRound(camera, enemies, shots, glass, breakGlass, aiming);
  }

  private fireRound(camera: THREE.Camera, enemies: Enemy[], shots: ProjectileSystem, glass: THREE.Object3D[], breakGlass: (object: THREE.Object3D) => void, aiming: boolean): FireResult {
    this.ammo -= 1;
    const stats = this.weapon.stats;
    const shotDamage = aiming ? stats.damage * 1.2 : stats.damage;
    let killed = false;
    for (let pellet = 0; pellet < stats.pellets; pellet += 1) {
      this.raycaster.setFromCamera(new THREE.Vector2(), camera);
      const direction = spreadDirection(this.raycaster.ray.direction, camera, stats.spread * (aiming ? 0.28 : 1));
      this.raycaster.ray.direction.copy(direction);
      shots.add(camera.position.clone().add(direction.clone().multiplyScalar(0.75)), direction, false);
      const impacts = this.raycaster.intersectObjects([...enemies.filter((enemy) => enemy.model.group.visible).map((enemy) => enemy.model.group), ...glass], true);
      killed = this.resolveImpacts(impacts, enemies, shotDamage, breakGlass) || killed;
    }
    return { fired: true, killed };
  }

  private resolveImpacts(impacts: THREE.Intersection<THREE.Object3D>[], enemies: Enemy[], damage: number, breakGlass: (object: THREE.Object3D) => void) {
    const relevant = this.weapon.stats.fireMode === "PIERCE" ? impacts : impacts.slice(0, 1);
    const hitEnemies = new Set<Enemy>();
    return relevant.reduce((killed, impact) => {
      if (isBreakable(impact.object)) {
        breakGlass(impact.object);
        return killed;
      }
      const enemy = enemies.find((item) => contains(item.model.group, impact.object));
      if (!enemy || hitEnemies.has(enemy)) return killed;
      hitEnemies.add(enemy);
      return hitEnemy(enemies, impact.object, damage) || killed;
    }, false);
  }
}

function spreadDirection(base: THREE.Vector3, camera: THREE.Camera, spread: number) {
  if (!spread) return base.clone();
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.sqrt(Math.random()) * spread;
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  return base.clone().addScaledVector(right, Math.cos(angle) * radius).addScaledVector(up, Math.sin(angle) * radius).normalize();
}

function contains(root: THREE.Object3D, object: THREE.Object3D) {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current === root) return true;
    current = current.parent;
  }
  return false;
}

function isBreakable(object: THREE.Object3D) {
  let root: THREE.Object3D | null = object;
  while (root && !root.userData.breakableGlass) root = root.parent;
  return Boolean(root);
}
