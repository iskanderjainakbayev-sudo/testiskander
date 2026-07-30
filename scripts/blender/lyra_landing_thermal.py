"""Landing hardware and asymmetric thermal-management hardware."""

from __future__ import annotations

import math

import bpy

from lyra_common import box, curve_tube, cylinder, empty, finish_mesh, oriented_cylinder, sphere

RADIATOR_OUTLINE = (
    (-6.3, 0.8),
    (-5.4, 5.0),
    (1.2, 5.2),
    (2.8, 4.4),
    (2.3, 1.3),
    (1.4, 0.7),
)


def build_landing_gear(root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> None:
    gear = empty("LANDING_GEAR_DEPLOYED", root)
    gear["animation_hint"] = "Named gear pivots remain as animation markers; geometry is batched"
    stations = (
        ("Nose", (0.0, 20.0, -2.6), (0.0, 18.9, -7.4), (0.0, 18.7, -7.7), (3.8, 2.5, 0.62)),
        ("PortMain", (-6.8, -10.5, -3.4), (-10.2, -12.4, -7.2), (-10.5, -12.6, -7.55), (4.6, 3.2, 0.72)),
        ("StarboardMain", (6.8, -10.5, -3.4), (10.2, -12.4, -7.2), (10.5, -12.6, -7.55), (4.6, 3.2, 0.72)),
    )
    for name, mount, knee, pad_location, pad_dimensions in stations:
        pivot = empty(f"Gear_{name}_Pivot", gear)
        _add_gear_well(name, mount, pivot, materials)
        main_gear = "Main" in name
        oriented_cylinder(
            f"Gear_{name}_PrimaryStrut",
            mount,
            knee,
            0.56 if main_gear else 0.50,
            materials["metal"],
            pivot,
            28,
        )
        brace_end = (knee[0] * 0.82, knee[1] + 1.15, knee[2] + 0.35)
        oriented_cylinder(
            f"Gear_{name}_Brace",
            mount,
            brace_end,
            0.31 if main_gear else 0.28,
            materials["metal"],
            pivot,
            20,
        )
        if main_gear:
            secondary_mount = (mount[0] * 0.91, mount[1] + 1.35, mount[2] + 0.12)
            secondary_knee = (knee[0], knee[1] + 0.58, knee[2] + 0.16)
            oriented_cylinder(
                f"Gear_{name}_AFrameSecondary",
                secondary_mount,
                secondary_knee,
                0.38,
                materials["metal"],
                pivot,
                24,
            )
        side = 1.0 if knee[0] >= 0.0 else -1.0
        piston_start = (mount[0] + side * 0.26, mount[1] + 0.18, mount[2] - 0.18)
        piston_end = (knee[0] + side * 0.18, knee[1] + 0.12, knee[2] + 0.82)
        oriented_cylinder(
            f"Gear_{name}_HydraulicPiston", piston_start, piston_end, 0.19, materials["metal"], pivot, 18
        )
        curve_tube(
            f"Gear_{name}_HydraulicHose",
            (
                (mount[0] - side * 0.16, mount[1], mount[2]),
                (knee[0] - side * 0.35, knee[1] + 0.65, knee[2] + 1.1),
                (knee[0] - side * 0.18, knee[1], knee[2] + 0.25),
            ),
            0.045,
            materials["armor"],
            pivot,
            resolution=1,
        )
        cylinder(
            f"Gear_{name}_UpperHinge",
            0.48,
            0.58,
            mount,
            materials["armor"],
            pivot,
            18,
            bevel=0.045,
        )
        cylinder(
            f"Gear_{name}_ShockCollar",
            0.58,
            0.78,
            knee,
            materials["armor"],
            pivot,
            32,
            (math.pi / 2.0, 0.0, 0.0),
            0.06,
        )
        box(
            f"Gear_{name}_Footpad",
            pad_dimensions,
            pad_location,
            materials["armor"],
            pivot,
            bevel=0.24,
            segments=4,
        )
        for cleat in (-1.0, 1.0):
            box(
                f"Gear_{name}_FootpadCleat_{'A' if cleat < 0 else 'B'}",
                (pad_dimensions[0] * 0.48, 0.24, 0.14),
                (
                    pad_location[0],
                    pad_location[1] + cleat * pad_dimensions[1] * 0.29,
                    pad_location[2] + pad_dimensions[2] * 0.48,
                ),
                materials["metal"],
                pivot,
                bevel=0.045,
                segments=2,
            )
        for side in (-1.0, 1.0):
            sphere(
                f"Gear_{name}_PadJoint_{'A' if side < 0 else 'B'}",
                0.28,
                (pad_location[0] + side * pad_dimensions[0] * 0.31, pad_location[1], pad_location[2] + 0.16),
                materials["metal"],
                pivot,
                12,
                6,
            )
        if name == "Nose":
            for side in (-1.0, 1.0):
                oriented_cylinder(
                    f"Gear_Nose_LowerFork_{'P' if side < 0 else 'S'}",
                    (knee[0], knee[1], knee[2] + 0.48),
                    (
                        pad_location[0] + side * pad_dimensions[0] * 0.27,
                        pad_location[1],
                        pad_location[2] + 0.34,
                    ),
                    0.19,
                    materials["metal"],
                    pivot,
                    20,
                )
        _add_footpad_claws(name, pad_location, pad_dimensions, pivot, materials)


def _add_gear_well(
    name: str,
    mount: tuple[float, float, float],
    parent: bpy.types.Object,
    materials: dict[str, bpy.types.Material],
) -> None:
    is_nose = name == "Nose"
    dimensions = (2.8, 4.4, 0.22) if is_nose else (3.4, 5.2, 0.24)
    well_center = (mount[0], mount[1], mount[2] + 0.12)
    box(
        f"Gear_{name}_RecessedWell",
        dimensions,
        well_center,
        materials["heat"],
        parent,
        bevel=0.18,
        segments=3,
    )
    door_width = dimensions[0] * 0.32
    for side in (-1.0, 1.0):
        box(
            f"Gear_{name}_WellDoor_{'P' if side < 0 else 'S'}",
            (door_width, dimensions[1] * 0.92, 0.13),
            (
                mount[0] + side * dimensions[0] * 0.58,
                mount[1],
                mount[2] + 0.03,
            ),
            materials["armor"],
            parent,
            rotation=(0.0, side * 0.13, 0.0),
            bevel=0.08,
            segments=2,
        )


def _add_footpad_claws(
    name: str,
    pad_location: tuple[float, float, float],
    pad_dimensions: tuple[float, float, float],
    parent: bpy.types.Object,
    materials: dict[str, bpy.types.Material],
) -> None:
    x, y, z = pad_location
    width, length, height = pad_dimensions
    for direction in (-1.0, 1.0):
        box(
            f"Gear_{name}_GroundClaw_Longitudinal_{'A' if direction < 0 else 'B'}",
            (width * 0.72, 0.58, 0.22),
            (x, y + direction * (length * 0.5 + 0.17), z - height * 0.34),
            materials["heat"],
            parent,
            rotation=(direction * 0.13, 0.0, 0.0),
            bevel=0.07,
            segments=2,
        )
        box(
            f"Gear_{name}_GroundClaw_Lateral_{'A' if direction < 0 else 'B'}",
            (0.58, length * 0.52, 0.22),
            (x + direction * (width * 0.5 + 0.17), y, z - height * 0.34),
            materials["heat"],
            parent,
            rotation=(0.0, direction * 0.13, 0.0),
            bevel=0.07,
            segments=2,
        )


def _radiator_blade(
    name: str,
    x: float,
    fan: float,
    offset_y: float,
    parent: bpy.types.Object,
    material: bpy.types.Material,
) -> None:
    y_offset = -6.5 + offset_y
    thickness = 0.11
    front = [
        (x - thickness, y + y_offset + fan * (z - 3.0), z)
        for y, z in RADIATOR_OUTLINE
    ]
    back = [
        (x + thickness, y + y_offset + fan * (z - 3.0), z)
        for y, z in RADIATOR_OUTLINE
    ]
    vertices = front + back
    count = len(RADIATOR_OUTLINE)
    faces = [tuple(range(count)), tuple(reversed(range(count, count * 2)))]
    faces += [
        (index, (index + 1) % count, count + (index + 1) % count, count + index)
        for index in range(count)
    ]
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    finish_mesh(obj, parent, material, bevel=0.09, bevel_segments=3, smooth=True)


def build_thermal_system(root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> None:
    thermal = empty("THERMAL_ASYMMETRIC_BALANCE", root)
    cylinder(
        "Radiator_Port_HullGimbal",
        0.58,
        1.45,
        (-8.25, -7.5, 2.55),
        materials["armor"],
        thermal,
        32,
        (0.0, math.pi / 2.0, 0.0),
        0.09,
    )
    oriented_cylinder(
        "Radiator_Port_DeploymentBoom",
        (-8.6, -7.5, 2.55),
        (-16.35, -7.8, 3.05),
        0.34,
        materials["metal"],
        thermal,
        28,
    )
    truss_booms = (
        ((-8.2, -6.25, 3.2), (-16.35, -3.55, 5.15)),
        ((-8.4, -8.85, 1.9), (-16.35, -13.2, 1.05)),
        ((-9.0, -6.15, 3.25), (-15.2, -11.7, 1.25)),
    )
    for index, (start, end) in enumerate(truss_booms):
        oriented_cylinder(
            f"Radiator_Port_Truss_{index + 1:02d}",
            start,
            end,
            0.17 if index < 2 else 0.12,
            materials["metal"],
            thermal,
            20,
        )
    blade_specs = (
        (-16.75, -0.32, -1.45),
        (-17.45, 0.0, 0.0),
        (-18.15, 0.32, 1.45),
    )
    for index, (x, fan, offset_y) in enumerate(blade_specs):
        _radiator_blade(
            f"Radiator_Port_TaperedBlade_{index + 1:02d}",
            x,
            fan,
            offset_y,
            thermal,
            materials["radiator"],
        )
        y_offset = -6.5 + offset_y
        outline = [
            (x - 0.14, y + y_offset + fan * (z - 3.0), z)
            for y, z in (*RADIATOR_OUTLINE, RADIATOR_OUTLINE[0])
        ]
        curve_tube(
            f"Radiator_Port_BladeFrame_{index + 1:02d}",
            outline,
            0.065,
            materials["metal"],
            thermal,
            1,
        )
        for rib_index, z in enumerate((2.15, 3.65)):
            curve_tube(
                f"Radiator_Port_Blade_{index + 1:02d}_Rib_{rib_index + 1:02d}",
                (
                    (x - 0.145, -5.1 + y_offset + fan * (z - 3.0), z),
                    (x - 0.145, 1.65 + y_offset + fan * (z - 3.0), z),
                ),
                0.052,
                materials["metal"],
                thermal,
                1,
            )
    curve_tube(
        "Radiator_Port_CoolantSupply",
        ((-8.2, -6.2, 2.9), (-12.0, -6.9, 3.6), (-16.9, -5.1, 5.35)),
        0.13,
        materials["radiator"],
        thermal,
    )
    curve_tube(
        "Radiator_Port_CoolantReturn",
        ((-8.4, -8.7, 2.3), (-12.4, -9.6, 2.0), (-16.9, -12.8, 0.9)),
        0.13,
        materials["radiator"],
        thermal,
    )
