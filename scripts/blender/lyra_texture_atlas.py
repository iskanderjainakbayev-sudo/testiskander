"""Generate shared color, roughness, and tangent-normal atlases for LYRA."""

from __future__ import annotations

import math
from array import array
from pathlib import Path

import bpy

ATLAS_SIZE = 1024
ATLAS_CACHE = Path("/tmp/lyra-generated-atlases")


def _signals(x: int, y: int) -> tuple[float, float, float]:
    a = x * 0.071 + y * 0.013
    b = x * 0.017 - y * 0.053
    c = (x + y) * 0.031
    grain = (math.sin(a) + math.sin(b) + math.sin(c)) / 3.0
    dx = (0.071 * math.cos(a) + 0.017 * math.cos(b) + 0.031 * math.cos(c)) / 3.0
    dy = (0.013 * math.cos(a) - 0.053 * math.cos(b) + 0.031 * math.cos(c)) / 3.0
    return grain, dx, dy


def _sample(x: int, y: int) -> tuple[tuple[float, float, float], float, tuple[float, float, float]]:
    half = ATLAS_SIZE // 2
    u, v = x % half, y % half
    grain, dx, dy = _signals(x, y)
    seam_x, seam_y = u % 128, v % 112
    seam = seam_x < 3 or seam_y < 3
    scratch = (x * 37 + y * 17) % 997 < 2
    groove_x = (1.5 - seam_x) * 0.045 if seam_x < 3 else 0.0
    groove_y = (1.5 - seam_y) * 0.045 if seam_y < 3 else 0.0
    if x < half and y >= half:
        base = 0.73 + grain * 0.035
        color = (base + 0.14, base + 0.13, base + 0.09)
        roughness = 0.50 + grain * 0.085
        if (68 < v % 192 < 74 and 30 < u % 256 < 150):
            color = tuple(channel * 0.28 for channel in color)
        if (136 < v % 256 < 141 and 178 < u % 256 < 244):
            color = (0.68, 0.23, 0.035)
    elif x >= half and y >= half:
        brushed = 0.018 * math.sin((u + v) * 0.11) + 0.011 * math.sin((u - v) * 0.037)
        oxidation = 0.018 * max(0.0, math.sin(u * 0.019 + v * 0.007))
        color = (
            0.125 + grain * 0.026 + brushed,
            0.142 + grain * 0.021 + brushed * 0.72 + oxidation * 0.35,
            0.151 + grain * 0.018 + brushed * 0.56 + oxidation,
        )
        roughness = 0.46 + abs(brushed) * 1.45 + grain * 0.045 + oxidation * 1.2
    elif x < half:
        radial = math.hypot(u - half * 0.5, v - half * 0.5) / (half * 0.72)
        heat = max(0.0, 1.0 - radial) * 0.11
        soot = 0.035 * (grain + 1.0) + 0.11 * (v / half) ** 2
        color = (0.10 + heat + soot, 0.078 + heat * 0.45, 0.062 + heat * 0.18)
        roughness = 0.52 + soot * 0.75 + grain * 0.045
    else:
        rib = 0.09 if u % 34 < 5 else 0.0
        oxidation = 0.025 * (grain + 1.0)
        color = (0.21 + rib + oxidation, 0.076 + rib * 0.31, 0.028 + oxidation)
        roughness = 0.34 + oxidation * 1.7 + (0.13 if rib else 0.0)
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
        "color": _image("TEX_LYRA_SurfaceColor_1K", color_pixels, "sRGB"),
        "roughness": _image("TEX_LYRA_SurfaceRoughness_1K", rough_pixels, "Non-Color"),
        "normal": _image("TEX_LYRA_SurfaceNormal_1K", normal_pixels, "Non-Color"),
    }
