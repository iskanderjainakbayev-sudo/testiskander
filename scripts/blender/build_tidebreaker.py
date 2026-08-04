from math import pi
from pathlib import Path
import sys
import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from ocean_hero_utils import reset, mat, uv, cube, cylinder, torus, curve, parent_all

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "models" / "ocean" / "weapons"
OUT.mkdir(parents=True, exist_ok=True)
bpy.context.preferences.filepaths.save_version = 0


def palette():
    return (
        mat("pearl ceramic", (.62, .72, .73), metallic=.28, roughness=.2),
        mat("deep graphite", (.035, .09, .105), metallic=.72, roughness=.24),
        mat("pressure blue", (.12, .25, .31), metallic=.68, roughness=.22),
        mat("safety gold", (.84, .55, .08), metallic=.7, roughness=.24),
        mat("ion cyan", (.015, .8, .86), roughness=.1, emission=(.01, 1, 1)),
    )


def barrel(name, x, z, ceramic, dark, gold, cyan):
    root = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(root)
    cylinder(f"{name}-sleeve", (x, .76, z), .13, .74, ceramic,
             (pi / 2, 0, 0), 32).parent = root
    cylinder(f"{name}-collar", (x, .39, z), .16, .16, dark,
             (pi / 2, 0, 0), 32).parent = root
    torus(f"{name}-gold-seal", (x, .48, z), .135, .025, gold,
          (pi / 2, 0, 0)).parent = root
    tip = cylinder(f"{name}-emitter", (x, 1.16, z), .14, .11, cyan,
                   (pi / 2, 0, 0), 32)
    tip.parent = root
    cube(f"{name}-vent", (x, .83, z + .125), (.035, .12, .018), dark, .018).parent = root
    return root


def build():
    reset()
    ceramic, dark, blue, gold, cyan = palette()
    root = bpy.data.objects.new("tidebreaker-blaster", None)
    bpy.context.collection.objects.link(root)

    uv("pressure-body", (0, 0, 0), (.48, .73, .43), ceramic, 48, 24)
    for y in (-.35, .22):
        ring = torus(f"body-band-{y}", (0, y, 0), .43, .07, blue, (pi / 2, 0, 0))
        ring.scale.z = .92
    cylinder("rear-cap", (0, -.65, 0), .34, .18, dark, (pi / 2, 0, 0), 32)

    barrels = (
        barrel("barrel-upper", 0, .28, ceramic, dark, gold, cyan),
        barrel("barrel-left", -.32, -.15, ceramic, dark, gold, cyan),
        barrel("barrel-right", .32, -.15, ceramic, dark, gold, cyan),
    )
    for item in barrels:
        item.parent = root

    drum = bpy.data.objects.new("energy-drum", None)
    bpy.context.collection.objects.link(drum)
    cylinder("drum-shell", (.28, -.04, -.48), .29, .24, blue, (0, pi / 2, 0), 32).parent = drum
    cylinder("drum-face", (.41, -.04, -.48), .23, .025, dark, (0, pi / 2, 0), 32).parent = drum
    torus("charge-ring", (.43, -.04, -.48), .205, .025, cyan, (0, pi / 2, 0)).parent = drum
    cylinder("drum-core", (.445, -.04, -.48), .07, .03, cyan, (0, pi / 2, 0), 24).parent = drum
    drum.parent = root

    cube("carry-rail", (0, -.08, .48), (.25, .38, .09), dark, .08, (-.08, 0, 0))
    curve("rear-loop-grip", [(0, -.53, .15), (0, -.94, .0), (0, -1.1, -.29),
          (0, -.87, -.48), (0, -.65, -.34)], .095, ceramic)
    curve("rear-grip-inlay", [(0, -.72, .03), (0, -.98, -.18), (0, -.85, -.36)], .055, dark)
    cube("thumb-switch", (.0, -.63, .29), (.11, .14, .035), gold, .035)
    curve("forward-grip", [(-.17, -.05, -.3), (-.2, .0, -.72), (-.2, -.03, -1.05)], .13, ceramic)
    curve("forward-grip-inlay", [(-.21, -.02, -.55), (-.21, -.03, -.86)], .065, dark)
    torus("grip-pommel", (-.2, -.03, -1.07), .13, .035, blue)

    parent_all(root)
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            for polygon in obj.data.polygons:
                polygon.use_smooth = True
    bpy.context.view_layer.objects.active = root
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "tidebreaker-blaster.blend"))
    bpy.ops.export_scene.gltf(filepath=str(OUT / "tidebreaker-blaster.glb"),
                              export_format='GLB', export_apply=True, export_yup=True)


build()
