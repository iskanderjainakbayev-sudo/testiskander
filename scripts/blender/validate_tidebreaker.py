from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parents[2]
ASSET = ROOT / "assets" / "models" / "ocean" / "weapons" / "tidebreaker-blaster.glb"
REQUIRED = {
    "tidebreaker-blaster", "barrel-upper", "barrel-left", "barrel-right",
    "energy-drum", "charge-ring", "barrel-upper-emitter",
    "barrel-left-emitter", "barrel-right-emitter",
}

bpy.ops.import_scene.gltf(filepath=str(ASSET))
objects = {item.name for item in bpy.context.scene.objects}
missing = REQUIRED - objects
if missing:
    raise RuntimeError(f"Tidebreaker is missing animated parts: {sorted(missing)}")

meshes = [item for item in bpy.context.scene.objects if item.type == "MESH"]
triangles = sum(sum(max(1, len(face.vertices) - 2) for face in item.data.polygons)
                for item in meshes)
materials = {slot.material.name for item in meshes for slot in item.material_slots if slot.material}
if triangles > 35_000:
    raise RuntimeError(f"Tidebreaker exceeds web triangle budget: {triangles}")
if len(materials) < 5:
    raise RuntimeError("Tidebreaker lacks authored material variation")
print(f"TIDEBREAKER: {len(meshes)} meshes, {triangles} triangles, {len(materials)} materials")
