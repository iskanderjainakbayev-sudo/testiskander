"""Shared Blender geometry helpers for the LYRA explorer vessel."""

from __future__ import annotations

import math
from collections.abc import Iterable, Sequence

import bpy
from mathutils import Vector


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.images):
        for datablock in tuple(datablocks):
            datablocks.remove(datablock)


def empty(name: str, parent: bpy.types.Object | None = None) -> bpy.types.Object:
    node = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(node)
    node.parent = parent
    return node


def finish_mesh(
    obj: bpy.types.Object,
    parent: bpy.types.Object,
    material: bpy.types.Material | None,
    bevel: float = 0.0,
    bevel_segments: int = 3,
    smooth: bool = True,
) -> bpy.types.Object:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if bevel > 0.0:
        modifier = obj.modifiers.new("Precision edge radii", "BEVEL")
        modifier.width = bevel
        modifier.segments = bevel_segments
        modifier.limit_method = "ANGLE"
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    if smooth:
        for polygon in obj.data.polygons:
            polygon.use_smooth = True
    if material is not None:
        obj.data.materials.append(material)
    obj.parent = parent
    obj.select_set(False)
    return obj


def box(
    name: str,
    dimensions: Sequence[float],
    location: Sequence[float],
    material: bpy.types.Material,
    parent: bpy.types.Object,
    rotation: Sequence[float] = (0.0, 0.0, 0.0),
    bevel: float = 0.12,
    segments: int = 3,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=location, rotation=rotation)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    return finish_mesh(obj, parent, material, bevel, segments, smooth=True)


def cylinder(
    name: str,
    radius: float,
    depth: float,
    location: Sequence[float],
    material: bpy.types.Material,
    parent: bpy.types.Object,
    vertices: int = 32,
    rotation: Sequence[float] = (0.0, 0.0, 0.0),
    bevel: float = 0.06,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices, radius=radius, depth=depth, location=location, rotation=rotation
    )
    obj = bpy.context.object
    obj.name = name
    return finish_mesh(obj, parent, material, bevel, 3, smooth=True)


def cone(
    name: str,
    radius1: float,
    radius2: float,
    depth: float,
    location: Sequence[float],
    material: bpy.types.Material,
    parent: bpy.types.Object,
    vertices: int = 40,
    rotation: Sequence[float] = (0.0, 0.0, 0.0),
    bevel: float = 0.05,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=radius1,
        radius2=radius2,
        depth=depth,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    return finish_mesh(obj, parent, material, bevel, 3, smooth=True)


def sphere(
    name: str,
    radius: float,
    location: Sequence[float],
    material: bpy.types.Material,
    parent: bpy.types.Object,
    segments: int = 32,
    rings: int = 16,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments, ring_count=rings, radius=radius, location=location
    )
    obj = bpy.context.object
    obj.name = name
    return finish_mesh(obj, parent, material, smooth=True)


def torus(
    name: str,
    major_radius: float,
    minor_radius: float,
    location: Sequence[float],
    material: bpy.types.Material,
    parent: bpy.types.Object,
    rotation: Sequence[float] = (math.pi / 2.0, 0.0, 0.0),
    major_segments: int = 48,
    minor_segments: int = 10,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=major_segments,
        minor_segments=minor_segments,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    return finish_mesh(obj, parent, material, smooth=True)


def oriented_cylinder(
    name: str,
    start: Sequence[float],
    end: Sequence[float],
    radius: float,
    material: bpy.types.Material,
    parent: bpy.types.Object,
    vertices: int = 24,
) -> bpy.types.Object:
    start_v, end_v = Vector(start), Vector(end)
    direction = end_v - start_v
    midpoint = (start_v + end_v) * 0.5
    obj = cylinder(name, radius, direction.length, midpoint, material, parent, vertices, bevel=0.03)
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = direction.to_track_quat("Z", "Y")
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.select_set(False)
    return obj


def curve_tube(
    name: str,
    points: Iterable[Sequence[float]],
    radius: float,
    material: bpy.types.Material,
    parent: bpy.types.Object,
    resolution: int = 2,
) -> bpy.types.Object:
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = resolution
    curve.bevel_depth = radius
    curve.bevel_resolution = 3
    spline = curve.splines.new("BEZIER")
    point_list = list(points)
    spline.bezier_points.add(len(point_list) - 1)
    for bezier, point in zip(spline.bezier_points, point_list, strict=True):
        bezier.co = point
        bezier.handle_left_type = "AUTO"
        bezier.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(material)
    obj.parent = parent
    return obj


def triangulate_meshes(root: bpy.types.Object) -> None:
    for obj in root.children_recursive:
        if obj.type != "MESH":
            continue
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        modifier = obj.modifiers.new("Runtime triangles", "TRIANGULATE")
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.select_set(False)
