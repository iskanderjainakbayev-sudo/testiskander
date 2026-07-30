"""Draw-call batching while retaining LYRA's semantic system markers."""

from __future__ import annotations

from collections import defaultdict

import bpy


def _batch_name(prefix: str, material_name: str) -> str:
    suffix = material_name.removeprefix("MAT_LYRA_").replace(" ", "_")
    return f"{prefix}_BATCH_{suffix}"


def batch_by_material(lod: bpy.types.Object, prefix: str) -> list[bpy.types.Object]:
    groups: dict[bpy.types.Material, list[bpy.types.Object]] = defaultdict(list)
    for obj in tuple(lod.children_recursive):
        if obj.type != "MESH":
            continue
        if len(obj.data.materials) != 1 or obj.data.materials[0] is None:
            raise RuntimeError(f"{obj.name} must have exactly one material before batching")
        groups[obj.data.materials[0]].append(obj)

    batches = []
    for material, objects in sorted(groups.items(), key=lambda item: item[0].name):
        source_systems = sorted({obj.parent.name if obj.parent else lod.name for obj in objects})
        bpy.ops.object.select_all(action="DESELECT")
        for obj in objects:
            obj.select_set(True)
        active = objects[0]
        bpy.context.view_layer.objects.active = active
        bpy.ops.object.join()
        active.name = _batch_name(prefix, material.name)
        active.data.name = f"{active.name}_Mesh"
        active.parent = lod
        active["batch_material"] = material.name
        active["batched_part_count"] = len(objects)
        active["source_systems"] = ", ".join(source_systems)
        if len(active.data.materials) > 1:
            for polygon in active.data.polygons:
                polygon.material_index = 0
            active.data.materials.clear()
            active.data.materials.append(material)
        active.select_set(False)
        batches.append(active)

    for marker in lod.children_recursive:
        if marker.type == "EMPTY":
            marker["geometry_batching"] = f"Static render geometry is under {lod.name} material batches"
    return batches
