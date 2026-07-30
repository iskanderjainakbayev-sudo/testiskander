import * as THREE from 'three';

export interface InteriorLighting {
  update: (time: number) => void;
}

export function buildInteriorLighting(
  group: THREE.Group,
  reactorLight: THREE.PointLight,
): InteriorLighting {
  const ambient = new THREE.HemisphereLight(0xa8c1bc, 0x090705, 0.22);
  group.add(ambient);

  const cockpit = new THREE.SpotLight(0xffc08b, 24, 17, 0.72, 0.78, 2);
  cockpit.position.set(0, 2.82, -2.8);
  cockpit.target.position.set(0, 0.62, -5.55);
  cockpit.castShadow = true;
  cockpit.shadow.mapSize.set(512, 512);
  cockpit.shadow.normalBias = 0.018;
  group.add(cockpit, cockpit.target);

  const forwardFill = new THREE.PointLight(0x7eb8b5, 3.8, 7.5, 2);
  forwardFill.position.set(0, 2.72, 0.7);
  const aftFill = new THREE.PointLight(0xd8a36f, 3.2, 7.2, 2);
  aftFill.position.set(0, 2.66, 6.25);
  group.add(forwardFill, aftFill);

  return {
    update: (time) => {
      forwardFill.intensity = 3.65 + Math.sin(time * 1.23) * 0.18;
      aftFill.intensity = 3.05 + Math.sin(time * 0.82 + 1.7) * 0.16;
      reactorLight.intensity = 8.1 + Math.sin(time * 2.15) * 0.65;
    },
  };
}
