"""Gemeinsame Listen für die Hilfsdatenbank (Excel) und den Konverter.

Die Excel hat ein Blatt „Alle Tiere“ mit mehrzeiliger Überschrift (Zeilen 1–4) und den Tieren ab Zeile 5.
Der Konverter erkennt die Spalten an ihren Überschriften (Gruppe in Zeile 1, Unterspalte in Zeile 3/4),
nicht an ihrer Position – Spalten dürfen also verschoben werden, Überschriften bitte nicht umbenennen.
"""
import json
import os
import re
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# (ID, Überschrift in der Excel)
TYPES = [("land", "Gehege landlebend"), ("flying", "Gehege fliegend"), ("aquarium", "Aquarium"), ("vivarium", "Vivarium")]
ROLES = [("scavenger", "Aasfressende Tiere"), ("terrestrialPollinator", "Bestäuber (Boden)"), ("aerialPollinator", "Bestäuber (Luft)"),
         ("soilRooter", "Bodenwühler"), ("wetlandEngineer", "Feuchtgebietsbauer"), ("preyLarge", "Große Beute"),
         ("preySmall", "Kleine Beute"), ("smallUnderwaterPrey", "Kleine Beute (Unterwasser)"), ("preyMedium", "Mittelgroße Beute"),
         ("mediumUnderwaterPrey", "Mittelgroße Beute (Unterwasser)"), ("terrestrialForager", "Pflanzenfresser (Boden)"),
         ("aerialForager", "Pflanzenfresser (Luft)"), ("predator", "Raubtiere"), ("underwaterPredator", "Raubtiere (Unterwasser)"),
         ("terrestrialSeedDisperser", "Samenverbreiter (Boden)"), ("aerialSeedDisperser", "Samenverbreiter (Luft)"),
         ("terrestrialSporeDisperser", "Sporenverbreiter (Boden)"), ("lowBrowser", "Stöbernde Tiere (Boden)"),
         ("highBrowser", "Stöbernde Tiere (Hoch)"), ("grazer", "Weidetiere"), ("underwaterGrazer", "Weidetiere (Unterwasser)"),
         ("freshwaterFish", "Süßwasserfische"), ("saltwaterFish", "Salzwasserfische")]
CONTINENTS = [("africa", "Afrika"), ("asia", "Asien"), ("europe", "Europa"), ("northAmerica", "Nordamerika"),
              ("southAmerica", "Südamerika"), ("oceania", "Ozeanien"), ("arctic", "Arktis"), ("arcticOcean", "Arktischer Ozean"),
              ("atlanticOcean", "Atlantischer Ozean"), ("indianOcean", "Indischer Ozean"), ("pacificOcean", "Pazifischer Ozean"),
              ("southernOcean", "Südlicher Ozean")]
BIOMES = [("desert", "Wüste"), ("savannah", "Graslandschaft"), ("temperate", "Gemäßigt"), ("taiga", "Taiga"), ("tundra", "Tundra"),
          ("tropical", "Tropen"), ("wetlands", "Feuchtgebiete"), ("lakesRivers", "Seen und Flüsse"), ("estuarine", "Ästuar"),
          ("mangrove", "Mangrove"), ("reef", "Riff"), ("openSea", "Offenes Meer")]
# (ID, deutsches Kürzel, Name, Kürzel auf der Seite)
STATUSES = [("ew", "WA", "In der Wildnis ausgestorben", "EW"), ("cr", "AB", "Vom Aussterben bedroht", "CR"),
            ("en", "SG", "Stark gefährdet", "EN"), ("vu", "G", "Gefährdet", "VU"), ("nt", "PG", "Potenziell gefährdet", "NT"),
            ("lc", "NG", "Nicht gefährdet", "LC"), ("dom", "Z", "Zahm", "DO"), ("dd", "UD", "Ungenügende Datengrundlage", "DD"),
            ("ne", "NB", "Nicht bewertet", "NE")]
# Flächen: (ID, Überschrift)
AREAS = [("shelter", "Rückzugsort"), ("water", "Wasseroberfläche"), ("deep", "Tiefwasserbereich"), ("climb", "Klettergebiet"),
         ("land", "Landfläche"), ("flight", "Flugbereich")]
LIFE = [("maturity", "Geschlechtsreife"), ("sterility", "Sterilität"), ("litter", "Wurfgröße"), ("gestation", "Tragezeit"),
        ("interval", "Zeit zwischen Geburten")]
TIME_UNITS = [("years", ("jahr", "jahre", "j")), ("months", ("monat", "monate", "m")), ("weeks", ("woche", "wochen", "w")),
              ("days", ("tag", "tage", "t"))]

# Sprachen für das Blatt "Tiernamen" (Deutsch ist die Tierart-Spalte selbst)
NAME_LANGS = [("en", "English"), ("fr", "Français"), ("it", "Italiano"), ("es", "Español (España)"), ("cs", "Čeština"),
              ("da", "Dansk"), ("nl", "Nederlands"), ("ja", "日本語"), ("ko", "한국어"), ("pl", "Polski"), ("pt-BR", "Português (Brasil)"),
              ("ru", "Русский"), ("zh-CN", "简体中文"), ("es-419", "Español (Latinoamérica)"), ("th", "ไทย"), ("zh-TW", "繁體中文")]
NAMES_SHEET = "Tiernamen"
MAIN_SHEET = "Alle Tiere"
FIRST_ROW = 5


def name_head(code, label):
    return f"{label} ({code})"


def norm_head(s):
    """Überschrift vergleichbar machen: nur Buchstaben/Ziffern, ♂/♀ als m/w (Umbrüche, Bindestriche, Leerzeichen egal)."""
    s = str(s or "").lower().replace("♂", " m ").replace("♀", " w ")
    return re.sub(r"[\W_]+", "", s)


def slug(name):
    s = str(name).strip().lower()
    for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss")):
        s = s.replace(a, b)
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def load_json(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return json.load(f)


def save_json(rel, data):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write("\n")
