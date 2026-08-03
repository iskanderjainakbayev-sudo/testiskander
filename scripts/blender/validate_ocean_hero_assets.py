from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "assets" / "models" / "ocean" / "hero"

for name in ("nereid-micro-sub", "damaged-lifepod"):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(ASSETS / f"{name}.glb"))
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    triangles = sum(sum(max(1, len(face.vertices) - 2) for face in obj.data.polygons) for obj in meshes)
    materials = {slot.material.name for obj in meshes for slot in obj.material_slots if slot.material}
    if triangles > 50_000:
        raise RuntimeError(f"{name} exceeds web triangle budget: {triangles}")
    if len(materials) < 4:
        raise RuntimeError(f"{name} lacks authored material variation")
    if any(len(face.vertices) < 3 for obj in meshes for face in obj.data.polygons):
        raise RuntimeError(f"{name} contains degenerate polygons")
    print(f"ASSET {name}: {len(meshes)} meshes, {triangles} triangles, {len(materials)} materials")
