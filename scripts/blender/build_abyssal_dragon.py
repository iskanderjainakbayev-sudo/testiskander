from pathlib import Path
import math
import bpy

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "assets" / "models" / "ocean"


def material(name, color, metallic=0.0, emission=None):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value = (*color, 1)
    node.inputs["Metallic"].default_value = metallic
    node.inputs["Roughness"].default_value = 0.32
    if emission:
        node.inputs["Emission Color"].default_value = (*emission, 1)
        node.inputs["Emission Strength"].default_value = 4.5
    return mat


def sphere(name, location, scale, mat, segments=20):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj


def cone(name, location, scale, rotation, mat, vertices=7):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=1, radius2=0, depth=2, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.rotation_euler = rotation
    obj.data.materials.append(mat)
    return obj


def build():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    skin = material("Abyss Scales", (0.018, 0.045, 0.10), 0.38, (0.02, 0.16, 0.46))
    belly = material("Ancient Belly", (0.08, 0.16, 0.22), 0.18)
    glow = material("Rift Biolight", (0.03, 0.35, 0.58), 0.1, (0.04, 0.55, 1.0))
    eye = material("Dragon Eyes", (1.0, 0.16, 0.03), 0.0, (1.0, 0.03, 0.0))
    bone = material("Pressure Ivory", (0.66, 0.78, 0.77), 0.05)

    root = bpy.data.objects.new("Abyssal Dragon", None)
    bpy.context.collection.objects.link(root)
    for index in range(18):
        t = index / 17
        radius = 1.55 * (1 - t * 0.76)
        segment = sphere(
            f"dragon-segment-{index:02d}",
            (0, math.sin(index * 0.52) * 0.16, -2.1 - index * 1.25),
            (radius, radius * 0.72, 1.05),
            skin,
        )
        segment.parent = root
        if index % 2 == 0:
            crest = cone(
                f"dragon-crest-{index:02d}",
                (0, radius * 0.72, -2.1 - index * 1.25),
                (0.28 * (1 - t * 0.5), 0.65 * (1 - t * 0.45), 0.17),
                (math.pi / 2, 0, 0),
                glow,
            )
            crest.parent = segment

    head = sphere("dragon-head", (0, 0.15, 0), (2.0, 1.35, 2.35), skin)
    head.parent = root
    snout = sphere("dragon-snout", (0, -0.12, 1.72), (1.32, 0.72, 1.15), belly)
    snout.parent = root
    for side in (-1, 1):
        eye_obj = sphere(f"dragon-eye-{side}", (side * 1.12, 0.48, 1.12), (0.25, 0.2, 0.16), eye, 12)
        eye_obj.parent = root
        horn = cone(
            f"dragon-horn-{side}",
            (side * 1.15, 1.0, -0.45),
            (0.3, 0.3, 1.25),
            (-0.35, side * 0.32, 0),
            bone,
        )
        horn.parent = root
        fin = cone(
            f"dragon-fin-{side}",
            (side * 1.8, -0.1, -2.0),
            (0.8, 1.9, 0.16),
            (0, 0, side * 1.2),
            glow,
        )
        fin.parent = root

    for side in (-1, 1):
        for tooth in range(4):
            fang = cone(
                f"dragon-fang-{side}-{tooth}",
                (side * (0.25 + tooth * 0.23), -0.58, 2.5),
                (0.11, 0.11, 0.38),
                (math.pi / 2, 0, 0),
                bone,
                6,
            )
            fang.parent = root

    root.scale = (0.78, 0.78, 0.78)
    bpy.context.view_layer.objects.active = root
    root.select_set(True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT / "abyssal-dragon.blend"))
    bpy.ops.export_scene.gltf(
        filepath=str(OUTPUT / "abyssal-dragon.glb"),
        export_format="GLB",
        export_apply=True,
        export_yup=True,
    )


build()
