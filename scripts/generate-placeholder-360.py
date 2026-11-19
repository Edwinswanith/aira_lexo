"""
Generates PLACEHOLDER 360 frames for the /buy page viewer, plus hotspot positions.

These are simple drawings of a recorder-shaped box, used only until real product
photos exist. Replace public/images/product-360/ with real turntable photos and update
src/content/product-360.json; the viewer code does not change.

Run: python3 scripts/generate-placeholder-360.py
"""
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

FRAMES = 36
SIZE = 900
SCALE = 2  # draw at 2x, then downscale for smooth edges
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "images" / "product-360"
MANIFEST = ROOT / "src" / "content" / "product-360.json"

W, H, D = 230, 560, 72  # device width, height, depth in drawing units
BG = (247, 245, 239)
BODY = (24, 28, 34)
MINT = (64, 224, 181)
SCREEN = (216, 213, 204)

# Feature points: local (x, y, z) and outward normal, for hotspots.
FEATURES = {
    "display": ((0, -130, D / 2), (0, 0, 1)),
    "button": ((0, 110, D / 2), (0, 0, 1)),
    "microphone": ((0, -232, D / 2), (0, 0, 1)),
    "usb": ((W / 2, 225, 0), (1, 0, 0)),
}


def font(size):
    for name in ("DejaVuSansMono-Bold.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def shade(color, factor):
    return tuple(max(0, min(255, int(c * factor))) for c in color)


def render(theta):
    s = SCALE
    img = Image.new("RGB", (SIZE * s, SIZE * s), BG)
    draw = ImageDraw.Draw(img)
    cx, cy = SIZE * s / 2, SIZE * s / 2 + 10 * s
    cos, sin = math.cos(theta), math.sin(theta)

    def X(x, z):
        return cx + (x * cos + z * sin) * s

    top, bottom = cy - H / 2 * s, cy + H / 2 * s

    # Soft floor shadow.
    shadow_w = (abs(W * cos) + abs(D * sin)) * s * 0.62
    draw.ellipse([cx - shadow_w, bottom + 6 * s, cx + shadow_w, bottom + 34 * s], fill=(226, 222, 212))

    faces = []
    if cos > 0:
        faces.append(("front", sorted([X(-W / 2, D / 2), X(W / 2, D / 2)]), 0.95 + 0.25 * cos))
    if cos < 0:
        faces.append(("back", sorted([X(-W / 2, -D / 2), X(W / 2, -D / 2)]), 0.85 + 0.2 * -cos))
    if sin < 0:
        faces.append(("right", sorted([X(W / 2, -D / 2), X(W / 2, D / 2)]), 0.75 + 0.2 * -sin))
    if sin > 0:
        faces.append(("left", sorted([X(-W / 2, -D / 2), X(-W / 2, D / 2)]), 0.7 + 0.2 * sin))

    radius = 46 * s
    for name, (x0, x1), light in faces:
        if x1 - x0 < 1:
            continue
        r = min(radius, (x1 - x0) / 2)
        draw.rounded_rectangle([x0, top, x1, bottom], radius=r, fill=shade(BODY, light))

    if cos > 0.08:
        # E-paper display, squeezed horizontally by the rotation.
        dx0, dx1 = sorted([X(-78, D / 2), X(78, D / 2)])
        draw.rounded_rectangle([dx0, cy - 178 * s, dx1, cy - 82 * s], radius=10 * s, fill=SCREEN)
        if cos > 0.35:
            label = Image.new("RGBA", (156 * s, 96 * s), (0, 0, 0, 0))
            ld = ImageDraw.Draw(label)
            ld.text((78 * s, 36 * s), "READY", font=font(30 * s), fill=(30, 30, 30), anchor="mm")
            ld.text((78 * s, 70 * s), "86%  14h", font=font(18 * s), fill=(60, 60, 60), anchor="mm")
            squeezed = label.resize((max(1, int(156 * s * cos)), 96 * s))
            img.paste(squeezed, (int(min(dx0, dx1)), int(cy - 178 * s)), squeezed)
        # Button with mint light ring.
        bx = X(0, D / 2)
        for radius_px, color in ((64, MINT), (54, shade(BODY, 0.8)), (44, shade(BODY, 1.25))):
            rx = radius_px * cos * s
            draw.ellipse([bx - rx, cy + (110 - radius_px) * s, bx + rx, cy + (110 + radius_px) * s], fill=color)
        # Microphone opening.
        mx, mr = X(0, D / 2), 6 * s
        draw.ellipse([mx - mr * cos, cy - 238 * s, mx + mr * cos, cy - 226 * s], fill=(8, 8, 10))

    if cos < -0.25:
        label = Image.new("RGBA", (200 * s, 70 * s), (0, 0, 0, 0))
        ImageDraw.Draw(label).text((100 * s, 35 * s), "Aira", font=font(40 * s), fill=(150, 150, 155), anchor="mm")
        squeezed = label.resize((max(1, int(200 * s * -cos)), 70 * s))
        lx = X(0, -D / 2) - squeezed.width / 2
        img.paste(squeezed, (int(lx), int(cy - 60 * s)), squeezed)
        for ux in (-22, 22):
            px = X(ux, -D / 2)
            draw.ellipse([px - 7 * s * -cos, cy + 180 * s, px + 7 * s * -cos, cy + 194 * s], fill=(190, 160, 90))

    if sin < -0.2:
        ux0, ux1 = sorted([X(W / 2, -13), X(W / 2, 13)])
        draw.rounded_rectangle([ux0, cy + 216 * s, ux1, cy + 234 * s], radius=6 * s, fill=(6, 6, 8))

    return img.resize((SIZE, SIZE), Image.LANCZOS)


def hotspot_positions(theta):
    cos, sin = math.cos(theta), math.sin(theta)
    positions = {}
    for name, ((x, y, z), (nx, _, nz)) in FEATURES.items():
        facing = -nx * sin + nz * cos  # z of the rotated normal; >0 faces the viewer
        if facing < 0.3:
            positions[name] = None
            continue
        sx = SIZE / 2 + (x * cos + z * sin)
        sy = SIZE / 2 + 10 + y
        positions[name] = [round(sx / SIZE * 100, 2), round(sy / SIZE * 100, 2)]
    return positions


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    hotspots = []
    for index in range(FRAMES):
        # Start facing the viewer; dragging right turns the device to show its right side.
        theta = -2 * math.pi * index / FRAMES
        frame = render(theta)
        frame.save(OUT / f"frame-{index:02d}.webp", "WEBP", quality=78, method=6)
        hotspots.append(hotspot_positions(theta))
    manifest = {
        "placeholder": True,
        "frameCount": FRAMES,
        "pattern": "/images/product-360/frame-{index}.webp",
        "width": SIZE,
        "height": SIZE,
        "hotspots": hotspots,
    }
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, separators=(",", ":")) + "\n")
    print(f"Wrote {FRAMES} frames to {OUT} and the manifest to {MANIFEST}")


if __name__ == "__main__":
    main()
