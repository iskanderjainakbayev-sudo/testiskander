from math import cos, pi, sin
from ocean_creature_utils import cone, eyes, fin, glowing_spots, parent, tail, uv


def turtle(root, mats, rng):
    skin, glow, eye, pupil = mats
    parent(uv("shell", (0, .1, .16), (.9, 1.18, .42), skin, 28, 14), root)
    parent(uv("shell-inlay", (0, .1, .5), (.68, .86, .055), glow, 20, 10), root)
    parent(uv("head", (0, -1.02, .02), (.36, .46, .34), skin, 20, 10), root)
    eyes(root, eye, pupil, .23, -1.35, .12, .075)
    tail(root, skin, (0, 1.12, 0), .32)
    for side in (-1, 1):
        fin(f"swim-fin-{side}", (side * .72, -.28, 0), (.46, .78, .08), (0, 0, side * .9), skin, root)


def jelly(root, mats, rng):
    skin, glow, eye, pupil = mats
    parent(uv("bell", (0, 0, .25), (.86, .86, .64), skin, 28, 14), root)
    parent(uv("luminous-core", (0, 0, .2), (.36, .36, .42), glow, 18, 9), root)
    for index in range(8):
        angle = index / 8 * 2 * pi
        parent(cone(f"tentacle-{index}", (cos(angle) * .52, sin(angle) * .52, -.75),
                    (.045, .9 + index % 3 * .18, .045), (0, 0, 0), glow if index % 2 else skin, 8), root)


def squid(root, mats, rng):
    skin, glow, eye, pupil = mats
    parent(uv("mantle", (0, .28, .15), (.62, 1.05, .68), skin, 28, 14), root)
    eyes(root, eye, pupil, .4, -.52, .18, .13)
    for side in (-1, 1):
        fin(f"swim-fin-{side}", (side * .48, .55, .18), (.42, .55, .055), (0, 0, side * .8), skin, root)
    for index in range(8):
        angle = index / 8 * 2 * pi
        parent(cone(f"tentacle-{index}", (cos(angle) * .24, -.95, sin(angle) * .16),
                    (.06, .82 + index % 2 * .3, .06), (pi / 2, 0, 0), glow if index % 3 == 0 else skin, 9), root)
    glowing_spots(root, glow, 5, 1.05, .46)


def crab(root, mats, rng):
    skin, glow, eye, pupil = mats
    parent(uv("shell", (0, 0, .12), (1.0, .72, .46), skin, 24, 12), root)
    parent(uv("shell-inlay", (0, 0, .5), (.58, .42, .05), glow, 18, 9), root)
    eyes(root, eye, pupil, .4, -.58, .34, .105)
    for side in (-1, 1):
        for index in range(4):
            parent(cone(f"leg-{side}-{index}", (side * (.82 + index * .08), -.35 + index * .28, -.12),
                        (.08, .52, .08), (0, side * .7, side * 1.05), skin, 8), root)
        parent(cone(f"claw-{side}", (side * 1.18, -.66, .08), (.3, .52, .24),
                    (0, 0, side * .48), glow if side > 0 else skin, 10), root)


def shrimp(root, mats, rng):
    skin, glow, eye, pupil = mats
    for index in range(6):
        taper = 1 - index * .11
        parent(uv(f"body-segment-{index}", (0, index * .3, 0), (.38 * taper, .36, .3 * taper), skin, 18, 9), root)
    eyes(root, eye, pupil, .3, -.34, .18, .11)
    tail(root, glow, (0, 1.72, 0), .55)
    for side in (-1, 1):
        for index in range(4):
            parent(cone(f"leg-{side}-{index}", (side * .3, index * .28, -.25),
                        (.035, .32, .035), (0, side * .8, side), skin, 7), root)


def slug(root, mats, rng):
    skin, glow, eye, pupil = mats
    parent(uv("body", (0, 0, 0), (.58, 1.15, .3), skin, 24, 12), root)
    parent(uv("mantle-glow", (0, .05, .28), (.38, .72, .055), glow, 18, 9), root)
    eyes(root, eye, pupil, .25, -.92, .18, .075)
    for side in (-1, 1):
        fin(f"swim-fin-{side}", (side * .25, -.82, .25), (.07, .42, .07), (0, 0, side * .28), glow, root)
    for index in range(7):
        parent(cone(f"cerata-{index}", ((index % 2 * 2 - 1) * .36, -.25 + index * .18, .35),
                    (.055, .25, .055), (0, 0, 0), glow, 8), root)
