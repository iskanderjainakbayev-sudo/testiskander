from pathlib import Path
import math
import bpy

ROOT = Path(__file__).resolve().parents[2]
MODEL = ROOT / "assets" / "models" / "ocean" / "abyssal-dragon.blend"
PREVIEW = ROOT / "artifacts" / "ocean" / "abyssal-dragon-preview.png"

bpy.ops.wm.open_mainfile(filepath=str(MODEL))
scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 1100
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = str(PREVIEW)
scene.world.color = (0.003, 0.008, 0.02)

bpy.ops.object.camera_add(location=(46, -35, -7))
camera = bpy.context.object
camera.name = "Preview Camera"
scene.camera = camera


def track(obj, point):
    direction = point - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


from mathutils import Vector
camera.data.lens = 52
track(camera, Vector((0, 0, -8)))

bpy.ops.object.light_add(type="AREA", location=(4, 9, 7))
key = bpy.context.object
key.data.energy = 520
key.data.color = (0.14, 0.55, 1.0)
key.data.shape = "DISK"
key.data.size = 8
track(key, Vector((0, 0, -7)))

bpy.ops.object.light_add(type="AREA", location=(-8, 2, -4))
fill = bpy.context.object
fill.data.energy = 360
fill.data.color = (1.0, 0.12, 0.04)
fill.data.size = 6
track(fill, Vector((0, 0, -8)))

bpy.ops.object.light_add(type="POINT", location=(0, -3, -15))
bpy.context.object.data.energy = 260
bpy.context.object.data.color = (0.02, 0.25, 1.0)

bpy.ops.object.light_add(type="AREA", location=(16, -18, 9))
front = bpy.context.object
front.data.energy = 900
front.data.color = (0.22, 0.72, 1.0)
front.data.size = 10
track(front, Vector((0, 0, -7)))

root = bpy.data.objects.get("Abyssal Dragon")
if root:
    root.rotation_euler[2] = math.radians(-16)
for obj in bpy.data.objects:
    if not obj.name.startswith("dragon-segment-"):
        continue
    index = int(obj.name[-2:])
    obj.location.x += math.sin(index * 0.62) * min(1.8, index * 0.12)
    obj.rotation_euler[1] = math.sin(index * 0.62) * 0.18

PREVIEW.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.render.render(write_still=True)

camera.location = (10, -15, 12)
camera.data.lens = 62
track(camera, Vector((0, 0, .5)))
scene.render.filepath = str(PREVIEW.with_name("abyssal-dragon-head-preview.png"))
bpy.ops.render.render(write_still=True)
