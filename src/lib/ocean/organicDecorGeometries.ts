import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function paint(geometry: THREE.BufferGeometry, color: number): THREE.BufferGeometry {
  const value = new THREE.Color(color);
  const colors = new Float32Array(geometry.getAttribute('position').count * 3);
  for (let index = 0; index < colors.length; index += 3) value.toArray(colors, index);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function curvedTube(points: THREE.Vector3[], radius: number, color: number): THREE.BufferGeometry {
  return paint(new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points), 7, radius, 6, false,
  ), color);
}

function leafGeometry(length: number, width: number, curl: number, color: number): THREE.BufferGeometry {
  const segments = 5;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const halfWidth = Math.sin(t * Math.PI) * width;
    const y = t * length;
    const z = Math.sin(t * Math.PI) * curl + Math.sin(t * Math.PI * 2) * curl * .16;
    positions.push(-halfWidth, y, z, halfWidth, y, z);
    uvs.push(0, t, 1, t);
    if (index < segments) {
      const base = index * 2;
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return paint(geometry, color);
}

function transform(
  geometry: THREE.BufferGeometry,
  position: THREE.Vector3,
  rotation: THREE.Euler,
  scale = new THREE.Vector3(1, 1, 1),
): THREE.BufferGeometry {
  return geometry.applyMatrix4(new THREE.Matrix4().compose(
    position, new THREE.Quaternion().setFromEuler(rotation), scale,
  ));
}

function crystalShardGeometry(radius: number, height: number, color: number): THREE.BufferGeometry {
  const sides = 6;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const rings: ReadonlyArray<[number, number, number, number]> = [
    [0, radius * .74, 0, 0], [.11, radius, 0, 0], [.76, radius * .68, radius * .12, -radius * .08],
  ];
  rings.forEach(([heightRatio, ringRadius, offsetX, offsetZ], ring) => {
    for (let side = 0; side < sides; side += 1) {
      const angle = side / sides * Math.PI * 2;
      positions.push(offsetX + Math.cos(angle) * ringRadius, height * heightRatio, offsetZ + Math.sin(angle) * ringRadius);
      uvs.push(side / sides, ring / 3);
    }
  });
  positions.push(radius * .34, height, -radius * .21, 0, 0, 0);
  uvs.push(.5, 1, .5, 0);
  for (let ring = 0; ring < 2; ring += 1) for (let side = 0; side < sides; side += 1) {
    const next = (side + 1) % sides;
    const base = ring * sides;
    indices.push(base + side, base + next, base + sides + side, base + next, base + sides + next, base + sides + side);
  }
  const tip = sides * 3;
  for (let side = 0; side < sides; side += 1) {
    const next = (side + 1) % sides;
    indices.push(sides * 2 + side, sides * 2 + next, tip, tip + 1, next, side);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  const faceted = geometry.toNonIndexed();
  faceted.computeVertexNormals();
  return paint(faceted, color);
}

export function createCoralColonyGeometry(variant: number): THREE.BufferGeometry {
  const pieces: THREE.BufferGeometry[] = [];
  const warm = variant % 2 === 0 ? 0xff725f : 0xf3ad62;
  const tips = variant % 2 === 0 ? 0xffd090 : 0xffe2b2;
  const arms = 6 + variant;
  for (let arm = 0; arm < arms; arm += 1) {
    const angle = arm / arms * Math.PI * 2 + variant * .41;
    const height = 1.15 + ((arm * 7 + variant * 3) % 5) * .19;
    const spread = .24 + (arm % 3) * .11;
    const base = new THREE.Vector3(Math.cos(angle) * .16, 0, Math.sin(angle) * .16);
    const bend = new THREE.Vector3(Math.cos(angle) * spread, height * .48, Math.sin(angle) * spread);
    const end = new THREE.Vector3(Math.cos(angle) * spread * 1.45, height, Math.sin(angle) * spread * 1.45);
    pieces.push(curvedTube([base, bend, end], .075 + (arm % 2) * .018, warm));
    const bud = paint(new THREE.SphereGeometry(.13, 7, 5), tips);
    pieces.push(transform(bud, end, new THREE.Euler(0, angle, 0), new THREE.Vector3(1.25, .72, 1.05)));
    if (arm % 2 === 0) {
      const forkEnd = end.clone().add(new THREE.Vector3(-Math.sin(angle) * .26, .31, Math.cos(angle) * .26));
      pieces.push(curvedTube([bend, end.clone().lerp(forkEnd, .45), forkEnd], .052, warm));
    }
  }
  return mergeGeometries(pieces, false);
}

export function createKelpClusterGeometry(variant: number): THREE.BufferGeometry {
  const pieces: THREE.BufferGeometry[] = [];
  const stemColor = variant % 2 ? 0x185f47 : 0x126b4e;
  const leafColor = variant % 2 ? 0x5ac77d : 0x43b88b;
  for (let stem = 0; stem < 3; stem += 1) {
    const x = (stem - 1) * .32;
    const height = 3.7 + stem * .75 + variant * .35;
    const phase = stem * 1.7 + variant;
    const points = [0, .32, .67, 1].map((t) => new THREE.Vector3(
      x + Math.sin(t * 2.4 + phase) * .22 * t, height * t, Math.cos(t * 1.8 + phase) * .12 * t,
    ));
    pieces.push(curvedTube(points, .055 + stem * .012, stemColor));
    for (let leaf = 1; leaf <= 4; leaf += 1) {
      const t = leaf / 5;
      const position = points[0].clone().lerp(points[3], t);
      const side = (leaf + stem) % 2 === 0 ? 1 : -1;
      const blade = leafGeometry(1.1 + leaf * .14, .23 + stem * .035, .24 * side, leafColor);
      pieces.push(transform(blade, position, new THREE.Euler(.12 * side, phase + side * 1.1, -.74 * side)));
    }
  }
  return mergeGeometries(pieces, false);
}

export function createCrystalClusterGeometry(variant: number): THREE.BufferGeometry {
  const pieces: THREE.BufferGeometry[] = [];
  const colors = [0x55ddec, 0x81bfff, 0xa67cff];
  const count = 5 + variant;
  for (let shard = 0; shard < count; shard += 1) {
    const angle = shard / count * Math.PI * 2 + variant * .6;
    const height = 1.15 + ((shard * 5 + variant) % 4) * .52;
    const crystal = crystalShardGeometry(.18 + (shard % 3) * .055, height, colors[variant % colors.length]);
    pieces.push(transform(
      crystal,
      new THREE.Vector3(Math.cos(angle) * .42, -.02, Math.sin(angle) * .42),
      new THREE.Euler(Math.sin(angle) * .16, angle, -Math.cos(angle) * .16),
    ));
  }
  return mergeGeometries(pieces, false);
}
