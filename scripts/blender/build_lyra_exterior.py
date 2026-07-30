"""Build and export the 65 m LYRA explorer exterior as a runtime GLB."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import bpy

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[1]
sys.path.insert(0, str(SCRIPT_DIR))

from lyra_common import clear_scene, convert_curves, empty, triangulate_meshes
from lyra_batching import batch_by_material
from lyra_hull import build_hull
from lyra_lods import build_collider, build_lod1
from lyra_materials import ATLAS_REGIONS, atlas_uv, create_materials
from lyra_systems import build_systems

OUTPUT_DIR = REPO_ROOT / "assets" / "models" / "odyssey"
BLEND_PATH = OUTPUT_DIR / "lyra-exterior.blend"
GLB_PATH = OUTPUT_DIR / "lyra-exterior.glb"
REPORT_PATH = OUTPUT_DIR / "lyra-exterior.build.json"


def triangle_count(node: bpy.types.Object) -> int:
    total = 0
    for obj in (node, *node.children_recursive):
        if obj.type == "MESH":
            total += sum(max(1, len(polygon.vertices) - 2) for polygon in obj.data.polygons)
    return total


def apply_atlas_regions(root: bpy.types.Object) -> None:
    name_to_region = {
        "MAT_LYRA_Hull_Ivory": "hull",
        "MAT_LYRA_Armor_Graphite": "armor",
        "MAT_LYRA_Heat_Ceramic": "heat",
        "MAT_LYRA_Radiator_Copper": "radiator",
    }
    for obj in root.children_recursive:
        if obj.type != "MESH" or not obj.data.materials:
            continue
        material = obj.data.materials[0]
        region = name_to_region.get(material.name)
        if region in ATLAS_REGIONS:
            atlas_uv(obj, region)


def identity_transform_violations(root: bpy.types.Object) -> list[str]:
    violations = []
    for obj in (root, *root.children_recursive):
        if obj.type != "MESH":
            continue
        identity = (
            obj.location.length < 1e-6
            and abs(obj.rotation_euler.x) < 1e-6
            and abs(obj.rotation_euler.y) < 1e-6
            and abs(obj.rotation_euler.z) < 1e-6
            and all(abs(value - 1.0) < 1e-6 for value in obj.scale)
        )
        if not identity:
            violations.append(obj.name)
    return violations


def main() -> None:
    clear_scene()
    bpy.context.preferences.filepaths.save_version = 0
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    materials = create_materials()
    root = empty("LYRA_EXPLORER_65M")
    root["asset_id"] = "odyssey.lyra.exterior"
    root["units"] = "meters"
    root["length_m"] = 65.0
    root["coordinate_convention"] = "Blender +Z up/+Y forward; glTF and Three.js +Y up/-Z forward"
    root["pivot"] = "vessel geometric center"
    lod0 = empty("LOD0_HERO", root)
    lod0["lod_level"] = 0
    lod0["default_visible"] = True
    lod0["activation_hint"] = "Use from touchdown closeups through 280 meters"
    build_hull(lod0, materials)
    build_systems(lod0, materials)
    lod1 = build_lod1(root, materials)
    collider = build_collider(root, materials)
    convert_curves(root)
    apply_atlas_regions(root)
    triangulate_meshes(root)
    lod0_batches = batch_by_material(lod0, "LOD0")
    lod1_batches = batch_by_material(lod1, "LOD1")
    violations = identity_transform_violations(root)
    if violations:
        raise RuntimeError(f"Unapplied mesh transforms: {violations}")
    report = {
        "asset": root.name,
        "lod0_triangles": triangle_count(lod0),
        "lod1_triangles": triangle_count(lod1),
        "collider_triangles": triangle_count(collider),
        "materials": sorted(material.name for material in materials.values()),
        "mesh_nodes": sum(1 for obj in root.children_recursive if obj.type == "MESH"),
        "lod0_render_batches": len(lod0_batches),
        "lod1_render_batches": len(lod1_batches),
        "coordinate_convention": root["coordinate_convention"],
        "transform_violations": violations,
    }
    REPORT_PATH.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    bpy.context.scene["LYRA_build_report"] = json.dumps(report)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH), compress=True)
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_PATH),
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_extras=True,
        export_tangents=True,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        export_skins=False,
        export_morph=False,
    )
    print("LYRA_BUILD_REPORT", json.dumps(report, sort_keys=True))


if __name__ == "__main__":
    main()
