"""Landing hardware and asymmetric thermal-management hardware."""

from __future__ import annotations

import math

import bpy

from lyra_common import box, curve_tube, cylinder, empty, finish_mesh, oriented_cylinder, sphere


def build_landing_gear(root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> None:
    gear = empty("LANDING_GEAR_DEPLOYED", root)
    gear["animation_hint"] = "Named gear pivots remain as animation markers; geometry is batched"
    stations = (
        ("Nose", (0.0, 20.0, -2.6), (0.0, 18.9, -7.4), (0.0, 18.7, -7.7), (3.2, 2.1, 0.48)),
        ("PortMain", (-6.8, -10.5, -3.4), (-10.2, -12.4, -7.2), (-10.5, -12.6, -7.55), (3.8, 2.6, 0.58)),
        ("StarboardMain", (6.8, -10.5, -3.4), (10.2, -12.4, -7.2), (10.5, -12.6, -7.55), (3.8, 2.6, 0.58)),
    )
    for name, mount, knee, pad_location, pad_dimensions in stations:
        pivot = empty(f"Gear_{name}_Pivot", gear)
        oriented_cylinder(f"Gear_{name}_PrimaryStrut", mount, knee, 0.36, materials["metal"], pivot, 28)
        brace_end = (knee[0] * 0.82, knee[1] + 1.15, knee[2] + 0.35)
        oriented_cylinder(f"Gear_{name}_Brace", mount, brace_end, 0.21, materials["metal"], pivot, 20)
        side = 1.0 if knee[0] >= 0.0 else -1.0
        piston_start = (mount[0] + side * 0.26, mount[1] + 0.18, mount[2] - 0.18)
        piston_end = (knee[0] + side * 0.18, knee[1] + 0.12, knee[2] + 0.82)
        oriented_cylinder(
            f"Gear_{name}_HydraulicPiston", piston_start, piston_end, 0.135, materials["metal"], pivot, 18
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
            0.34,
            0.46,
            mount,
            materials["armor"],
            pivot,
            18,
            bevel=0.045,
        )
        cylinder(
            f"Gear_{name}_ShockCollar",
            0.38,
            0.65,
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
            materials["heat"],
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
                0.22,
                (pad_location[0] + side * pad_dimensions[0] * 0.31, pad_location[1], pad_location[2] + 0.16),
                materials["metal"],
                pivot,
                12,
                6,
            )
        _add_footpad_claws(name, pad_location, pad_dimensions, pivot, materials)


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
            materials["metal"],
            parent,
            rotation=(direction * 0.13, 0.0, 0.0),
            bevel=0.07,
            segments=2,
        )
        box(
            f"Gear_{name}_GroundClaw_Lateral_{'A' if direction < 0 else 'B'}",
            (0.58, length * 0.52, 0.22),
            (x + direction * (width * 0.5 + 0.17), y, z - height * 0.34),
            materials["metal"],
            parent,
            rotation=(0.0, direction * 0.13, 0.0),
            bevel=0.07,
            segments=2,
        )


def _radiator_blade(
    name: str,
    x: float,
    fan: float,
    parent: bpy.types.Object,
    material: bpy.types.Material,
) -> None:
    outline = ((-7.1, 0.7), (-6.1, 5.5), (1.6, 5.7), (3.4, 4.8), (2.8, 1.2), (1.7, 0.5))
    y_offset = -6.5
    thickness = 0.11
    front = [(x - thickness, y + y_offset + fan * (z - 3.0), z) for y, z in outline]
    back = [(x + thickness, y + y_offset + fan * (z - 3.0), z) for y, z in outline]
    vertices = front + back
    count = len(outline)
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
    for index, (x, fan) in enumerate(((-16.95, -0.15), (-17.58, 0.0), (-18.21, 0.15))):
        _radiator_blade(
            f"Radiator_Port_TaperedBlade_{index + 1:02d}", x, fan, thermal, materials["radiator"]
        )
    for index, z in enumerate((0.72, 1.64, 2.58, 3.52, 4.46, 5.4)):
        curve_tube(
            f"Radiator_Port_CoolantRib_{index + 1:02d}",
            ((-18.35, -13.55, z), (-18.42, -8.3, z + 0.16), (-18.33, -3.25, z - 0.04)),
            0.055,
            materials["metal"],
            thermal,
        )
    edge_paths = (
        ((-18.4, -13.6, 0.7), (-18.4, -12.6, 5.5), (-18.4, -4.9, 5.7)),
        ((-18.4, -4.9, 5.7), (-18.4, -3.1, 4.8), (-18.4, -4.8, 0.5)),
    )
    for index, points in enumerate(edge_paths):
        curve_tube(f"Radiator_Port_EdgeFrame_{index + 1:02d}", points, 0.09, materials["metal"], thermal)
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
