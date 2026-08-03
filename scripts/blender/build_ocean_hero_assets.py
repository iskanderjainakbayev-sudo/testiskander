from pathlib import Path
import sys
import bpy
from math import pi
sys.path.insert(0, str(Path(__file__).resolve().parent))
from ocean_hero_utils import reset, mat, uv, cube, cylinder, torus, curve, fin_mesh, parent_all

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "models" / "ocean" / "hero"
OUT.mkdir(parents=True, exist_ok=True)

def palette():
    return (
        mat("warm ceramic hull", (.57, .62, .58), metallic=.32, roughness=.2),
        mat("graphite pressure frame", (.025, .055, .06), metallic=.78, roughness=.2),
        mat("rescue orange", (.86, .16, .045), metallic=.25, roughness=.26),
        mat("polarized canopy", (.015, .19, .25), metallic=.35, roughness=.08,
            emission=(.015, .11, .15), alpha=.82),
        mat("cyan navigation light", (.05, .7, .8), roughness=.18, emission=(.03, .8, 1)),
        mat("port navigation light", (.8, .025, .01), roughness=.2, emission=(1, .01, 0)),
    )


def build_nereid():
    reset()
    ivory, edge, coral, glass, cyan, red = palette()
    root = bpy.data.objects.new("nereid-micro-sub", None)
    bpy.context.collection.objects.link(root)
    uv("hydrodynamic-hull", (0, 0, 0), (1.08, 1.0, 2.7), ivory, 48, 24)
    uv("canopy", (0, .36, -1.92), (.75, .67, 1.05), glass, 40, 20)
    torus("canopy-pressure-seal", (0, .29, -1.75), .79, .075, edge)
    curve("orange-keel-stripe", [(-.83, -.18, -1.45), (-.94, -.22, 0), (-.65, -.16, 1.75)], .075, coral)
    curve("orange-keel-stripe-r", [(.83, -.18, -1.45), (.94, -.22, 0), (.65, -.16, 1.75)], .075, coral)
    for side in (-1, 1):
        x = side * 1.16
        cylinder(f"thruster-{side}", (x, 0, .9), .36, 1.28, edge, vertices=32)
        torus(f"thruster-shroud-{side}", (x, 0, .24), .36, .075, coral)
        cylinder(f"thruster-core-{side}", (x, 0, .22), .17, .09, cyan, vertices=24)
        fin_mesh(f"manta-fin-{side}", [(side*.72, 0, -.2), (side*2.15, -.03, .3),
                 (side*1.75, -.02, 1.08), (side*.72, 0, .72), (side*.72, .11, -.2),
                 (side*2.15, .06, .3), (side*1.75, .07, 1.08), (side*.72, .11, .72)], ivory)
        uv(f"nav-light-{side}", (side*.91, .28, -1.38), (.07, .07, .16), red if side < 0 else cyan, 16, 8)
    cube("dorsal-sensor", (0, 1.02, .25), (.11, .32, .62), edge, .06, (.22, 0, 0))
    uv("sensor-pearl", (0, 1.17, -.35), (.18, .18, .22), cyan, 20, 10)
    torus("aft-service-ring", (0, 0, 1.5), .86, .085, coral)
    parent_all(root)
    export(root, "nereid-micro-sub")


def build_lifepod():
    reset()
    ivory, edge, coral, glass, cyan, red = palette()
    root = bpy.data.objects.new("damaged-lifepod", None)
    bpy.context.collection.objects.link(root)
    uv("pressure-shell", (0, 0, 0), (3.25, 1.95, 3.05), ivory, 48, 24)
    uv("lower-heat-shield", (0, -1.08, .2), (3.12, .92, 2.82), edge, 40, 16)
    torus("equatorial-rescue-band", (0, 0, 0), 3.0, .22, coral, (pi / 2, 0, 0))
    torus("forward-hatch-frame", (0, .22, -2.82), 1.08, .17, edge)
    cylinder("forward-hatch", (0, .22, -2.92), .89, .16, coral, vertices=40)
    for side in (-1, 1):
        uv(f"observation-window-{side}", (side*2.17, .57, -1.12), (.72, .48, .84), glass, 32, 16)
        curve(f"roll-cage-{side}", [(side*2.72, -1.1, -1.6), (side*3.28, 0, 0),
              (side*2.75, .9, 1.7)], .12, edge)
        cylinder(f"landing-shock-{side}", (side*2.25, -1.72, .7), .16, 2.1, edge,
                 (pi / 2, 0, .18*side), 20)
        cube(f"landing-foot-{side}", (side*2.45, -2.57, .85), (.65, .12, .34), edge, .1)
    curve("antenna", [(1.4, 1.62, .65), (1.55, 2.65, .7), (1.72, 3.4, .82)], .07, edge)
    uv("distress-beacon", (1.72, 3.43, .82), (.18, .18, .18), red, 20, 10)
    for x in (-1.35, 0, 1.35):
        cube(f"shell-rib-{x}", (x, 1.71, .52), (.09, .15, 1.35), coral, .045, (0, 0, -.12*x))
    parent_all(root)
    export(root, "damaged-lifepod")


def export(root, name):
    bpy.context.view_layer.objects.active = root
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / f"{name}.blend"))
    bpy.ops.export_scene.gltf(filepath=str(OUT / f"{name}.glb"), export_format='GLB',
                              export_apply=True, export_yup=True)


build_nereid()
build_lifepod()
