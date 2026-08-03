from pathlib import Path
import random
import sys
import bpy

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from ocean_creature_exotics import crab, jelly, shrimp, slug, squid, turtle
from ocean_creature_manifest import load_creatures
from ocean_creature_swimmers import eel, fish, puffer, ray
from ocean_creature_utils import empty, material

ROOT = SCRIPT_DIR.parents[1]
OUTPUT = ROOT / "assets" / "models" / "ocean" / "fish"
bpy.context.preferences.filepaths.save_version = 0
BUILDERS = {
    "fish": fish, "whale": fish, "ray": ray, "eel": eel, "serpent": eel,
    "puffer": puffer, "turtle": turtle, "jelly": jelly, "squid": squid,
    "crab": crab, "shrimp": shrimp, "slug": slug,
}


def build(creature):
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    asset_id = creature["asset_id"]
    root = empty(asset_id)
    root["hostile"] = creature["hostile"]
    skin = material(f"{asset_id}-skin", creature["color"], creature["glow"], .16, .03, .32)
    glow = material(f"{asset_id}-biolight", creature["glow"], creature["glow"], 3.2, 0, .24)
    eye_color = 0xFF543D if creature["hostile"] else 0xDFFFFF
    eye = material(f"{asset_id}-eye", eye_color, eye_color, 1.5, 0, .18)
    pupil = material(f"{asset_id}-pupil", 0x050912, 0x050912, .2, .1, .12)
    builder = BUILDERS[creature["body_plan"]]
    if creature["body_plan"] == "whale":
        builder(root, (skin, glow, eye, pupil), random.Random(asset_id), "whale")
    else:
        builder(root, (skin, glow, eye, pupil), random.Random(asset_id))
    root["display_name"] = creature["name"]
    root["body_plan"] = creature["body_plan"]
    OUTPUT.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT / f"{asset_id}.blend"), compress=True)
    bpy.ops.export_scene.gltf(filepath=str(OUTPUT / f"{asset_id}.glb"), export_format="GLB", export_apply=True)
    print(f"BUILT {asset_id}")


for entry in load_creatures(ROOT):
    build(entry)
