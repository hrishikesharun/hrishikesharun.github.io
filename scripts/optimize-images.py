"""
Optimise source imagery for the site.

Drop full size exports and phone photographs into images/ at the repo root,
then run this. It resizes anything oversized, converts to WebP and writes the
result into public/assets/projects/ under the name the site expects.

    python scripts/optimize-images.py

Nothing on the page renders a tile wider than about 400 CSS pixels, so a
4032px phone photograph is roughly ten times more detail than can ever be
shown. MAX_EDGE keeps enough headroom for high density displays without
shipping megabytes nobody sees.

Requires Pillow:  pip install Pillow
"""

import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required. Install it with: pip install Pillow")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "images")
OUT = os.path.join(ROOT, "public", "assets", "projects")

MAX_EDGE = 1600  # longest side in pixels
QUALITY = 82     # WebP quality for photographs
QUALITY_UI = 90  # higher for screenshots and diagrams, text artefacts show

# source filename -> (output name, is_ui)
MAPPING = {
    "jenny UI.png": ("jenny.webp", True),
    "working prosthetic hand.jpeg": ("prosthetic-hand.webp", False),
    "prosthetic hand poster.png": ("prosthetic-hand-cad.webp", True),
    "Mechanical Gripper.jpeg": ("gripper.webp", False),
    "layqa perfumes.png": ("layqa.webp", True),
}


def optimise(src_path, out_path, is_ui):
    img = Image.open(src_path)
    img = img.convert("RGB")

    w, h = img.size
    scale = min(1.0, MAX_EDGE / max(w, h))
    if scale < 1.0:
        img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)

    img.save(out_path, "WEBP", quality=QUALITY_UI if is_ui else QUALITY, method=6)
    return (w, h), img.size


def main():
    if not os.path.isdir(SRC):
        sys.exit("No images/ directory at the repo root.")
    os.makedirs(OUT, exist_ok=True)

    total_before = total_after = 0
    for name, (out_name, is_ui) in MAPPING.items():
        src_path = os.path.join(SRC, name)
        if not os.path.exists(src_path):
            print("skip (missing):", name)
            continue
        out_path = os.path.join(OUT, out_name)
        before, after = optimise(src_path, out_path, is_ui)
        b = os.path.getsize(src_path) / 1024
        a = os.path.getsize(out_path) / 1024
        total_before += b
        total_after += a
        print(
            "%-30s %sx%s -> %sx%s  %7.0f KB -> %6.0f KB  (-%.0f%%)"
            % (out_name, before[0], before[1], after[0], after[1], b, a, 100 * (1 - a / b))
        )

    # the flowchart came from elsewhere, shrink it in place if still a PNG
    legacy = os.path.join(OUT, "nhs-flowchart.png")
    if os.path.exists(legacy):
        out_path = os.path.join(OUT, "nhs-flowchart.webp")
        before, after = optimise(legacy, out_path, True)
        b = os.path.getsize(legacy) / 1024
        a = os.path.getsize(out_path) / 1024
        total_before += b
        total_after += a
        print(
            "%-30s %sx%s -> %sx%s  %7.0f KB -> %6.0f KB  (-%.0f%%)"
            % ("nhs-flowchart.webp", before[0], before[1], after[0], after[1], b, a, 100 * (1 - a / b))
        )
        os.remove(legacy)

    print("\ntotal  %.0f KB -> %.0f KB  (-%.0f%%)"
          % (total_before, total_after, 100 * (1 - total_after / total_before)))


if __name__ == "__main__":
    main()
