import type { TacticalMapDefinition } from "./types";

export const siroccoOutpost: TacticalMapDefinition = {
  id: "sirocco-outpost",
  name: "SIROCCO OUTPOST",
  subtitle: "Dustwind Military Base // sandstorm",
  bounds: 72,
  weather: "sandstorm",
  spawnPoints: [
    { id: "south-gate", position: [0, 1.75, 56], facing: Math.PI },
    { id: "hangar-roof", position: [-29, 7.25, 13], facing: -1.2 },
    { id: "tower-platform", position: [29, 9.25, -9], facing: 0.4 },
    { id: "tunnel-exit", position: [25, 1.75, -42], facing: 0.2 },
  ],
  collision: [
    { x: -29, z: 13, width: 18, depth: 19 },
    { x: 29, z: -9, width: 12, depth: 12 },
    { x: -4, z: -24, width: 14, depth: 10 },
    { x: 25, z: -42, width: 7, depth: 21 },
    { x: -43, z: -25, width: 8, depth: 8 },
  ],
  surfaces: [
    { x: -29, z: 13, width: 18, depth: 19, height: 5.5 },
    { x: 29, z: -9, width: 12, depth: 12, height: 7.5 },
    { x: -4, z: -24, width: 14, depth: 10, height: 4.5 },
    { x: -43, z: -25, width: 8, depth: 8, height: 8 },
  ],
  climbables: [
    { id: "hangar-ladder", x: -39, z: 13, width: 1.5, depth: 1.3, topHeight: 5.5 },
    { id: "tower-ladder", x: 24, z: -9, width: 1.5, depth: 1.3, topHeight: 7.5 },
    { id: "watch-ladder", x: -47, z: -25, width: 1.5, depth: 1.3, topHeight: 8 },
  ],
  lighting: { sky: 0x6c4932, fog: 0xa86d3f, moon: 1.8, accent: 0xffbc57 },
  ambientSounds: ["sounds/maps/sirocco-wind.ogg", "sounds/maps/base-generators.ogg"],
  routes: [
    { id: "runway", style: "close", description: "Fast route through the gate and between parked armor." },
    { id: "hangar-roof", style: "sniper", description: "Ladder access to a wide runway sightline." },
    { id: "service-tunnel", style: "flank", description: "Covered tunnel behind the command block." },
    { id: "watchtower", style: "sniper", description: "High-risk tower route beside the crane yard." },
  ],
  navigationMesh: {
    patrolRoutes: [
      [[-56, 0, 42], [-29, 0, 13], [-3, 0, -2], [29, 0, -9], [51, 0, 24]],
      [[-44, 0, -25], [-17, 0, -35], [25, 0, -42], [42, 0, -14]],
    ],
  },
  interactiveObjects: [
    { id: "hangar-control-window", kind: "breakable-glass" },
    { id: "command-room-window", kind: "breakable-glass" },
    { id: "hangar-service-door", kind: "door" },
    { id: "command-archive-door", kind: "door" },
  ],
};
