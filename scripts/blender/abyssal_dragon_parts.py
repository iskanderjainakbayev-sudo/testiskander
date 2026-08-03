import math
import bpy
from ocean_hero_utils import uv, curve, fin_mesh


def attach_uv(parent, name, location, scale, material, segments=24, rings=12):
    obj = uv(name, (0, 0, 0), scale, material, segments, rings)
    obj.parent, obj.location = parent, location
    return obj


def attach_cone(parent, name, location, scale, rotation, material, vertices=12):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=1, radius2=0, depth=2)
    obj = bpy.context.object
    obj.name, obj.parent, obj.location = name, parent, location
    obj.scale, obj.rotation_euler = scale, rotation
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def attach_fin(parent, name, vertices, material):
    blade = fin_mesh(f"{name}-membrane", vertices, material)
    blade.parent = parent
    return blade


def build_segment(root, index, count, materials):
    skin, armor, belly, glow = materials
    t = index / (count - 1)
    radius = 1.5 * (1 - t * .72)
    segment = bpy.data.objects.new(f"dragon-segment-{index:02d}", None)
    segment.location = (0, math.sin(index*.58)*.1, -2.0-index*.98)
    segment.parent = root
    bpy.context.collection.objects.link(segment)
    attach_uv(segment, f"muscle-{index:02d}", (0,0,0),
              (radius, radius*.68, 1.28), skin, 24, 12)
    attach_uv(segment, f"armor-carapace-{index:02d}", (0,radius*.4,-.08),
              (radius*.76, radius*.2, .92), armor, 20, 10)
    attach_uv(segment, f"ventral-scute-{index:02d}", (0,-radius*.49,.08),
              (radius*.58, radius*.13, .8), belly, 18, 8)
    if index < 14:
        attach_cone(segment, f"dorsal-spine-{index:02d}", (0,radius*.72,-.08),
                    (.18*(1-t*.4), .62*(1-t*.5), .13),
                    (math.pi/2,0,0), armor, 10)
    for side in (-1, 1):
        attach_uv(segment, f"pressure-organ-{index:02d}-{side}",
                  (side*radius*.88,.08,.08), (.055,.1,.22), glow, 14, 7)
    return segment


def build_head(root, materials):
    skin, armor, belly, glow, eye, bone = materials
    attach_uv(root, "dragon-cranium", (0,.05,.05), (1.95,1.22,2.25), skin, 36, 18)
    attach_uv(root, "armored-brow", (0,.65,.72), (1.7,.48,1.22), armor, 28, 14)
    attach_uv(root, "dragon-muzzle", (0,-.08,1.83), (1.28,.73,1.05), belly, 28, 14)
    attach_uv(root, "lower-jaw", (0,-.72,2.05), (1.18,.28,.94), armor, 28, 12)
    for side in (-1, 1):
        attach_uv(root, f"weak-point-dragon-eye-{side}", (side*1.28,.63,1.12),
                  (.24,.12,.18), eye, 20, 10)
        attach_cone(root, f"crown-horn-{side}", (side*1.18,1.0,-.35),
                    (.28,.28,1.45), (-.35,side*.34,0), bone, 12)
        attach_cone(root, f"cheek-horn-{side}", (side*1.7,.12,.55),
                    (.18,.18,.92), (0,side*.68,0), bone, 10)
        feeler = curve(f"luminous-barbel-{side}", [(side*.72,-.55,2.4),
          (side*1.25,-1.05,3.15),(side*1.55,-.7,4.25)], .045, glow)
        feeler.parent = root
    for row, vertical in enumerate((-.48,-.82)):
        for tooth_index in range(-5,6):
            attach_cone(root, f"fang-{row}-{tooth_index}",
              (tooth_index*.17,vertical,2.72-abs(tooth_index)*.025),
              (.07,.07,.34 if row == 0 else .24), (math.pi/2,0,0), bone, 8)


def build_fins(root, membrane, bone, glow):
    for side in (-1, 1):
        pivot = bpy.data.objects.new(f"swim-fin-{side}", None)
        pivot.location, pivot.parent = (side*1.25,0,-2.5), root
        bpy.context.collection.objects.link(pivot)
        attach_fin(pivot, f"swim-fin-{side}", [(0,0,0),(side*3.6,.1,-.8),
          (side*2.8,.15,1.8),(0,.08,1.15),(0,.12,0),(side*3.6,.22,-.8),
          (side*2.8,.27,1.8),(0,.2,1.15)], membrane)
        for rib in range(3):
            line = curve(f"fin-ray-{side}-{rib}", [(0,.18,.2+rib*.25),
                (side*(2.7+rib*.25),.22,-.35+rib*.58)], .035, bone)
            line.parent = pivot
        organ = curve(f"fin-biolight-{side}", [(0,.24,.12),(side*2.2,.28,.05),
                      (side*2.7,.28,.85)], .05, glow)
        organ.parent = pivot
    tail = bpy.data.objects.new("swim-tail", None)
    tail.location, tail.parent = (0,0,-19.2), root
    bpy.context.collection.objects.link(tail)
    attach_fin(tail, "tail-crown", [(-.1,0,0),(-2.4,.05,-1.6),(-1.2,.05,.2),
      (-2.1,.05,1.8),(.1,.12,0),(2.4,.17,-1.6),(1.2,.17,.2),(2.1,.17,1.8)], membrane)
