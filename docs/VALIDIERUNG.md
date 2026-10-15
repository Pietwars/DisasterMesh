# Validierung · Version 0.2

Stand: 15. Oktober 2026. Ausschließlich das eigene Profil `disaster_ttgo_wifi` ist Gegenstand der Prüfungen.

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
