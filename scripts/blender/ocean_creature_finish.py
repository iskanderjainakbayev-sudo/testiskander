"""Species-specific finishing details shared by every ocean creature."""

from math import pi
from ocean_creature_utils import cone, fin, parent, torus, uv


SWIMMERS = {"fish", "whale", "puffer"}


def _scale_rows(root, glow, accent, length, width, count):
    for index in range(count):
        y = -.62 * length + index * (1.18 * length / max(1, count - 1))
        material = glow if index % 3 == 1 else accent
        for side in (-1, 1):
            parent(uv(f"scale-{side}-{index}", (side * width, y, .12),
                      (.07, .12, .035), material, 10, 5), root)


def _sail(root, membrane, length, height):
    for index in range(3):
        y = -.28 * length + index * .34 * length
        fin(f"sail-fin-{index}", (0, y, height * .55),
            (.1, .35 * length, .42 * height), (pi / 2, 0, 0), membrane, root)


def _armor(root, accent, length, width):
    for index in range(4):
        y = -.48 * length + index * .34 * length
        parent(uv(f"armor-plate-{index}", (0, y, .32),
                  (width * .72, .22 * length, .075), accent, 14, 7), root)


def _crown(root, accent, length, width):
    for index in range(5):
        y = -.45 * length + index * .23 * length
        height = .28 + (2 - abs(2 - index)) * .08
        parent(cone(f"crown-spine-{index}", (0, y, .55),
                    (.07, .07, height), (0, 0, 0), accent, 7), root)
    for side in (-1, 1):
        parent(cone(f"cheek-blade-{side}", (side * width, -.72 * length, .02),
                    (.08, .42, .19), (pi / 2, side * .32, 0), accent, 6), root)


def _whiskers(root, glow, length, width):
    for side in (-1, 1):
        for index in range(2):
            parent(cone(f"sensory-whisker-{side}-{index}",
                        (side * width * (.72 + index * .18), -length * .92, -.12 + index * .18),
                        (.018, length * (.48 + index * .12), .018),
                        (pi / 2, side * .13, 0), glow, 7), root)


def _halo(root, glow, length, width):
    parent(torus("luminous-halo", (0, -.08 * length, .05),
                 (width * 1.18, length * .76, 1), (pi / 2, 0, 0), glow), root)


def _finish_swimmer(root, mats, creature, rng):
    _, glow, _, _, accent, membrane = mats
    plan = creature["body_plan"]
    length = 1.8 if plan == "whale" else 1.25 + rng.random() * .42
    width = .67 if plan != "puffer" else .9
    profile = sum(ord(char) for char in creature["asset_id"]) % 5
    _scale_rows(root, glow, accent, length, width * .92, 6 if plan == "whale" else 5)
    if profile == 0:
        _sail(root, membrane, length, .72)
    elif profile == 1:
        _armor(root, accent, length, width)
    elif profile == 2:
        _crown(root, accent, length, width)
    elif profile == 3:
        _whiskers(root, glow, length, width)
    else:
        _halo(root, glow, length, width)


def _finish_other(root, mats, creature):
    _, glow, _, _, accent, membrane = mats
    plan = creature["body_plan"]
    if plan in {"eel", "serpent"}:
        for index in range(1, 10, 2):
            parent(torus(f"eel-ring-{index}", (0, index * .43, 0),
                         (.42 * (1 - index / 13.4), .34 * (1 - index / 13.4), 1),
                         (pi / 2, 0, 0), glow, .74, .026), root)
    elif plan == "ray":
        _scale_rows(root, glow, accent, 1.15, .67, 5)
        _halo(root, glow, 1.1, .7)
    elif plan in {"squid", "jelly"}:
        parent(torus("mantle-crown", (0, .08, .55), (1, 1, .65),
                     (0, 0, 0), glow, .48, .055), root)
    elif plan in {"crab", "shrimp"}:
        _armor(root, accent, .85, .72)
    else:
        _scale_rows(root, glow, membrane, 1.05, .48, 4)


def finish_creature(root, mats, creature, rng):
    if creature["body_plan"] in SWIMMERS:
        _finish_swimmer(root, mats, creature, rng)
    else:
        _finish_other(root, mats, creature)
