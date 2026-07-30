"""Propulsion, landing, sensor, thermal, and service systems for LYRA."""

from __future__ import annotations

import math

import bpy
from mathutils import Vector

from lyra_common import (
    box,
    cone,
    curve_tube,
    cylinder,
    empty,
    finish_mesh,
    oriented_cylinder,
    sphere,
    torus,
)


def build_systems(root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> None:
    build_engines(root, materials)
    build_landing_gear(root, materials)
    build_thermal_system(root, materials)
    build_sensor_suite(root, materials)
    build_rcs_and_service_details(root, materials)


def build_engines(root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> None:
    engines = empty("PROPULSION_THREE_VECTOR", root)
    for index, (x, z, scale) in enumerate(((-4.8, -0.4, 0.92), (0.0, -0.7, 1.12), (4.8, -0.4, 0.92))):
        engine = empty(f"Engine_{index + 1:02d}_{'Center' if index == 1 else 'Port' if x < 0 else 'Starboard'}", engines)
        cone(
            f"Engine_{index + 1:02d}_OuterNozzle",
            1.22 * scale,
            2.15 * scale,
            3.8,
            (x, -28.8, z),
            materials["heat"],
            engine,
            64,
            (math.pi / 2.0, 0.0, 0.0),
            0.09,
        )
        cone(
            f"Engine_{index + 1:02d}_InnerBell",
            0.74 * scale,
            1.58 * scale,
            3.0,
            (x, -29.25, z),
            materials["metal"],
            engine,
            56,
            (math.pi / 2.0, 0.0, 0.0),
            0.04,
        )
        cylinder(
            f"Engine_{index + 1:02d}_Cowl",
            1.65 * scale,
            2.7,
            (x, -26.25, z),
            materials["armor"],
            engine,
            56,
            (math.pi / 2.0, 0.0, 0.0),
            0.14,
        )
        torus(
            f"Engine_{index + 1:02d}_ExitRing",
            1.72 * scale,
            0.16,
            (x, -30.72, z),
            materials["heat"],
            engine,
            major_segments=64,
            minor_segments=12,
        )
        torus(
            f"Engine_{index + 1:02d}_VectorRing",
            1.36 * scale,
            0.12,
            (x, -27.42, z),
            materials["metal"],
            engine,
            major_segments=56,
            minor_segments=10,
        )
        cylinder(
            f"Engine_{index + 1:02d}_PlasmaAperture",
            1.30 * scale,
            0.18,
            (x, -30.83, z),
            materials["amber"],
            engine,
            56,
            (math.pi / 2.0, 0.0, 0.0),
            0.0,
        )
        for vane in range(12):
            angle = math.tau * vane / 12
            px = x + math.cos(angle) * 1.65 * scale
            pz = z + math.sin(angle) * 1.65 * scale
            box(
                f"Engine_{index + 1:02d}_BellPetal_{vane + 1:02d}",
                (0.16, 1.65, 0.62),
                (px, -29.62, pz),
                materials["heat"],
                engine,
                rotation=(0.0, -angle, 0.0),
                bevel=0.045,
                segments=2,
            )
        for actuator in range(4):
            angle = math.tau * actuator / 4 + math.pi / 4
            start = (x + math.cos(angle) * 2.0 * scale, -26.6, z + math.sin(angle) * 2.0 * scale)
            end = (x + math.cos(angle) * 1.55 * scale, -29.2, z + math.sin(angle) * 1.55 * scale)
            oriented_cylinder(
                f"Engine_{index + 1:02d}_Actuator_{actuator + 1:02d}",
                start,
                end,
                0.085,
                materials["metal"],
                engine,
                20,
            )
        curve_tube(
            f"Engine_{index + 1:02d}_CoolantFeed",
            ((x - 0.55, -24.8, z + 1.05), (x - 0.85, -27.0, z + 1.5), (x - 0.72, -29.0, z + 1.58)),
            0.11,
            materials["radiator"],
            engine,
        )


def build_landing_gear(root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> None:
    gear = empty("LANDING_GEAR_DEPLOYED", root)
    gear["animation_hint"] = "Rotate named gear pivots inward for flight configuration"
    stations = (
        ("Nose", (0.0, 20.0, -2.6), (0.0, 18.9, -7.4), (0.0, 18.7, -7.7), (3.2, 2.1, 0.48)),
        ("PortMain", (-6.8, -10.5, -3.4), (-10.2, -12.4, -7.2), (-10.5, -12.6, -7.55), (3.8, 2.6, 0.58)),
        ("StarboardMain", (6.8, -10.5, -3.4), (10.2, -12.4, -7.2), (10.5, -12.6, -7.55), (3.8, 2.6, 0.58)),
    )
    for name, mount, knee, pad_location, pad_dimensions in stations:
        pivot = empty(f"Gear_{name}_Pivot", gear)
        oriented_cylinder(f"Gear_{name}_PrimaryStrut", mount, knee, 0.24, materials["metal"], pivot, 28)
        brace_end = (knee[0] * 0.82, knee[1] + 1.15, knee[2] + 0.35)
        oriented_cylinder(f"Gear_{name}_Brace", mount, brace_end, 0.13, materials["metal"], pivot, 20)
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
        for side in (-1.0, 1.0):
            sphere(
                f"Gear_{name}_PadJoint_{'A' if side < 0 else 'B'}",
                0.22,
                (pad_location[0] + side * pad_dimensions[0] * 0.31, pad_location[1], pad_location[2] + 0.16),
                materials["metal"],
                pivot,
                24,
                12,
            )


def build_thermal_system(root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> None:
    thermal = empty("THERMAL_ASYMMETRIC_BALANCE", root)
    oriented_cylinder(
        "Radiator_Port_DeploymentBoom",
        (-8.6, -1.5, 2.5),
        (-16.4, -2.4, 3.1),
        0.28,
        materials["metal"],
        thermal,
        28,
    )
    box(
        "Radiator_Port_MainPanel",
        (0.42, 12.8, 6.2),
        (-17.15, -2.7, 3.2),
        materials["radiator"],
        thermal,
        rotation=(0.08, 0.0, -0.04),
        bevel=0.18,
        segments=3,
    )
    for index in range(13):
        y = -8.15 + index * 0.91
        box(
            f"Radiator_Port_FluidRib_{index + 1:02d}",
            (0.55, 0.095, 5.8),
            (-17.38, y, 3.2),
            materials["metal"],
            thermal,
            bevel=0.025,
            segments=2,
        )
    for z in (0.25, 6.15):
        box(
            f"Radiator_Port_Frame_{int(z * 100):03d}",
            (0.62, 12.9, 0.18),
            (-17.42, -2.7, z),
            materials["metal"],
            thermal,
            bevel=0.04,
        )
    curve_tube(
        "Radiator_Port_CoolantSupply",
        ((-8.2, -0.5, 2.9), (-12.0, -1.2, 3.6), (-16.9, -1.2, 5.7)),
        0.13,
        materials["radiator"],
        thermal,
    )
    curve_tube(
        "Radiator_Port_CoolantReturn",
        ((-8.4, -2.4, 2.3), (-12.4, -3.3, 2.0), (-16.9, -3.9, 0.7)),
        0.13,
        materials["radiator"],
        thermal,
    )


def _dish(
    name: str,
    center: tuple[float, float, float],
    direction: tuple[float, float, float],
    radius: float,
    parent: bpy.types.Object,
    material: bpy.types.Material,
) -> bpy.types.Object:
    rings, segments = 10, 64
    vertices = [(0.0, 0.0, 0.0)]
    for ring in range(1, rings + 1):
        ring_radius = radius * ring / rings
        depth = 0.34 * radius * (ring_radius / radius) ** 2
        for segment in range(segments):
            angle = math.tau * segment / segments
            vertices.append((ring_radius * math.cos(angle), ring_radius * math.sin(angle), depth))
    faces = []
    for segment in range(segments):
        faces.append((0, 1 + segment, 1 + (segment + 1) % segments))
    for ring in range(1, rings):
        first, second = 1 + (ring - 1) * segments, 1 + ring * segments
        for segment in range(segments):
            nxt = (segment + 1) % segments
            faces.append((first + segment, second + segment, second + nxt, first + nxt))
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = center
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector(direction).to_track_quat("Z", "Y")
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    solidify = obj.modifiers.new("Dish structural thickness", "SOLIDIFY")
    solidify.thickness = 0.06
    bpy.ops.object.modifier_apply(modifier=solidify.name)
    obj.select_set(False)
    return finish_mesh(obj, parent, material, bevel=0.035, bevel_segments=2, smooth=True)


def build_sensor_suite(root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> None:
    sensors = empty("SENSOR_SUITE_STARBOARD", root)
    oriented_cylinder("Sensor_Mast_ForeLeg", (7.1, 0.2, 4.1), (9.3, -0.4, 7.4), 0.18, materials["metal"], sensors, 24)
    oriented_cylinder("Sensor_Mast_AftLeg", (7.9, -3.2, 4.2), (9.3, -0.4, 7.4), 0.18, materials["metal"], sensors, 24)
    cylinder("Sensor_Mast_Gimbal", 0.62, 0.52, (9.3, -0.4, 7.4), materials["armor"], sensors, 36, bevel=0.08)
    direction = (0.38, 0.78, 0.5)
    _dish("Sensor_DeepRange_Dish", (9.3, -0.4, 7.85), direction, 2.65, sensors, materials["metal"])
    feed_end = tuple(Vector((9.3, -0.4, 7.85)) + Vector(direction).normalized() * 1.75)
    oriented_cylinder("Sensor_Dish_FeedBoom", (9.3, -0.4, 7.85), feed_end, 0.07, materials["metal"], sensors, 20)
    sphere("Sensor_Dish_FeedHorn", 0.25, feed_end, materials["cyan"], sensors, 28, 14)
    for index, y in enumerate((4.0, 1.2, -4.3)):
        oriented_cylinder(
            f"Sensor_LateralAntenna_{index + 1:02d}",
            (8.0, y, 3.5),
            (13.0 + index * 0.7, y - 0.7, 4.0 + index * 0.5),
            0.055,
            materials["metal"],
            sensors,
            16,
        )
        sphere(
            f"Sensor_LateralTip_{index + 1:02d}",
            0.14,
            (13.0 + index * 0.7, y - 0.7, 4.0 + index * 0.5),
            materials["cyan"],
            sensors,
            20,
            10,
        )


def build_rcs_and_service_details(root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> None:
    details = empty("RCS_SERVICE_AND_MARKERS", root)
    for side in (-1.0, 1.0):
        label = "Port" if side < 0 else "Starboard"
        for station, y in (("Fore", 18.0), ("Aft", -17.5)):
            box(
                f"RCS_{label}_{station}_Pod",
                (1.3, 2.5, 1.7),
                (side * 9.25, y, 1.0),
                materials["armor"],
                details,
                bevel=0.28,
                segments=4,
            )
            for nozzle, z_offset in enumerate((-0.42, 0.42)):
                cone(
                    f"RCS_{label}_{station}_Lateral_{nozzle + 1:02d}",
                    0.18,
                    0.34,
                    0.7,
                    (side * 9.95, y + (nozzle - 0.5) * 0.75, 1.0 + z_offset),
                    materials["heat"],
                    details,
                    28,
                    (0.0, side * math.pi / 2.0, 0.0),
                    0.025,
                )
            cone(
                f"RCS_{label}_{station}_Vertical",
                0.17,
                0.32,
                0.65,
                (side * 9.25, y, 1.95),
                materials["heat"],
                details,
                28,
                bevel=0.025,
            )
    for side in (-1.0, 1.0):
        for index, y in enumerate((-20.0, -13.0, 2.0, 9.0)):
            box(
                f"Service_Louver_{'P' if side < 0 else 'S'}_{index + 1:02d}",
                (0.18, 3.8, 0.42),
                (side * (9.7 - index * 0.35), y, -1.25),
                materials["metal"],
                details,
                bevel=0.06,
            )
    for side, color in ((-1.0, materials["amber"]), (1.0, materials["cyan"])):
        for index, y in enumerate((-20.0, 0.0, 19.5)):
            sphere(
                f"Navigation_{'Port' if side < 0 else 'Starboard'}_{index + 1:02d}",
                0.16 if index != 1 else 0.12,
                (side * (10.1 if index == 1 else 8.5), y, 2.0),
                color,
                details,
                24,
                12,
            )
