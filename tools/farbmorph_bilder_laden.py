"""Beispielbilder der Farbmorphen aus der offiziellen Zoopedia lokal sichern.

Aufruf (im Projektordner):  python tools/farbmorph_bilder_laden.py
Liest data/tiere.json und lädt alle Farbmorph-Bilder, die noch als Internet-Link eingetragen sind,
nach assets/farbmorphen/. Danach den Excel-Umwandler erneut starten – er nimmt dann die lokale Kopie.
Läuft automatisch in der GitHub-Aktion.
"""
import json
import os
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import zoopedia_schema as Z  # noqa: E402

DST = os.path.join(Z.ROOT, "assets", "farbmorphen")


def main():
    os.makedirs(DST, exist_ok=True)
    data = Z.load_json("data/tiere.json")
    urls = sorted({m["img"] for a in data["animals"] for m in a.get("morphs", []) if str(m.get("img", "")).startswith("http")})
    ok = fail = 0
    for url in urls:
        out = os.path.join(DST, os.path.basename(url.split("?")[0]))
        if os.path.exists(out):
            continue
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Zoopedia-Fanseite (GitHub Action)"})
            with urllib.request.urlopen(req, timeout=30) as r:
                body = r.read()
            if not body.startswith(b"\x89PNG") and not body[:3] == b"\xff\xd8\xff":
                raise ValueError("keine Bilddatei")
            with open(out, "wb") as f:
                f.write(body)
            ok += 1
        except Exception as e:  # einzelne Fehler überspringen, Seite nutzt dann den Link
            print(f"Hinweis: {url} nicht geladen ({e})")
            fail += 1
    print(f"Farbmorph-Bilder: {ok} neu geladen, {fail} fehlgeschlagen, {len(urls)} Links insgesamt")


if __name__ == "__main__":
    main()
