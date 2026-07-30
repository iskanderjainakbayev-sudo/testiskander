# Adding a map

Create a `myMap.map.ts` file in this folder and export a `mapDefinition`. The registry finds it
at build time automatically. A map definition needs spawn points, collision boxes, walkable
surfaces, lighting, ambient sound paths, patrol routes, and interactive-object metadata.

Use `ironDistrict.ts` as the starting example. The render layout belongs in a small map builder,
while gameplay data stays in the definition. This lets an artist replace the Blender map kit in
`assets/models/maps/` without mixing models, collision, and weapon balance together.
