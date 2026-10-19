# Validierung · Stand 0.9.0-alpha

> Ab 0.9.0-alpha entstehen die Flashpakete automatisch beim Versions-Tag (Workflow „Release“, prüft Vollständigkeit und `SHA256SUMS`). Die Version kommt aus der Datei `VERSION`; CI bricht ab, wenn Fußzeile, Demo, Firmwarekennung oder README davon abweichen (`python3 tools/version.py --check`). Ältere Abschnitte unten beschreiben ihren damaligen Stand (z. B. MeshCore 1.17.1) und werden nicht nachträglich geändert.

## Flash- und Speicherprüfung (nach 0.9.2)

`tools/validate_memory.py` (aus DisAHRsterRadio-MeshCore 0.9.4) läuft im CI nach jedem Build der WLAN-Portal-Profile; Boardvertrag `tools/memory_boards.json`. Lokal gemessen (PlatformIO 6.2.0, Stand main nach 0.9.2):

| Profil | App-Partition | firmware.bin frei | statisches RAM | Flash laut Boardvertrag |
|---|---:|---:|---:|---|
| disaster_ttgo_wifi / disaster_tlora_v2_1_sx1276_wifi | 1.966.080 | 667.920 | 83.336 von 327.680 | 4 MiB |
| disaster_heltec_v2_sx1276_wifi / _diag | 1.966.080 | 651.344 / 647.520 | 83.208 von 327.680 | 8 MiB (Layout `min_spiffs.csv` nutzt 4 MiB) |

Nicht gemessen: Laufzeit-Heap, minimaler freier Heap, Stack. Dafür gibt es die `[HEAP]`-Zeilen seriell und die Speicheranzeige der Weboberfläche.

## 0.9.0-alpha (16.10.2026)

MeshCore 1.18.0. Lokal nacheinander gebaut (`pio run` + `buildfs`), alle **16 Profile erfolgreich**:

| Profil | Flash |
|---|---|
| disaster_ttgo_wifi / _wifi_sd | 85,1 % / 87,1 % |
| disaster_ttgo_repeater / _room | 44,4 % / 43,4 % |
| disaster_t3s3_sx1262_wifi / _wifi_sd / _wifi_gps | 63,2 % / 64,8 % / 64,5 % |
| disaster_t3s3_sx1262_repeater / _room | 29,4 % / 29,2 % |
| disaster_t3s3_sx1276_wifi / _wifi_sd / _repeater / _room | 63,1 % / 64,6 % / 29,3 % / 29,1 % |
| disaster_tlora_v2_1_sx1276_wifi | 85,1 % |
| disaster_heltec_v2_sx1276_wifi / _diag | 66,4 % / 66,6 % |

Hardware: keine Abnahme dieser Version. LILYGO T3 V1.6.1 lief beim Nutzer mit der Schwester-Firmware DisAHRsterRadio vollständig; Heltec V2 zeigte dort Brownout/fehlenden WLAN-AP (Gegenmaßnahme enthalten, ungeprüft).

## 0.8.0

Stand: 16. Oktober 2026. **Keine Hardwareabnahme.** Alle Ergebnisse unten sind Software-, Build- und Browserprüfungen. Echte Boards, Funkreichweite, Repeater, Room-Server über Neustart, GPS-Modul, Stromaufnahme und ein echtes iPhone sind nicht geprüft.

| Prüfung (0.8.0) | Ergebnis |
|---|---|
| `npm test` (Protokoll, DOM, Karte, Kartenspeicher, POI, Position `!DP1`) | Bestanden, lokal und in CI (Workflow „Tests“) |
| `npm run test:browser` (Chromium, Portal, Demo, Karten, POI) | Bestanden in CI (Job „browser“) |
| Python-Tests (`tests/*.test.py`) | Bestanden |
| Native C++-Tests (`tests/*.test.cpp`) | Bestanden |
| Firmware-Builds TTGO (4) und T3-S3 (8 + `sx1262_wifi_gps`) | Bestanden in CI, inkl. zusammengeführtem Image und Dateisystem |
| Windows-Prüflauf | Bestanden in CI |
| Handy-Ortung über `http://192.168.4.1` | Erwartet gesperrt (kein sicherer Kontext); auf echten Geräten nicht bestätigt |
| GPS-Modul an GPIO 43/44 | Nur Build geprüft; kein Modul angeschlossen |
| Reale Boards, Funk, Strom, iPhone | **Nicht getestet** |

Das Startpaket in den Releases ist weiterhin der geprüfte Stand 0.7.1.1 (siehe unten). Ein 0.8.0-Startpaket braucht einen neuen Prüfstand.

## Historie: Version 0.1 bis 0.6


Stand: 15. Oktober 2026. Die eigenen Profile `disaster_ttgo_wifi` , `disaster_ttgo_repeater` und ab 0.4 `disaster_ttgo_room` sind Gegenstand der Prüfungen.

| Prüfung | Ergebnis |
|---|---|
| Protokolldekodierung | Bestanden: UTF-8, Zieladressen, Zeitstempel, abgeschnittene Frames, Zustellhinweise |
| Oberfläche mit simulierter API (JSDOM) | Bestanden: Kanalwahl, Sendeanfrage, Zeichengrenze in Bytes, empfangene HTML-Zeichen bleiben Text |
| JavaScript-Syntax | Bestanden |
| Native C++-History-Prüfung | Bestanden: Ringumbruch, Prüfsummenfehler, ungültige Längen, beschädigter letzter Eintrag |
| ESP32-Firmware-Build | Bestanden: MeshCore 1.17.1, TTGO V2.1_1.6, ESP32-Arduino 2.0.17 |
| Statischer Speicherbedarf | 81.000 Byte RAM / 327.680 Byte; 1.455.729 Byte Flash / 1.966.080 Byte Appbereich (Referenzbuild 0.1; nicht die neue 0.2-Speicherbelegung) |
| Zusammengeführtes ESP32-Image | Erstellt und Build erfolgreich. Kein Dateisystemimage enthalten; Erstinitialisierung per `uploadfs` laut Anleitung. |
| Dateisystem-Build (`buildfs`) | Für 0.1 im GitHub-Build `38645993354` erfolgreich abgeschlossen. Für neue Commits wird der Schritt erneut geprüft. |
| Chromium-Layouttest | Nicht ausgeführt: Browserdownload in dieser Umgebung fehlgeschlagen. Playwright-Testskript liegt bei. |
| Reales Board / SX1276 / OLED | Noch nicht getestet |
| Funkreichweite, Empfang und Empfangsbestätigungen | Noch nicht am Gerät getestet |
| Speicherverhalten und RAM im WLAN-Betrieb | Noch nicht am Gerät gemessen |
| Dauerbetrieb und Stromausfalltests | Noch nicht am Gerät getestet |

Die Softwareprüfungen ersetzen keine Funk- oder Hardwareprüfung. Ein erfolgreicher Build bestätigt, dass der Quellcode für das Zielprofil übersetzt und verlinkt werden kann; er bestätigt keine Zustellung über Funk.

## Zusätzliche Prüfungen für 0.2

- Protokolltests bestanden: eindeutige ACK-Zuordnung, doppelte ACKs, Tag-Kollision, ACK ohne gespeicherte Nachricht, Sequenzreihenfolge, abgeschnittener Datensatz, alte Formate.
- JSDOM-Tests bestanden: Suche, Exporterzeugung, neuer Entwurf während laufender Anfrage bleibt erhalten, doppeltes Absenden blockiert, leere Nachricht blockiert, Verbindungsausfall sperrt Senden.
- Firmware, zusammengeführtes Image und SPIFFS werden im Workflow für jeden Commit geprüft. Maßgeblich ist der [Actions-Lauf des jeweiligen Commits](https://github.com/Pietwars/DisasterMesh/actions).
- Download/Speichern des Exports auf echtem iPhone sowie ACK-Empfang über echte Funkhardware stehen aus.

## Hardware-Abnahme mit zwei Boards

- [ ] Meshtastic-Backup separat aufbewahrt.
- [ ] Beide Boards starten, OLED und Serial-Ausgabe geprüft.
- [ ] Zwei unterschiedliche SSIDs vorhanden, beide offen.
- [ ] Handy kann ohne Internet auf das lokale Portal zugreifen.
- [ ] Funkparameter auf beiden Boards identisch; Antennen und Sendezeit berücksichtigt.
- [ ] Kanalnachricht A → B und B → A empfangen.
- [ ] Private Kanäle mit gleichem Schlüssel funktionieren; falscher Schlüssel empfängt keinen Klartext.
- [ ] Bekanntgaben führen zu passenden Chat-Kontakten.
- [ ] Direktnachrichten und separate Empfangsbestätigungen beobachtet.
- [ ] Nach Stromunterbrechung bleibt der Verlauf erhalten; beschädigte Einträge werden nicht angezeigt.
- [ ] Mehr als 96 Ereignisse erzeugt; Speicher bleibt begrenzt, neueste Ereignisse bleiben erhalten.
- [ ] Mehrere WLAN-Clients, langsame Verbindungen und 24-Stunden-Betrieb geprüft.
- [ ] Erst danach separaten Repeater und größere Entfernung prüfen.

## Zusätzliche Prüfungen für 0.3

- Native Prüfung der echten Repeater-Provisionierungsfunktion mit simulierter Zufallsquelle und Preferences: Passworterzeugung, Feldgrenzen, Erhalt eigener Passwörter, Ersetzung des alten Standardpassworts. Dies prüft nicht die tatsächliche Flashpersistenz.
- Eigener GitHub-Job baut App, zusammengeführtes Image und SPIFFS für `disaster_ttgo_repeater`. Ergebnis im Actions-Lauf des jeweiligen Commits prüfen.
- Reale Repeaterfunktion, Passwortpersistenz nach Stromausfall und der Drei-Board-Vergleichstest stehen aus.

## Zusätzliche Prüfungen für 0.4

- Decoder: korrekte Signed-Room-Offsets und Autorpräfixe, beschädigte Frames, identische Room-Dubletten.
- Meldungsvorlagen: gültige und ungültige Koordinaten, unzulässige Trennzeichen, Nachrichtentyp und UTF-8-Grenzen.
- Simulierte Portal-API: Raumwahl, Senden vor Anmeldung gesperrt, Anmeldeanfrage ohne Eingabefeld, Schreibrecht und Meldungsvorlage.
- Native Room-Journal-Prüfung: Ringumbruch, feste Grenzen, Prüfsummen-/Zeit-/Terminierungsfehler. Native Tests prüfen nicht das tatsächliche SPIFFS-Schreibverhalten.
- Drei getrennte CI-Jobs bauen Portal, Repeater und Room samt SPIFFS. Maßgeblich ist das Ergebnis des jeweiligen Commits. Reale RF-Anmeldung, Cursorverhalten, ACKs und Persistenz bei Stromverlust stehen aus.

## Zusätzliche Prüfungen für 0.5

- Native Zustell-Engine mit simulierter SPIFFS-Datei: persistente Versuchszählung, ACK und Kollision, acht Slots, Abbruch, Ablauf, vier Versuche, Wiederanlauf mit Uhr-Sperre und Rückfall nach zerrissenem Schreibzugriff. Keine Simulation echter Flashcontroller-/Stromausfallphysik.
- Portal-DOM: private Warteschlangenoption nutzt den vorgesehenen Endpoint; normale Direkt-/Raumabläufe bleiben geprüft.
- Vektorkarte: Projektion realer Koordinaten, Geometrien, Bounds, Quelle, ungültige Daten. Der echte OSM-Ausschnitt wurde erfolgreich konvertiert und vom Kartenvalidator eingelesen.
- Python-Werkzeuge: OSM-Konvertierung, Attribution, Archiv-CRC und abgeschnittene/defekte Datensätze.
- Eigener vierter CI-Job für SD-Portal; alle vier Profile verwenden den Hersteller-Resetwert GPIO23. Maßgeblich sind die jeweiligen CI-Ergebnisse.
- Nicht ausgeführt: SD-Hardware-/Ausfall-/Rotationslasttest, tatsächliche private Offline-Zustellung, Langzeit-Airtime-Messung, Safari-IndexedDB-/Touch-/Download-Test und echter Browser-Layouttest.

## Zusätzliche Prüfungen für 0.6

- Vier Bereiche mit echten Firmware-Endpunkten: Chat, Schwarzes Brett, Offlinekarte, Gerät. Kanal-/Kontaktwahl getrennt von Room-Servern; Zielauswahl pro Bereich bleibt erhalten.
- DOM-Regression: Navigation, leere Room-Liste, Rechteprüfung, Erhalt von Entwürfen, globale Rückmeldungen, Zustand bei Verbindungsausfall und eindeutige Element-IDs.
- Projektname DisAHRsterRadio; WLAN-Präfix und Downloadnamen angepasst. Speicherungsschlüssel, Map-IndexedDB und Exportformatkennungen bleiben für die bisherigen Daten kompatibel. Firmwareupdate ohne Dateisystem-Reset.
- Firmware-Builds und Hardwareprüfung: maßgeblich ist das Ergebnis des aktuellen Actions-Laufs. Hardwaretests stehen weiterhin aus.

- Der neue Browser-CI-Job prüft alle vier Ansichten bei 320, 390, 768 und 1024 Pixeln, Room-Anmeldung, API-Senden, Geräteeinstellungen und das Zeichnen des realen Heimersheim-Kartenpakets. Lokal konnte Chromium wegen eines unvollständigen Browserdownloads nicht gestartet werden; CI-Ergebnis separat prüfen.

## Entwicklung nach 0.6: Diagnose

- Geräteseite mit Firmwareversion, Laufzeit, ESP32-Resetgrund, RAM-Werten, WLAN-Clients,
  nativen TX/RX-Paketzählern, Funkzeiten und internem TX-Budget.
- DOM-Regression prüft fehlende Felder, Null versus unbekannt, reine Textdarstellung,
  JSON-Export ohne Nachrichten/Kontakte/Schlüssel und Sperre bei Verbindungsverlust.
- Chromium-Test prüft Diagnoseanzeige zusammen mit den bestehenden Layoutbreiten.
- Reale Counter-/Reset-/Heap-Messung und Budgetaufschub-Erfassung bleiben offen.

## Automatische Diagnoseaufzeichnung

- Python-Recorder liest die tatsächliche HTTP-Schnittstelle mit dem erforderlichen Header.
- Lokale HTTP-Integrationstests prüfen die Auswahl zulässiger Felder, fehlende Werte,
  Nullbudget, HTTP-Fehler, defekte/übergroße Antworten, Messlücken, sinkende Laufzeit,
  JSONL-Zusammenfassung und Schutz vorhandener Dateien.
- Tests sind im gemeinsamen Prüflauf und Linux-CI eingebunden; Windows-CI nutzt denselben Prüflauf.
- Ein echter 24-Stunden-Lauf mit Boards und die Windows-WLAN-Wiederverbindung bleiben offen.

## T3-S3 V1.3-Unterstützung

- Getrennte SX1262-/SX1276-Profile, je vier Rollen; Funkchip der Bestellung ist noch nicht bestätigt.
- Eigene S3-CI-Matrix für alle acht App-/Merged-/SPIFFS-Builds. Ergebnisse des jeweiligen Commits prüfen.
- Native Compileprüfungen sichern SD-MOSI11/HSPI am S3 und SD-MOSI15/VSPI am bisherigen ESP32 ab; Reset-/SD-Taktkonflikte und nicht unterstützte Targets werden abgewiesen.
- Windows-Werkzeuge erhalten explizite Board-/Rollenauswahl; der vollständige Check kann dasselbe Profil bauen.
- USB, PSRAM, OLED, Funk, Akkumessung, SD-Gleichzeitigkeit und Fünf-Board-Betrieb sind nicht an echter S3-Hardware geprüft.

## Bestätigte SX1262-Hardware: Windows-Rollenpakete

- Nutzer bestätigt SX1262 für die fünf T3-S3-V1.3-Boards.
- Paketbildung prüft Partitionen, Größen, App-/Merged-Konsistenz; Factory enthält SPIFFS.
- Paketprüfungen und simulierte Flashabläufe testen beschädigte Daten, Backupfehler und Partitionsabweichung vor Schreibzugriffen.
- Install/Backup/Update sind nicht an einem realen USB-Gerät ausgeführt. Flash-/Backup-Wiederherstellung und Datenerhalt bleiben Hardwareabnahme.


## Geprüftes Startpaket 0.7.1.1, Kartenkorrektur vom 16.10.2026

Quellstand `ead206f67d0fc09b82efed478456dbbdc1c73c4d`: zwölf Firmwareprofile, reguläre GitHub-Browserprüfungen und vollständiger Windows-Prüflauf erfolgreich. Zusätzlich lokale Browserprüfung mit Chromium 141, einschließlich eingebettetem Originalfoto und 320–1280 Pixeln Breite. Die MeshAhrtal-Oberfläche und die vier SX1262-Windows-Pakete wurden gebaut und ohne Board geprüft. Desktop-, iPhone-, Admin- und Kartenbilder sind echte Aufnahmen der Demo.

Die Kartenkorrektur prüft die tatsächliche Lage von Heimersheim, begrenzte Kartenansicht, lesbare Straßen, Maßstab und Ortsnamen. Die neue POI-Suite prüft OSM-Versorgungsorte, Wasserhinweise, Suche und Kategorien, eigene Punkte anlegen/ändern/löschen, Neuladen sowie atomaren GeoJSON-Import/Export und sichere Textdarstellung. 90 OSM-Punkte sind im Regionalpaket enthalten; Öffnungszeiten, Notdienst, Zugänglichkeit und Wasserqualität wurden nicht vor Ort verifiziert. Kein Mundraub-Dienst wird verwendet. Alle vier Browser-Suites sind lokal und im regulären GitHub-Prüflauf erfolgreich.

Exakte Läufe und Downloads: [STARTPAKET.md](STARTPAKET.md); Metadaten: [PRUEFSTAND_2026-10-15.json](PRUEFSTAND_2026-10-15.json). Das Startpaket enthält die Demo, das Originalfoto, Vorschauen und separate Firmware-Downloadlinks. Board-/iPhone-Abnahme bleibt offen. Keine erfolgreiche Funk- oder Hardwareprüfung wird behauptet.
