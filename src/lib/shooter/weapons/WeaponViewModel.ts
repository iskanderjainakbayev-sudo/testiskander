import * as THREE from "three";
import { findModel } from "../assets/assetRegistry";
import { loadModel } from "../assets/modelLoader";
import type { WeaponFinish } from "../armory";
import type { WeaponDefinition } from "./weaponCatalog";

export class WeaponViewModel {
  private readonly root = new THREE.Group();
  private readonly flash = new THREE.PointLight(0x9fffee, 0, 4, 2);
  private currentId = "";
  private fireUntil = 0;
  private inspectUntil = 0;
  private reloadUntil = 0;
  private meleeUntil = 0;
  private aimAmount = 0;
  private finish: WeaponFinish;

  constructor(camera: THREE.Camera) {
    this.root.position.set(0.48, -0.43, -0.78);
    this.root.rotation.set(-0.1, Math.PI, 0);
    this.flash.position.set(0, 0, 0.92);
    this.root.add(this.flash);
    camera.add(this.root);
    this.finish = { id: "field-standard", name: "FIELD STANDARD", weapon: "ALL LOADOUTS", rarity: "common", color: 0x76e8df, accent: 0x173d50, description: "", odds: 0 };
  }

  setFinish(finish: WeaponFinish) { this.finish = finish; this.currentId = ""; }

  equip(weapon: WeaponDefinition) {
    if (weapon.id === this.currentId) return;
    this.currentId = weapon.id;
    this.root.clear();
    this.root.add(this.flash, makeFallbackWeapon(this.finish.color), makeFinishCharm(this.finish));
    const external = findModel(weapon.assets.model);
    if (external) void this.replaceFallback(external, weapon.id);
  }

  fire(weapon: WeaponDefinition, time: number) {
    this.flash.color.setHex(weapon.assets.muzzleFlash.color);
    this.flash.intensity = weapon.assets.muzzleFlash.intensity;
    this.fireUntil = time + 55;
  }

  inspect(time: number) { this.inspectUntil = time + 1250; }
  reload(time: number, duration: number) { this.reloadUntil = time + duration; }
  melee(time: number) { this.meleeUntil = time + 310; }
  setAiming(aiming: boolean, delta: number) { this.aimAmount = THREE.MathUtils.damp(this.aimAmount, aiming ? 1 : 0, 14, delta); }

  update(time: number) {
    this.flash.intensity = time < this.fireUntil ? this.flash.intensity * 0.84 : 0;
    const inspecting = Math.max(0, (this.inspectUntil - time) / 1250);
    const reloading = Math.max(0, (this.reloadUntil - time) / 1400);
    const melee = Math.max(0, (this.meleeUntil - time) / 310);
    const aim = this.aimAmount * (1 - Math.max(inspecting, reloading, melee));
    this.root.rotation.z = Math.sin(time * 0.008) * 0.012 + inspecting * 0.55 - reloading * 0.28 + Math.sin(melee * Math.PI) * 0.75;
    this.root.rotation.x = -0.1 + aim * 0.08 - Math.sin(melee * Math.PI) * 0.34;
    this.root.position.x = 0.48 - aim * 0.48;
    this.root.position.y = -0.43 - Math.sin(time * 0.006) * 0.008 - reloading * 0.11 + aim * 0.26 - Math.sin(melee * Math.PI) * 0.1;
  }

  private async replaceFallback(asset: NonNullable<ReturnType<typeof findModel>>, id: string) {
    try {
      const model = await loadModel(asset);
      if (this.currentId !== id) return;
      model.scale.setScalar(0.32);
      model.rotation.set(0, Math.PI, 0);
      this.root.clear();
      this.root.add(this.flash, model, makeFinishCharm(this.finish));
    } catch {
      // A broken community model should not stop a match; the fallback remains equipped.
    }
  }
}

function makeFallbackWeapon(accentColor: number) {
  const root = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x26343d, roughness: 0.34, metalness: 0.86 });
  const accent = new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.5, metalness: 0.4 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.17, 0.72), metal);
  body.position.z = 0.22;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 8), metal);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = 0.83;
  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.24), accent);
  sight.position.set(0, 0.13, 0.32);
  root.add(body, barrel, sight);
  return root;
}

function makeFinishCharm(finish: WeaponFinish) {
  const charm = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.045),
    new THREE.MeshStandardMaterial({ color: finish.color, emissive: finish.color, emissiveIntensity: 0.75, metalness: 0.7, roughness: 0.25 }),
  );
  charm.position.set(0.14, -0.12, 0.34);
  charm.userData.finish = finish.id;
  return charm;
}
