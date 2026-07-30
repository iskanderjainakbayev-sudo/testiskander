import * as THREE from "three";
import { getModelsInFolder } from "../assets/assetRegistry";
import { loadModel } from "../assets/modelLoader";
import { addDistrictGround } from "./districtGround";
import { addDistrictStructures } from "./districtStructures";
import { findMap } from "./mapRegistry";
import { createDistrictMaterials } from "./mapPrimitives";
import { addSiroccoStructures } from "./siroccoStructures";
import { addSiroccoTerrain, createSiroccoMaterials } from "./siroccoTerrain";
import { addIslandStructures } from "./sunburstStructures";
import { addIslandTerrain, createIslandMaterials } from "./sunburstTerrain";
import { addIslandOutlands } from "./sunburstOutlands";
import type { InteractiveDoor, TacticalMapRuntime } from "./types";

export class TacticalMap implements TacticalMapRuntime {
  readonly definition;
  readonly breakableGlass: THREE.Object3D[];
  private readonly doors: InteractiveDoor[];
  private readonly updateLayout?: (delta: number) => void;
  private readonly group = new THREE.Group();
  private readonly shards = new THREE.Group();

  constructor(scene: THREE.Scene, mapId = "iron-district") {
    this.definition = findMap(mapId);
    const details = this.buildLayout();
    this.breakableGlass = details.breakableGlass;
    this.doors = details.doors;
    this.updateLayout = details.update;
    this.group.add(this.shards);
    scene.add(this.group);
    this.addLighting(scene);
    void this.loadMapKit();
  }

  breakGlass(object: THREE.Object3D) {
    const glass = glassRoot(object);
    if (!glass || !glass.visible) return false;
    const worldPosition = glass.getWorldPosition(new THREE.Vector3());
    glass.visible = false;
    for (let index = 0; index < 10; index += 1) this.addShard(worldPosition, index);
    return true;
  }

  get collision() {
    return [...this.definition.collision, ...this.doors.filter((door) => !door.open).map((door) => door.collision)];
  }

  toggleNearestDoor(camera: THREE.Camera) {
    const cameraPosition = camera.position;
    const facing = camera.getWorldDirection(new THREE.Vector3());
    const door = this.doors
      .filter((item) => {
        const offset = item.pivot.position.clone().sub(cameraPosition);
        return offset.length() < 4.2 && facing.dot(offset.normalize()) > -0.2;
      })
      .sort((left, right) => left.pivot.position.distanceToSquared(cameraPosition) - right.pivot.position.distanceToSquared(cameraPosition))[0];
    if (!door) return false;
    door.open = !door.open;
    return true;
  }

  update(delta: number) {
    this.doors.forEach((door) => {
      const target = door.open ? door.openRotation : door.closedRotation;
      door.pivot.rotation.y = THREE.MathUtils.damp(door.pivot.rotation.y, target, 11, delta);
    });
    this.updateLayout?.(delta);
  }

  private addLighting(scene: THREE.Scene) {
    scene.background = new THREE.Color(this.definition.lighting.sky);
    scene.fog = new THREE.Fog(this.definition.lighting.fog, 27, 96);
    const sky = new THREE.HemisphereLight(0x82a5bb, 0x11181c, 1.8);
    const moon = new THREE.DirectionalLight(0xc9eaff, this.definition.lighting.moon);
    moon.position.set(-22, 31, 12);
    moon.castShadow = true;
    moon.shadow.mapSize.set(1024, 1024);
    scene.add(sky, moon);
    [[-16, 10], [8, 9], [27, -11], [-29, -20], [0, 28]].forEach(([x, z]) => {
      const lamp = new THREE.PointLight(this.definition.lighting.accent, 2.3, 15, 2);
      lamp.position.set(x, 5.5, z);
      scene.add(lamp);
    });
  }

  private buildLayout() {
    if (this.definition.id === "sunburst-island") {
      const materials = createIslandMaterials();
      addIslandTerrain(this.group, materials);
      const details = addIslandStructures(this.group, materials);
      addIslandOutlands(this.group, materials, details);
      return details;
    }
    if (this.definition.id === "sirocco-outpost") {
      const materials = createSiroccoMaterials();
      addSiroccoTerrain(this.group, materials);
      return addSiroccoStructures(this.group, materials);
    }
    const materials = createDistrictMaterials();
    addDistrictGround(this.group, materials);
    return addDistrictStructures(this.group, materials);
  }

  private async loadMapKit() {
    const models = await Promise.allSettled(getModelsInFolder("maps").map(loadModel));
    models.forEach((result) => {
      if (result.status === "fulfilled") this.group.add(result.value);
    });
  }

  private addShard(position: THREE.Vector3, index: number) {
    const shard = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.09 + (index % 3) * 0.04),
      new THREE.MeshBasicMaterial({ color: 0x91e6e8, transparent: true, opacity: 0.72 }),
    );
    shard.position.copy(position).add(new THREE.Vector3((index - 5) * 0.12, 0.2 + (index % 2) * 0.1, 0.04));
    shard.rotation.set(index, index * 0.5, 0);
    this.shards.add(shard);
  }
}

function glassRoot(object: THREE.Object3D) {
  let current: THREE.Object3D | null = object;
  while (current && !current.userData.breakableGlass) current = current.parent;
  return current;
}
