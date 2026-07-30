"""Procedural texture atlas and browser-safe PBR materials for LYRA."""

from __future__ import annotations

import bpy

from lyra_texture_atlas import create_texture_atlases


def _socket(shader: bpy.types.ShaderNodeBsdfPrincipled, names: tuple[str, ...]):
    for name in names:
        if name in shader.inputs:
            return shader.inputs[name]
    return None


def _material(
    name: str,
    color: tuple[float, float, float, float],
    metallic: float,
    roughness: float,
    atlases: dict[str, bpy.types.Image] | None = None,
    emission: tuple[float, float, float] | None = None,
    emission_strength: float = 0.0,
) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.diffuse_color = color
    nodes = material.node_tree.nodes
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Base Color"].default_value = color
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    if atlases is not None:
        color_texture = nodes.new("ShaderNodeTexImage")
        color_texture.name = "LYRA shared color atlas"
        color_texture.image = atlases["color"]
        rough_texture = nodes.new("ShaderNodeTexImage")
        rough_texture.name = "LYRA shared roughness atlas"
        rough_texture.image = atlases["roughness"]
        normal_texture = nodes.new("ShaderNodeTexImage")
        normal_texture.name = "LYRA shared tangent normal atlas"
        normal_texture.image = atlases["normal"]
        normal_map = nodes.new("ShaderNodeNormalMap")
        normal_map.inputs["Strength"].default_value = 0.34
        material.node_tree.links.new(color_texture.outputs["Color"], shader.inputs["Base Color"])
        material.node_tree.links.new(rough_texture.outputs["Color"], shader.inputs["Roughness"])
        material.node_tree.links.new(normal_texture.outputs["Color"], normal_map.inputs["Color"])
        material.node_tree.links.new(normal_map.outputs["Normal"], shader.inputs["Normal"])
    if emission is not None:
        emission_socket = _socket(shader, ("Emission Color", "Emission"))
        strength_socket = _socket(shader, ("Emission Strength",))
        if emission_socket:
            emission_socket.default_value = (*emission, 1.0)
        if strength_socket:
            strength_socket.default_value = emission_strength
    material.node_tree.links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return material


def create_materials() -> dict[str, bpy.types.Material]:
    atlases = create_texture_atlases()
    materials = {
        "hull": _material("MAT_LYRA_Hull_Ivory", (0.57, 0.56, 0.52, 1), 0.10, 0.62, atlases),
        "armor": _material("MAT_LYRA_Armor_Graphite", (0.20, 0.22, 0.23, 1), 0.45, 0.50, atlases),
        "metal": _material("MAT_LYRA_Metal_Satin", (0.11, 0.13, 0.14, 1), 0.84, 0.42),
        "glass": _material("MAT_LYRA_Canopy_Glass", (0.008, 0.027, 0.035, 1), 0.15, 0.07),
        "heat": _material("MAT_LYRA_Heat_Ceramic", (0.10, 0.075, 0.055, 1), 0.68, 0.41, atlases),
        "cyan": _material(
            "MAT_LYRA_Emission_Cyan", (0.01, 0.22, 0.31, 1), 0.35, 0.18, emission=(0.0, 0.78, 1.0), emission_strength=5.0
        ),
        "amber": _material(
            "MAT_LYRA_Emission_Amber", (0.26, 0.055, 0.006, 1), 0.28, 0.26, emission=(1.0, 0.075, 0.004), emission_strength=3.0
        ),
        "radiator": _material("MAT_LYRA_Radiator_Copper", (0.13, 0.040, 0.016, 1), 0.84, 0.46, atlases),
    }
    glass = materials["glass"]
    glass.surface_render_method = "DITHERED"
    shader = next(node for node in glass.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    shader.inputs["Alpha"].default_value = 0.58
    transmission = _socket(shader, ("Transmission Weight", "Transmission"))
    coat = _socket(shader, ("Coat Weight", "Clearcoat"))
    if transmission:
        transmission.default_value = 0.34
    if coat:
        coat.default_value = 0.42
    return materials


ATLAS_REGIONS = {
    "hull": (0.02, 0.52, 0.46, 0.46),
    "armor": (0.52, 0.52, 0.46, 0.46),
    "heat": (0.02, 0.02, 0.46, 0.46),
    "radiator": (0.52, 0.02, 0.46, 0.46),
}


def atlas_uv(obj: bpy.types.Object, region: str) -> None:
    if obj.type != "MESH" or region not in ATLAS_REGIONS:
        return
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    if not obj.data.uv_layers:
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.uv.smart_project(angle_limit=1.1519, island_margin=0.025)
        bpy.ops.object.mode_set(mode="OBJECT")
    uv_data = obj.data.uv_layers.active.data
    min_u = min(loop.uv.x for loop in uv_data)
    max_u = max(loop.uv.x for loop in uv_data)
    min_v = min(loop.uv.y for loop in uv_data)
    max_v = max(loop.uv.y for loop in uv_data)
    span_u, span_v = max(max_u - min_u, 1e-5), max(max_v - min_v, 1e-5)
    off_u, off_v, size_u, size_v = ATLAS_REGIONS[region]
    for loop in uv_data:
        loop.uv.x = off_u + ((loop.uv.x - min_u) / span_u) * size_u
        loop.uv.y = off_v + ((loop.uv.y - min_v) / span_v) * size_v
    obj.select_set(False)
