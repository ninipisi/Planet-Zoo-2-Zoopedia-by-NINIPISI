"""Übersetzungen: i18n/translations.tsv (in Excel bearbeitbar) -> i18n/translations.json

Aufruf (im Projektordner):  python tools/build_i18n.py
Leere Zellen fallen auf der Webseite automatisch zurück (es-419 -> es -> en -> de).
"""
import csv
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "i18n", "translations.tsv")
DST = os.path.join(ROOT, "i18n", "translations.json")


def main():
    with open(SRC, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.reader(f, delimiter="\t", quoting=csv.QUOTE_NONE))
    head = rows[0]
    langs = head[1:]
    out = {lang: {} for lang in langs}
    seen = set()
    for n, row in enumerate(rows[1:], 2):
        if not row or not row[0].strip():
            continue
        key = row[0].strip()
        if key in seen:
            print(f"Hinweis: Schlüssel „{key}“ doppelt (Zeile {n}) – der spätere Wert gilt")
        seen.add(key)
        for i, lang in enumerate(langs, 1):
            val = row[i].strip() if i < len(row) else ""
            if val:
                out[lang][key] = val
    missing_de = [k for k in seen if k not in out.get("de", {})]
    if missing_de:
        print("Hinweis: ohne deutschen Text:", ", ".join(sorted(missing_de)))
    with open(DST, "w", encoding="utf-8", newline="\n") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"{len(seen)} Schlüssel × {len(langs)} Sprachen -> i18n/translations.json")


if __name__ == "__main__":
    main()
