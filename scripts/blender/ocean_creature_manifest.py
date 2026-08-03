from pathlib import Path
import re


def _field(source, name, pattern):
    match = re.search(rf"{name}: {pattern}", source)
    return match.group(1) if match else None


def load_creatures(root: Path):
    creatures = []
    source_dir = root / "src" / "lib" / "ocean"
    for path in sorted(source_dir.glob("species*.ts")):
        for line in path.read_text().splitlines():
            if "assetId:" not in line or "boss: true" in line:
                continue
            asset_id = _field(line, "assetId", r"'([^']+)'")
            body_plan = _field(line, "bodyPlan", r"'([^']+)'")
            color = _field(line, "color", r"0x([0-9a-fA-F]+)")
            glow = _field(line, "glow", r"0x([0-9a-fA-F]+)")
            name = _field(line, "name", r"'([^']+)'")
            if not all((asset_id, body_plan, color, glow, name)):
                raise RuntimeError(f"Cannot parse creature: {line}")
            creatures.append({
                "asset_id": asset_id,
                "name": name,
                "body_plan": body_plan,
                "color": int(color, 16),
                "glow": int(glow, 16),
                "hostile": "temperament: 'aggressive'" in line,
            })
    if len(creatures) != 69:
        raise RuntimeError(f"Expected 69 non-boss creatures, found {len(creatures)}")
    return creatures
