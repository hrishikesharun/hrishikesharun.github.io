"""
Flatten the Vite project back into single HTML files.

    python scripts/build-review-html.py

Writes two files to the repo root:

  portfolio-review.html
      Every hand written line of the project in one readable file: the
      markup, the whole stylesheet, and all six JavaScript modules in
      boot order with clear banners between them. GSAP and Lenis come
      from a CDN rather than being bundled, so the file stays free of
      library noise and contains only work worth reviewing. Images are
      referenced by relative path, so it renders if it sits beside the
      public/assets folder. This is the one to hand to a reviewer.

  portfolio-standalone.html
      The same thing but with every image embedded as a data URI, so it
      renders correctly from anywhere with no other files present. Much
      larger, and most of that size is base64, so it is worse to read.
      Use it for looking, not for reviewing.

Both are gitignored. Regenerate whenever the source changes.
"""

import base64
import io
import mimetypes
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
PUBLIC = os.path.join(ROOT, "public")

# Concatenation order matters: this is the boot order main.js relies on.
MODULES = [
    ("src/data/projects.js", os.path.join(SRC, "data", "projects.js")),
    ("src/shader.js", os.path.join(SRC, "shader.js")),
    ("src/scroll.js", os.path.join(SRC, "scroll.js")),
    ("src/arc.js", os.path.join(SRC, "arc.js")),
    ("src/gallery.js", os.path.join(SRC, "gallery.js")),
    ("src/cursor.js", os.path.join(SRC, "cursor.js")),
    ("src/main.js", os.path.join(SRC, "main.js")),
]

CDN = """<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js"></script>"""

BANNER = """
/* ============================================================================
   %s
   ============================================================================ */
"""


def read(path):
    return io.open(path, encoding="utf-8").read()


def strip_module_syntax(code):
    """Turn an ES module into plain script code.

    Import statements are dropped because GSAP, ScrollTrigger and Lenis all
    arrive as globals from the CDN tags, and the local modules are simply
    concatenated in dependency order. `export` keywords are removed so the
    declarations land in one shared scope.
    """
    code = re.sub(r"^\s*import[^;]*;\s*$", "", code, flags=re.M)
    code = re.sub(r"^\s*export\s+(?=(async\s+)?function|const|let|var|class)", "", code, flags=re.M)
    # Vite only injects this at build time, so resolve it to a relative path.
    code = code.replace("import.meta.env.BASE_URL", "'./'")
    return code.strip()


def data_uri(path):
    mime = mimetypes.guess_type(path)[0] or "application/octet-stream"
    if path.lower().endswith(".webp"):
        mime = "image/webp"
    with open(path, "rb") as f:
        return "data:%s;base64,%s" % (mime, base64.b64encode(f.read()).decode("ascii"))


def collect_assets():
    """Map every site relative asset path to its data URI."""
    out = {}
    for dirpath, _dirs, files in os.walk(os.path.join(PUBLIC, "assets")):
        for fn in files:
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, PUBLIC).replace(os.sep, "/")
            out["/" + rel] = data_uri(full)
    return out


def build(inline_images):
    html = read(os.path.join(ROOT, "index.html"))
    css = read(os.path.join(SRC, "style.css"))

    js_parts = []
    for label, path in MODULES:
        js_parts.append(BANNER % label)
        js_parts.append(strip_module_syntax(read(path)))
    js = "\n".join(js_parts)

    if inline_images:
        assets = collect_assets()
        # runtime lookups inside projects.js
        lookup = ",\n    ".join(
            "'%s': '%s'" % (k.split("/")[-1], v) for k, v in assets.items() if "/projects/" in k
        )
        js = js.replace(
            "const asset = (file) => `${'./'}assets/projects/${file}`;",
            "const EMBEDDED = {\n    %s\n  };\n  const asset = (file) => EMBEDDED[file] || file;" % lookup,
        )
        # src attributes in the markup
        for path, uri in assets.items():
            html = html.replace('src="%s"' % path, 'src="%s"' % uri)

    # swap the Vite entry points for the inlined versions
    html = html.replace(
        '<link rel="stylesheet" href="/src/style.css">',
        "<style>\n%s\n</style>" % css,
    )
    html = html.replace(
        '<script type="module" src="/src/main.js"></script>',
        "%s\n<script>\n%s\n</script>" % (CDN, js),
    )
    return html


def main():
    review = build(inline_images=False)
    standalone = build(inline_images=True)

    for name, content in (
        ("portfolio-review.html", review),
        ("portfolio-standalone.html", standalone),
    ):
        path = os.path.join(ROOT, name)
        io.open(path, "w", encoding="utf-8", newline="\n").write(content)
        print("%-28s %8.0f KB" % (name, os.path.getsize(path) / 1024))


if __name__ == "__main__":
    main()
