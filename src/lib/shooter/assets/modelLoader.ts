import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import type { ImportedModel } from "./assetRegistry";

export async function loadModel(asset: ImportedModel) {
  const model = await loadByFormat(asset);
  model.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    node.castShadow = true;
    node.receiveShadow = true;
    if (node.material instanceof THREE.MeshStandardMaterial) return;
    const source = Array.isArray(node.material) ? node.material[0] : node.material;
    node.material = new THREE.MeshStandardMaterial({
      color: source?.color ?? new THREE.Color(0xffffff),
      map: source?.map ?? null,
      roughness: 0.65,
      metalness: 0.15,
    });
  });
  return model;
}

async function loadByFormat(asset: ImportedModel): Promise<THREE.Group> {
  if (asset.format === "glb" || asset.format === "gltf") {
    const gltf = await new GLTFLoader().loadAsync(asset.url);
    return gltf.scene;
  }
  if (asset.format === "fbx") return new FBXLoader().loadAsync(asset.url);
  return new OBJLoader().loadAsync(asset.url);
}
