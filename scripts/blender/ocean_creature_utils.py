import bpy
from mathutils import Vector


def rgb(value):
    return tuple(((value >> shift) & 255) / 255 for shift in (16, 8, 0))


def material(name, color, emission=None, strength=0.0, metallic=0.0, roughness=0.38):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb(color), 1)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value = (*rgb(color), 1)
    node.inputs["Roughness"].default_value = roughness
    node.inputs["Metallic"].default_value = metallic
    if "Coat Weight" in node.inputs:
        node.inputs["Coat Weight"].default_value = 0.32
        node.inputs["Coat Roughness"].default_value = 0.22
    if emission is not None:
        node.inputs["Emission Color"].default_value = (*rgb(emission), 1)
        node.inputs["Emission Strength"].default_value = strength
    return mat


def parent(obj, root):
    obj.parent = root
    return obj


def empty(name, location=(0, 0, 0), root=None):
    obj = bpy.data.objects.new(name, None)
    obj.location = location
    bpy.context.collection.objects.link(obj)
    return parent(obj, root) if root else obj


def uv(name, location, scale, mat, segments=24, rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def cone(name, location, scale, rotation, mat, vertices=12):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=1, radius2=0, depth=2, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.rotation_euler = rotation
    obj.data.materials.append(mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def fin(name, location, scale, rotation, mat, root):
    pivot = empty(name, location, root)
    blade = cone(f"{name}-blade", (0, 0, 0), scale, rotation, mat, 3)
    parent(blade, pivot)
    return pivot


def eyes(root, eye_mat, pupil_mat, wide=.46, forward=-1.12, height=.16, size=.12):
    for side in (-1, 1):
        parent(uv(f"weak-point-eye-{side}", (side * wide, forward, height), (size, .075, size), eye_mat, 16, 8), root)
        parent(uv(f"pupil-{side}", (side * wide, forward - .073, height),
                  (size * .48, .014, size * .56), pupil_mat, 12, 6), root)


def tail(root, skin, location=(0, 1.42, 0), size=1.0):
    pivot = empty("swim-tail", location, root)
    for side in (-1, 1):
        parent(cone(f"tail-lobe-{side}", (side * .23 * size, .38 * size, 0),
                    (.48 * size, .62 * size, .08 * size), (0, 0, side * .34), skin, 3), pivot)
    return pivot


def glowing_spots(root, glow, count=5, length=1.3, width=.55):
    for index in range(count):
        y = -.75 + index * (length / max(1, count - 1))
        side = -1 if index % 2 else 1
        parent(uv(f"biolight-{index}", (side * width, y, .08), (.055, .035, .035), glow, 10, 6), root)
