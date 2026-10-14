# Übergabe: Zoopedia für Planet Zoo 2 (Fan-Webseite)

Diese Datei fasst zusammen, was in einem früheren Claude-Chat besprochen und gebaut wurde.
Wenn du das Projekt in einem neuen Chat fortsetzt: ZIP hochladen, diese Datei lesen lassen und mit den "Nächsten Schritten" weitermachen.

## Ziel
Statische Webseite (GitHub Pages, kein Server) für **Planet Zoo 2** (Release 13.10.2026), inhaltlich nah an der Excel `reference/Zoopedia_-_GERMAN_-_Build_1_18_2_103911.xlsx`
(Planet-Zoo-1-Zoopedia: Gehege, Vivarien, Min/Max-Berechner, Gefährdungslevel).
Die Seite soll nach Release mit DLCs erweitert werden. Optik soll klar nach Planet Zoo 2 wirken (Vorbild: https://www.planetzoogame.com/de-DE).

## Anforderungen des Nutzers (verbindlich)
- **Quellen/DLCs** als Häkchen in den Einstellungen: vorerst "Basisspiel" (Standard: an, abwählbar) und "Deluxe-Edition". Ein Tier gehört genau zu **einer** Quelle.
  Die Auswahl wirkt auf Tabelle, Zählung (Tab-Badges, Anzahl) und Planer-Auswahl. Neue DLC-Tiere werden per Update einfach ergänzt, Standard-Sortierung alphabetisch.
- **Jubiläumstiere** (frühestens Okt. 2027) gehören kostenlos zum Hauptspiel und werden mit dem Geschenk-Symbol `assets/geschenk.png` markiert. In der Excel: Spalte „Inhaltspaket“ = „Jubiläum 2027“ (Jahr optional).
- **Alle Filter/Einstellungen nur lokal** im Browser (localStorage), jeder Besucher hat seine eigene Ansicht, keine geteilten Daten.
- **Tabs:** Gehege – landlebend, Gehege – fliegend (Volieren), Aquarium, Vivarium (+ Planer) – wie die Filter der offiziellen Zoopedia (HabitatTerrestrial, HabitatFlying, HabitatAquarium, Exhibit). Eine Art kann in mehreren Tabs stehen (z. B. Fische in Aquarium und Vivarium).
- **Spalten-Sortierung** per Klick auf die Überschrift, auf-/absteigend mit Pfeil wie in Excel; Standard alphabetisch.
- **Temperaturfilter:** Spanne von/bis. Ohne "Exakt": Tiere anzeigen, deren Toleranzbereich die Spanne überlappt (Spanne 30–40 °C, Tier 28–45 °C wird gezeigt).
  Mit "Exakt": nur Tiere, deren Toleranzbereich komplett in der Spanne liegt (z. B. 32–35 °C).
- **Zaun:** Härtegrad 1–6 plus Mindesthöhe in m; Wassergraben mit Breite und Tiefe als separate Info (Zaun ODER Wassergraben).
- **Berechner-Logik** (aus der Excel bestätigt): Mehrbedarf je weiterem Tier = Wert für 2 Tiere − Wert für 1 Tier; Bedarf für n Tiere = Basis + (n−1) × Mehrbedarf.
  Gilt für Gehegegröße, Kletterfläche, Wasserfläche, Tiefwasser. Die Tabelle rechnet automatisch bei kleinster und größter erlaubter Gruppe.
  Der "Wert für 2 Tiere" wird abgelesen (nicht pro Tier angezeigt).
- **Gehege-Planer** (eigener Tab): mehrere Arten, Männchen/Weibchen je Art, Gruppenprüfung (Min/Max, nur ♂, nur ♀, gemischtes Verhältnis).
  Eingaben unter Min / über Max werden **markiert, nicht gesperrt**. Prüfung der Vergesellschaftung (Bonus auf Lebensqualität / unverträglich) – Daten dafür liefert der Nutzer, Struktur steht in `data/compat.json`.
- **Einheiten** der Lebenszyklus-Werte: vermutlich Monate in PZ2, erst nach Release klar, evtl. je nach Tierart verschieden. Deshalb in `data/meta.json` → `units` konfigurierbar.
- **Sprachen** (Dropdown oben rechts): Deutsch, Englisch, Französisch, Italienisch, Spanisch (Spanien), Tschechisch, Dänisch, Niederländisch, Japanisch, Koreanisch, Polnisch, Portugiesisch (Brasilien), Russisch, Chinesisch (vereinfacht), Spanisch (Lateinamerika), Thai, Chinesisch (traditionell).
  Oberfläche **und Tiernamen** werden übersetzt (Tiernamen: Blatt „Tiernamen“ in der Excel bzw. Feld `names` je Tier; fehlt eine Übersetzung, erscheint der deutsche Name).
  Sprachauswahl mit Flaggen-Emoji (Twemoji-Flaggen-Schrift `fonts/TwemojiCountryFlags.woff2`, damit sie auch unter Windows erscheinen; Spanisch Lateinamerika = 🇲🇽).
- **Logo:** goldene Medaille (Planet-Zoo-Stil), darauf ein gerade stehendes Buch mit Lesezeichen, das unten herausschaut, in der Buchmitte eine Tierpfote im Negativ (ausgestanzt). Liegt als `assets/logo.svg`.
- **Design:** freundliche Farben (Sand/Grün-Türkis/Sonnenorange), Farbschema Hell/Dunkel/Wie das System in den Einstellungen.
- **Autor:** Kopfzeile „Inoffizielle Fan-Zoopedia von NINIPISI 🇩🇪 für Planet Zoo 2“, Fußzeile „Inoffizielles Fan-Projekt von NINIPISI 🇩🇪, nicht mit Frontier Developments verbunden. / Planet Zoo ist eine Marke von Frontier Developments Ltd.“ – NINIPISI verlinkt auf https://steamcommunity.com/id/ninipisi (in `js/app.js` → `AUTHOR`).
- **Temperatur:** Einstellung °C/°F. Daten bleiben in °C, Umrechnung nur für Anzeige und Filtereingabe (`ZL.cToF` / `ZL.fToC`).
- **Spielinhalte (DLCs):** eigener Button „Meine Spielinhalte“ in der Kopfzeile (nicht mehr in den Einstellungen).
- **Bedienung:** Filter eingeklappt mit Zähler „n aktiv“, Spaltenauswahl mit „Standard wiederherstellen“, Klick auf eine Tierart öffnet die Detailansicht (alle Werte + „Im Planer verwenden“).
- Daten für PZ2 liefert der Nutzer nach Release als Excel (Gehege-Anforderungen, Erweiterung/DLC je Tier).

## Excel-Struktur Planet Zoo 1 (nur noch historische Referenz in `reference/`, nicht mehr auf der Seite)
(veraltet – die Datenvorlage ist jetzt die Hilfsdatenbank, siehe „Datenpflege“)
- Blatt "Wikia | Gehege": 153 Tiere, Spalten u. a. Status (Kürzel WA, AB, SG, G, PG, NG, Z, UD), DLC als Zahl 0–19, Kontinente/Biome als X-Matrix, Mindestflächen für 1 Tier, Temperatur, Kletterschutz, Zaunstärke/-höhe, Wassergraben, Sozialverhalten, Begehbar (Nein/Ja/Ja+), Lebensdaten.
- Blatt "Wikia | Vivarien": 42 Tiere (Temperatur, Luftfeuchtigkeit, Gruppengröße, Lebensdaten).
- Blatt "Min|Max Anf. + Berechner": Wert für 2 Tiere (manuell) und daraus berechnete Mehrbedarfe/Min/Max.
- Blatt "Gefährdungslevel": Legende der Kürzel.
- Jubiläumstiere stehen in der Excel als Zellkommentar an der DLC-Zelle.

## Projektstruktur
```
index.html            Gerüst (Kopf, Tabs, Dialog)
css/style.css         Stil, alle Farben/Schriften als Variablen in :root
js/logic.js           Reine Logik (Berechnung, Filter, Sortierung, Gruppenprüfung, Planer, Zusammenleben) – in Node getestet
js/app.js             Oberfläche, Zustand, localStorage, Zooplaner, Planer, Einstellungen
data/meta.json        DLC-Liste, Kontinente, Biome, Rollen, Gefährdungslevel, Tabs inkl. Spaltenkonfiguration und Filter
data/tiere.json       alle Tierarten (Feld types: land/flying/aquarium/vivarium bestimmt die Tabs) – wird aus der Excel erzeugt
data/compat.json      Zusammenleben (benefit = a profitiert von b, neutral = verträglich ohne Bonus; nicht aufgeführt = nicht möglich)
i18n/translations.tsv Übersetzungen (Quelle, in Excel bearbeitbar)  →  i18n/translations.json (erzeugt)
daten/Zoopedia_PZ2_Daten.xlsx  Hilfsdatenbank (Blatt „Alle Tiere“, Inhalte, Tiernamen, Abweichungen)
daten/tierbilder/     Original-Tierbilder (Dateiname = deutscher Tiername, z. B. „Löwe.jpg“)
tools/zoopedia_schema.py  Listen (Gehegearten, Rollen, Kontinente, Biome, Status, Flächen) für den Konverter
tools/excel_to_json.py  Hilfsdatenbank → data/tiere.json + compat.json + DLC-Liste in meta.json (--pruefen: nur prüfen)
tools/bilder_umwandeln.py  daten/tierbilder/*.jpg → assets/tiere/<id>.webp (960 px)
tools/build_i18n.py     TSV → translations.json   (Aufruf: python tools/build_i18n.py)
tools/test_logic.js     Tests der Logik (node tools/test_logic.js)
.github/workflows/daten.yml  GitHub Action: bei Upload von Excel/Bildern/TSV automatisch Daten erzeugen, testen, committen
fonts/                Nunito (OFL), Twemoji-Flaggen, lokal eingebunden
assets/logo.svg       Logo
assets/biome/*.svg    Biom-Icons aus dem Spiel (ID als Dateiname)
assets/anforderungen/*.svg  Anforderungs-Icons aus dem Spiel (shelter, water, deep, climb, land, temp, humidity, salinity, fence, height, strength);
                      flight.svg selbst gezeichnet im gleichen Stil (im Paket fehlte ein Flugbereich-Icon)
assets/status/badge-mask.png  Form der Gefährdungs-Knöpfe (aus „Arterhaltungszustand-Kürzel Buttons.png“), Farben in style.css (.st-*)
assets/icons/haken.svg, kreuz.svg  „Gäste können durchgehen“ wie in der offiziellen Zoopedia
assets/geschenk.png   Geschenk-Symbol für Jubiläumstiere
assets/tiere/*.webp   Tierbilder (erzeugt)
reference/            PZ1-Excel, Logo-Vorschau (historisch)
```
Lokal testen: `python -m http.server` im Projektordner, dann http://localhost:8000 (direkt per Doppelklick geht nicht, weil JSON per fetch geladen wird).
Veröffentlichen: GitHub-Repo, Settings → Pages → Deploy from branch (main, Ordner /root).

## Datenpflege (Hilfsdatenbank + Skript + GitHub Action)
1. `daten/Zoopedia_PZ2_Daten.xlsx`, Blatt „Alle Tiere“: eine Zeile je Tierart. Überschriften (Zeilen 1–4) nicht umbenennen – der Konverter erkennt die Spalten daran, nicht an der Position.
2. Neue DLC: im Blatt „Inhalte“ eine Zeile ergänzen (ID, Name DE/EN, Standardmäßig aktiv, Steam-Link), dann bei den Tieren „Inhaltspaket“ = dieser Name.
3. Tierbild: JPG mit dem deutschen Tiernamen in `daten/tierbilder/` legen.
4. Hochladen → Action erzeugt alles. Lokal: `python tools/bilder_umwandeln.py` und `python tools/excel_to_json.py daten/Zoopedia_PZ2_Daten.xlsx`.
5. Bei Fehlern (Tierart + Zeile + Spalte werden genannt) wird nichts geschrieben.
Lebenszyklus als Text („3 Jahre“, „20 Monate“, „4 Wochen“, „10 Tage“) → `[Zahl, Einheit]`, auf der Seite übersetzt. Wurfgröße/Nur ♂/Nur ♀ als „1-6“.
Zusammenleben: „Erfolgreiche Beziehungen“ = diese Art profitiert von den genannten; „Neutrale Beziehungen“ = verträglich ohne Bonus; Namen mit Komma getrennt, „keine“ = leer.

## Stand (14.10.2026, 13. Runde) – Bauformen, Farbmorphen, Update-Datum
- Excel ist die einzige Datenquelle. Zusätzlich (gelbe Spalten ganz rechts, „Alle Tiere“ DA–DC): Vivarium „Bauformen“ (mit „; “ getrennt: Box, Zylinder, Box (groß), Zylinder (groß), Box (groß, abgeschrägt), Begehbar) und „Farbmorphen“: Beschreibung (offizieller deutscher Text „Name: Beschreibung“) + Beispielbild-Link (hosting.zaonce.net …_headshot_<Typ>.png, 128 px, transparent), beide mit „; “ getrennt in gleicher Reihenfolge. 70 Arten / 121 Morphen, ausgelesen von https://www.planetzoogame.com/de-DE/2/zoopedia/<de-slug> (Liste `.c-pz2-zoopedia-lifecycle__colourmorphs li[title]`).
- Weitere zwischendurch ergänzte Spalten (Lebensphasen, Fortpflanzung, Gelände, Akkreditierung, Auswilderung) auf Wunsch wieder entfernt.
- Seite: Tierprofil zeigt „Vivarium-Bauformen“ und „Farbmorphen“ (rundes Bild + Name + Beschreibung; Beschreibungen nur deutsch, in anderen Sprachen Hinweis). Bilder: lokal aus `assets/farbmorphen/`, sonst Link. `tools/farbmorph_bilder_laden.py` lädt sie in der GitHub-Aktion herunter (danach zweiter Konverter-Lauf).
- Gefährdungs-Auswahlliste (H5:H440, Quelle Listen!A1:A9) ist eine Excel-Erweiterung und geht beim Speichern mit openpyxl verloren – bei jeder Bearbeitung neu anlegen.
- Oben links „v<Version> – <Datum>“; Datum NUR aus Blatt „Info“, Zeile „Letztes Update“ (leer = kein Datum) → `meta.updated`. Tooltip „Letztes Update: …“.

## Stand (14.10.2026, 12. Runde) – Architektur-Entscheidung, Datenerhalt, Besucherzähler
- Entschieden: **kein Backend / keine Datenbank** (Nutzerin: „hinfällig“). Seite bleibt statisch auf GitHub Pages, kostenlos & wartungsarm. React-Umbau nicht begonnen (kein Nutzen ohne Backend; nur auf ausdrücklichen Wunsch).
- Datenerhalt bei Updates: Speicherschlüssel `zoopedia-pz2.v1` bleibt; `migrateState()` übernimmt ältere Stände statt sie zu verwerfen (`STATE_V`). Unlesbare Stände werden vorher unter `zoopedia-pz2.v1.backup` gesichert. Das frühere einmalige Zurücksetzen der Spalten (COLS_V) ist entfernt – eigene Spaltenwahl bleibt immer erhalten.
  Regel für künftige Änderungen: Speicherformat nie brechen; neue Felder mit Standardwert ergänzen; bei Umbauten einen Schritt in `migrateState()` ergänzen und `STATE_V` erhöhen.
- Einstellungen → „Meine Daten“: Sicherung herunterladen (JSON) / Sicherung laden – z. B. für Browserwechsel.
- Besucherzähler: GoatCounter (kostenlos, ohne Cookies). Excel-Blatt „Info“, Zeile „GoatCounter-Code“ → `meta.counter` (Code „ninipisi“; Konverter akzeptiert auch den ganzen Einbau-Code oder Link und zieht den Code heraus). Seite zählt jeden Aufruf per Bild-Ping (nicht in Vorschau/localhost) und zeigt auf der Startseite „🐾 n Besucher“ (eindeutige Besucher aus `/counter/%2F.json`, Pfad `COUNTER_PATH` = "/"; die PZ1-Seite teilt sich den Code „ninipisi“ und zählt unter eigenem Pfad). In GoatCounter muss unter Settings „Allow adding visitor counts on your website“ aktiviert sein. Ohne Code: kein Zähler.

## Stand (13.10.2026, 11. Runde)
- Neuer erster Tab „Startseite“ (`#home`; die Seite öffnet immer damit, außer ein Link zeigt auf einen Tab). Aufbau: grüner Kopfbereich mit Logo und zwei Einstiegen, Bildkacheln je Gehegeart (Bilder in `HOME_PICS`), Funktionsliste mit runden Symbolen, °F-Hinweis mit Erklärung aller Werkzeuge und Hinweis, dass °F umgerechnet und daher nicht 100 % genau ist.
- Standardmäßig sichtbar: Gefährdung, Inhalt, Kontinente/Ozeane, Biome, Temperatur, Mindestfläche 1 Tier (Rückzugsort, Wasseroberfläche, Tiefwasserbereich, Klettergebiet, Landfläche, bei Volieren zusätzlich Flugbereich), Zaun, Sozialverhalten, Lebenszyklus. Ausgeblendet: „Je weiterem Tier“, Min-/Max-Gruppe, Rollen, Luftfeuchtigkeit, Salzgehalt (im Spaltenmenü einblendbar; Spalten ohne Werte im Tab erscheinen ohnehin nicht).
- Flächenfilter: Vergleichszeichen ≤ / ≥ / = per Klick wechseln (`filter.sizeOp`).
- „Zooplaner“-Knopf steht jetzt in der Filterleiste rechts; „Sichtbare Spalten“ sitzt rechtsbündig direkt über der Tabelle.
- „Sichtbare Spalten“: oben „Meine Ansichten“ – ★ Standard plus eigene, benannte Spalten-Ansichten je Übersicht (localStorage `cats.<id>.colViews`), aktive Ansicht hervorgehoben.
- Version (z. B. 1.0.3.1011968) dezent oben links unter „Zoopedia“: Excel-Blatt „Info“, Zeile „Version“ → `meta.json` `version`.
- Steam-Guide: Logo 195×195 als PNG (aus `assets/logo.svg` gerendert).
- Deluxe-Steam-Link: https://store.steampowered.com/app/4515760/Planet_Zoo_2_Deluxe_Upgrade_Pack/ (Blatt „Inhalte“).

## Stand (13.10.2026, 10. Runde) – Release-Daten, Hilfsdatenbank, Zooplaner, Spielgrafiken
- Hilfsdatenbank aus der vorbereiteten Mappe der Nutzerin gebaut und aus der offiziellen Zoopedia (Release-Daten, Nuxt-Payload) befüllt: 136 Arten (106 aus ihrer Mappe + 30 Vivarium-Arten + 6 neue). Ihre Werte haben Vorrang; 3 Abweichungen zur offiziellen Seite im Blatt „Abweichungen“ (Leopard Zeit zwischen Geburten 21 vs. 20 Monate, Leopardenhai G vs. SG, Koi „Cyprinus sp.“ vs. „Cyprinus rubrofuscus“).
- Ergänzte Spalten (gelbe Überschrift): Gehegeart (4 X-Spalten), Rollen Süß-/Salzwasserfische, Luftfeuchtigkeit, Salzgehalt, Flugbereich.
- 4 Tabs nach Gehegeart; „Begehbares Vivarium“ entfällt. Daten in einer Datei `data/tiere.json`.
- Spalten ohne einen einzigen Wert im Tab werden automatisch ausgeblendet (auch im Spaltenmenü).
- Gefährdung: Knöpfe in Spielform mit Kürzeln EW, CR, EN, VU, NT, LC, DO, DD, NE in allen Sprachen; Farben aus den Einzelgrafiken (EW aus dem Knopfbild zurückgerechnet).
- Gäste können durchgehen: Haken/Kreuz (Ja/Nein) statt Nein/Ja/Ja+.
- Ökologische Rollen: Filter, ausblendbare Spalte, im Profil.
- Profil: Bild, Gehegeart-Chips (springen zum Tab), Biome mit Icons, Flächentabelle 1 Tier / 2 Tiere / je weiterem / Min-/Max-Gruppe, Klima/Zaun mit Icons, Lebenszyklus, Zusammenleben (profitiert von / ist von Vorteil für / verträglich ohne Bonus; sonst „kann mit keiner anderen Art zusammenleben“).
- Planer: alle Arten wählbar; Paare: profitieren (✓), neutral (○), nicht möglich (⚠). Flächen nur, wenn > 0.
- **Zooplaner:** Knopf „Zooplaner“ in jeder Übersicht. Häkchen vorne in der Zeile = Art ist im Zoo. Anzeigen: Alle / Vorhanden / Fehlen noch (Teil des Filters, also auch in gespeicherten Filtern). Mehrere Zoos (anlegen, umbenennen, löschen), gespeichert in localStorage (`zoos`, `zoo`, `zooMode`).
- Übersetzungen: ~90 neue Schlüssel in allen 17 Sprachen; Rollen-, Flächen- und Gehegebegriffe für fr/it/es/ja/pt-BR/zh aus den offiziellen Spieltexten.

## Stand (12.10.2026, 9. Runde)
- Steam-Links je Inhalt: Excel-Blatt „Inhalte“, Spalte „Steam-Link“ → `meta.json` `dlcs[].url` → Button „Steam“ in „Meine Spielinhalte“. Basisspiel: https://store.steampowered.com/app/3219030/Planet_Zoo_2/ – Deluxe noch ohne Link (folgt).
- Zähler in „Meine Spielinhalte“ zählt Arten in mehreren Bereichen nur einmal (124 Basisspiel, 6 Deluxe).

## Stand (12.10.2026, 8. Runde)
- Ko-fi zusätzlich dezent in der Kopfzeile rechts unter der Sprachauswahl (`#kofiTop`).
- Ko-fi-Kasten in der Fußzeile (https://ko-fi.com/theniceguides, Adresse in `js/app.js` → `KOFI_URL`), eigenes Design ohne externes Ko-fi-Skript, Texte in allen 17 Sprachen (`kofi.*`).

## Stand (12.10.2026, 7. Runde) – Vergesellschaftung gerichtet
- Blatt „Vergesellschaftung“: Tierart | Beziehung (profitiert von / profitieren voneinander / nicht verträglich mit) | Partner-Tierart | Bemerkung, Namen per Auswahlliste.
- `data/compat.json`: `benefit` = a profitiert von b (einseitig), `conflict` = beidseitig unverträglich (altes `bonus` = gegenseitig, wird noch verstanden).
- Planer: je Artenpaar ✓ profitiert / ✓ gegenseitig / ⚠ nicht verträglich / ⚠ kein Vorteil hinterlegt. Tierprofil: „Profitiert von“, „Ist von Vorteil für“, „Nicht verträglich mit“ (anklickbar).
- Offizielle Platzhalter-Gewichte (1 kg/1 kg bei 10 Arten, z. B. Elefant) entfernt → in der Excel gelb (Körpermaße jetzt ebenfalls markiert).

## Stand (12.10.2026, 6. Runde) – PZ2-Daten statt PZ1-Platzhaltern
- PZ1-Platzhalter restlos entfernt (Tierdaten, Demo-Hinweis, alte Biome/Kontinente, alte Übersetzungs-Schlüssel).
- 130 Tierarten aus der offiziellen PZ2-Zoopedia (Stand Export 01.10.2026) übernommen: deutscher + wissenschaftlicher Name, Inhalt (Basisspiel/Deluxe),
  Gefährdung, Systematik, Kontinente/Ozeane (12), Biome (12), Körpermaße (Größe/Gewicht, Messart), Zaun (Stärke, Höhe, Kletterschutz, Wassergraben) wo veröffentlicht.
- Offizielle Namen für en, fr, it, es, ja, pt-BR, zh-CN; cs, da, nl, pl, ko, ru, th, zh-TW per KI (prüfen lassen); es-419 fällt auf es zurück.
- Bereiche wie offiziell: Gehege (HabitatTerrestrial), Voliere (HabitatFlying), Aquarium (HabitatAquarium), Vivarium (Exhibit). 15 Arten stehen in Aquarium UND Vivarium.
  „Begehbares Vivarium“ gibt es in der offiziellen Zoopedia (noch) nicht – Tab bleibt leer.
- Noch offen (nach Release aus dem Spiel): Flächen, Temperatur, Luftfeuchtigkeit, Gruppen, Begehbar, Lebenszyklus → in `daten/Zoopedia_PZ2_Daten.xlsx` gelb markiert.
  Solange Werte fehlen, setzt der Konverter `"pending": true` und die Seite zeigt einen Hinweis.
- Gespeicherte Filter/Einstellungen mit alten PZ1-Biomen werden beim Laden automatisch bereinigt.

## Stand (12.10.2026, 5. Runde)
Logo: Buch + Lesezeichen als positive Prägung in dunklerem Medaillengold, Pfote (Form nach Vorlage der Nutzerin) mittig auf der Buchvorderseite ausgestanzt.
Seiten-Logo eingebunden: `favicon.ico`, `assets/icons/` (Favicons 16/32/48, apple-touch-icon, 192/512, maskable, og-image 1200×630), `site.webmanifest`, passende Tags in `index.html`.
Hinweis: `og:image` ist relativ – nach dem Veröffentlichen am besten durch die volle GitHub-Pages-Adresse ersetzen, damit Discord/Steam/Facebook das Vorschaubild sicher finden.
Icons neu erzeugen nach Logo-Änderung: SVG im Browser rendern (siehe Chat) oder mit beliebigem SVG→PNG-Werkzeug.

## Stand (12.10.2026, 4. Runde)
„Exakt“-Hinweis steht immer als „Exakt = zeigt Tiere, deren Wohlfühlbereich exakt innerhalb der Spanne ist“.
Hintergrund: eigenes Giraffen-Fleckenmuster (`assets/giraffe-muster.svg`, per CSS-Maske, Farbe über `--pattern` je Farbschema) – Stil angelehnt an die offizielle PZ2-Zoopedia, keine Frontier-Grafik.
Systematik im Tierprofil unter dem Namen: Klasse/Ordnung/Familie/Gattung (Feld `taxonomy`, Excel-Spalten im Bereich „Allgemein“).

## Stand (12.10.2026, 3. Runde)
Wassergraben in der Tabelle als „6 m × 2 m“, im Tierprofil „↔ Breite / ↕ Tiefe“. Tierbild-Platzhalter im Profil (Bilder: `assets/tiere/`, Excel-Spalte „Bild (Dateiname)“).
Gespeicherte Filter je Übersicht (Name + Suche/Filter, lokal im Browser, `cats.<bereich>.presets`). Nullwerte in Tabellen und Profil als „–“.
„Exakt“-Hinweis wechselt jetzt sofort beim Anhaken („…exakt innerhalb der Spanne“).

## Stand (12.10.2026, 2. Runde)
Umgesetzt: Autor-Zeilen, freundliches Design mit Hell/Dunkel/System, Tiernamen in allen Sprachen,
Flaggen in der Sprachauswahl, °C/°F, eigener Spielinhalte-Button, aufgeräumte Oberfläche mit Detailansicht. Getestet hell/dunkel, Desktop und Handy (360/390/768 px).

## Stand (12.10.2026, 1. Runde)
`js/logic.js`, `js/app.js` und alle Skripte in `tools/` fehlten im ZIP und wurden neu geschrieben.
Getestet: Logik in Node (9 Tests), Seite headless im Browser (Tabs, Filter inkl. Temperatur/Exakt, Suche mit Umlauten, Sortierung, Spaltenmenü,
Einstellungen/Inhalte, Sprachwechsel, Speicherung nach Neuladen, Planer, Handy-Breite ohne Querscrollen, keine Konsolenfehler).
(überholt: die PZ1-Platzhalter wurden am 12.10.2026 vollständig entfernt, siehe 6. Runde)

## Annahmen, die der Nutzer noch bestätigen sollte
1. ✅ bestätigt: **Gemischtes Verhältnis** (z. B. "1 ♂ / 14 ♀") = maximale Anzahl ♂ bzw. ♀ in einer gemischten Gruppe, Gesamtzahl begrenzt durch "Gruppe max."; reine ♂- bzw. ♀-Gruppen nutzen die Spalten "Nur ♂"/"Nur ♀".
2. ✅ bestätigt (Summe als Standard): **Mehrere Arten in einem Gehege:** Flächen werden standardmäßig **addiert** (Einstellung "Summe" oder "Größter Einzelwert"). Unklar, wie das Spiel es wirklich rechnet.
3. ✅ entschieden: Datenpflege per Excel-Vorlage + Skript + GitHub Action (siehe oben).
4. ✅ erledigt: Lebenszyklus-Werte stehen mit Einheit in der Excel („3 Jahre“, „20 Monate“ …). Lebenserwartung und Körpermaße gibt es in der Hilfsdatenbank nicht mehr.
5. **Design:** Die offizielle Seite blockiert automatisches Abrufen. Farben (tiefes Blaugrün, warmes Gelb-Orange als Akzent), Schrift Nunito und runde Pillenformen sind aus der Erinnerung an die Planet-Zoo-Optik gewählt, **nicht** am Original geprüft. Besser: Screenshots der offiziellen Seite und Hex-Farben vom Nutzer holen und `:root` in `css/style.css` anpassen.
6. Übersetzungen (außer Deutsch/Englisch) sind KI-Übersetzungen und sollten von Muttersprachlern geprüft werden. Spanisch (Lateinamerika) fällt auf Spanisch (Spanien) zurück (leere Spalte in der TSV).
7. Offizielle Logos/Artwork von Frontier werden bewusst nicht verwendet; Fan-Hinweis steht im Footer.

## Nächste Schritte
1. ✅ Im Browser getestet. Optional: Nutzerin testet selbst lokal / auf GitHub Pages.
2. Design mit Screenshots/Farbwerten der offiziellen PZ2-Seite angleichen.
3. ✅ Punkte 1–3 geklärt.
4. ✅ Release-Daten übernommen (10. Runde). Neue Werte/Rollen im Spiel: Liste in `tools/zoopedia_schema.py` + Spalten in `data/meta.json` ergänzen.
5. Optional: Übersetzungen prüfen lassen; Abweichungen im Blatt „Abweichungen“ mit dem Spiel abgleichen.
