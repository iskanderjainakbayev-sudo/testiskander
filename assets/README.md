# Tactical Shooter Assets

This folder is the game's mod-friendly asset library. Add Blender exports here, restart
`npm run dev`, and the game finds supported models when it starts.

```
assets/
  models/weapons/      weapon `.glb`, `.gltf`, `.fbx`, or `.obj` models
  models/characters/   player and character models
  models/maps/         map kits and environment models
  models/props/        containers, furniture, signs, and other props
  textures/            PBR texture sets
  sounds/              weapon and ambience audio
  animations/          reload, inspect, idle, and character animations
```

`.glb` is the best option: it can carry Blender PBR materials and animations in one file.
Use a stable filename (for example `ar9.glb`) and set that filename in the relevant
definition in `src/lib/shooter/weapons/weaponCatalog.ts`. Weapon numbers live separately
in `stats`, so replacing a model never changes balance.

The ten supplied weapon `.glb` files are a simple editable starter kit. Open one in Blender,
replace its meshes or materials, and export it back to the same filename to update the game.

The asset registry uses Vite's build-time file discovery. A newly copied model is available
after the dev server restarts, or after the next production build. Browsers cannot scan a
visitor's disk at runtime, so this is the safe web equivalent of automatic folder loading.

Every model inside `models/maps/` is attached to the active map automatically. Weapon models
are selected by matching their filename to the `model` field (for example `ar9.glb`), so a
replacement at the same path appears without changing gameplay code.
