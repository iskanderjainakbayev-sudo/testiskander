"""Stepped dorsal engineering spine that gives LYRA vertical mass and service logic."""

from __future__ import annotations

import bpy

from lyra_common import box, curve_tube, empty


def build_engineering_spine(
    root: bpy.types.Object, materials: dict[str, bpy.types.Material]
) -> None:
    spine = empty("DORSAL_ENGINEERING_SPINE", root)
    modules = (
        ("AftPower", (5.6, 7.8, 1.45), (0.0, -15.0, 4.48)),
        ("ReactorCore", (6.3, 10.5, 1.82), (0.0, -6.0, 5.10)),
        ("MissionBus", (5.2, 7.2, 1.42), (0.0, 3.6, 5.07)),
    )
    for name, dimensions, location in modules:
        box(
            f"Spine_{name}_PressureModule",
            dimensions,
            location,
            materials["armor"],
            spine,
            bevel=0.38,
            segments=4,
        )
    lids = (
        ("Reactor", (2.75, 3.8, 0.15), (0.0, -6.3, 6.04)),
        ("Mission", (2.35, 2.8, 0.14), (0.0, 3.6, 5.81)),
    )
    for name, dimensions, location in lids:
        box(
            f"Spine_{name}_OffWhiteAccessLid",
            dimensions,
            location,
            materials["hull"],
            spine,
            bevel=0.10,
            segments=3,
        )
    box(
        "Spine_Reactor_CableTrench",
        (1.18, 9.0, 0.16),
        (0.0, -6.4, 6.08),
        materials["heat"],
        spine,
        bevel=0.07,
        segments=2,
    )
    for side in (-1.0, 1.0):
        label = "Port" if side < 0 else "Starboard"
        for index, (y, x, z) in enumerate(
            (
                (-16.6, 2.72, 4.65),
                (-13.4, 2.72, 4.65),
                (-8.7, 3.12, 5.10),
                (-4.9, 3.12, 5.10),
                (1.8, 2.55, 5.08),
                (4.7, 2.55, 5.08),
            )
        ):
            box(
                f"Spine_{label}_HeatLouver_{index + 1:02d}",
                (0.22, 1.18, 0.38),
                (side * x, y, z),
                materials["heat"],
                spine,
                bevel=0.055,
                segments=2,
            )
        curve_tube(
            f"Spine_{label}_ServiceRail",
            (
                (side * 2.75, -18.1, 4.77),
                (side * 3.15, -9.6, 5.28),
                (side * 3.18, -2.0, 5.32),
                (side * 2.62, 6.2, 5.27),
            ),
            0.065,
            materials["metal"],
            spine,
            1,
        )
