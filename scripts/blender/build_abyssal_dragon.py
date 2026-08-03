from pathlib import Path
import sys
import bpy

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from ocean_hero_utils import reset, mat
from abyssal_dragon_parts import build_segment, build_head, build_fins

ROOT = HERE.parents[1]
OUTPUT = ROOT / "assets" / "models" / "ocean"
bpy.context.preferences.filepaths.save_version = 0


def build():
    reset()
    skin = mat("abyssal pebbled skin", (.012,.045,.105), metallic=.18, roughness=.36,
               emission=(.005,.04,.15))
    armor = mat("ancient pressure armor", (.03,.11,.22), metallic=.42, roughness=.26)
    belly = mat("ventral scutes", (.09,.18,.22), metallic=.12, roughness=.4)
    glow = mat("rift biolight organs", (.015,.32,.82), roughness=.12,
               emission=(.015,.42,1))
    eye = mat("predator eyes", (.72,.012,.002), roughness=.08, emission=(1,.008,0))
    bone = mat("pressure ivory", (.6,.72,.7), metallic=.06, roughness=.26)
    membrane = mat("abyssal fin membrane", (.018,.12,.24), roughness=.2,
                   emission=(.005,.1,.35), alpha=.83)
    root = bpy.data.objects.new("Abyssal Dragon", None)
    bpy.context.collection.objects.link(root)
    root["display_name"], root["body_plan"], root["hostile"] = "Abyssal Dragon", "serpent", True
    for index in range(18):
        build_segment(root, index, 18, (skin, armor, belly, glow))
    build_head(root, (skin, armor, belly, glow, eye, bone))
    build_fins(root, membrane, bone, glow)
    root.scale = (.78,.78,.78)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT / "abyssal-dragon.blend"), compress=True)
    bpy.ops.export_scene.gltf(filepath=str(OUTPUT / "abyssal-dragon.glb"),
                              export_format='GLB', export_apply=True, export_yup=True)


build()
