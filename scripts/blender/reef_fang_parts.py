import math
import bpy
from ocean_hero_utils import uv, curve, fin_mesh


def loft(name, profile, material, sides=24, smooth=True):
    vertices = []
    for y, width, depth, lift in profile:
        for index in range(sides):
            angle = index * math.tau / sides
            side = math.sin(angle)
            vertical = math.cos(angle)
            planar = math.copysign(abs(side) ** .82, side)
            z_scale = 1 + .13 * max(0, vertical)
            vertices.append((planar*width, y, lift+vertical*depth*z_scale))
    faces = []
    for ring in range(len(profile)-1):
        for side in range(sides):
            nxt = (side+1) % sides
            faces.append((ring*sides+side,ring*sides+nxt,
                          (ring+1)*sides+nxt,(ring+1)*sides+side))
    faces += [tuple(range(sides-1,-1,-1)),
              tuple((len(profile)-1)*sides+i for i in range(sides))]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(material)
    for polygon in mesh.polygons:
        polygon.use_smooth = smooth
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bevel = obj.modifiers.new("organic edge tension", 'BEVEL')
    bevel.width, bevel.segments = .025, 2
    return obj


def plate(name, vertices, material, parent):
    obj = fin_mesh(name, vertices, material)
    obj.parent = parent
    return obj


def biological_eye(root, side, materials):
    socket, iris, pupil, cornea = materials
    uv(f"eye-socket-{side}", (side*.76,-1.43,.28), (.13,.23,.2), socket, 20, 10).parent = root
    uv(f"iris-{side}", (side*.855,-1.45,.28), (.028,.145,.13), iris, 20, 10).parent = root
    uv(f"weak-point-pupil-{side}", (side*.879,-1.485,.28), (.018,.065,.095), pupil, 16, 8).parent = root
    uv(f"cornea-{side}", (side*.892,-1.45,.28), (.016,.16,.145), cornea, 20, 10).parent = root


def mouth(root, materials):
    cavity, gum, tooth, jaw = materials
    uv("recessed-mouth-cavity", (0,-2.02,-.18), (.56,.09,.24), cavity, 28, 12).parent = root
    upper = curve("upper-gum", [(-.5,-2.115,-.08),(0,-2.15,-.13),(.5,-2.115,-.08)], .052, gum)
    lower = curve("lower-gum", [(-.48,-2.105,-.25),(0,-2.14,-.3),(.48,-2.105,-.25)], .052, gum)
    upper.parent, lower.parent = root, root
    jaw_root = bpy.data.objects.new("articulated-lower-jaw", None)
    jaw_root.location, jaw_root.parent = (0,-.02,-.26), root
    bpy.context.collection.objects.link(jaw_root)
    lower_jaw = loft("lower-jaw-bone", [(-2.08,.42,.11,-.12),(-1.62,.5,.16,-.08),
                     (-1.08,.32,.12,-.04)], jaw, 18)
    lower_jaw.parent = jaw_root
    sizes = (.22,.3,.25,.34,.28,.32,.23)
    for row, z in enumerate((-.06,-.27)):
        for index, x in enumerate((-.43,-.29,-.15,0,.15,.29,.43)):
            bpy.ops.mesh.primitive_cone_add(vertices=9, radius1=.038+sizes[index]*.035,
                depth=sizes[index], location=(x,-2.17,z),
                rotation=(math.pi/2+(index-3)*.035,0,(index-3)*.025))
            fang = bpy.context.object
            fang.name, fang.parent = f"seated-fang-{row}-{index}", root if row == 0 else jaw_root
            fang.data.materials.append(tooth)


def paired_fin(root, side, skin, membrane, ray):
    pivot = bpy.data.objects.new(f"swim-fin-{side}", None)
    pivot.location, pivot.parent = (side*.65,-.25,-.12), root
    bpy.context.collection.objects.link(pivot)
    uv(f"pectoral-root-{side}", (0,0,0), (.28,.38,.18), skin, 20, 10).parent = pivot
    blade = plate(f"pectoral-membrane-{side}", [(0,-.1,0),(side*1.3,.05,-.3),
      (side*1.1,.58,-.12),(side*.2,.46,.05),(0,-.1,.07),(side*1.3,.05,-.23),
      (side*1.1,.58,-.05),(side*.2,.46,.12)], membrane, pivot)
    for index in range(3):
        rib = curve(f"pectoral-ray-{side}-{index}", [(side*.12,.02,.07),
          (side*(.92+index*.13),.12+index*.16,-.15+index*.06)], .018, ray)
        rib.parent = pivot
    return blade


def tail(root, skin, membrane, ray):
    pivot = bpy.data.objects.new("swim-tail", None)
    pivot.location, pivot.parent = (0,1.42,0), root
    bpy.context.collection.objects.link(pivot)
    uv("caudal-peduncle", (0,.14,0), (.24,.58,.23), skin, 22, 10).parent = pivot
    plate("asymmetric-caudal-fin", [(-.04,.35,0),(-.06,1.18,1.2),(-.04,1.42,.82),
      (-.05,1.02,-.72),(.04,.35,0),(.06,1.18,1.2),(.04,1.42,.82),(.05,1.02,-.72)], membrane, pivot)
    for z in (-.55,.3,.92):
        rib = curve(f"caudal-ray-{z}", [(0,.36,z*.2),(0,1.15,z)], .02, ray)
        rib.parent = pivot
