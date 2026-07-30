import * as THREE from "three";

export function buildArena(scene: THREE.Scene) {
  scene.background = new THREE.Color(0x091427);
  scene.fog = new THREE.Fog(0x091427, 29, 100);
  scene.add(new THREE.HemisphereLight(0x8cc7fa, 0x111725, 2.4));
  addMoon(scene);
  addFloor(scene);
  addCover(scene);
}

function addMoon(scene: THREE.Scene) {
  const moon = new THREE.DirectionalLight(0xc8efff, 2.8);
  moon.position.set(-14, 22, 10);
  moon.castShadow = true;
  scene.add(moon);
}

function addFloor(scene: THREE.Scene) {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(150, 150),
    new THREE.MeshStandardMaterial({
      color: 0x172844,
      roughness: 0.88,
      metalness: 0.2,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const grid = new THREE.GridHelper(120, 30, 0x347b9f, 0x203b63);
  grid.position.y = 0.015;
  scene.add(grid);
}

function addCover(scene: THREE.Scene) {
  const material = new THREE.MeshStandardMaterial({
    color: 0x334d69,
    roughness: 0.64,
    metalness: 0.6,
  });
  for (let index = 0; index < 20; index += 1) {
    const angle = index * 1.72;
    const radius = 14 + (index % 4) * 7;
    const height = 2.2 + (index % 2);
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, height, 1.5),
      material,
    );
    crate.position.set(
      Math.cos(angle) * radius,
      height / 2,
      Math.sin(angle) * radius,
    );
    crate.rotation.y = angle;
    crate.castShadow = true;
    crate.receiveShadow = true;
    scene.add(crate);
  }
}
