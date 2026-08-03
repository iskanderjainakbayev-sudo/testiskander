from pathlib import Path
import sys
import bpy

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from ocean_hero_utils import reset, mat, uv, curve
from reef_fang_parts import loft, plate, biological_eye, mouth, paired_fin, tail

ROOT = HERE.parents[1]
OUT = ROOT / "assets" / "models" / "ocean" / "fish"
bpy.context.preferences.filepaths.save_version = 0


def build():
    reset()
    skin = mat("reef-fang dermal scales", (.58,.07,.018), metallic=.08, roughness=.34)
    dorsal = mat("reef-fang dorsal armor", (.18,.012,.008), metallic=.24, roughness=.3)
    belly = mat("reef-fang countershade", (.72,.27,.12), roughness=.42)
    membrane = mat("scarlet fin membrane", (.75,.045,.012), roughness=.25,
                   emission=(.13,.004,.001), alpha=.9)
    glow = mat("lateral electroreceptors", (1,.22,.025), roughness=.16,
               emission=(1,.035,.002))
    tooth = mat("mottled pressure ivory", (.72,.66,.48), roughness=.31)
    gum = mat("vascular gums", (.3,.012,.015), roughness=.42)
    cavity = mat("mouth cavity", (.008,.001,.001), roughness=.62)
    iris = mat("amber iris", (.78,.15,.008), roughness=.16, emission=(.55,.045,.001))
    pupil = mat("predator pupil", (.004,.001,.001), roughness=.05)
    cornea = mat("wet cornea", (.06,.11,.1), metallic=.05, roughness=.03, alpha=.5)
    root = bpy.data.objects.new("reef-fang", None)
    root["display_name"], root["body_plan"], root["hostile"] = "Reef Fang", "fish", True
    bpy.context.collection.objects.link(root)
    body = loft("anatomical-shark-body", [(-2.12,.13,.12,.05),(-1.82,.62,.42,.08),
      (-1.28,.84,.61,.07),(-.55,.88,.68,.02),(.18,.7,.57,0),(.82,.47,.4,0),
      (1.35,.23,.22,0),(1.58,.16,.16,0)], skin)
    body.parent = root
    belly_mesh = loft("ventral-countershade", [(-1.82,.44,.12,-.33),(-1.2,.61,.17,-.47),
      (-.45,.62,.18,-.51),(.3,.46,.14,-.4),(.9,.24,.09,-.25)], belly, 18)
    belly_mesh.parent = root
    plate("planar-skull-shield", [(-.62,-1.86,.18),(-.76,-1.1,.62),(-.48,-.45,.7),(-.08,-1.95,.32),
      (.62,-1.86,.18),(.76,-1.1,.62),(.48,-.45,.7),(.08,-1.95,.32)], dorsal, root)
    for side in (-1,1):
        biological_eye(root, side, (dorsal,iris,pupil,cornea))
        for gill in range(4):
            slit = curve(f"gill-slit-{side}-{gill}", [(side*.81,-1.02+gill*.13,.2),
                (side*.86,-.98+gill*.13,-.18)], .018, cavity)
            slit.parent = root
        paired_fin(root, side, skin, membrane, glow)
        for scar in range(3):
            mark = curve(f"scar-{side}-{scar}", [(side*.84,-.28+scar*.15,.34),
                (side*.86,-.1+scar*.15,.18)], .012, belly)
            mark.parent = root
    mouth(root, (cavity,gum,tooth,dorsal))
    plate("dorsal-fin", [(-.08,-.55,.52),(-.1,.08,1.5),(-.08,.78,.48),(-.05,.48,.34),
      (.08,-.55,.52),(.1,.08,1.5),(.08,.78,.48),(.05,.48,.34)], membrane, root)
    tail(root, skin, membrane, glow)
    uv("lateral-glow", (.72,.18,.06), (.035,.42,.055), glow, 16, 8).parent = root
    OUT.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"reef-fang.blend"), compress=True)
    bpy.ops.export_scene.gltf(filepath=str(OUT/"reef-fang.glb"), export_format='GLB', export_apply=True)


build()
