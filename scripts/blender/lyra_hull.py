"""Curved lifting-body hull and layered exterior shell for LYRA."""

from __future__ import annotations

import math

import bpy

from lyra_common import box, curve_tube, empty, finish_mesh, torus
from lyra_materials import atlas_uv

HULL_SECTIONS = (
    (-30.0, 2.8, 2.4, 2.2, -0.20, 2.1),
    (-27.0, 5.8, 3.2, 2.8, -0.15, 2.2),
    (-21.0, 8.8, 4.5, 3.8, -0.05, 2.45),
    (-12.0, 10.5, 5.0, 4.2, 0.00, 2.65),
    (0.0, 10.9, 5.1, 4.3, 0.05, 2.75),
    (11.0, 9.5, 4.8, 3.8, 0.18, 2.65),
    (21.0, 6.8, 4.0, 3.0, 0.40, 2.45),
    (28.0, 3.6, 2.6, 1.9, 0.55, 2.2),
    (32.3, 0.45, 0.55, 0.38, 0.45, 2.0),
)


def _section_at(y: float) -> tuple[float, float, float, float, float]:
    for left, right in zip(HULL_SECTIONS, HULL_SECTIONS[1:], strict=False):
        if left[0] <= y <= right[0]:
            mix = (y - left[0]) / (right[0] - left[0])
            return tuple(a + (b - a) * mix for a, b in zip(left[1:], right[1:], strict=True))
    return HULL_SECTIONS[0][1:] if y < HULL_SECTIONS[0][0] else HULL_SECTIONS[-1][1:]


def surface_point(y: float, angle: float, offset: float = 0.0) -> tuple[float, float, float]:
    radius_x, top, bottom, center_z, exponent = _section_at(y)
    cosine, sine = math.cos(angle), math.sin(angle)
    curve_x = math.copysign(abs(cosine) ** (2.0 / exponent), cosine)
    curve_z = math.copysign(abs(sine) ** (2.0 / exponent), sine)
    vertical = top if sine >= 0 else bottom
    x = (radius_x + offset) * curve_x
    z = center_z + (vertical + offset) * curve_z
    return x, y, z


def _grid_mesh(
    name: str,
    vertices: list[tuple[float, float, float]],
    row_count: int,
    column_count: int,
    parent: bpy.types.Object,
    material: bpy.types.Material,
    atlas_region: str | None,
    thickness: float = 0.0,
    bevel: float = 0.0,
) -> bpy.types.Object:
    faces = []
    for row in range(row_count - 1):
        for column in range(column_count - 1):
            a = row * column_count + column
            faces.append((a, a + 1, a + column_count + 1, a + column_count))
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    if thickness:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        solidify = obj.modifiers.new("Layered shell thickness", "SOLIDIFY")
        solidify.thickness = thickness
        solidify.offset = 0.0
        bpy.ops.object.modifier_apply(modifier=solidify.name)
        obj.select_set(False)
    finish_mesh(obj, parent, material, bevel, 2, smooth=True)
    if atlas_region:
        atlas_uv(obj, atlas_region)
    return obj


def loft_hull(
    name: str,
    sections: tuple[tuple[float, float, float, float, float, float], ...],
    radial_segments: int,
    parent: bpy.types.Object,
    material: bpy.types.Material,
) -> bpy.types.Object:
    vertices = []
    for y, radius_x, top, bottom, center_z, exponent in sections:
        for index in range(radial_segments):
            angle = math.tau * index / radial_segments
            cosine, sine = math.cos(angle), math.sin(angle)
            x = radius_x * math.copysign(abs(cosine) ** (2.0 / exponent), cosine)
            vertical = top if sine >= 0 else bottom
            z = center_z + vertical * math.copysign(abs(sine) ** (2.0 / exponent), sine)
            vertices.append((x, y, z))
    faces = []
    for ring in range(len(sections) - 1):
        for index in range(radial_segments):
            nxt = (index + 1) % radial_segments
            a = ring * radial_segments + index
            b = ring * radial_segments + nxt
            c = (ring + 1) * radial_segments + nxt
            d = (ring + 1) * radial_segments + index
            faces.append((a, b, c, d))
    faces.extend(
        [
            tuple(reversed(range(radial_segments))),
            tuple((len(sections) - 1) * radial_segments + i for i in range(radial_segments)),
        ]
    )
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    finish_mesh(obj, parent, material, smooth=True)
    atlas_uv(obj, "hull")
    return obj


def shell_patch(
    name: str,
    y_start: float,
    y_end: float,
    angle_start: float,
    angle_end: float,
    parent: bpy.types.Object,
    material: bpy.types.Material,
    atlas_region: str | None,
    offset: float = 0.14,
    rows: int = 8,
    columns: int = 18,
    thickness: float = 0.11,
) -> bpy.types.Object:
    vertices = []
    for row in range(rows):
        y = y_start + (y_end - y_start) * row / (rows - 1)
        for column in range(columns):
            angle = angle_start + (angle_end - angle_start) * column / (columns - 1)
            vertices.append(surface_point(y, angle, offset))
    return _grid_mesh(
        name, vertices, rows, columns, parent, material, atlas_region, thickness, bevel=0.04
    )


def _wing(
    name: str,
    side: float,
    outline: tuple[tuple[float, float], ...],
    parent: bpy.types.Object,
    material: bpy.types.Material,
    thickness: float,
) -> bpy.types.Object:
    points = [(side * x, y, 0.15 + thickness * 0.5) for x, y in outline]
    points += [(side * x, y, 0.15 - thickness * 0.5) for x, y in outline]
    count = len(outline)
    top = tuple(range(count))
    bottom = tuple(reversed(range(count, count * 2)))
    faces = [top, bottom]
    for index in range(count):
        nxt = (index + 1) % count
        faces.append((index, nxt, count + nxt, count + index))
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(points, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    finish_mesh(obj, parent, material, bevel=0.34, bevel_segments=4, smooth=True)
    atlas_uv(obj, "hull")
    return obj


def build_hull(root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> None:
    hull = empty("HULL_PRIMARY", root)
    loft_hull("Hull_LiftingBody_LOD0", HULL_SECTIONS, 96, hull, materials["hull"])
    outline = ((4.8, -21.5), (11.4, -17.0), (18.7, -4.0), (17.0, 8.5), (9.2, 15.0), (3.6, 11.5))
    _wing("Hull_Port_LiftingSurface", -1.0, outline, hull, materials["hull"], 1.15)
    _wing("Hull_Starboard_LiftingSurface", 1.0, outline, hull, materials["hull"], 1.15)
    shell_patch(
        "Canopy_Inset_Glass", 14.2, 28.2, 0.78, 2.36, hull, materials["glass"], None, 0.22, 18, 34, 0.16
    )
    frame_points = (
        [surface_point(y, 0.77, 0.34) for y in (14.0, 18.0, 22.0, 25.5, 28.3)],
        [surface_point(y, 2.37, 0.34) for y in (14.0, 18.0, 22.0, 25.5, 28.3)],
    )
    for index, points in enumerate(frame_points):
        curve_tube(f"Canopy_Frame_Longitudinal_{index + 1:02d}", points, 0.095, materials["metal"], hull)
    for y in (16.3, 20.2, 24.0, 27.0):
        angles = tuple(0.77 + (2.37 - 0.77) * step / 8 for step in range(9))
        curve_tube(
            f"Canopy_Frame_Arc_{int(y * 10):03d}",
            [surface_point(y, angle, 0.34) for angle in angles],
            0.075,
            materials["metal"],
            hull,
        )
    _add_armor_layers(hull, materials)
    _add_service_shell(hull, materials)


def _add_armor_layers(parent: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> None:
    panel_specs = (
        ("Port_Forward", 7.0, 19.5, 2.55, 3.03),
        ("Port_Mid", -8.0, 5.5, 2.58, 3.06),
        ("Port_Aft", -21.5, -10.0, 2.52, 3.02),
        ("Starboard_Forward", 5.5, 18.0, 0.10, 0.58),
        ("Starboard_Mid", -9.5, 3.5, 0.08, 0.56),
        ("Starboard_Aft", -22.0, -11.2, 0.12, 0.62),
        ("Dorsal_Aft", -20.0, -7.5, 1.18, 1.86),
    )
    for name, y_start, y_end, angle_start, angle_end in panel_specs:
        shell_patch(
            f"Armor_{name}", y_start, y_end, angle_start, angle_end, parent, materials["armor"], "armor", 0.18
        )
    for side in (-1.0, 1.0):
        for index, y in enumerate((-13.5, -4.5, 4.5, 11.5)):
            box(
                f"Wing_ControlSurface_{'P' if side < 0 else 'S'}_{index + 1:02d}",
                (4.6, 3.6, 0.24),
                (side * (12.2 + index % 2), y, 0.84),
                materials["armor"],
                parent,
                rotation=(0.0, 0.0, side * 0.035),
                bevel=0.16,
            )


def _add_service_shell(parent: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> None:
    for side in (-1.0, 1.0):
        label = "Port" if side < 0 else "Starboard"
        box(
            f"Cargo_Bay_Door_{label}",
            (4.2, 10.5, 0.24),
            (side * 3.25, -1.5, -4.2),
            materials["armor"],
            parent,
            bevel=0.22,
        )
        for index, y in enumerate((-17.5, -10.5, 8.2)):
            shell_patch(
                f"Service_Hatch_{label}_{index + 1:02d}",
                y,
                y + 3.6,
                2.85 if side < 0 else 0.05,
                3.12 if side < 0 else 0.32,
                parent,
                materials["metal"],
                None,
                0.25,
                4,
                8,
                0.08,
            )
    docking = empty("AIRLOCK_PORT_DOCKING", parent)
    torus(
        "Docking_Collar_Outer",
        1.55,
        0.23,
        (-10.75, -3.2, 0.1),
        materials["metal"],
        docking,
        rotation=(0.0, math.pi / 2.0, 0.0),
    )
    torus(
        "Docking_Collar_Seal",
        1.22,
        0.12,
        (-10.92, -3.2, 0.1),
        materials["cyan"],
        docking,
        rotation=(0.0, math.pi / 2.0, 0.0),
    )
