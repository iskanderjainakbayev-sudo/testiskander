from pathlib import Path
import sys
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
name = sys.argv[sys.argv.index("--") + 1]
asset = ROOT / "assets" / "models" / "ocean" / "hero" / f"{name}.glb"
output = Path("/tmp") / f"{name}-preview.png"

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(asset))

world = bpy.context.scene.world
world.color = (.005, .018, .025)
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (.003, .018, .03, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = .35

for location, energy, color, size in [
    ((-5, 7, -6), 1150, (.28, .82, 1), 5),
    ((6, 3, -2), 900, (1, .35, .12), 4),
    ((0, -6, 4), 750, (.04, .25, .42), 3),
]:
    data = bpy.data.lights.new("studio softbox", 'AREA')
    data.energy, data.color, data.shape, data.size = energy, color, 'DISK', size
    light = bpy.data.objects.new("studio softbox", data)
    light.location = location
    bpy.context.collection.objects.link(light)
    light.rotation_euler = (Vector((0, 0, 0)) - light.location).to_track_quat('-Z', 'Y').to_euler()

bpy.ops.object.camera_add(location=(8.5, 5.4, -9.5))
camera = bpy.context.object
camera.rotation_euler = (Vector((0, 0, 0)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.lens = 58
bpy.context.scene.camera = camera

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = 900, 650, 100
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = str(output)
scene.render.film_transparent = False
scene.view_settings.look = 'AgX - Medium High Contrast'
bpy.ops.render.render(write_still=True)
print(f"PREVIEW {output}")
