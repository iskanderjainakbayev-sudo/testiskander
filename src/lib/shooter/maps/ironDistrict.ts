import type { TacticalMapDefinition } from "./types";

const buildingCollision = [
  [-23, -12, 12, 16], [0, -25, 18, 12], [23, -8, 14, 17],
  [24, 17, 16, 14], [2, 23, 12, 10], [-6, 0, 9, 12],
] as const;

export const ironDistrict: TacticalMapDefinition = {
  id: "iron-district",
  name: "IRON DISTRICT",
  subtitle: "Cordon Yard // midnight",
  bounds: 42,
  weather: "rain",
  spawnPoints: [
    { id: "south-checkpoint", position: [0, 1.75, 34], facing: Math.PI },
    { id: "warehouse-roof", position: [-21, 8.25, 13], facing: -1.3 },
    { id: "tunnel-exit", position: [25, 1.75, -21], facing: 0.2 },
  ],
  collision: buildingCollision.map(([x, z, width, depth]) => ({ x, z, width, depth })),
  surfaces: [
    { x: -21, z: 15, width: 14, depth: 18, height: 6.5 },
    { x: 24, z: 17, width: 16, depth: 14, height: 5.5 },
    { x: 0, z: -25, width: 18, depth: 12, height: 4.5 },
  ],
  climbables: [],
  lighting: { sky: 0x07131d, fog: 0x101d26, moon: 1.5, accent: 0x78e6db },
  ambientSounds: ["sounds/maps/iron-district-night.ogg", "sounds/maps/distant-sirens.ogg"],
  routes: [
    { id: "roofline", style: "sniper", description: "Warehouse roof to the transit depot sightline." },
    { id: "courtyard", style: "close", description: "Cover-rich central yard for rifles and SMGs." },
    { id: "utility", style: "flank", description: "Low-light tunnel behind the eastern apartments." },
  ],
  navigationMesh: {
    patrolRoutes: [
      [[-33, 0, 27], [-11, 0, 6], [10, 0, 6], [31, 0, 25]],
      [[-28, 0, -22], [-8, 0, -10], [13, 0, -15], [33, 0, -25]],
    ],
  },
  interactiveObjects: [
    { id: "warehouse-office-window", kind: "breakable-glass" },
    { id: "checkpoint-booth-glass", kind: "breakable-glass" },
    { id: "service-tunnel-door", kind: "door" },
  ],
};
