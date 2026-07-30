"""Compose LYRA's detailed exterior subsystems."""

from __future__ import annotations

import bpy

from lyra_landing_thermal import build_landing_gear, build_thermal_system
from lyra_propulsion import build_engines
from lyra_sensors_service import build_rcs_and_service_details, build_sensor_suite


def build_systems(root: bpy.types.Object, materials: dict[str, bpy.types.Material]) -> None:
    build_engines(root, materials)
    build_landing_gear(root, materials)
    build_thermal_system(root, materials)
    build_sensor_suite(root, materials)
    build_rcs_and_service_details(root, materials)
