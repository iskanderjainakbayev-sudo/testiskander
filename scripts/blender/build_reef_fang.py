from pathlib import Path
import math
import sys
import bpy

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from ocean_hero_utils import reset, mat, uv, curve, fin_mesh, parent_all

ROOT = HERE.parents[1]
OUT = ROOT / "assets" / "models" / "ocean" / "fish"
bpy.context.preferences.filepaths.save_version = 0


def loft(name, profile, material, sides=28):
    vertices = []
    for y, width, depth, lift in profile:
        for index in range(sides):
            angle = index * math.tau / sides
            vertices.append((math.sin(angle) * width, y, lift + math.cos(angle) * depth))
    faces = []
    for ring in range(len(profile) - 1):
        for side in range(sides):
            nxt = (side + 1) % sides
            faces.append((ring*sides+side, ring*sides+nxt,
                          (ring+1)*sides+nxt, (ring+1)*sides+side))
    faces += [tuple(range(sides - 1, -1, -1)),
              tuple((len(profile)-1)*sides + side for side in range(sides))]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(material)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bevel = obj.modifiers.new("subdermal smoothing", 'BEVEL')
    bevel.width, bevel.segments = .035, 2
    return obj


def pivot_fin(name, vertices, material, root):
    pivot = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(pivot)
    pivot.parent = root
    blade = fin_mesh(f"{name}-blade", vertices, material)
    blade.parent = pivot
    return pivot


def build():
    reset()
    skin = mat("reef-fang lacquered scales", (.64, .09, .025), metallic=.12, roughness=.29)
    armor = mat("reef-fang volcanic armor", (.11, .018, .012), metallic=.3, roughness=.36)
    fin = mat("reef-fang translucent fins", (.92, .16, .035), roughness=.22,
              emission=(.22, .018, .003), alpha=.88)
    glow = mat("reef-fang sensory organs", (1, .26, .04), roughness=.15,
               emission=(1, .055, .008))
    tooth = mat("reef-fang pressure ivory", (.78, .72, .52), roughness=.27)
    eye = mat("reef-fang eyes", (.025, .006, .003), roughness=.08,
              emission=(1, .035, .005))
    root = bpy.data.objects.new("reef-fang", None)
    root["display_name"], root["body_plan"], root["hostile"] = "Reef Fang", "fish", True
    bpy.context.collection.objects.link(root)
    body = loft("continuous-hatchet-body", [(-1.72,.12,.12,.02), (-1.48,.48,.42,.03),
        (-1.0,.78,.72,.1), (-.38,.84,.82,.12), (.3,.65,.64,.08),
        (.92,.38,.4,.02), (1.45,.12,.15,0)], skin)
    body.parent = root
    jaw = loft("armored-lower-jaw", [(-1.7,.08,.04,-.14), (-1.5,.47,.14,-.22),
                (-1.02,.53,.17,-.26), (-.72,.25,.08,-.18)], armor, 20)
    jaw.parent = root
    for side in (-1, 1):
        uv(f"weak-point-eye-{side}", (side*.62, -1.18, .31), (.08,.16,.15), eye, 20, 10).parent = root
        curve(f"emissive-gill-{side}", [(side*.72,-.83,.18), (side*.78,-.67,.08),
              (side*.75,-.51,-.04)], .028, glow).parent = root
        for plate in range(5):
            uv(f"cheek-scale-{side}-{plate}", (side*(.75-.045*plate), -.57+plate*.27,
               .28+math.sin(plate)*.12), (.055,.18,.15), armor, 16, 8).parent = root
        pivot_fin(f"swim-fin-{side}", [(side*.5,-.25,-.05),(side*1.28,-.05,-.35),
          (side*1.02,.42,-.12),(side*.52,.2,.02),(side*.5,-.25,.01),(side*1.28,-.05,-.29),
          (side*1.02,.42,-.06),(side*.52,.2,.08)], fin, root)
        pivot_fin(f"split-fin-{side}", [(side*.42,.35,.18),(side*1.02,.68,.38),
          (side*.56,.9,.2),(side*.42,.55,.14),(side*.42,.35,.22),(side*1.02,.68,.44),
          (side*.56,.9,.26),(side*.42,.55,.2)], armor, root)
    pivot_fin("dorsal-fin", [(-.05,-.4,.62),(-.08,.1,1.42),(-.07,.76,.58),(-.05,.5,.48),
        (.05,-.4,.62),(.08,.1,1.42),(.07,.76,.58),(.05,.5,.48)], fin, root)
    tail = pivot_fin("swim-tail", [(-.05,1.28,0),(-.82,2.05,.48),(-.34,1.84,0),(-.72,2.08,-.5),
        (.05,1.28,0),(.82,2.05,.48),(.34,1.84,0),(.72,2.08,-.5)], fin, root)
    tail.location.y = .1
    for tooth_index in range(-4, 5):
        bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=.045, depth=.28,
          location=(tooth_index*.105, -1.72+abs(tooth_index)*.015, -.09), rotation=(math.pi/2,0,0))
        fang = bpy.context.object
        fang.name, fang.parent = f"fang-{tooth_index}", root
        fang.data.materials.append(tooth)
    parent_all(root)
    OUT.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "reef-fang.blend"), compress=True)
    bpy.ops.export_scene.gltf(filepath=str(OUT / "reef-fang.glb"), export_format='GLB', export_apply=True)


build()
