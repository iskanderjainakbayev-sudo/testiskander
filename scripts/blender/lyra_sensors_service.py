"""Sensor dish, RCS clusters, navigation lights, and service details."""

from __future__ import annotations

import math

import bpy
from mathutils import Vector

from lyra_common import box, cone, curve_tube, cylinder, empty, finish_mesh, oriented_cylinder, sphere
from lyra_hull import surface_point


def _oriented_torus(
    name: str,
    location: tuple[float, float, float],
    direction: tuple[float, float, float],
    major_radius: float,
    minor_radius: float,
    parent: bpy.types.Object,
    material: bpy.types.Material,
    segments: tuple[int, int],
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=segments[0],
        minor_segments=segments[1],
        location=location,
    )
    obj = bpy.context.object
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector(direction).to_track_quat("Z", "Y")
    return finish_mesh(obj, parent, material, smooth=True)


def _dish(
    name: str,
    center: tuple[float, float, float],
    direction: tuple[float, float, float],
    radius: float,
    parent: bpy.types.Object,
    material: bpy.types.Material,
) -> bpy.types.Object:
    rings, segments = 8, 40
    vertices = [(0.0, 0.0, 0.0)]
    for ring in range(1, rings + 1):
        ring_radius = radius * ring / rings
        depth = 0.34 * radius * (ring_radius / radius) ** 2
        for segment in range(segments):
            angle = math.tau * segment / segments
            vertices.append((ring_radius * math.cos(angle), ring_radius * math.sin(angle), depth))
    faces = [(0, 1 + segment, 1 + (segment + 1) % segments) for segment in range(segments)]
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
    return finish_mesh(obj, parent, material, bevel=0.025, bevel_segments=2, smooth=True)


def build_sensor_suite(root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> None:
    sensors = empty("SENSOR_SUITE_STARBOARD", root)
    oriented_cylinder("Sensor_Mast_ForeLeg", (7.1, 0.2, 4.1), (9.3, -0.4, 7.4), 0.18, materials["metal"], sensors, 24)
    oriented_cylinder("Sensor_Mast_AftLeg", (7.9, -3.2, 4.2), (9.3, -0.4, 7.4), 0.18, materials["metal"], sensors, 24)
    oriented_cylinder(
        "Sensor_Mast_OutboardBrace",
        (10.1, -1.5, 1.15),
        (9.3, -0.4, 7.4),
        0.15,
        materials["metal"],
        sensors,
        20,
    )
    cylinder("Sensor_Mast_Gimbal", 0.76, 0.42, (9.3, -0.4, 7.32), materials["armor"], sensors, 36, bevel=0.08)
    _oriented_torus(
        "Sensor_Mast_AzimuthRing",
        (9.3, -0.4, 7.52),
        (0.0, 0.0, 1.0),
        0.67,
        0.105,
        sensors,
        materials["metal"],
        (28, 6),
    )
    for side in (-1.0, 1.0):
        oriented_cylinder(
            f"Sensor_Dish_ElevationYoke_{'P' if side < 0 else 'S'}",
            (9.3 + side * 0.61, -0.4, 7.48),
            (9.3 + side * 0.61, -0.4, 8.04),
            0.105,
            materials["metal"],
            sensors,
            18,
        )
    oriented_cylinder(
        "Sensor_Dish_ElevationAxle",
        (8.54, -0.4, 7.94),
        (10.06, -0.4, 7.94),
        0.12,
        materials["metal"],
        sensors,
        20,
    )
    curve_tube(
        "Sensor_Mast_ServiceCable",
        (
            (7.15, 0.1, 4.15),
            (8.1, -0.1, 5.8),
            (8.75, -0.55, 7.2),
            (9.05, -0.72, 7.78),
        ),
        0.052,
        materials["radiator"],
        sensors,
        1,
    )
    direction = (0.38, 0.78, 0.5)
    _dish("Sensor_DeepRange_Dish", (9.3, -0.4, 7.85), direction, 2.65, sensors, materials["metal"])
    feed_end = tuple(Vector((9.3, -0.4, 7.85)) + Vector(direction).normalized() * 1.75)
    oriented_cylinder("Sensor_Dish_FeedBoom", (9.3, -0.4, 7.85), feed_end, 0.07, materials["metal"], sensors, 20)
    sphere("Sensor_Dish_FeedHorn", 0.25, feed_end, materials["cyan"], sensors, 18, 9)
    _add_dish_cage((9.3, -0.4, 7.85), direction, 2.65, feed_end, sensors, materials)
    for index, y in enumerate((4.0, 1.2, -4.3)):
        tip = (13.0 + index * 0.7, y - 0.7, 4.0 + index * 0.5)
        oriented_cylinder(
            f"Sensor_LateralAntenna_{index + 1:02d}",
            (8.0, y, 3.5),
            tip,
            0.055,
            materials["metal"],
            sensors,
            16,
        )
        sphere(f"Sensor_LateralTip_{index + 1:02d}", 0.14, tip, materials["cyan"], sensors, 12, 6)


def _add_dish_cage(
    center: tuple[float, float, float],
    direction: tuple[float, float, float],
    radius: float,
    feed_end: tuple[float, float, float],
    parent: bpy.types.Object,
    materials: dict[str, bpy.types.Material],
) -> None:
    axis = Vector(direction).normalized()
    reference = Vector((0.0, 0.0, 1.0)) if abs(axis.z) < 0.9 else Vector((0.0, 1.0, 0.0))
    tangent = axis.cross(reference).normalized()
    bitangent = axis.cross(tangent).normalized()
    rim_center = Vector(center) + axis * (radius * 0.34)
    _oriented_torus(
        "Sensor_Dish_StructuralRim",
        tuple(rim_center),
        direction,
        radius,
        0.075,
        parent,
        materials["metal"],
        (32, 5),
    )
    _oriented_torus(
        "Sensor_Dish_ReceiverCage",
        feed_end,
        direction,
        0.31,
        0.04,
        parent,
        materials["metal"],
        (16, 4),
    )
    rear_hub = Vector(center) - axis * 0.32
    for index, angle in enumerate((0.0, math.tau / 3.0, math.tau * 2.0 / 3.0)):
        rim_point = rim_center + (tangent * math.cos(angle) + bitangent * math.sin(angle)) * radius
        oriented_cylinder(
            f"Sensor_Dish_FeedStay_{index + 1:02d}",
            tuple(rim_point),
            feed_end,
            0.043,
            materials["metal"],
            parent,
            14,
        )
    for index, angle in enumerate((0.0, math.pi * 0.5, math.pi, math.pi * 1.5)):
        rib_point = rim_center + (tangent * math.cos(angle) + bitangent * math.sin(angle)) * radius * 0.93
        oriented_cylinder(
            f"Sensor_Dish_RearRib_{index + 1:02d}",
            tuple(rib_point),
            tuple(rear_hub),
            0.037,
            materials["metal"],
            parent,
            12,
        )


def build_rcs_and_service_details(root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> None:
    details = empty("RCS_SERVICE_AND_MARKERS", root)
    for side in (-1.0, 1.0):
        label = "Port" if side < 0 else "Starboard"
        for station, y in (("Fore", 18.0), ("Aft", -17.5)):
            surface_angle = math.pi if side < 0 else 0.0
            surface_x, _, surface_z = surface_point(y, surface_angle, 0.28)
            pod_location = (surface_x, y, surface_z)
            box(
                f"RCS_{label}_{station}_Pod",
                (1.3, 2.5, 1.7),
                pod_location,
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
                    (
                        surface_x + side * 0.67,
                        y + (nozzle - 0.5) * 0.75,
                        surface_z + z_offset,
                    ),
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
                (surface_x, y, surface_z + 0.92),
                materials["heat"],
                details,
                28,
                bevel=0.025,
            )
    _add_service_louvers(details, materials)
    _add_navigation_lights(details, materials)


def _add_service_louvers(
    details: bpy.types.Object, materials: dict[str, bpy.types.Material]
) -> None:
    for side in (-1.0, 1.0):
        for index, y in enumerate((-20.0, -13.0, 2.0, 9.0)):
            angle = math.pi + 0.34 if side < 0 else -0.34
            x, _, z = surface_point(y, angle, 0.24)
            box(
                f"Service_Louver_{'P' if side < 0 else 'S'}_{index + 1:02d}",
                (0.18, 3.8, 0.42),
                (x, y, z),
                materials["metal"],
                details,
                bevel=0.06,
            )


def _add_navigation_lights(
    details: bpy.types.Object, materials: dict[str, bpy.types.Material]
) -> None:
    for side, color in ((-1.0, materials["amber"]), (1.0, materials["cyan"])):
        for index, y in enumerate((-20.0, 0.0, 19.5)):
            sphere(
                f"Navigation_{'Port' if side < 0 else 'Starboard'}_{index + 1:02d}",
                0.16 if index != 1 else 0.12,
                (side * (10.1 if index == 1 else 8.5), y, 2.0),
                color,
                details,
                12,
                6,
            )
