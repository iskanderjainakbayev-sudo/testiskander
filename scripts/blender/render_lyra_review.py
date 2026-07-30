"""Render isolated LYRA hero-model review angles with procedural studio lighting."""

from __future__ import annotations

import math
from pathlib import Path

import bpy
from mathutils import Vector

OUTPUT_DIR = Path("/tmp/lyra-review")


def look_at(obj: bpy.types.Object, target: tuple[float, float, float]) -> None:
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def area_light(
    name: str,
    location: tuple[float, float, float],
    target: tuple[float, float, float],
    color: tuple[float, float, float],
    energy: float,
    size: float,
) -> None:
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.color = color
    data.shape = "DISK"
    data.size = size
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    look_at(obj, target)


def hide_runtime_helpers(root: bpy.types.Object) -> None:
    for name in ("LOD1_DISTANCE", "COLLIDER_SIMPLE"):
        node = next((child for child in root.children if child.name == name), None)
        if node is None:
            continue
        node.hide_render = True
        for child in node.children_recursive:
            child.hide_render = True


def add_stars() -> None:
    mesh = bpy.data.meshes.new("Review_Stars_Mesh")
    vertices = []
    for index in range(1400):
        longitude = (index * 2.399963229728653) % math.tau
        latitude = math.acos(1.0 - 2.0 * ((index + 0.5) / 1400.0))
        radius = 180.0
        vertices.append(
            (
                radius * math.sin(latitude) * math.cos(longitude),
                radius * math.sin(latitude) * math.sin(longitude),
                radius * math.cos(latitude),
            )
        )
    mesh.from_pydata(vertices, [], [])
    stars = bpy.data.objects.new("Review_Stars", mesh)
    bpy.context.scene.collection.objects.link(stars)
    material = bpy.data.materials.new("Review_Stars_Material")
    material.diffuse_color = (0.7, 0.82, 1.0, 1.0)
    material.use_nodes = True
    shader = next(node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    shader.inputs["Base Color"].default_value = (0.55, 0.72, 1.0, 1.0)
    emission = shader.inputs.get("Emission Color") or shader.inputs.get("Emission")
    if emission:
        emission.default_value = (0.55, 0.72, 1.0, 1.0)
    mesh.materials.append(material)


def configure_scene() -> bpy.types.Object:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 960
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    scene.render.image_settings.color_depth = "8"
    scene.view_settings.exposure = 1.15
    scene.world.color = (0.001, 0.002, 0.006)
    world = scene.world
    world.use_nodes = True
    background = next(node for node in world.node_tree.nodes if node.type == "BACKGROUND")
    background.inputs["Color"].default_value = (0.001, 0.003, 0.009, 1.0)
    background.inputs["Strength"].default_value = 0.12
    camera_data = bpy.data.cameras.new("Review_Camera")
    camera_data.lens = 55.0
    camera_data.sensor_width = 36.0
    camera = bpy.data.objects.new("Review_Camera", camera_data)
    bpy.context.scene.collection.objects.link(camera)
    scene.camera = camera
    area_light("Key_Softbox", (34.0, 28.0, 38.0), (0.0, 0.0, 0.0), (0.78, 0.88, 1.0), 52000, 18.0)
    area_light("Port_Fill", (-35.0, 5.0, 14.0), (-2.0, 0.0, 0.0), (0.22, 0.42, 1.0), 34000, 22.0)
    area_light("Engine_Rim", (4.0, -42.0, 13.0), (0.0, -8.0, 0.0), (1.0, 0.18, 0.035), 46000, 13.0)
    area_light("Belly_Bounce", (0.0, 2.0, -30.0), (0.0, 0.0, -1.0), (0.12, 0.32, 0.48), 26000, 20.0)
    add_stars()
    return camera


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    root = bpy.data.objects.get("LYRA_EXPLORER_65M")
    if root is None:
        raise RuntimeError("LYRA source scene is not loaded")
    hide_runtime_helpers(root)
    camera = configure_scene()
    views = {
        "three-quarter-front": ((47.0, 55.0, 25.0), (0.0, 2.0, 0.2), 61.0),
        "port-profile": ((-62.0, 1.0, 11.0), (0.0, 0.0, 0.0), 62.0),
        "rear-engines": ((39.0, -68.0, 17.0), (0.0, -14.0, -0.4), 62.0),
        "dorsal": ((38.0, 22.0, 90.0), (0.0, 0.0, 0.0), 52.0),
        "landed-gear": ((55.0, 46.0, 10.0), (0.0, 2.0, -2.0), 58.0),
    }
    for name, (location, target, lens) in views.items():
        camera.location = location
        camera.data.lens = lens
        look_at(camera, target)
        bpy.context.scene.render.filepath = str(OUTPUT_DIR / f"lyra-{name}.png")
        bpy.ops.render.render(write_still=True)
        print("LYRA_REVIEW_FRAME", bpy.context.scene.render.filepath)


if __name__ == "__main__":
    main()
