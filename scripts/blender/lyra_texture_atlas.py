"""Generate shared color, roughness, and tangent-normal atlases for LYRA."""

from __future__ import annotations

import math
from array import array
from pathlib import Path

import bpy

from lyra_atlas_markings import marking_kind

ATLAS_SIZE = 2048
ATLAS_CACHE = Path("/tmp/lyra-generated-atlases")


def _signals(x: int, y: int) -> tuple[float, float, float]:
    scale = ATLAS_SIZE / 1024.0
    sample_x, sample_y = x / scale, y / scale
    a = sample_x * 0.071 + sample_y * 0.013
    b = sample_x * 0.017 - sample_y * 0.053
    c = (sample_x + sample_y) * 0.031
    grain = (math.sin(a) + math.sin(b) + math.sin(c)) / 3.0
    dx = (0.071 * math.cos(a) + 0.017 * math.cos(b) + 0.031 * math.cos(c)) / 3.0
    dy = (0.013 * math.cos(a) - 0.053 * math.cos(b) + 0.031 * math.cos(c)) / 3.0
    return grain, dx, dy


def _sample(x: int, y: int) -> tuple[tuple[float, float, float], float, tuple[float, float, float]]:
    half = ATLAS_SIZE // 2
    u, v = x % half, y % half
    scale = ATLAS_SIZE / 1024.0
    grain, dx, dy = _signals(x, y)
    seam_period_x, seam_period_y = round(128 * scale), round(112 * scale)
    seam_x, seam_y = u % seam_period_x, v % seam_period_y
    seam_width = round(2 * scale)
    seam = seam_x < seam_width or seam_y < seam_width
    seam_distance = min(
        seam_x,
        seam_period_x - seam_x,
        seam_y,
        seam_period_y - seam_y,
    )
    cavity_grime = max(0.0, 1.0 - seam_distance / (8.0 * scale))
    scratch_period = round(389 * scale)
    scratch_phase = (v + u // 7) % scratch_period
    scratch = (
        scratch_phase < max(1, round(1.2 * scale))
        and (u // max(1, round(54 * scale))) % 5 in (1, 2, 3)
    )
    groove_x = (seam_width * 0.5 - seam_x) * 0.035 if seam_x < seam_width else 0.0
    groove_y = (seam_width * 0.5 - seam_y) * 0.035 if seam_y < seam_width else 0.0
    if x < half and y >= half:
        base = 0.50 + grain * 0.038
        color = (base + 0.11, base + 0.10, base + 0.075)
        roughness = 0.62 + grain * 0.085
        if (68 < v % 192 < 74 and 30 < u % 256 < 150):
            color = tuple(channel * 0.28 for channel in color)
        if (136 < v % 256 < 141 and 178 < u % 256 < 244):
            color = (0.68, 0.23, 0.035)
    elif x >= half and y >= half:
        brushed = 0.018 * math.sin((u + v) * 0.11 / scale)
        brushed += 0.011 * math.sin((u - v) * 0.037 / scale)
        oxidation = 0.018 * max(0.0, math.sin((u * 0.019 + v * 0.007) / scale))
        color = (
            0.165 + grain * 0.030 + brushed,
            0.180 + grain * 0.025 + brushed * 0.72 + oxidation * 0.35,
            0.190 + grain * 0.022 + brushed * 0.56 + oxidation,
        )
        roughness = 0.46 + abs(brushed) * 1.45 + grain * 0.045 + oxidation * 1.2
    elif x < half:
        radial = math.hypot(u - half * 0.5, v - half * 0.5) / (half * 0.72)
        heat = max(0.0, 1.0 - radial) * 0.11
        soot = 0.035 * (grain + 1.0) + 0.11 * (v / half) ** 2
        color = (0.10 + heat + soot, 0.078 + heat * 0.45, 0.062 + heat * 0.18)
        roughness = 0.52 + soot * 0.75 + grain * 0.045
    else:
        rib = 0.065 if u % round(34 * scale) < round(5 * scale) else 0.0
        oxidation = 0.025 * (grain + 1.0)
        color = (0.17 + rib + oxidation, 0.058 + rib * 0.31, 0.022 + oxidation)
        roughness = 0.40 + oxidation * 1.7 + (0.13 if rib else 0.0)
    color = tuple(channel * (1.0 - cavity_grime * 0.12) for channel in color)
    roughness += cavity_grime * 0.07
    marking = marking_kind(u, v, half) if y >= half else None
    if x >= half and marking in ("warning", "hazard"):
        marking = None
    if marking == "serial":
        color = (0.28, 0.30, 0.29) if x >= half else (0.10, 0.115, 0.12)
        roughness = 0.62
    elif marking == "warning":
        color = (0.43, 0.095, 0.018)
        roughness = 0.64
    elif marking == "hazard":
        color = (0.38, 0.085, 0.016)
        roughness = 0.66
    if seam:
        color = tuple(channel * 0.78 for channel in color)
        roughness += 0.15
    if scratch:
        color = (min(1.0, color[0] + 0.11), min(1.0, color[1] + 0.07), color[2])
        roughness += 0.09
    nx, ny = -(dx * 1.8 + groove_x), -(dy * 1.8 + groove_y)
    normal_length = math.sqrt(nx * nx + ny * ny + 1.0)
    normal = (nx / normal_length * 0.5 + 0.5, ny / normal_length * 0.5 + 0.5, 1.0 / normal_length)
    return tuple(max(0.0, min(1.0, value)) for value in color), max(0.05, min(0.92, roughness)), normal


def _image(name: str, pixels: array, color_space: str) -> bpy.types.Image:
    expected = ATLAS_SIZE * ATLAS_SIZE * 4
    if len(pixels) != expected:
        raise RuntimeError(f"{name} has {len(pixels)} values; expected {expected}")
    ATLAS_CACHE.mkdir(parents=True, exist_ok=True)
    working = bpy.data.images.new(f"{name}_Working", ATLAS_SIZE, ATLAS_SIZE, alpha=True)
    working.colorspace_settings.name = color_space
    working.pixels.foreach_set(pixels)
    working.update()
    sample_peak = max(working.pixels[index] for index in range(4096) if index % 4 != 3)
    if sample_peak <= 0.0:
        raise RuntimeError(f"{name} pixel upload remained black")
    path = ATLAS_CACHE / f"{name}.png"
    working.filepath_raw = str(path)
    working.file_format = "PNG"
    working.save()
    loaded = bpy.data.images.load(str(path), check_existing=False)
    loaded.name = name
    loaded.colorspace_settings.name = color_space
    loaded.pack()
    bpy.data.images.remove(working)
    return loaded


def create_texture_atlases() -> dict[str, bpy.types.Image]:
    color_pixels, rough_pixels, normal_pixels = array("f"), array("f"), array("f")
    for y in range(ATLAS_SIZE):
        for x in range(ATLAS_SIZE):
            color, roughness, normal = _sample(x, y)
            color_pixels.extend((*color, 1.0))
            rough_pixels.extend((roughness, roughness, roughness, 1.0))
            normal_pixels.extend((*normal, 1.0))
    return {
        "color": _image("TEX_LYRA_SurfaceColor_2K", color_pixels, "sRGB"),
        "roughness": _image("TEX_LYRA_SurfaceRoughness_2K", rough_pixels, "Non-Color"),
        "normal": _image("TEX_LYRA_SurfaceNormal_2K", normal_pixels, "Non-Color"),
    }
