import math
import bpy
from ocean_hero_utils import mat, uv, cube, cylinder, curve, fin_mesh


def breach_hull(shell, cavity_material):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1,
        location=(2.45,.22,-2.05))
    cutter = bpy.context.object
    cutter.name = "breach-cutter"
    cutter.scale = (1.22,.92,1.08)
    modifier = shell.modifiers.new("torn pressure breach", 'BOOLEAN')
    modifier.operation, modifier.solver, modifier.object = 'DIFFERENCE', 'EXACT', cutter
    bpy.context.view_layer.objects.active = shell
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.data.objects.remove(cutter, do_unlink=True)
    for polygon in shell.data.polygons:
        polygon.use_smooth = True
    uv("charred-breach-cavity", (1.82,.2,-2.45), (1.14,.82,.28),
       cavity_material, 28, 14)


def torn_panels(material, bare_metal):
    panels = [
      ("peeled-upper-panel", [(1.1,.68,-2.72),(2.0,1.2,-2.52),(2.8,1.0,-1.92),(2.14,.56,-2.7),
        (1.1,.73,-2.66),(2.0,1.34,-2.42),(2.8,1.08,-1.82),(2.14,.62,-2.62)]),
      ("peeled-side-panel", [(2.38,-.7,-2.28),(3.28,-.52,-1.42),(3.14,.2,-1.3),(2.34,.32,-2.45),
        (2.45,-.68,-2.22),(3.42,-.47,-1.3),(3.28,.25,-1.18),(2.41,.35,-2.37)]),
      ("crumpled-lower-panel", [(1.05,-.58,-2.7),(1.8,-1.32,-2.32),(2.48,-1.08,-1.86),(2.1,-.52,-2.62),
        (1.08,-.53,-2.63),(1.82,-1.2,-2.2),(2.53,-.98,-1.73),(2.12,-.46,-2.54)]),
    ]
    for index, (name, vertices) in enumerate(panels):
        fin_mesh(name, vertices, material if index != 1 else bare_metal)


def exposed_internals(frame, insulation, wire_materials):
    for offset in (-.48,0,.48):
        curve(f"exposed-frame-{offset}", [(1.15+abs(offset)*.4,offset,-2.52),
              (2.05,offset*.8,-2.74),(2.66,offset*.55,-2.18)], .07, frame)
    for index, location in enumerate(((1.52,.48,-2.64),(1.83,.13,-2.71),(1.48,-.3,-2.6))):
        uv(f"torn-insulation-{index}", location, (.34,.24,.12), insulation, 16, 8)
    for index, side in enumerate((-.42,-.2,.08,.3,.48)):
        wire = curve(f"severed-wire-{index}", [(1.72,side,-2.72),(2.25,side*.8,-2.98),
            (2.78,side*.5,-2.54),(3.03,side*.8,-2.3)], .025, wire_materials[index%len(wire_materials)])
        wire.data.bevel_resolution = 2


def scorch_and_grime(scorch, grime):
    for index in range(6):
        y = -.35+index*.16
        streak = curve(f"impact-scorch-{index}", [(1.55,y,-2.78),(1.05-index*.07,y+.18,-2.95),
            (.25-index*.18,y+.34,-3.0)], .035+index*.008, scorch)
        streak.data.bevel_resolution = 1
    for index, x in enumerate((-2.15,-1.75,-1.3,1.15)):
        curve(f"contact-grime-{index}", [(x,-1.65,-1.65),(x*.92,-1.82,-.7),
              (x*.84,-1.86,.15)], .055, grime)


def hatch_details(glass, frame, crack, grime):
    cylinder("hatch-porthole-glass", (0,.22,-3.04), .58, .07, glass, vertices=36)
    for index, angle in enumerate((0,.72,1.55,2.28,2.9)):
        end = (.48*math.cos(angle), .22+.48*math.sin(angle), -3.09)
        mid = (.18*math.cos(angle+.16), .22+.18*math.sin(angle+.16), -3.095)
        curve(f"hatch-crack-{index}", [(0,.22,-3.095),mid,end], .009, crack)
    for index in range(12):
        angle = index*math.tau/12
        uv(f"hatch-fastener-{index}", (.96*math.cos(angle),.22+.96*math.sin(angle),-3.03),
           (.045,.045,.025), frame, 12, 6)
    for index in range(5):
        cube(f"pressure-vent-{index}", (-1.65,-.3+index*.18,-2.72),
             (.34,.035,.045), grime, .025, (0,.08,0))


def add_lifepod_damage(shell):
    cavity = mat("carbonized breach", (.006,.008,.007), metallic=.12, roughness=.72)
    metal = mat("exposed torn alloy", (.22,.27,.26), metallic=.82, roughness=.24)
    frame = mat("inner safety frame", (.06,.1,.1), metallic=.76, roughness=.28)
    foam = mat("exposed thermal insulation", (.6,.42,.09), roughness=.88)
    scorch = mat("directional impact scorch", (.035,.012,.006), roughness=.92)
    grime = mat("contact grime", (.04,.055,.047), roughness=.86)
    wire_red = mat("severed red cable", (.55,.015,.008), metallic=.18, roughness=.35)
    wire_blue = mat("severed blue cable", (.01,.18,.45), metallic=.18, roughness=.35)
    glass = mat("cracked hatch glazing", (.015,.2,.26), metallic=.14, roughness=.08, alpha=.68)
    breach_hull(shell, cavity)
    torn_panels(shell.data.materials[0], metal)
    exposed_internals(frame, foam, (wire_red,wire_blue))
    scorch_and_grime(scorch, grime)
    hatch_details(glass, metal, cavity, grime)
