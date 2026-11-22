"""Subsets the app's bundled TTFs to Latin + ₹ and writes woff2 for the site,
and copies the TTFs for the Poster Studio (opentype.js reads TTF).
Run: python scripts/build-fonts.py  (needs fonttools + brotli)."""
import os, shutil, sys
from fontTools import subset

APP = os.environ.get("NOTTEODO_APP_DIR", "C:/My_Project/Notteodo")
SRC = os.path.join(APP, "frontend/assets/google_fonts")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src/fonts")
POSTER = os.path.join(ROOT, "poster-studio/fonts")
UNICODES = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+20B9,U+2122,U+2191-2193,U+2212,U+2215,U+FEFF,U+FFFD"

if not os.path.isdir(SRC):
    sys.exit(f"fonts not found at {SRC}")
for name in sorted(os.listdir(SRC)):
    if not name.endswith(".ttf"):
        continue
    shutil.copy(os.path.join(SRC, name), os.path.join(POSTER, name))
    out = os.path.join(OUT, name.replace(".ttf", ".woff2"))
    args = [os.path.join(SRC, name), f"--unicodes={UNICODES}", "--flavor=woff2", f"--output-file={out}",
            "--layout-features=*", "--no-hinting", "--desubroutinize"]
    subset.main(args)
    print(f"{name} -> {os.path.getsize(out)//1024} KB")
