from pathlib import Path
import sys
import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
name = sys.argv[sys.argv.index("--") + 1]
folder = "weapons" if name == "tidebreaker-blaster" else "hero"
asset = ROOT / "assets" / "models" / "ocean" / folder / f"{name}.glb"
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

camera_location = ((4.2, 4.8, 2.9) if name == "tidebreaker-blaster" else
                   (11.5, 7.2, -15.5) if name == "damaged-lifepod" else (12, 5.5, -8))
bpy.ops.object.camera_add(location=camera_location)
camera = bpy.context.object
camera.rotation_euler = (Vector((0, 0, 0)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.lens = 64 if name == "tidebreaker-blaster" else 58
bpy.context.scene.camera = camera

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = 900, 650, 100
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = str(output)
scene.render.film_transparent = False
scene.view_settings.look = 'AgX - Medium High Contrast'
bpy.ops.render.render(write_still=True)
print(f"PREVIEW {output}")
if name == "damaged-lifepod":
    damage = Vector((1.75, .12, -2.35))
    camera.location = (7.2, 3.6, -9.4)
    camera.rotation_euler = (damage - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.lens = 72
    closeup = Path("/tmp/damaged-lifepod-damage-preview.png")
    scene.render.filepath = str(closeup)
    bpy.ops.render.render(write_still=True)
    print(f"DAMAGE_PREVIEW {closeup}")
if name == "nereid-micro-sub":
    views = [
        ("side", (16,4,0), (0,0,0), 58),
        ("rear", (12,5.5,13), (0,0,.55), 58),
        ("cockpit-detail", (3.6,2.2,-7.2), (0,.2,-1.8), 70),
    ]
    for label, location, target, lens in views:
        camera.location, camera.data.lens = location, lens
        camera.rotation_euler = (Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler()
        detail_output = Path('/tmp') / f"nereid-micro-sub-{label}-preview.png"
        scene.render.filepath = str(detail_output)
        bpy.ops.render.render(write_still=True)
        print(f"NEREID_VIEW {detail_output}")
