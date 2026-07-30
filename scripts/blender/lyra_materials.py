"""Procedural texture atlas and browser-safe PBR materials for LYRA."""

from __future__ import annotations

import math
from array import array

import bpy

ATLAS_SIZE = 1024


def _noise(x: int, y: int) -> float:
    return (
        math.sin(x * 0.071 + y * 0.013)
        + math.sin(x * 0.017 - y * 0.053)
        + math.sin((x + y) * 0.031)
    ) / 3.0


def _atlas_color(x: int, y: int) -> tuple[float, float, float]:
    half = ATLAS_SIZE // 2
    u, v = x % half, y % half
    grain = _noise(x, y)
    seam = u % 128 < 3 or v % 112 < 3
    scratch = (x * 37 + y * 17) % 997 < 2
    if x < half and y >= half:
        base = 0.61 + grain * 0.022
        wear = -0.11 if seam else 0.0
        fleck = 0.08 if scratch else 0.0
        return base + 0.12 + wear + fleck, base + 0.11 + wear, base + 0.08 + wear
    if x >= half and y >= half:
        weave = 0.018 * math.sin((u + v) * 0.22) * math.sin((u - v) * 0.19)
        line = 0.035 if seam else 0.0
        return 0.045 + grain * 0.012 + line, 0.055 + weave + line, 0.063 + weave
    if x < half:
        radial = math.hypot(u - half * 0.5, v - half * 0.5) / (half * 0.72)
        heat = max(0.0, 1.0 - radial) * 0.11
        soot = 0.035 * (grain + 1.0)
        return 0.10 + heat + soot, 0.085 + heat * 0.45, 0.075 + heat * 0.18
    rib = 0.13 if u % 34 < 5 else 0.0
    oxidation = 0.025 * (grain + 1.0)
    return 0.26 + rib + oxidation, 0.105 + rib * 0.35, 0.045 + oxidation


def create_atlas() -> bpy.types.Image:
    image = bpy.data.images.new("TEX_LYRA_SurfaceAtlas_1K", ATLAS_SIZE, ATLAS_SIZE, alpha=True)
    pixels = array("f")
    append = pixels.extend
    for y in range(ATLAS_SIZE):
        for x in range(ATLAS_SIZE):
            r, g, b = _atlas_color(x, y)
            append((max(0.0, min(1.0, r)), max(0.0, min(1.0, g)), max(0.0, min(1.0, b)), 1.0))
    image.pixels.foreach_set(pixels)
    image.colorspace_settings.name = "sRGB"
    image.pack()
    return image


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
    atlas: bpy.types.Image | None = None,
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
    if atlas is not None:
        texture = nodes.new("ShaderNodeTexImage")
        texture.name = "LYRA shared procedural atlas"
        texture.image = atlas
        material.node_tree.links.new(texture.outputs["Color"], shader.inputs["Base Color"])
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
    atlas = create_atlas()
    materials = {
        "hull": _material("MAT_LYRA_Hull_Ivory", (0.66, 0.65, 0.60, 1), 0.58, 0.34, atlas),
        "armor": _material("MAT_LYRA_Armor_Graphite", (0.04, 0.05, 0.06, 1), 0.72, 0.30, atlas),
        "metal": _material("MAT_LYRA_Metal_Satin", (0.12, 0.15, 0.17, 1), 0.88, 0.22),
        "glass": _material("MAT_LYRA_Canopy_Glass", (0.008, 0.027, 0.035, 1), 0.15, 0.07),
        "heat": _material("MAT_LYRA_Heat_Ceramic", (0.10, 0.075, 0.055, 1), 0.76, 0.41, atlas),
        "cyan": _material(
            "MAT_LYRA_Emission_Cyan", (0.01, 0.22, 0.31, 1), 0.35, 0.18, emission=(0.0, 0.78, 1.0), emission_strength=6.0
        ),
        "amber": _material(
            "MAT_LYRA_Emission_Amber", (0.31, 0.10, 0.01, 1), 0.28, 0.24, emission=(1.0, 0.20, 0.01), emission_strength=8.0
        ),
        "radiator": _material("MAT_LYRA_Radiator_Copper", (0.30, 0.10, 0.035, 1), 0.91, 0.25, atlas),
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
