"""Render isolated LYRA hero-model review angles with procedural studio lighting."""

from __future__ import annotations

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


def _ground_plane() -> bpy.types.Object:
    bpy.ops.mesh.primitive_plane_add(size=180.0, location=(0.0, 0.0, -8.02))
    ground = bpy.context.object
    ground.name = "Review_NeutralGround"
    material = bpy.data.materials.new("Review_NeutralGround_Material")
    material.use_nodes = True
    shader = next(node for node in material.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    shader.inputs["Base Color"].default_value = (0.024, 0.028, 0.034, 1.0)
    shader.inputs["Metallic"].default_value = 0.12
    shader.inputs["Roughness"].default_value = 0.68
    ground.data.materials.append(material)
    ground.hide_render = True
    return ground


def _gradient_world() -> None:
    world = bpy.context.scene.world
    world.use_nodes = True
    nodes = world.node_tree.nodes
    nodes.clear()
    output = nodes.new("ShaderNodeOutputWorld")
    background = nodes.new("ShaderNodeBackground")
    coordinates = nodes.new("ShaderNodeTexCoord")
    separate = nodes.new("ShaderNodeSeparateXYZ")
    map_range = nodes.new("ShaderNodeMapRange")
    ramp = nodes.new("ShaderNodeValToRGB")
    map_range.inputs["From Min"].default_value = -1.0
    map_range.inputs["From Max"].default_value = 1.0
    ramp.color_ramp.elements[0].color = (0.012, 0.018, 0.028, 1.0)
    ramp.color_ramp.elements[1].color = (0.16, 0.19, 0.23, 1.0)
    background.inputs["Strength"].default_value = 0.24
    world.node_tree.links.new(coordinates.outputs["Normal"], separate.inputs["Vector"])
    world.node_tree.links.new(separate.outputs["Z"], map_range.inputs["Value"])
    world.node_tree.links.new(map_range.outputs["Result"], ramp.inputs["Fac"])
    world.node_tree.links.new(ramp.outputs["Color"], background.inputs["Color"])
    world.node_tree.links.new(background.outputs["Background"], output.inputs["Surface"])


def configure_scene() -> tuple[bpy.types.Object, bpy.types.Object]:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 960
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    scene.render.image_settings.color_depth = "8"
    scene.view_settings.exposure = 1.02
    _gradient_world()
    camera_data = bpy.data.cameras.new("Review_Camera")
    camera_data.lens = 55.0
    camera_data.sensor_width = 36.0
    camera = bpy.data.objects.new("Review_Camera", camera_data)
    bpy.context.scene.collection.objects.link(camera)
    scene.camera = camera
    area_light("Key_Softbox", (34.0, 28.0, 38.0), (0.0, 0.0, 0.0), (1.0, 0.95, 0.88), 76000, 22.0)
    area_light("Port_Fill", (-35.0, 5.0, 14.0), (-2.0, 0.0, 0.0), (0.53, 0.66, 0.82), 52000, 26.0)
    area_light("Top_Ambient", (0.0, 3.0, 55.0), (0.0, 0.0, 0.0), (0.82, 0.88, 0.94), 68000, 30.0)
    area_light("Engine_Rim", (4.0, -42.0, 13.0), (0.0, -8.0, 0.0), (1.0, 0.52, 0.22), 34000, 15.0)
    area_light("Belly_Bounce", (0.0, 2.0, -30.0), (0.0, 0.0, -1.0), (0.30, 0.42, 0.54), 24000, 22.0)
    return camera, _ground_plane()


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    root = bpy.data.objects.get("LYRA_EXPLORER_65M")
    if root is None:
        raise RuntimeError("LYRA source scene is not loaded")
    hide_runtime_helpers(root)
    camera, ground = configure_scene()
    views = {
        "three-quarter-front": ((47.0, 55.0, 25.0), (0.0, 2.0, 0.2), 61.0),
        "port-profile": ((-62.0, 1.0, 11.0), (0.0, 0.0, 0.0), 62.0),
        "rear-engines": ((39.0, -68.0, 17.0), (0.0, -14.0, -0.4), 62.0),
        "dorsal": ((38.0, 22.0, 90.0), (0.0, 0.0, 0.0), 52.0),
        "landed-gear": ((55.0, 46.0, 10.0), (0.0, 2.0, -2.0), 58.0),
    }
    for name, (location, target, lens) in views.items():
        ground.hide_render = name != "landed-gear"
        camera.location = location
        camera.data.lens = lens
        look_at(camera, target)
        bpy.context.scene.render.filepath = str(OUTPUT_DIR / f"lyra-{name}.png")
        bpy.ops.render.render(write_still=True)
        print("LYRA_REVIEW_FRAME", bpy.context.scene.render.filepath)


if __name__ == "__main__":
    main()
