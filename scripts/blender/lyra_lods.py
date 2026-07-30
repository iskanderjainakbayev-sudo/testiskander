"""Distance representation and explicit gameplay collider for LYRA."""

from __future__ import annotations

import math

import bpy

from lyra_common import box, cone, cylinder, empty, oriented_cylinder, torus
from lyra_hull import HULL_SECTIONS, _wing, loft_hull, shell_patch


def build_lod1(root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> bpy.types.Object:
    lod = empty("LOD1_DISTANCE", root)
    lod["lod_level"] = 1
    lod["default_visible"] = False
    lod["activation_hint"] = "Use beyond 280 meters; hide LOD0_HERO"
    loft_hull("LOD1_Hull_LiftingBody", HULL_SECTIONS, 32, lod, materials["armor"], "armor")
    outline = ((4.8, -21.5), (11.4, -17.0), (18.7, -4.0), (17.0, 8.5), (9.2, 15.0), (3.6, 11.5))
    _wing("LOD1_Port_LiftingSurface", -1.0, outline, lod, materials["armor"], 1.1, "armor")
    _wing("LOD1_Starboard_LiftingSurface", 1.0, outline, lod, materials["armor"], 1.1, "armor")
    shell_patch(
        "LOD1_Canopy", 14.2, 28.2, 0.78, 2.36, lod, materials["glass"], None, 0.22, 8, 14, 0.12
    )
    box(
        "LOD1_DorsalEngineeringSpine",
        (6.0, 25.0, 1.7),
        (0.0, -6.0, 5.0),
        materials["armor"],
        lod,
        bevel=0.22,
        segments=2,
    )
    aft = -1.5
    for index, (x, z, scale) in enumerate(((-4.8, -0.4, 0.92), (0.0, -0.7, 1.12), (4.8, -0.4, 0.92))):
        cone(
            f"LOD1_Engine_{index + 1:02d}_Nozzle",
            1.15 * scale,
            2.05 * scale,
            3.8,
            (x, -28.8 + aft, z),
            materials["heat"],
            lod,
            24,
            (math.pi / 2.0, 0.0, 0.0),
            0.06,
        )
        torus(
            f"LOD1_Engine_{index + 1:02d}_GlowRing",
            1.5 * scale,
            0.14,
            (x, -30.7 + aft, z),
            materials["amber"],
            lod,
            major_segments=24,
            minor_segments=6,
        )
    box(
        "LOD1_Port_Radiator",
        (0.4, 14.0, 3.2),
        (-17.25, -9.0, 2.6),
        materials["radiator"],
        lod,
        bevel=0.1,
        segments=2,
    )
    oriented_cylinder(
        "LOD1_Sensor_Mast", (7.3, -1.0, 4.0), (9.3, -0.4, 7.4), 0.22, materials["metal"], lod, 16
    )
    cylinder("LOD1_Sensor_Dish", 2.25, 0.18, (9.3, 0.0, 7.9), materials["metal"], lod, 24, bevel=0.04)
    for name, x in (("Port", -10.2), ("Starboard", 10.2)):
        oriented_cylinder(
            f"LOD1_Gear_{name}",
            (x * 0.67, -10.5, -3.4),
            (x, -12.4, -7.2),
            0.24,
            materials["metal"],
            lod,
            16,
        )
    return lod


def build_collider(root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> bpy.types.Object:
    collider = empty("COLLIDER_SIMPLE", root)
    collider["collision_role"] = "compound static/kinematic proxy"
    collider["default_visible"] = False
    collider_sections = (
        (-27.0, 3.8, 3.0, 2.5, -0.1, 2.0),
        (-15.0, 9.2, 4.4, 3.8, 0.0, 2.0),
        (5.0, 10.0, 4.5, 3.8, 0.1, 2.0),
        (21.0, 6.0, 3.5, 2.6, 0.35, 2.0),
        (30.5, 0.8, 0.8, 0.6, 0.4, 2.0),
    )
    hull = loft_hull("COLLIDER_Hull", collider_sections, 12, collider, materials["armor"], "armor")
    hull["collider_type"] = "convex"
    for side, label in ((-1.0, "Port"), (1.0, "Starboard")):
        wing = box(
            f"COLLIDER_{label}Wing",
            (11.5, 23.0, 1.2),
            (side * 9.3, -2.0, 0.0),
            materials["armor"],
            collider,
            rotation=(0.0, 0.0, side * 0.08),
            bevel=0.0,
            segments=1,
        )
        wing["collider_type"] = "box"
    return collider
