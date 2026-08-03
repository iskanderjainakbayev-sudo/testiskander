import math
import bpy
from ocean_hero_utils import mat, uv, cube, cylinder, torus, curve, fin_mesh


def hull(material):
    profile = [(-2.62,.3,.34),(-2.35,.72,.62),(-1.72,1.0,.88),(-.65,1.1,.96),
               (.55,1.04,.93),(1.52,.82,.76),(2.28,.42,.46),(2.48,.18,.22)]
    sides = 24
    vertices = []
    for z, width, height in profile:
        for index in range(sides):
            angle = index*math.tau/sides
            x = math.copysign(abs(math.sin(angle))**.82, math.sin(angle))*width
            y = math.cos(angle)*height
            vertices.append((x,y,z))
    faces = []
    for ring in range(len(profile)-1):
        for side in range(sides):
            nxt = (side+1)%sides
            faces.append((ring*sides+side,ring*sides+nxt,
                          (ring+1)*sides+nxt,(ring+1)*sides+side))
    faces += [tuple(range(sides-1,-1,-1)),
              tuple((len(profile)-1)*sides+i for i in range(sides))]
    mesh = bpy.data.meshes.new("tapered pressure hull")
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(material)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    obj = bpy.data.objects.new("tapered-pressure-hull", mesh)
    bpy.context.collection.objects.link(obj)
    bevel = obj.modifiers.new("rolled hull planes", 'BEVEL')
    bevel.width, bevel.segments = .035, 2
    return obj


def cockpit(root, edge, glass, glow):
    interior = mat("cockpit shadow", (.005,.012,.014), metallic=.12, roughness=.72)
    upholstery = mat("pilot restraint", (.08,.1,.09), roughness=.64)
    screen = mat("instrument phosphor", (.01,.42,.5), roughness=.1, emission=(.01,.8,1))
    uv("cockpit-pressure-cavity", (0,.22,-1.88), (.66,.56,.86), interior, 28, 14).parent = root
    for side in (-1,1):
        cube(f"seat-{side}", (side*.25,-.06,-1.45), (.18,.3,.25), upholstery, .08,
             (-.18,0,0)).parent = root
        curve(f"seat-harness-{side}", [(side*.34,.12,-1.63),(side*.24,-.12,-1.42),
              (side*.15,.12,-1.63)], .018, glow).parent = root
    cube("instrument-console", (0,.16,-2.32), (.48,.18,.09), edge, .06, (-.2,0,0)).parent = root
    for x in (-.31,-.1,.11,.32):
        uv(f"instrument-{x}", (x,.29,-2.38), (.055,.025,.035), screen, 12, 6).parent = root
    torus("canopy-inner-seal", (0,.28,-1.74), .72, .042, edge).parent = root
    for x in (-.56,.56):
        curve(f"canopy-frame-{x}", [(x,.33,-2.45),(x*.92,.91,-1.9),(x*.78,.64,-1.06)],
              .055, edge).parent = root


def service_panels(root, hull_mat, edge, coral):
    wear = mat("contact abrasion", (.12,.15,.13), metallic=.28, roughness=.78)
    for side in (-1,1):
        x = side*1.02
        uv(f"recessed-hatch-bed-{side}", (x,0,.28), (.035,.38,.58), edge, 20, 10).parent = root
        uv(f"maintenance-hatch-{side}", (side*1.055,0,.28), (.025,.31,.49), hull_mat, 20, 10).parent = root
        for y,z in ((-.25,-.05),(.25,-.05),(-.25,.58),(.25,.58)):
            uv(f"hatch-fastener-{side}-{y}-{z}", (side*1.087,y,z), (.025,.035,.035), edge, 10, 5).parent = root
        for vent in range(5):
            cube(f"cooling-vent-{side}-{vent}", (side*1.02,-.38+vent*.16,1.22),
                 (.035,.05,.24), edge, .025).parent = root
        curve(f"nacelle-feed-pipe-{side}", [(side*.72,.56,.42),(side*1.2,.45,.72),
              (side*1.22,.25,1.1)], .055, edge).parent = root
        for scrape in range(3):
            curve(f"keel-scrape-{side}-{scrape}", [(side*(.45+scrape*.08),-.86,-.2),
                  (side*(.38+scrape*.08),-.9,.55)], .015, wear).parent = root
        fin_mesh(f"rescue-chevron-{side}", [(side*1.07,.42,-.55),(side*1.09,.18,-.25),
          (side*1.09,.42,-.05),(side*1.07,.58,-.35),(side*1.09,.42,-.55),
          (side*1.11,.18,-.25),(side*1.11,.42,-.05),(side*1.09,.58,-.35)], coral).parent = root


def propulsion(root, edge, coral, glow):
    for side in (-1,1):
        x = side*1.16
        for brace_y in (-.32,.32):
            cube(f"load-brace-{side}-{brace_y}", (side*.96,brace_y,.72),
                 (.34,.08,.12), edge, .055, (0,side*.16,0)).parent = root
        torus(f"intake-lip-{side}", (x,0,.2), .37, .065, coral).parent = root
        cylinder(f"exhaust-stage-{side}", (x,0,1.58), .3,.18,edge,vertices=28).parent = root
        cylinder(f"exhaust-glow-{side}", (x,0,1.69), .2,.08,glow,vertices=24).parent = root
        for blade in range(6):
            angle = blade*math.tau/6
            cube(f"intake-fan-{side}-{blade}", (x,0,.16), (.025,.26,.045), edge,.015,
                 (0,0,angle)).parent = root
        curve(f"thruster-coolant-{side}", [(side*.78,-.62,.18),(x,-.52,.68),
              (x,-.4,1.42)], .035, coral).parent = root
