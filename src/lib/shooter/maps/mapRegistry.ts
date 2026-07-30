import type { TacticalMapDefinition } from "./types";

const mapModules = import.meta.glob("./*.map.ts", {
  eager: true,
  import: "mapDefinition",
}) as Record<string, TacticalMapDefinition>;

export const tacticalMaps = Object.values(mapModules);

export function findMap(mapId: string) {
  return tacticalMaps.find((map) => map.id === mapId) ?? tacticalMaps[0];
}
