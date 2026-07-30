"""Curved lifting-body hull and layered exterior shell for LYRA."""

from __future__ import annotations

import math

import bpy

from lyra_common import box, curve_tube, empty, finish_mesh, oriented_cylinder, sphere, torus
from lyra_materials import atlas_uv
from lyra_spine import build_engineering_spine
from lyra_surface_hardware import add_hull_hardware

HULL_SECTIONS = (
    (-30.0, 2.5, 2.3, 2.0, -0.18, 2.8),
    (-27.0, 4.6, 3.0, 2.5, -0.12, 3.0),
    (-21.0, 6.6, 3.8, 3.2, -0.04, 3.25),
    (-12.0, 8.2, 4.3, 3.7, 0.00, 3.55),
    (0.0, 8.6, 4.45, 3.8, 0.05, 3.65),
    (11.0, 7.8, 4.2, 3.4, 0.16, 3.55),
    (21.0, 5.8, 3.55, 2.7, 0.36, 3.25),
    (28.0, 2.8, 2.3, 1.7, 0.52, 3.0),
    (32.3, 0.42, 0.52, 0.36, 0.44, 2.8),
)


def smooth_sections(
    sections: tuple[tuple[float, float, float, float, float, float], ...], subdivisions: int
) -> tuple[tuple[float, float, float, float, float, float], ...]:
    dense = []
    for index in range(len(sections) - 1):
        previous = sections[max(0, index - 1)]
        current = sections[index]
        following = sections[index + 1]
        after = sections[min(len(sections) - 1, index + 2)]
        for step in range(subdivisions):
            t = step / subdivisions
            values = [current[0] + (following[0] - current[0]) * t]
            for component in range(1, 6):
                p0, p1 = previous[component], current[component]
                p2, p3 = following[component], after[component]
                value = 0.5 * (
                    2.0 * p1
                    + (-p0 + p2) * t
                    + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t * t
                    + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t * t * t
                )
                values.append(max(0.18, value) if component in (1, 2, 3) else value)
            dense.append(tuple(values))
    dense.append(sections[-1])
    return tuple(dense)


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
    atlas_region: str = "hull",
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
    atlas_uv(obj, atlas_region)
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
    bevel: float = 0.04,
) -> bpy.types.Object:
    vertices = []
    for row in range(rows):
        y = y_start + (y_end - y_start) * row / (rows - 1)
        for column in range(columns):
            angle = angle_start + (angle_end - angle_start) * column / (columns - 1)
            vertices.append(surface_point(y, angle, offset))
    return _grid_mesh(
        name, vertices, rows, columns, parent, material, atlas_region, thickness, bevel=bevel
    )


def _framed_recess(
    name: str,
    y_start: float,
    y_end: float,
    angle_start: float,
    angle_end: float,
    parent: bpy.types.Object,
    materials: dict[str, bpy.types.Material],
) -> None:
    shell_patch(
        f"{name}_ShadowWell",
        y_start,
        y_end,
        angle_start,
        angle_end,
        parent,
        materials["heat"],
        "heat",
        offset=0.045,
        rows=6,
        columns=14,
        thickness=0.055,
        bevel=0.025,
    )
    boundaries = (
        [surface_point(y, angle_start, 0.27) for y in (y_start, (y_start + y_end) * 0.5, y_end)],
        [surface_point(y, angle_end, 0.27) for y in (y_start, (y_start + y_end) * 0.5, y_end)],
        [
            surface_point(y_start, angle, 0.27)
            for angle in (angle_start, (angle_start + angle_end) * 0.5, angle_end)
        ],
        [
            surface_point(y_end, angle, 0.27)
            for angle in (angle_start, (angle_start + angle_end) * 0.5, angle_end)
        ],
    )
    for index, points in enumerate(boundaries):
        curve_tube(f"{name}_Frame_{index + 1:02d}", points, 0.075, materials["metal"], parent, 1)
    angle_mid = (angle_start + angle_end) * 0.5
    for index, fraction in enumerate((0.18, 0.38, 0.62, 0.82)):
        y = y_start + (y_end - y_start) * fraction
        curve_tube(
            f"{name}_InternalConduit_{index + 1:02d}",
            (
                surface_point(y, angle_start + 0.035, 0.12),
                surface_point(y, angle_mid, 0.12),
                surface_point(y, angle_end - 0.035, 0.12),
            ),
            0.045,
            materials["radiator"] if index == 1 else materials["metal"],
            parent,
            1,
        )
    for pipe_index, fraction in enumerate((0.22, 0.50, 0.78)):
        angle = angle_start + (angle_end - angle_start) * fraction
        material = materials["radiator"] if pipe_index == 1 else materials["metal"]
        curve_tube(
            f"{name}_LongitudinalPipe_{pipe_index + 1:02d}",
            (
                surface_point(y_start + 0.55, angle, 0.13),
                surface_point((y_start + y_end) * 0.5, angle, 0.13),
                surface_point(y_end - 0.55, angle, 0.13),
            ),
            0.055 if pipe_index == 1 else 0.043,
            material,
            parent,
            1,
        )
        for terminal_index, y in enumerate((y_start + 0.62, y_end - 0.62)):
            sphere(
                f"{name}_PipeSocket_{pipe_index + 1:02d}_{terminal_index + 1:02d}",
                0.095,
                surface_point(y, angle, 0.18),
                materials["metal"],
                parent,
                10,
                5,
            )
    midpoint_y = (y_start + y_end) * 0.5
    side_bay = abs(math.cos(angle_mid)) > 0.68
    manifold_location = surface_point(midpoint_y - 1.55, angle_mid, 0.16)
    box(
        f"{name}_ManifoldBlock",
        (0.30, 1.75, 0.78) if side_bay else (1.75, 1.55, 0.30),
        manifold_location,
        materials["armor"],
        parent,
        bevel=0.10,
        segments=3,
    )
    pump_y = midpoint_y + 1.35
    oriented_cylinder(
        f"{name}_CoolantPumpHousing",
        surface_point(pump_y, angle_mid, 0.10),
        surface_point(pump_y, angle_mid, 0.48),
        0.34,
        materials["armor"],
        parent,
        18,
        bevel=0.025,
    )
    oriented_cylinder(
        f"{name}_CoolantPumpCollar",
        surface_point(pump_y, angle_mid, 0.46),
        surface_point(pump_y, angle_mid, 0.64),
        0.23,
        materials["metal"],
        parent,
        16,
        bevel=0.018,
    )
    oriented_cylinder(
        f"{name}_PumpStatusLens",
        surface_point(pump_y, angle_mid, 0.63),
        surface_point(pump_y, angle_mid, 0.69),
        0.095,
        materials["cyan"],
        parent,
        12,
        bevel=0.0,
    )
    curve_tube(
        f"{name}_BraidedWiringHarness",
        (
            surface_point(y_start + 0.8, angle_end - 0.045, 0.15),
            surface_point(midpoint_y - 2.1, angle_end - 0.08, 0.20),
            surface_point(midpoint_y + 2.0, angle_end - 0.05, 0.16),
            surface_point(y_end - 0.7, angle_end - 0.045, 0.15),
        ),
        0.034,
        materials["armor"],
        parent,
        1,
    )
    if side_bay:
        for index, fraction in enumerate((0.24, 0.48, 0.72)):
            y = y_start + (y_end - y_start) * fraction
            box(
                f"{name}_PipeClamp_{index + 1:02d}",
                (0.20, 0.28, 0.72),
                surface_point(y, angle_mid, 0.19),
                materials["metal"],
                parent,
                bevel=0.035,
                segments=2,
            )
    fastener_positions = (
        (y_start, angle_start),
        (y_start, angle_mid),
        (y_start, angle_end),
        (midpoint_y, angle_start),
        (midpoint_y, angle_end),
        (y_end, angle_start),
        (y_end, angle_mid),
        (y_end, angle_end),
    )
    for index, (y, angle) in enumerate(fastener_positions):
        oriented_cylinder(
            f"{name}_FrameFastener_{index + 1:02d}",
            surface_point(y, angle, 0.25),
            surface_point(y, angle, 0.31),
            0.044,
            materials["metal"],
            parent,
            8,
            bevel=0.0,
        )


def _wing(
    name: str,
    side: float,
    outline: tuple[tuple[float, float], ...],
    parent: bpy.types.Object,
    material: bpy.types.Material,
    thickness: float,
    atlas_region: str = "hull",
) -> bpy.types.Object:
    del outline
    stations = (
        (3.4, -21.0, 15.0, thickness),
        (7.0, -20.2, 14.5, thickness * 0.93),
        (10.2, -17.2, 11.8, thickness * 0.72),
        (13.4, -10.4, 6.8, thickness * 0.43),
        (15.2, -4.5, -3.5, 0.12),
    )
    segments = 48
    points = []
    for span, aft, fore, height in stations:
        center_y = (aft + fore) * 0.5
        half_chord = max(0.12, (fore - aft) * 0.5)
        for segment in range(segments):
            angle = math.tau * segment / segments
            cosine, sine = math.cos(angle), math.sin(angle)
            y = center_y + half_chord * math.copysign(abs(cosine) ** 0.74, cosine)
            z = 0.08 + height * 0.5 * math.copysign(abs(sine) ** 0.62, sine)
            points.append((side * span, y, z))
    faces = []
    for station in range(len(stations) - 1):
        for segment in range(segments):
            nxt = (segment + 1) % segments
            a = station * segments + segment
            b = station * segments + nxt
            c = (station + 1) * segments + nxt
            d = (station + 1) * segments + segment
            faces.append((a, b, c, d))
    faces.extend(
        (
            tuple(reversed(range(segments))),
            tuple((len(stations) - 1) * segments + index for index in range(segments)),
        )
    )
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(points, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    finish_mesh(obj, parent, material, smooth=True)
    atlas_uv(obj, atlas_region)
    return obj


def _wing_panel(
    name: str,
    side: float,
    points: tuple[tuple[float, float], ...],
    parent: bpy.types.Object,
    material: bpy.types.Material,
) -> None:
    vertices = [(side * x, y, 0.76) for x, y in points]
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], [tuple(range(len(vertices)))])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    solidify = obj.modifiers.new("Flush control-surface depth", "SOLIDIFY")
    solidify.thickness = 0.08
    bpy.ops.object.modifier_apply(modifier=solidify.name)
    obj.select_set(False)
    finish_mesh(obj, parent, material, bevel=0.035, bevel_segments=2, smooth=True)
    atlas_uv(obj, "armor")


def build_hull(root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> None:
    hull = empty("HULL_PRIMARY", root)
    loft_hull(
        "Hull_LiftingBody_LOD0",
        smooth_sections(HULL_SECTIONS, 5),
        56,
        hull,
        materials["armor"],
        "armor",
    )
    outline = ((4.8, -21.5), (11.4, -17.0), (18.7, -4.0), (17.0, 8.5), (9.2, 15.0), (3.6, 11.5))
    _wing("Hull_Port_LiftingSurface", -1.0, outline, hull, materials["armor"], 1.15, "armor")
    _wing("Hull_Starboard_LiftingSurface", 1.0, outline, hull, materials["armor"], 1.15, "armor")
    shell_patch(
        "Canopy_Interior_ShadowShell",
        14.15,
        28.25,
        0.76,
        2.38,
        hull,
        materials["armor"],
        "armor",
        0.105,
        8,
        18,
        0.08,
        0.025,
    )
    shell_patch(
        "Canopy_Inset_Glass",
        14.2,
        28.2,
        0.78,
        2.36,
        hull,
        materials["glass"],
        None,
        0.22,
        12,
        22,
        0.16,
        0.025,
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
    build_engineering_spine(hull, materials)
    _add_section_breaks(hull, materials)
    _add_integrated_recesses(hull, materials)
    _add_armor_layers(hull, materials)
    _add_service_shell(hull, materials)
    add_hull_hardware(hull, materials, surface_point)


def _add_integrated_recesses(
    parent: bpy.types.Object, materials: dict[str, bpy.types.Material]
) -> None:
    recesses = (
        ("ServiceTrench_Starboard", -13.0, 1.5, 0.06, 0.43),
        ("ThermalInterface_Port", -13.0, -2.5, 2.70, 3.08),
        ("ReactorAccess_Dorsal", -7.0, 4.5, 1.30, 1.84),
    )
    for name, y_start, y_end, angle_start, angle_end in recesses:
        _framed_recess(
            name,
            y_start,
            y_end,
            angle_start,
            angle_end,
            parent,
            materials,
        )
    shell_patch(
        "PressureDoor_Starboard_OffWhite",
        -10.8,
        -4.2,
        0.48,
        0.64,
        parent,
        materials["hull"],
        "hull",
        0.19,
        5,
        9,
        0.18,
        0.035,
    )
    shell_patch(
        "PressureDoor_Port_OffWhite",
        -10.8,
        -4.2,
        2.50,
        2.66,
        parent,
        materials["hull"],
        "hull",
        0.19,
        5,
        9,
        0.18,
        0.035,
    )
    for side, angle in ((1.0, 0.46), (-1.0, 2.68)):
        label = "Starboard" if side > 0 else "Port"
        for index, y in enumerate((-9.9, -7.5, -5.1)):
            oriented_cylinder(
                f"PressureDoor_{label}_Hinge_{index + 1:02d}",
                surface_point(y - 0.34, angle, 0.26),
                surface_point(y + 0.34, angle, 0.26),
                0.10,
                materials["metal"],
                parent,
                16,
            )


def _add_section_breaks(
    parent: bpy.types.Object, materials: dict[str, bpy.types.Material]
) -> None:
    for index, y in enumerate((-20.5, -8.0, 8.0, 18.5)):
        shell_patch(
            f"Hull_PressureSectionBreak_{index + 1:02d}",
            y - 0.11,
            y + 0.11,
            0.0,
            math.tau,
            parent,
            materials["heat"],
            "heat",
            0.038,
            2,
            32,
            0.025,
            0.0,
        )
    chines = (
        ("StarboardUpper", 0.60, 0.67),
        ("PortUpper", math.pi - 0.67, math.pi - 0.60),
        ("StarboardLower", -0.67, -0.60),
        ("PortLower", math.pi + 0.60, math.pi + 0.67),
    )
    for name, angle_start, angle_end in chines:
        shell_patch(
            f"Hull_LongitudinalChine_{name}",
            -23.0,
            20.0,
            angle_start,
            angle_end,
            parent,
            materials["armor"],
            "armor",
            0.19,
            12,
            3,
            0.075,
            0.0,
        )
    shell_patch(
        "Hull_VentralStructuralKeel",
        -22.0,
        18.0,
        -1.70,
        -1.44,
        parent,
        materials["armor"],
        "armor",
        0.24,
        16,
        6,
        0.13,
        0.025,
    )


def _add_armor_layers(parent: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> None:
    panel_specs = (
        ("Port_Aft", -20.5, -16.2, 2.60, 2.93, "hull"),
        ("Starboard_Forward", 8.5, 14.8, 0.15, 0.45, "hull"),
    )
    for name, y_start, y_end, angle_start, angle_end, material_key in panel_specs:
        shell_patch(
            f"Armor_{name}",
            y_start,
            y_end,
            angle_start,
            angle_end,
            parent,
            materials[material_key],
            material_key,
            0.18,
            6,
            12,
            0.08,
            0.025,
        )
    panel_shapes = (
        ((5.8, -15.5), (10.7, -13.4), (12.6, -5.0), (9.7, -1.8), (5.4, -3.6)),
        ((10.8, -11.8), (14.6, -8.4), (16.2, -3.4), (13.0, -1.7), (11.4, -5.2)),
        ((5.4, 1.3), (9.5, 2.7), (11.2, 8.9), (7.2, 11.7), (4.8, 8.0)),
    )
    for side in (-1.0, 1.0):
        for index, points in enumerate(panel_shapes):
            _wing_panel(
                f"Wing_ControlSurface_{'P' if side < 0 else 'S'}_{index + 1:02d}",
                side,
                points,
                parent,
                materials["armor"],
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
        for index, y in enumerate((-17.5, 8.2)):
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
        (-8.55, -3.2, 0.1),
        materials["metal"],
        docking,
        rotation=(0.0, math.pi / 2.0, 0.0),
        major_segments=32,
        minor_segments=8,
    )
    torus(
        "Docking_Collar_Seal",
        1.22,
        0.12,
        (-8.72, -3.2, 0.1),
        materials["cyan"],
        docking,
        rotation=(0.0, math.pi / 2.0, 0.0),
        major_segments=32,
        minor_segments=8,
    )
