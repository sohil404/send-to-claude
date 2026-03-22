#!/usr/bin/env python3
"""Generate extension icons using Pillow (pip install Pillow)."""

from PIL import Image, ImageDraw
import os

DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "icons")
os.makedirs(DIR, exist_ok=True)


def draw_arrow(size, bg_color, arrow_color, rounded_bg=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if rounded_bg:
        r = int(size * 0.22)
        draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=bg_color)

    s = size
    m = s * 0.18
    points = [
        (m, m),
        (s - m, s / 2),
        (m, s - m),
        (m, s * 0.6),
        (s * 0.55, s / 2),
        (m, s * 0.4),
    ]
    draw.polygon([(int(x), int(y)) for x, y in points], fill=arrow_color)
    return img


# Toolbar icons: dark arrow on transparent
for size in [16, 48]:
    img = draw_arrow(size, None, (60, 60, 60, 255))
    img.save(os.path.join(DIR, f"icon{size}.png"))
    print(f"  icon{size}.png")

# Store icon: warm arrow on dark rounded rect
img = draw_arrow(128, (26, 26, 26, 255), (212, 165, 116, 255), rounded_bg=True)
img.save(os.path.join(DIR, "icon128.png"))
print("  icon128.png")

print("Done.")
