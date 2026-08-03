from pathlib import Path
import bpy

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "assets" / "models" / "ocean"

for name, path in (("reef-fang", ASSETS / "fish" / "reef-fang.glb"),
                   ("abyssal-dragon", ASSETS / "abyssal-dragon.glb")):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(path))
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    triangles = sum(sum(max(1, len(face.vertices)-2) for face in obj.data.polygons) for obj in meshes)
    names = {obj.name for obj in bpy.context.scene.objects}
    required = {"swim-tail", "swim-fin-1", "swim-fin--1"}
    if name == "reef-fang":
        required |= {"weak-point-eye-1", "weak-point-eye--1"}
    else:
        required |= {"dragon-segment-00", "dragon-segment-17"}
    missing = required - names
    if missing:
        raise RuntimeError(f"{name} missing animation nodes: {sorted(missing)}")
    if triangles > 80_000:
        raise RuntimeError(f"{name} exceeds triangle budget: {triangles}")
    print(f"FEATURED {name}: {len(meshes)} meshes, {triangles} triangles, {path.stat().st_size} bytes")
