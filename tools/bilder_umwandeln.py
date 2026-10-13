"""Tierbilder (JPG/PNG) für die Webseite verkleinern und als WebP speichern.

Aufruf (im Projektordner):  python tools/bilder_umwandeln.py
Liest alle Bilder aus daten/tierbilder/ (Dateiname = deutscher Tiername, z. B. „Löwe.jpg“)
und schreibt assets/tiere/<tiername-als-id>.webp (960 px breit). Vorhandene, neuere WebP-Dateien werden übersprungen.
Benötigt: pip install pillow
"""
import glob
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import zoopedia_schema as Z  # noqa: E402

SRC = os.path.join(Z.ROOT, "daten", "tierbilder")
DST = os.path.join(Z.ROOT, "assets", "tiere")
WIDTH = 960


def main():
    os.makedirs(DST, exist_ok=True)
    files = [f for f in glob.glob(os.path.join(SRC, "*")) if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))]
    done = 0
    for f in sorted(files):
        out = os.path.join(DST, Z.slug(os.path.splitext(os.path.basename(f))[0]) + ".webp")
        if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(f):
            continue
        im = Image.open(f).convert("RGB")
        if im.width > WIDTH:
            im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
        im.save(out, "WEBP", quality=80, method=6)
        done += 1
    print(f"{done} Bild(er) umgewandelt, {len(files)} insgesamt in daten/tierbilder/")


if __name__ == "__main__":
    main()
