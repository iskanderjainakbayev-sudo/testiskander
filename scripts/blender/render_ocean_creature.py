from pathlib import Path
import sys
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
asset = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "reef-fang"
source = ROOT / "assets" / "models" / "ocean" / "fish" / f"{asset}.blend"
preview = ROOT / "artifacts" / "ocean" / f"{asset}-preview.png"
bpy.ops.wm.open_mainfile(filepath=str(source))
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 800
scene.render.resolution_y = 520
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = str(preview)
scene.world.color = (0.002, 0.012, 0.025)


def point_at(obj, target):
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


bpy.ops.object.camera_add(location=(5.8, -7.8, 4.2))
camera = bpy.context.object
camera.data.lens = 58
point_at(camera, Vector((0, 0, 0)))
scene.camera = camera

bpy.ops.object.light_add(type="AREA", location=(-3, -4, 6))
key = bpy.context.object
key.data.energy = 520
key.data.color = (0.1, 0.55, 1)
key.data.size = 5
point_at(key, Vector((0, 0, 0)))

bpy.ops.object.light_add(type="AREA", location=(4, 2, 2))
fill = bpy.context.object
fill.data.energy = 330
fill.data.color = (1, 0.2, 0.06)
fill.data.size = 4
point_at(fill, Vector((0, 0, 0)))

preview.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.render.render(write_still=True)
