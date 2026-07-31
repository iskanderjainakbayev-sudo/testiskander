from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "assets" / "models" / "ocean" / "fish"
CREATURES = [
    ("lantern-sprat", 0x8DFFF1, 0x36BBAA, "fish", False),
    ("mosaic-shellwing", 0xFFB96B, 0x6B3011, "fish", False),
    ("bubblefin", 0xBDA4FF, 0x4E2B8F, "round", False),
    ("sunveil-ray", 0xFFF09A, 0x7E6A18, "ray", False),
    ("volt-ribbon", 0x65DBFF, 0x146FBA, "eel", False),
    ("rootback-crab", 0xC87556, 0x46190D, "crab", False),
    ("needle-dart", 0xA9FF77, 0x3C7C21, "needle", False),
    ("night-kite", 0x6F86C9, 0x243467, "ray", False),
    ("reef-fang", 0xFF7B4E, 0x8F2418, "fish", True),
    ("rift-stalker", 0xF05F54, 0x6F130E, "shark", True),
    ("ink-maw", 0x7532A5, 0x341050, "round", True),
    ("glassjaw", 0x8BC5D2, 0x2B6877, "shark", True),
]


def rgb(value):
    return tuple(((value >> shift) & 255) / 255 for shift in (16, 8, 0))


def mat(name, color, emission=0):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*rgb(color), 1)
    material.use_nodes = True
    node = material.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value = (*rgb(color), 1)
    node.inputs["Roughness"].default_value = 0.3
    node.inputs["Metallic"].default_value = 0.08
    if emission:
        node.inputs["Emission Color"].default_value = (*rgb(emission), 1)
        node.inputs["Emission Strength"].default_value = 2.8
    return material


def sphere(name, location, scale, material):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return obj


def cone(name, location, scale, rotation, material, vertices=5):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=1, radius2=0, depth=2, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.rotation_euler = rotation
    obj.data.materials.append(material)
    return obj


def parent(obj, root):
    obj.parent = root
    return obj


def eyes(root, eye_mat, wide=0.48, forward=-1.25):
    for side in (-1, 1):
        parent(sphere(f"eye-{side}", (side * wide, forward, 0.18), (0.12, 0.08, 0.12), eye_mat), root)


def fish(root, skin, glow, eye_mat, hostile, shape):
    scales = {"round": (0.86, 1.16, 0.78), "needle": (0.38, 1.85, 0.38), "shark": (0.72, 1.85, 0.62)}
    parent(sphere("body", (0, 0, 0), scales.get(shape, (0.72, 1.48, 0.58)), skin), root)
    eyes(root, eye_mat, 0.45 if shape != "needle" else 0.25, -1.2 if shape != "shark" else -1.55)
    parent(cone("swim-tail", (0, 1.65, 0), (0.72, 0.18, 0.7), (0, 0, 0), skin, 3), root)
    for side in (-1, 1):
        parent(cone(f"swim-fin-{side}", (side * 0.65, 0.05, -0.05), (0.45, 0.62, 0.09), (0, 0, side * 0.8), skin, 3), root)
    for offset in (-0.45, 0.18, 0.7):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.62, minor_radius=0.035, location=(0, offset, 0))
        ring = bpy.context.object
        ring.name = "biolight-ring"
        ring.rotation_euler[0] = 1.5708
        ring.data.materials.append(glow)
        parent(ring, root)
    if hostile:
        for tooth in range(-2, 3):
            parent(cone(f"fang-{tooth}", (tooth * 0.13, -1.52, -0.18), (0.055, 0.16, 0.055), (1.5708, 0, 0), eye_mat, 5), root)


def ray(root, skin, glow, eye_mat):
    parent(sphere("body", (0, 0, 0), (1.5, 1.22, 0.18), skin), root)
    for side in (-1, 1):
        parent(cone(f"swim-fin-{side}", (side * 1.15, 0, 0), (1.25, 1.0, 0.08), (0, 0, side * 1.5708), skin, 3), root)
    parent(cone("swim-tail", (0, 2.2, 0), (0.13, 1.6, 0.13), (0, 0, 0), skin, 8), root)
    parent(sphere("ray-glow", (0, -0.3, 0.19), (0.65, 0.55, 0.03), glow), root)
    eyes(root, eye_mat, 0.42, -0.95)


def eel(root, skin, glow, eye_mat):
    for index in range(9):
        taper = 1 - index * 0.075
        parent(sphere(f"eel-segment-{index:02d}", (0, index * 0.55, 0), (0.42 * taper, 0.55, 0.38 * taper), skin), root)
    parent(sphere("eel-glow", (0, 0, 0.36), (0.2, 2.1, 0.04), glow), root)
    eyes(root, eye_mat, 0.28, -0.42)


def crab(root, skin, glow, eye_mat):
    parent(sphere("shell", (0, 0, 0), (1.05, 0.8, 0.42), skin), root)
    parent(sphere("shell-glow", (0, 0, 0.4), (0.52, 0.42, 0.05), glow), root)
    eyes(root, eye_mat, 0.38, -0.65)
    for side in (-1, 1):
        for leg in range(3):
            parent(cone(f"leg-{side}-{leg}", (side * (0.85 + leg * 0.08), -0.25 + leg * 0.35, -0.18), (0.12, 0.58, 0.12), (0, side * 0.65, side * 1.1), skin, 6), root)
        parent(cone(f"claw-{side}", (side * 1.25, -0.72, 0), (0.38, 0.55, 0.3), (0, 0, side * 0.5), skin, 5), root)


def build(asset_id, color, emissive, kind, hostile):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    root = bpy.data.objects.new(asset_id, None)
    bpy.context.collection.objects.link(root)
    skin = mat(f"{asset_id}-scales", color, emissive)
    glow = mat(f"{asset_id}-biolight", emissive, emissive)
    eye_mat = mat(f"{asset_id}-eyes", 0xFF4A35 if hostile else 0xEFFFFF, 0xFF1600 if hostile else 0xAFFFFF)
    if kind == "ray": ray(root, skin, glow, eye_mat)
    elif kind == "eel": eel(root, skin, glow, eye_mat)
    elif kind == "crab": crab(root, skin, glow, eye_mat)
    else: fish(root, skin, glow, eye_mat, hostile, kind)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT / f"{asset_id}.blend"))
    bpy.ops.export_scene.gltf(filepath=str(OUTPUT / f"{asset_id}.glb"), export_format="GLB", export_apply=True)


for creature in CREATURES:
    build(*creature)
