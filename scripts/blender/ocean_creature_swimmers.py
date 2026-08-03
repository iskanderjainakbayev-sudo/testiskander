from math import pi
from ocean_creature_utils import cone, empty, eyes, fin, glowing_spots, parent, tail, uv


def fish(root, mats, rng, plan="fish"):
    skin, glow, eye, pupil = mats
    long = 1.25 + rng.random() * .42
    deep = .5 + rng.random() * .2
    if plan == "whale":
        long, deep = 1.8, .76
    parent(uv("body", (0, 0, 0), (.66, long, deep), skin, 28, 14), root)
    parent(uv("head", (0, -long * .72, .02), (.58, .62, deep * .88), skin, 24, 12), root)
    eyes(root, eye, pupil, .43, -long * 1.05, .16, .11 if plan != "whale" else .085)
    tail(root, skin, (0, long * 1.03, 0), .9 if plan != "whale" else 1.3)
    for side in (-1, 1):
        fin(f"swim-fin-{side}", (side * .55, -.02, -.05), (.32, .62, .055), (0, 0, side * .9), skin, root)
    fin("dorsal-fin", (0, .08, deep * .78), (.15, .6, .48), (pi / 2, 0, 0), skin, root)
    for side in (-1, 1):
        for gill in range(3):
            parent(cone(f"gill-{side}-{gill}", (side * .54, -.72 + gill * .08, .02),
                        (.018, .16, .025), (pi / 2, 0, 0), glow, 8), root)
    glowing_spots(root, glow, 6, long * 1.3, .58)


def ray(root, mats, rng):
    skin, glow, eye, pupil = mats
    parent(uv("ray-body", (0, 0, 0), (.82, 1.18, .2), skin, 28, 14), root)
    for side in (-1, 1):
        fin(f"swim-fin-{side}", (side * .55, 0, 0), (1.25, 1.2, .07), (0, 0, side * pi / 2), skin, root)
    tail(root, skin, (0, 1.15, 0), .72)
    parent(uv("dorsal-glow", (0, -.1, .18), (.58, .7, .025), glow, 20, 10), root)
    eyes(root, eye, pupil, .38, -.72, .16, .1)
    glowing_spots(root, glow, 7, 1.3, .68)


def eel(root, mats, rng):
    skin, glow, eye, pupil = mats
    count = 11
    for index in range(count):
        taper = 1 - index / (count * 1.22)
        segment = uv(f"eel-segment-{index:02d}", (0, index * .43, 0),
                     (.42 * taper, .5, .34 * taper), skin, 18, 9)
        parent(segment, root)
        if index % 2 == 0:
            parent(uv(f"eel-light-{index}", (.31 * taper, index * .43, .08),
                      (.045, .12, .035), glow, 10, 6), root)
    eyes(root, eye, pupil, .28, -.42, .13, .1)
    fin("dorsal-fin", (0, 1.7, .3), (.12, 1.7, .3), (pi / 2, 0, 0), glow, root)


def puffer(root, mats, rng):
    skin, glow, eye, pupil = mats
    parent(uv("body", (0, 0, 0), (.9, 1.0, .82), skin, 28, 14), root)
    eyes(root, eye, pupil, .55, -.75, .2, .15)
    tail(root, skin, (0, .92, 0), .55)
    for side in (-1, 1):
        fin(f"swim-fin-{side}", (side * .72, 0, 0), (.26, .42, .04), (0, 0, side), glow, root)
    for index in range(14):
        angle = index / 14 * 2 * pi
        parent(cone(f"spine-{index}", (.7 * __import__('math').sin(angle), .65 * __import__('math').cos(angle), .25),
                    (.045, .25, .045), (pi / 2, 0, -angle), skin, 7), root)
