"""Sparse scale cues: flush fasteners and long maintenance seams."""

from __future__ import annotations

from collections.abc import Callable

import bpy

from lyra_common import oriented_cylinder

SurfacePoint = Callable[[float, float, float], tuple[float, float, float]]


def add_hull_hardware(
    parent: bpy.types.Object,
    materials: dict[str, bpy.types.Material],
    surface_point: SurfacePoint,
) -> None:
    fields = (
        (0.32, (-15.0, -5.0, 5.0, 15.0)),
        (2.82, (-15.0, -5.0, 5.0, 15.0)),
        (1.18, (-7.0, 9.0)),
        (1.96, (-7.0, 9.0)),
    )
    serial = 0
    for angle, stations in fields:
        for y in stations:
            serial += 1
            oriented_cylinder(
                f"Hull_FlushFastener_{serial:03d}",
                surface_point(y, angle, 0.17),
                surface_point(y, angle, 0.245),
                0.052,
                materials["metal"],
                parent,
                8,
                bevel=0.0,
            )
