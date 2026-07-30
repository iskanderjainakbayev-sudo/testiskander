"""Detailed three-nozzle propulsion assembly for LYRA."""

from __future__ import annotations

import math

import bpy

from lyra_common import box, cone, curve_tube, cylinder, empty, finish_mesh, oriented_cylinder, torus


def _open_nozzle(
    name: str,
    x: float,
    center_y: float,
    z: float,
    front_radius: float,
    exit_radius: float,
    depth: float,
    segments: int,
    material: bpy.types.Material,
    parent: bpy.types.Object,
) -> None:
    vertices = []
    for y, radius in ((center_y + depth * 0.5, front_radius), (center_y - depth * 0.5, exit_radius)):
        vertices += [
            (x + math.cos(math.tau * index / segments) * radius, y, z + math.sin(math.tau * index / segments) * radius)
            for index in range(segments)
        ]
    faces = [
        (index, (index + 1) % segments, segments + (index + 1) % segments, segments + index)
        for index in range(segments)
    ]
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    finish_mesh(obj, parent, material, smooth=True)


def build_engines(root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> None:
    engines = empty("PROPULSION_THREE_VECTOR", root)
    aft = -1.5
    stations = ((-4.8, -0.4, 0.92), (0.0, -0.7, 1.12), (4.8, -0.4, 0.92))
    for index, (x, z, scale) in enumerate(stations):
        label = "Center" if index == 1 else "Port" if x < 0 else "Starboard"
        engine = empty(f"Engine_{index + 1:02d}_{label}", engines)
        _open_nozzle(
            f"Engine_{index + 1:02d}_OuterNozzle",
            x,
            -28.8 + aft,
            z,
            1.22 * scale,
            2.15 * scale,
            3.8,
            64,
            materials["heat"],
            engine,
        )
        _open_nozzle(
            f"Engine_{index + 1:02d}_InnerBell",
            x,
            -29.25 + aft,
            z,
            0.74 * scale,
            1.58 * scale,
            3.0,
            56,
            materials["metal"],
            engine,
        )
        cylinder(
            f"Engine_{index + 1:02d}_Cowl",
            1.65 * scale,
            2.7,
            (x, -26.25 + aft, z),
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
            (x, -30.72 + aft, z),
            materials["heat"],
            engine,
            major_segments=64,
            minor_segments=12,
        )
        torus(
            f"Engine_{index + 1:02d}_VectorRing",
            1.36 * scale,
            0.12,
            (x, -27.42 + aft, z),
            materials["metal"],
            engine,
            major_segments=56,
            minor_segments=10,
        )
        cylinder(
            f"Engine_{index + 1:02d}_PlasmaAperture",
            0.82 * scale,
            0.12,
            (x, -29.65 + aft, z),
            materials["amber"],
            engine,
            56,
            (math.pi / 2.0, 0.0, 0.0),
            0.0,
        )
        _add_engine_internals(index, x, z, scale, aft, engine, materials)
        _add_bell_hardware(index, x, z, scale, aft, engine, materials)


def _add_engine_internals(
    index: int,
    x: float,
    z: float,
    scale: float,
    aft: float,
    engine: bpy.types.Object,
    materials: dict[str, bpy.types.Material],
) -> None:
    torus(
        f"Engine_{index + 1:02d}_InnerBaffleRing",
        1.12 * scale,
        0.075,
        (x, -30.35 + aft, z),
        materials["metal"],
        engine,
        major_segments=28,
        minor_segments=5,
    )
    cone(
        f"Engine_{index + 1:02d}_Centerbody",
        0.24 * scale,
        0.055,
        1.05,
        (x, -30.45 + aft, z),
        materials["heat"],
        engine,
        24,
        (math.pi / 2.0, 0.0, 0.0),
        0.025,
    )
    vertices, faces = [], []
    for vane in range(7):
        angle = math.tau * vane / 7
        half = 0.06
        base = len(vertices)
        for radius, y, offset in (
            (0.31 * scale, -30.24 + aft, -half),
            (1.03 * scale, -30.38 + aft, -half),
            (1.03 * scale, -30.38 + aft, half),
            (0.31 * scale, -30.24 + aft, half),
        ):
            vertices.append((x + math.cos(angle + offset) * radius, y, z + math.sin(angle + offset) * radius))
        faces.append((base, base + 1, base + 2, base + 3))
    mesh = bpy.data.meshes.new(f"Engine_{index + 1:02d}_InternalVanes_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(f"Engine_{index + 1:02d}_InternalVanes", mesh)
    bpy.context.scene.collection.objects.link(obj)
    finish_mesh(obj, engine, materials["metal"], bevel=0.012, bevel_segments=1, smooth=False)


def _add_bell_hardware(
    index: int,
    x: float,
    z: float,
    scale: float,
    aft: float,
    engine: bpy.types.Object,
    materials: dict[str, bpy.types.Material],
) -> None:
    for vane in range(12):
        angle = math.tau * vane / 12
        px = x + math.cos(angle) * 1.65 * scale
        pz = z + math.sin(angle) * 1.65 * scale
        box(
            f"Engine_{index + 1:02d}_BellPetal_{vane + 1:02d}",
            (0.16, 1.65, 0.62),
            (px, -29.62 + aft, pz),
            materials["heat"],
            engine,
            rotation=(0.0, -angle, 0.0),
            bevel=0.045,
            segments=2,
        )
    for actuator in range(4):
        angle = math.tau * actuator / 4 + math.pi / 4
        start = (x + math.cos(angle) * 2.0 * scale, -26.6 + aft, z + math.sin(angle) * 2.0 * scale)
        end = (x + math.cos(angle) * 1.55 * scale, -29.2 + aft, z + math.sin(angle) * 1.55 * scale)
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
        (
            (x - 0.55, -24.8 + aft, z + 1.05),
            (x - 0.85, -27.0 + aft, z + 1.5),
            (x - 0.72, -29.0 + aft, z + 1.58),
        ),
        0.11,
        materials["radiator"],
        engine,
    )
