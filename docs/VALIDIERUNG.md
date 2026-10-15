# Validierung · Version 0.6

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
- [ ] Zwei unterschiedliche SSIDs/Passwörter vorhanden.
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
- Simulierte Portal-API: Raumwahl, Senden vor Anmeldung gesperrt, Anmeldeanfrage, Löschen des Passwortfelds, Schreibrecht und Meldungsvorlage.
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
