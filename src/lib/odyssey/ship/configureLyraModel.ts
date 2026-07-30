import * as THREE from 'three';

export interface LyraVariant {
  root: THREE.Group;
  lod0: THREE.Object3D;
  lod1: THREE.Object3D;
}

export function configureLyraModel(
  root: THREE.Group,
  landed: boolean,
  anisotropy: number,
): LyraVariant {
  const lod0 = requireNode(root, 'LOD0_HERO');
  const lod1 = requireNode(root, 'LOD1_DISTANCE');
  requireNode(root, 'COLLIDER_SIMPLE').visible = false;
  const landingGear = root.getObjectByName('LANDING_GEAR_DEPLOYED');
  if (landingGear) landingGear.visible = landed;
  lod0.visible = true;
  lod1.visible = false;
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.castShadow = landed;
    object.receiveShadow = landed;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => configureMaterial(material, anisotropy));
  });
  root.updateMatrixWorld(true);
  return { root, lod0, lod1 };
}

export function selectLyraLod(variant: LyraVariant, distance: number) {
  const showHero = distance < 280;
  variant.lod0.visible = showHero;
  variant.lod1.visible = !showHero;
}

function requireNode(root: THREE.Object3D, name: string) {
  const node = root.getObjectByName(name);
  if (!node) throw new Error(`LYRA asset is missing ${name}`);
  return node;
}

function configureMaterial(material: THREE.Material, anisotropy: number) {
  for (const value of Object.values(material)) {
    if (!(value instanceof THREE.Texture)) continue;
    value.anisotropy = anisotropy;
    value.needsUpdate = true;
  }
  if (material instanceof THREE.MeshStandardMaterial) {
    material.envMapIntensity = 0.78;
  }
  if (material.transparent) {
    material.depthWrite = false;
    material.side = THREE.FrontSide;
  }
}
