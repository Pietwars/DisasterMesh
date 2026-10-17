# Änderungen

## Unveröffentlicht · 17.10.2026 · Verbesserungsliste

- Fußzeile der Weboberfläche (und damit `PortalPage.h`) zeigt jetzt „MeshCore v1.18.0 · DisAHRsterRadio 0.9.0-alpha“ statt v1.17.1 / 0.8.0; Demo-Firmwarekennung `v1.18.0-ahr0.9.0-alpha`.
- **Zentrale Version:** Datei `VERSION` ist die einzige Quelle. `tools/version.py` schreibt Fußzeile, Demo, Firmwarekennung aller Profile, README, package.json/-lock, Flyer-HTML und Projektseite; `--check` läuft in CI (Tests + Firmware) und bricht bei Abweichungen ab (`tests/version.test.py`).
- CI: nach `tools/embed_web.py` prüft `git diff --exit-code`, dass `PortalPage.h`/`PortalAssets.h` eingecheckt zur Weboberfläche passen (auch im Job sx1276-boards und T3-S3).
- Doku: englische Kurzfassung (Boards, MeshCore 1.18), `T3S3_V13_WINDOWS.md`, `VALIDIERUNG.md`, `dist/LESEN.md` aktualisiert; `STARTPAKET.md` verlinkt keine abgelaufenen/anmeldepflichtigen Artefakte mehr als aktuelle Downloads.
- Projektfamilie: eine gemeinsame Tabelle mit allen fünf Repositorys (erzeugt mit `tools/projektfamilie.py`).

### Schlanke TTGO-/T3-V1.6.1-Profile

- **T3 V1.6.1 / TLora V2.1-1.6 wurde ohne Optimierung gebaut (-O0):** Die Upstream-Variante `LilyGo_TLora_V2_1_1_6` entfernt mit `build_unflags = -Os` die Optimierung, dabei fällt auch das `-Os` aus `build_flags` weg. `disaster_ttgo_wifi` (inkl. `_wifi_sd`, `disaster_tlora_v2_1_sx1276_wifi`), `disaster_ttgo_repeater`, `disaster_ttgo_room` übernehmen dieses `build_unflags` nicht mehr → `-Os` wie bei allen anderen Boards.
- Die ~15 Sensorbibliotheken aus `sensor_base` (INA3221/219/226/260, AHTX0, BME280/680, BMP280/085, SHTC3, SHT4x, LPS22HB, MLX90614, VL53L0X, MicroNMEA, BSEC) werden für diese Profile nicht mehr gebaut (`[dm_classic_slim]` in `firmware/MeshCore/platformio.local.ini`: eigene `lib_deps`, `lib_ignore`). `ENV_INCLUDE_*` waren schon aus; der Sensorcode fällt beim Kompilieren weg, Batterie-Telemetrie bleibt. T3-S3-Profile (GPS) unverändert.
- Flash (App-Partition 1,9 MB, `min_spiffs.csv`): **`disaster_ttgo_wifi` 85,1 % → 65,6 %** (1 672 453 → 1 289 693 Bytes), `_wifi_sd` 87,1 % → 67,2 %, Repeater 44,4 % → 29,5 %, Room 43,4 % → 29,3 %. Auf Hardware noch nicht geprüft.

## 0.9.0-alpha-Nachtrag · 17.10.2026 · Vereinheitlichung

- README: Abschnitt „Projektfamilie DisAHRsterRadio“ (in allen drei Repositorys identisch) mit Versionen, Live-Demos, Release, Flyern und Namensregel (DisAHRsterRadio = Projekt/Marke, MeshAhrtal = Weboberfläche, DisasterMesh = Original-Repo).
- Schnellstart verweist auf die Live-Demo `pietwars.github.io/DisasterMesh/demo/`; Hinweis auf die älteren Release-Stände (Demo 0.8.0, Startpaket 0.7.1.1) präzisiert.
- Vorschaubilder neu aus der aktuellen Demo aufgenommen (Startbild, Schnellmeldungen, Standort, Chat, Desktop, iPhone).
- Neuer Flyer `docs/flyer/DisasterMesh-Flyer.pdf` (Druck, QR-Codes zu Repository und Demo) und `DisasterMesh-Flyer-digital.pdf` (klickbare Links zu Repository, Releases, Live-Demo, Projektseite); alter Flyer entfernt.
- Projektseite: Flyer-Abschnitt mit allen drei Flyern (Druck/digital), Demo-Links der Geschwister, Boardliste aktualisiert; Flyer werden unter `/flyer/` mit veröffentlicht.

## 0.9.0-alpha · 16.10.2026

Zusammenführung aller MeshCore-basierten Stände. Alpha, keine Hardwarefreigabe, kein Release.

- MeshCore von 1.17.1 auf **1.18.0** (Upstream `main`, Commit `81dbae59`) angehoben; DisasterMesh-Anpassungen (WLAN-Portal, Verlauf, Zustellaufträge, SD-Archiv, Repeater-/Room-Erweiterungen, Sendebudget-Diagnose, T3-S3-Ziel) neu angewendet, Patches in `docs/` neu erzeugt. Mitgelieferte Bibliotheken unter `firmware/MeshCore/lib/` entfernt (kommen jetzt über `lib_deps`).
- Neue Profile aus dem Zweig `t3-v161-sx1276-wifi`: `disaster_tlora_v2_1_sx1276_wifi` (LILYGO T3 V1.6.1), `disaster_heltec_v2_sx1276_wifi` und `_wifi_diag` (Heltec WiFi LoRa 32 V2). Neuer CI-Job für diese drei Profile.
- Heltec V2: gestaffelter WLAN-Start wie in DisAHRsterRadio (Brownout-Erkennung aus, Boot-Marker, WLAN 2 s nach dem Funk, Sendeleistung 8,5 dBm, softAP auf Kanal 1 mit Rückgabeprüfung, Wiederholung bei Fehler, Zugangsdaten alle 30 s seriell).
- `/api/position` zum Setzen der Advert-Position; eigener Standort wird beim Setzen automatisch zum Teilen freigegeben.
- Startbild immer in voller Breite, der Schriftzug wird auf schmalen Bildschirmen nicht mehr abgeschnitten.
- Firmwareversion `v1.18.0-ahr0.9.0-alpha`; Versionsangaben in Oberfläche, Demo, Flyer, Projektseite und Doku angepasst. README mit Boardliste (T3-S3, T3 V1.6.1, Heltec V2), Hardwarestand und Links zu DisAHRsterRadio-MeshCore und DisAHRsterRadio.

## 0.8.0-Nachtrag · Flyer und Projektseite

- Flyer A5 als PDF mit QR-Code zum Repository (`docs/flyer/`, neu erzeugen mit `node tools/build_flyer.cjs`).
- Statische Projektseite `docs/site/index.html` mit Bildern und Live-Demo, gebaut von `tools/build_site.py` und veröffentlicht über den Workflow „Projektseite (GitHub Pages)“.
- Startpaket-Vorbereitung: Prüfstand-Vorlage und `tools/record_pruefstand.py`, `!DM1`-Meldungen als Karten.

## Unveröffentlicht

- Schwarzes Brett und Chat: `!DM1`-Meldungen erscheinen als Karte mit Symbol, Art (Hilfe gesucht / Hilfe angeboten / Info), Absender, Ort, Text und Gültigkeit; fehlerhafte Meldungen bleiben Rohtext. Empfangene Meldungen mit vorangestelltem Knotennamen werden erkannt.
- Startpaket: `tools/build_start_package.py` liest Version, Artefakte und Hardware-Status aus dem neuesten Prüfstand, nutzt das neue Startbild und nennt die GPS-Variante. Neu `tools/record_pruefstand.py` (Prüfstand aus ausgefüllter Checkliste `docs/PRUEFSTAND_VORLAGE.json`) und `--preview` für ein deutlich markiertes, ungeprüftes Vorschaupaket. Das Release-Startpaket bleibt 0.7.1.1.

## 0.8.0 · 16.10.2026

Auf ausdrücklichen Wunsch von Peter Müller vor der Hardware-Abnahme umgesetzt (Ausnahme vom Entwicklungsplan). Keine Hardwarefreigabe.

- Neues Startbild „DisAHRsterRadio · MeshCore-Funknetz fürs Ahrtal“ aus dem Originalfoto (© Pietwars): Mesh-Knoten über Ort und Hügeln, stilisierte Funkwellen. Lokales WebP (ca. 30 KB); das eingebettete Portal wird dadurch rund 50 KB kleiner.
- Ahrtal-Leiste mit dem Flusslauf von Schuld bis Sinzig, Hinweis „Notruf 112“ und ein kurzer Gedenktext zur Flut im Juli 2021.
- Größere Schaltflächen (mind. 52 px, Navigation 60 px), Grundschrift 17 px.
- Schnellmeldungen auf dem Brett: Trinkwasser, Strom/Laden, Medikamente, Verletzt, Evakuierung, „Mir geht es gut“, Hilfe anbieten, Strom vorhanden. Dazu eine Ortsliste, die Ort und ungefähre Koordinaten einträgt.
- Standort teilen: Ortsliste, Karte antippen, Handy-Ortung (nur in sicherem Kontext) oder GPS-Modul am Board. Kompakte Meldung `!DP1` (≈ 35 Byte) mit Genauigkeit grob/mittel/fein, nur auf Knopfdruck, höchstens alle 5 Minuten. Empfangene Positionen erscheinen mit Alter auf der Karte und als lesbare Zeile im Chat.
- Optionales Firmwareprofil `disaster_t3s3_sx1262_wifi_gps` für ein externes NMEA-GPS an GPIO 43/44 (MeshCore `ENV_INCLUDE_GPS`). `/api/state` meldet `gps:{enabled,fix,lat,lon}`. Advert ohne Position.
- Neuer CI-Build für das GPS-Profil. Neue Tests für `!DP1`, Ortsliste, Standort- und Schnellmeldungs-Oberfläche.
- Befund und Anschluss: `docs/GPS_UND_STANDORT.md`.
- Einheitliche Namen: DisAHRsterRadio (Projekt), MeshAhrtal (Oberfläche/Netz), DisasterMesh (nur Repository). Seitentitel, Manifest, Kopfzeile und Exportnamen angepasst; Repeater-Bekanntgabename `DisAHRsterRadio-Repeater` statt `-Relay`. README neu, Validierung mit Stand 0.8.0, Vorschaubilder neu aufgenommen, ungenutzte CSS-Regeln entfernt.

## 0.7.2 · 16.10.2026

Aufräumen, keine neue Hardwarefreigabe. Die alten TTGO-BINs aus `dist/` sind entfernt; Firmware kommt nur noch aus den Actions-Artefakten oder einem eigenen Build. Öffentlicher Name bleibt DisAHRsterRadio. MeshAhrtal ist die Oberfläche, DisasterMesh der Repository-Name.

- Verlauf im Flash lässt sich im Adminbereich löschen. Er ist unverschlüsselt; Schlüssel und SD-Archiv bleiben.
- Jedes Handy darf höchstens alle 15 Sekunden und höchstens sechsmal in zehn Minuten senden. Das geräteweite Minimum von fünf Sekunden bleibt.
- Optionaler Name an diesem Handy steht vor normalen Nachrichten, nicht vor `!DM1`-Meldungen.
- Auf dem Schwarzen Brett stehen aktuelle Hilfen über Angeboten und dem übrigen Verlauf. Das ist eine Anzeige, keine Funkpriorität.
- Kanalnamen und Schlüssel lassen sich als Kopierzeile auf das zweite Board übertragen. Nicht über Funk schicken.
- Kartenpakete: Heimersheim (mit Gebäuden) plus Altenahr/Mayschoß/Rech, Dernau/Ahrweiler und Sinzig ohne Gebäude. Dazu die Übersicht `ahrtal.geojson` von Blankenheim bis zur Mündung, ohne Gebäude. Vor dem Ausfall laden; die Automatik braucht Internet.
- Architektur und Entwicklungsplan beschreiben SX1262, die Admin-Trennung und den offenen Zwei-Board-Test. iPhone- und Stromgrenzen stehen in eigenen Seiten.

Weiterhin Entwicklungsprototyp. Zwei echte Boards, Repeater, Room über Neustart und ein echtes iPhone sind nicht abgenommen.

## 0.7.1.1 · 15.10.2026

Karten-/POI-Korrektur: falsche Ortszuordnung (Bad Neuenahr statt Heimersheim) behoben, korrektes Regionalpaket mit 90 OSM-Alltags-POIs und medizinischer Versorgung in der Umgebung. Eigene POIs mit Kartenwahl, Bearbeitung, Löschung, Speicherung und GeoJSON-Sicherung ergänzt. Keine Mundraub-Anbindung. Heimersheim-Geometrien auf den Regionalausschnitt begrenzt; alte Kartenspeicher anhand von Straßen und Gebäuden eingepasst. Straßenhierarchie, Wege, Gebäude, Gewässer, kollisionsarme Beschriftung, Nordhinweis und dynamischer Maßstab ergänzt. Paketrevision löst bei aktivierter Automatik eine einmalige Aktualisierung des alten Kartenpakets aus.

- MeshAhrtal-Gestaltung mit dunklen Waldgrüntönen, hellgrünen Bedienelementen und dezentem Funknetzmotiv.
- Originales Ahrtal-Nachtfoto ohne Schrift lokal im Kopfbereich; kein externer Bildabruf.
- Mobile Navigation, Adminbereich und Kartenansicht an das Thema angepasst.
- Desktop-/iPhone-/Admin-/Karten-Vorschau und Demo aktualisiert.
- Firmware und sichtbare Version 0.7.1.1. npm verwendet die gültige SemVer-Schreibweise `0.7.1-1`; `disahrsterradioVersion` trägt die Anzeigeversion.

## 0.7.1 · 15.10.2026

- Heimersheim-Kartenpaket direkt auf dem Handy herunterladen und dauerhaft im Browser speichern.
- Optional bei geöffneter App täglich aktualisieren; bei wiederkehrender Internetverbindung erneut versuchen. Downloads bleiben auf 5 MB und 20 Sekunden begrenzt.
- Karte und Zeitstempel atomar speichern. Fehler erhalten die bisherige Karte, manuell importierte Karten werden nicht automatisch ersetzt.
- Eigene Obst-, Nuss-, Beeren- und Kräuterfundorte mit Kartenmarkern, Erntemonaten, Kategorien-/Saisonfiltern und GeoJSON-Import/Export.
- Geprüftes Startpaket mit aktueller Demo, Heimersheim-Karte, Anleitungen, Prüfsummen und passenden SX1262-Windows-Downloads.
- Versionsanzeige in Firmware, Oberfläche, Demo und npm auf 0.7.1 vereinheitlicht; veraltete Dokumentationsangaben korrigiert.

Weiterhin Entwicklungsprototyp: Hardware-/iPhone-Abnahme offen. Aktuell ein regionales Kartenpaket, Automatik nur bei geöffneter App. Keine direkte Mundraub-Datenanbindung. Appupdates derselben Rolle erhalten das Dateisystem; kein `uploadfs` bei bestehenden Knoten.

## 0.7

Ahrtal-Oberfläche, iPhone-Home-Bildschirm-Zugang, separater Geräte-Adminbereich und auswählbare Deutschland-Funkprofile für die unterstützte 868-MHz-Hardware.
