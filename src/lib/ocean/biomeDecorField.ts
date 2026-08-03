import * as THREE from 'three';
import { biomeAt } from './biomes';
import {
  createCoralColonyGeometry,
  createCrystalClusterGeometry,
  createKelpClusterGeometry,
} from './organicDecorGeometries';
import { floorAt, seededRandom } from './terrain';

type DecorKind = 'coral' | 'kelp' | 'crystal';

interface Placement {
  kind: DecorKind;
  variant: number;
  x: number;
  z: number;
  scale: number;
  rotation: number;
}

const FOCUS_POINTS: ReadonlyArray<[number, number, DecorKind, number]> = [
  [0, 8, 'coral', 46], [51, -25, 'kelp', 52],
  [-190, -52, 'crystal', 28], [218, 34, 'crystal', 30],
];

function kindAt(x: number, z: number): DecorKind {
  const biome = biomeAt(new THREE.Vector3(x, floorAt(x, z), z));
  if (biome === 'Coral Paradise' || biome === 'Mushroom Reef') return 'coral';
  if (biome === 'Giant Kelp Forest' || biome === 'Underwater Jungle') return 'kelp';
  return 'crystal';
}

function addPlacement(
  placements: Placement[], random: () => number, x: number, z: number, forced?: DecorKind,
): void {
  const kind = forced ?? kindAt(x, z);
  const sizeRange: Record<DecorKind, [number, number]> = {
    coral: [.65, 1.55], kelp: [.82, 1.55], crystal: [.72, 1.65],
  };
  placements.push({
    kind, variant: Math.floor(random() * 3), x, z,
    scale: THREE.MathUtils.lerp(...sizeRange[kind], random()),
    rotation: random() * Math.PI * 2,
  });
}

function createPlacements(): Placement[] {
  const random = seededRandom(77421);
  const placements: Placement[] = [];
  for (let index = 0; index < 250; index += 1) {
    const radius = THREE.MathUtils.lerp(10, 270, Math.sqrt(random()));
    const angle = random() * Math.PI * 2;
    addPlacement(placements, random, Math.cos(angle) * radius, 8 + Math.sin(angle) * radius);
  }
  for (const [focusX, focusZ, kind, count] of FOCUS_POINTS) {
    for (let index = 0; index < count; index += 1) {
      const distance = THREE.MathUtils.lerp(4, kind === 'kelp' ? 34 : 24, Math.sqrt(random()));
      const angle = random() * Math.PI * 2;
      addPlacement(
        placements, random,
        focusX + Math.cos(angle) * distance, focusZ + Math.sin(angle) * distance, kind,
      );
    }
  }
  return placements;
}

function decorMaterial(kind: DecorKind): THREE.MeshStandardMaterial {
  const emissive = kind === 'crystal' ? 0x176b8e : kind === 'kelp' ? 0x062d20 : 0x52231e;
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: kind === 'crystal' ? .3 : .74,
    metalness: kind === 'crystal' ? .08 : 0, emissive, emissiveIntensity: kind === 'crystal' ? 1.3 : .22,
    side: kind === 'kelp' ? THREE.DoubleSide : THREE.FrontSide,
  });
  if (kind === 'kelp') addKelpSway(material);
  return material;
}

function addKelpSway(material: THREE.MeshStandardMaterial): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
      float swayWeight = smoothstep(0.35, 5.5, position.y);
      float instancePhase = instanceMatrix[3][0] * .073 + instanceMatrix[3][2] * .051;
      transformed.xz += vec2(sin(uTime * .62 + instancePhase), cos(uTime * .48 + instancePhase))
        * .16 * swayWeight;`,
    );
    material.userData.swayShader = shader;
  };
}

export function createBiomeDecorField(): THREE.Group {
  const group = new THREE.Group();
  const placements = createPlacements();
  const transform = new THREE.Object3D();
  for (const kind of ['coral', 'kelp', 'crystal'] as const) {
    for (let variant = 0; variant < 3; variant += 1) {
      const selected = placements.filter((item) => item.kind === kind && item.variant === variant);
      const geometry = kind === 'coral' ? createCoralColonyGeometry(variant)
        : kind === 'kelp' ? createKelpClusterGeometry(variant) : createCrystalClusterGeometry(variant);
      const mesh = new THREE.InstancedMesh(geometry, decorMaterial(kind), selected.length);
      selected.forEach((item, index) => {
        transform.position.set(item.x, floorAt(item.x, item.z) + .035, item.z);
        transform.rotation.set(0, item.rotation, 0);
        transform.scale.setScalar(item.scale);
        transform.updateMatrix();
        mesh.setMatrixAt(index, transform.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.castShadow = kind !== 'kelp';
      mesh.receiveShadow = true;
      mesh.userData.decorKind = kind;
      group.add(mesh);
    }
  }
  return group;
}

export function updateBiomeDecorField(field: THREE.Object3D, time: number): void {
  field.traverse((object) => {
    if (!(object instanceof THREE.InstancedMesh) || object.userData.decorKind !== 'kelp') return;
    const material = object.material as THREE.MeshStandardMaterial;
    const shader = material.userData.swayShader as { uniforms: { uTime: { value: number } } } | undefined;
    if (shader) shader.uniforms.uTime.value = time;
  });
}
