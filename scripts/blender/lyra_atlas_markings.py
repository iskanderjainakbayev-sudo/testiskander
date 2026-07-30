"""Tiny deterministic stencil language used by the procedural LYRA atlas."""

from __future__ import annotations

GLYPHS = {
    "A": ("01110", "10001", "10001", "11111", "10001", "10001", "10001"),
    "C": ("01111", "10000", "10000", "10000", "10000", "10000", "01111"),
    "E": ("11111", "10000", "10000", "11110", "10000", "10000", "11111"),
    "I": ("11111", "00100", "00100", "00100", "00100", "00100", "11111"),
    "L": ("10000", "10000", "10000", "10000", "10000", "10000", "11111"),
    "N": ("10001", "11001", "11001", "10101", "10011", "10011", "10001"),
    "O": ("01110", "10001", "10001", "10001", "10001", "10001", "01110"),
    "P": ("11110", "10001", "10001", "11110", "10000", "10000", "10000"),
    "R": ("11110", "10001", "10001", "11110", "10100", "10010", "10001"),
    "S": ("01111", "10000", "10000", "01110", "00001", "00001", "11110"),
    "T": ("11111", "00100", "00100", "00100", "00100", "00100", "00100"),
    "U": ("10001", "10001", "10001", "10001", "10001", "10001", "01110"),
    "Y": ("10001", "10001", "01010", "00100", "00100", "00100", "00100"),
    "0": ("01110", "10011", "10101", "10101", "11001", "10001", "01110"),
    "7": ("11111", "00001", "00010", "00100", "01000", "01000", "01000"),
}


def _text_mask(
    u: int,
    v: int,
    half: int,
    text: str,
    origin: tuple[float, float],
    cell_fraction: float,
) -> bool:
    cell = max(2, round(half * cell_fraction))
    x = u - round(half * origin[0])
    y = v - round(half * origin[1])
    if x < 0 or y < 0 or y >= 7 * cell:
        return False
    advance = 6 * cell
    glyph_index = x // advance
    if glyph_index >= len(text):
        return False
    character = text[glyph_index]
    if character == " ":
        return False
    column = (x % advance) // cell
    row = y // cell
    glyph = GLYPHS.get(character)
    return glyph is not None and column < 5 and glyph[6 - row][column] == "1"


def marking_kind(u: int, v: int, half: int) -> str | None:
    if _text_mask(u, v, half, "LYRA07", (0.07, 0.73), 0.0085):
        return "serial"
    if _text_mask(u, v, half, "NO STEP", (0.48, 0.19), 0.0065):
        return "warning"
    if _text_mask(u, v, half, "CAUTION", (0.08, 0.31), 0.0058):
        return "warning"
    normalized_u, normalized_v = u / half, v / half
    if 0.07 < normalized_u < 0.42 and 0.12 < normalized_v < 0.155:
        stripe = int((normalized_u + normalized_v * 1.7) * 46.0)
        return "hazard" if stripe % 2 == 0 else None
    return None
