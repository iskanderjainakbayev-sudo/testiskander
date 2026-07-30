import type { TacticalMapDefinition } from "./types";

export const sunburstIsland: TacticalMapDefinition = {
  id: "sunburst-island",
  name: "SUNBURST ISLAND",
  subtitle: "Brightwater Basin // clear skies",
  bounds: 88,
  weather: "shiny",
  spawnPoints: [
    { id: "beach-drop", position: [0, 1.75, 34], facing: Math.PI },
    { id: "windmill-ridge", position: [-24, 8.25, 10], facing: -0.9 },
    { id: "plaza-balcony", position: [20, 5.75, -8], facing: 0.4 },
    { id: "lighthouse-rise", position: [-58, 10.5, -36], facing: 0.65 },
  ],
  collision: [
    { x: -23, z: 10, width: 4, depth: 4, height: 6.5 },
    { x: 12, z: -8, width: 0.5, depth: 14, height: 4.5 }, { x: 28, z: -8, width: 0.5, depth: 14, height: 4.5 },
    { x: 20, z: -1, width: 16, depth: 0.5, height: 4.5 }, { x: 14.45, z: -15, width: 4.5, depth: 0.5, height: 4.5 }, { x: 25.55, z: -15, width: 4.5, depth: 0.5, height: 4.5 },
    { x: -7, z: -23, width: 0.5, depth: 10, height: 4.5 }, { x: 11, z: -23, width: 0.5, depth: 10, height: 4.5 },
    { x: 2, z: -18, width: 18, depth: 0.5, height: 4.5 }, { x: -4.25, z: -28, width: 5.1, depth: 0.5, height: 4.5 }, { x: 8.25, z: -28, width: 5.1, depth: 0.5, height: 4.5 },
    { x: -58, z: -36, width: 5, depth: 5, height: 8.5 }, { x: 54, z: 33, width: 14, depth: 9, height: 5.5 },
  ],
  surfaces: [
    { x: -23, z: 10, width: 12, depth: 12, height: 6.5 },
    { x: 20, z: -8, width: 16, depth: 14, height: 4.5 },
    { x: -58, z: -36, width: 10, depth: 10, height: 8.5 },
    { x: 54, z: 33, width: 18, depth: 14, height: 5.5 },
  ],
  climbables: [
    { id: "market-ladder", x: 11.2, z: -1.7, width: 1.6, depth: 1.4, topHeight: 4.5 },
    { id: "windmill-ladder", x: -20.4, z: 10, width: 1.6, depth: 1.6, topHeight: 6.5 },
    { id: "lighthouse-ladder", x: -53.2, z: -36, width: 1.8, depth: 1.6, topHeight: 8.5 },
    { id: "solar-ladder", x: 45, z: 33, width: 2, depth: 1.5, topHeight: 5.5 },
  ],
  lighting: { sky: 0x76ccff, fog: 0x9de9ff, moon: 2.5, accent: 0xffe16b },
  ambientSounds: ["sounds/maps/sunburst-wind.ogg", "sounds/maps/coastal-birds.ogg"],
  routes: [
    { id: "ridge", style: "sniper", description: "Windmill ridge across Brightwater Basin." },
    { id: "market", style: "close", description: "Sunbeam market and central splash plaza." },
    { id: "cove", style: "flank", description: "Hidden cove path behind the boathouses." },
    { id: "lighthouse", style: "sniper", description: "Long lighthouse sightline through the western cove." },
    { id: "solar", style: "close", description: "Solar depot rooftops in the northern outlands." },
  ],
  navigationMesh: {
    patrolRoutes: [
      [[-60, 0, -36], [-31, 0, -17], [-10, 0, 3], [31, 0, -9], [54, 0, 33]],
      [[-67, 0, 44], [-24, 0, 26], [-8, 0, -13], [15, 0, -21], [67, 0, -30]],
    ],
  },
  interactiveObjects: [
    { id: "market-window", kind: "breakable-glass" },
    { id: "lighthouse-door", kind: "door" },
  ],
};
