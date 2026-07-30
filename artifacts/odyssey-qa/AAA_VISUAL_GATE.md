# The Long Silence — fixed AAA visual gate

This gate is immutable for the final review. A judge may not lower thresholds,
reinterpret missing evidence as passing, or award visual credit from source code
instead of runtime captures.

## Evidence set

- 44 distinct runtime PNG stills at 1920×1080, device pixel ratio 1.
- Both walking and cockpit flight views.
- All five orbital discoveries.
- Solace and Nacre landing, surface traversal, samples, and takeoff.
- Traffic encounters, menu, pause, HUD, transmissions, and finale.
- 10 evenly sampled frame sheets covering every cinematic and transition.
- Artifact sweeps for z-fighting, banding, transparency sorting, clipping,
  pop-in, temporal discontinuity, and HUD collisions.
- Warm 30-second frame traces for interior, flight, both surfaces, and cinematics.
- Direct comparison with the cached Starfield, Star Citizen, and Elite Dangerous
  reference images in `/tmp/aaa_visual_refs`.

## Scoring

Each category is scored from 0–10:

1. Mesh quality, silhouette, and intentional modeling.
2. Texture resolution, material realism, wear, and surface response.
3. Lighting, shadows, exposure, atmosphere, and depth.
4. Space, planets, scale, composition, and environmental fidelity.
5. Ship interior and cockpit fidelity.
6. Menus, typography, HUD, hierarchy, and legibility.
7. Cinematography, transitions, camera continuity, and visual storytelling.
8. Artifact-free rendering and temporal stability.
9. Living-universe density, motion, effects, and visual variety.
10. Runtime performance and image stability.

Passing requires all of the following:

- Total score at least 90/100.
- No category below 8/10.
- An explicit verdict: **“Yes—at native gameplay resolution, this actually
  looks as good as the cited AAA references.”**

If the judge cannot make that exact statement from the runtime evidence, the
gate fails and the judge must return specific, prioritized corrections.

## Performance category

A 10/10 requires:

- Average frame rate at least 59.5 FPS.
- p95 frame time at most 17.5 ms.
- p99 frame time at most 22 ms.
- Fewer than 0.1% of frames above 33 ms.

An 8/10 requires:

- Average frame rate at least 58 FPS.
- p95 frame time at most 20 ms.
- p99 frame time at most 33.3 ms.
- Fewer than 1% of frames above 33 ms.

Synthetic traces, build success, and Blender renders do not substitute for
browser runtime traces.
