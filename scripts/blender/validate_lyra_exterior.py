"""Reopen the exported LYRA GLB and print authoritative runtime metrics."""

from __future__ import annotations

import json
import struct
import sys
from pathlib import Path

import bpy
from mathutils import Vector

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[1]
GLB_PATH = REPO_ROOT / "assets" / "models" / "odyssey" / "lyra-exterior.glb"


def triangle_count(node: bpy.types.Object) -> int:
    total = 0
    for obj in (node, *node.children_recursive):
        if obj.type == "MESH":
            total += sum(max(1, len(polygon.vertices) - 2) for polygon in obj.data.polygons)
    return total


def glb_json(path: Path) -> dict:
    with path.open("rb") as handle:
        magic, version, length = struct.unpack("<4sII", handle.read(12))
        if magic != b"glTF" or version != 2 or length != path.stat().st_size:
            raise RuntimeError("Invalid GLB header")
        json_length, json_type = struct.unpack("<II", handle.read(8))
        if json_type != 0x4E4F534A:
            raise RuntimeError("First GLB chunk is not JSON")
        return json.loads(handle.read(json_length).decode("utf-8").rstrip(" \t\r\n\x00"))


def main() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(GLB_PATH))
    roots = [obj for obj in bpy.context.scene.objects if obj.parent is None]
    root = next((obj for obj in roots if obj.name == "LYRA_EXPLORER_65M"), None)
    if root is None:
        raise RuntimeError(f"LYRA root missing; found {[obj.name for obj in roots]}")
    groups = {obj.name: obj for obj in root.children}
    required = ("LOD0_HERO", "LOD1_DISTANCE", "COLLIDER_SIMPLE")
    missing = [name for name in required if name not in groups]
    if missing:
        raise RuntimeError(f"Missing required nodes: {missing}")
    document = glb_json(GLB_PATH)
    bounds = [
        obj.matrix_world @ Vector(corner)
        for obj in groups["LOD0_HERO"].children_recursive
        if obj.type == "MESH"
        for corner in obj.bound_box
    ]
    minimum = [min(point[axis] for point in bounds) for axis in range(3)]
    maximum = [max(point[axis] for point in bounds) for axis in range(3)]
    dimensions = [maximum[axis] - minimum[axis] for axis in range(3)]
    generic_names = {
        "Cube",
        "Cylinder",
        "Cone",
        "Sphere",
        "Torus",
    }
    generic_meshes = [
        mesh.get("name", "")
        for mesh in document.get("meshes", [])
        if mesh.get("name", "").split(".")[0] in generic_names
    ]
    transformed_mesh_nodes = [
        node.get("name", f"node_{index}")
        for index, node in enumerate(document.get("nodes", []))
        if "mesh" in node and any(key in node for key in ("translation", "rotation", "scale", "matrix"))
    ]
    report = {
        "file_bytes": GLB_PATH.stat().st_size,
        "lod0_triangles": triangle_count(groups["LOD0_HERO"]),
        "lod1_triangles": triangle_count(groups["LOD1_DISTANCE"]),
        "collider_triangles": triangle_count(groups["COLLIDER_SIMPLE"]),
        "lod0_render_meshes": sum(
            1 for obj in groups["LOD0_HERO"].children_recursive if obj.type == "MESH"
        ),
        "lod1_render_meshes": sum(
            1 for obj in groups["LOD1_DISTANCE"].children_recursive if obj.type == "MESH"
        ),
        "collider_meshes": sum(
            1 for obj in groups["COLLIDER_SIMPLE"].children_recursive if obj.type == "MESH"
        ),
        "materials": len(document.get("materials", [])),
        "textures": len(document.get("textures", [])),
        "images": len(document.get("images", [])),
        "nodes": len(document.get("nodes", [])),
        "meshes": len(document.get("meshes", [])),
        "accessors": len(document.get("accessors", [])),
        "animations": len(document.get("animations", [])),
        "extensions_used": document.get("extensionsUsed", []),
        "root_extras": root.keys(),
        "required_nodes": list(required),
        "lod0_bounds_min": minimum,
        "lod0_bounds_max": maximum,
        "lod0_dimensions": dimensions,
        "generic_mesh_names": generic_meshes,
        "transformed_mesh_nodes": transformed_mesh_nodes,
    }
    failures = []
    if not 35_000 <= report["lod0_triangles"] <= 80_000:
        failures.append("LOD0 triangle target")
    if report["lod1_triangles"] >= 12_000:
        failures.append("LOD1 triangle target")
    if report["lod0_render_meshes"] > 12:
        failures.append("LOD0 draw-call mesh target")
    if report["lod1_render_meshes"] > 8:
        failures.append("LOD1 draw-call mesh target")
    if report["materials"] != 8:
        failures.append("material budget")
    if report["images"] != 1:
        failures.append("embedded atlas image count")
    if report["file_bytes"] >= 8 * 1024 * 1024:
        failures.append("8 MiB preferred GLB size")
    if not 64.0 <= max(dimensions) <= 66.0:
        failures.append("65 meter vessel scale")
    if generic_meshes:
        failures.append("generic mesh names")
    if transformed_mesh_nodes:
        failures.append("unapplied mesh transforms")
    if failures:
        raise RuntimeError(f"Validation failed: {failures}; report={report}")
    print("LYRA_VALIDATION_REPORT", json.dumps(report, sort_keys=True, default=list))


if __name__ == "__main__":
    main()
