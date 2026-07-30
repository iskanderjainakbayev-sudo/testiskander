import * as THREE from 'three';

export function addAtlasSegments(
  parent: THREE.Group,
  material: THREE.Material,
): void {
  const geometry = new THREE.BoxGeometry(8, 29, 10);
  const segments = new THREE.InstancedMesh(geometry, material, 32);
  const dummy = new THREE.Object3D();
  for (let index = 0; index < 32; index += 1) {
    const angle = (index / 32) * Math.PI * 2;
    dummy.position.set(Math.cos(angle) * 111, Math.sin(angle) * 111, 0);
    dummy.rotation.z = angle - Math.PI / 2;
    const major = index % 4 === 0;
    dummy.scale.set(major ? 1.35 : 0.76, 1, major ? 1.2 : 0.7);
    dummy.updateMatrix();
    segments.setMatrixAt(index, dummy.matrix);
  }
  segments.instanceMatrix.needsUpdate = true;
  parent.add(segments);
}

export function addAtlasGlyphs(parent: THREE.Group, material: THREE.Material): void {
  const geometry = new THREE.BoxGeometry(1.9, 7.5, 1.1);
  const glyphs = new THREE.InstancedMesh(geometry, material, 48);
  const dummy = new THREE.Object3D();
  for (let index = 0; index < 48; index += 1) {
    const angle = (index / 48) * Math.PI * 2;
    dummy.position.set(Math.cos(angle) * 92, Math.sin(angle) * 92, 7);
    dummy.rotation.z = angle;
    dummy.scale.y = index % 5 === 0 ? 1.8 : 0.72 + (index % 3) * 0.18;
    dummy.updateMatrix();
    glyphs.setMatrixAt(index, dummy.matrix);
  }
  glyphs.instanceMatrix.needsUpdate = true;
  parent.add(glyphs);
}

export function addAtlasCrown(
  parent: THREE.Group,
  material: THREE.Material,
): THREE.Group {
  const crown = new THREE.Group();
  const geometry = new THREE.TorusGeometry(139, 2.3, 7, 46, Math.PI * 0.43);
  for (let index = 0; index < 4; index += 1) {
    const arc = new THREE.Mesh(geometry, material);
    arc.rotation.z = index * Math.PI * 0.5 + 0.18;
    crown.add(arc);
  }
  parent.add(crown);
  return crown;
}
