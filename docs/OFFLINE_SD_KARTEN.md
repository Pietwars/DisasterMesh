# Private Offline-Aufträge, SD-Archiv und echte Offlinekarten · 0.5

## 1. Private Nachrichten später zustellen

Die Lösung ist eine **Warteschlange auf dem Absender-Board**, kein privates Postfach auf einem Zwischenserver. A bleibt eingeschaltet, B darf vorübergehend offline sein. A versucht zeitversetzt erneut und nutzt unveränderte private MeshCore-Direktnachrichten. Bei einem ausgeschalteten A wird erst nach dessen Neustart weitergearbeitet.

Im Portal einen bereits bekannten privaten Chat-Kontakt wählen. „Bei ausgeschaltetem Empfänger weiter versuchen“ aktivieren, 1/6/24 Stunden auswählen und senden. Kanal- und Raumkontakte unterstützen diese Option nicht. Normales Senden bleibt unverändert ohne automatische Wiederholung.

Unter „Private Zustellaufträge & SD-Archiv“ erscheinen Text, Zielpräfix, Status und Versuchszahl. Maximal acht Aufträge; abgeschlossene Einträge werden bei Bedarf durch neuere ersetzt. Abbrechen verhindert weitere Versuche, kann aber bereits ausgesendete Pakete nicht zurückholen. Alle im Board-WLAN teilen diese Warteschlange.

Die Versuchszahl wird vor Übergabe an den Funkkern dauerhaft gespeichert und zurückgelesen. Wiederholungen behalten Timestamp und Text, verändern den nativen Attempt-Wert. Nach dem ersten Versuch wird ungefähr 5 Minuten gewartet, danach 15 und 45 Minuten; nach Versuch 4 bleibt eine letzte Wartezeit von 5 Minuten. Globale 5-Sekunden-Sendepause und andere Bedienvorgänge können diese Zeiten verlängern. Vor Wiederholungen wird ein alter privater Kontaktpfad lokal zurückgesetzt, damit MeshCore neu über Flood zustellen kann.

Ein passender eindeutiger ACK beendet den Auftrag als „Empfang bestätigt“. Vier Versuche ohne ACK ergeben „Ohne Bestätigung beendet“. Das beweist nicht, dass B nichts erhalten hat. Bei abgelaufener Gültigkeit wird nicht weiter gesendet. Gleiche empfangene private Texte mit gleichem Absender und Zeitstempel werden im Portal zusammengefasst; andere native Clients können Wiederholungen anders anzeigen. Keine globale Exactly-once-Garantie.

Nach einem Neustart bleiben Aufträge gespeichert, senden aber erst nach **„Handy-Uhr übernehmen“** oder einer neuen Raumanmeldung/einem neuen Auftrag weiter. Die Uhr muss stimmen. Bereits versuchte Aufträge warten nach Boot mindestens 5 Minuten. Die Wiederaufnahme prüft den vollständigen gespeicherten Empfänger-Public-Key gegen die aktuelle Kontaktliste; fehlende oder mehrdeutige Kontakte werden zurückgestellt, nicht an einen anderen Kontakt gesendet.

A benötigt weder SD noch einen Room-Server. Warteschlange im internen Flash: zwei prüfsummengeschützte Zustandskopien je Slot, maximal 2.736 Byte Dateiinhalt. Technisch ist es FNV-Fehlererkennung, keine kryptografische Authentifizierung. Aufträge und Verlauf liegen lokal als Klartext. Private Funkverschlüsselung ersetzt keine Verschlüsselung der Speicherkarte oder Benutzerkonten im WLAN.

Stromausfälle/defekte Datenträger können den neuesten Zustand verlieren. Bei unklarem Speicher-/HTTP-Status den vorhandenen Auftrag kontrollieren, bevor ein weiterer angelegt wird. Ein beschädigter neuer Zustand kann beim Booten auf die ältere gültige Kopie zurückfallen. Beschränkte ACK-Tabellen, Routingverluste und volle Empfängerspeicher können Zustellung verhindern. Deshalb stehen RF- und Stromausfalltests noch aus.

## 2. SD-Archiv mit dem passenden Profil

**Herstellerbelegung für T3 V1.6:** LoRa RESET GPIO23; SD CLK14, MISO2, MOSI15, CS13. Das übernommene MeshCore-Profil hatte RESET14. Ab 0.5 überschreiben alle eigenen Profile diesen Wert mit GPIO23. Ältere/abweichende Boards mit RESET14 benötigen ein anderes Profil und dürfen nicht mit dem SD-Takt auf demselben Pin betrieben werden.

Primärquellen:
- https://github.com/Xinyuan-LilyGO/LilyGo-LoRa-Series/blob/master/examples/ArduinoLoRa/LoRaSender/utilities.h (Block `T3_V1_6_SX1276`).
- https://github.com/LilyGO/TTGO-LoRa32-V2.1/blob/master/OLED_LoRa_Sender/OLED_LoRa_Sender.ino.
- https://github.com/espressif/arduino-esp32/blob/2.0.17/libraries/SPI/src/SPI.h: die Radio-Instanz im vendorten Target nutzt den Standard-HSPI-Konstruktor. SD wird ausdrücklich über **VSPI** mit seinen eigenen Pins betrieben, damit die Initialisierung den Radiobus nicht überschreibt.

FAT32-Karte im vorhandenen Slot verwenden; keine Karte im laufenden Betrieb ziehen. Passende Boardrevision vor Ort prüfen. Das SD-Profil ersetzt die Portal-Firmware auf A oder B, es ist keine zusätzliche Serverrolle.

PowerShell im Projektordner, `COM5` anpassen:

```powershell
py -3.12 -m platformio run -j 2 -d firmware/MeshCore -e disaster_ttgo_wifi_sd -t upload --upload-port COM5
```

Beim reinen Portalupdate **kein `uploadfs`**, damit Identität, Verlauf und Aufträge erhalten bleiben. Nur bei der allerersten Einrichtung das Dateisystem gemäß `ERSTE_SCHRITTE.md` initialisieren. Anschließend RESET, Seriellmonitor 115200 und SD-Status prüfen. Eigenes Actions-Artefakt: `disastermesh-ttgo-sd-testbuild`.

Das Archiv ergänzt den internen 96-Ereignis-Ring; es ersetzt ihn nicht. Auf SD werden die gleichen 186-Byte-Ereignisse inklusive Sequenz und Prüfsumme geschrieben. `/disaster/current.bin` wächst bis knapp unter 1 MiB und wird dann zu `previous.bin`. Das ältere vorherige Segment wird entfernt. Maximal zwei Segmente à höchstens 1 MiB, also kein unbegrenztes Archiv. Ein unvollständiger letzter Datensatz löst beim nächsten Schreiben eine Rotation aus; er wird nicht mit folgenden Datensätzen vermischt. Unerwartet übergroße aktuelle Dateien deaktivieren das Archiv.

Fehlende Karte oder erkannter Schreib-/Rotationsfehler deaktiviert SD für den laufenden Boot. Der interne Verlauf und der Funkstack bleiben aktiv; der SD-Treiber kann bei Hardwarefehlern trotzdem Verzögerungen verursachen, die noch am Gerät zu messen sind. Keine automatische Formatierung, kein automatischer Karten-Reparaturversuch. Aufbewahrungsrotation und Stromausfall können Archivdaten verlieren.

Beide Segmente im Portal per WLAN herunterladen oder ausgeschaltete Karte am PC lesen. Konvertierung nach lesbarem JSON:

```powershell
py -3.12 tools/archive_to_json.py current.bin previous.bin -o archiv.json
```

Defekte und unvollständige Datensätze werden ausgelassen. Das Archiv enthält Nachrichtenklartext, Zielpräfixe und Zeitstempel, aber keine privaten Identitätsschlüssel. Download und Konvertierung nicht ins öffentliche Repository zurückladen, wenn private Texte enthalten sind. Nachrichten werden nicht über LoRa als Archivdatei übertragen.

## 3. Reale Offlinekarte

Die Karte zeichnet tatsächliche lokale GeoJSON-Vektoren im Browser: Straßen, Gewässer, Flächen, Gebäude und Ortsnamen. Kein bloßes Koordinatenraster und keine extern geladenen Kartenkacheln. Der mitgelieferte OSM-Ausschnitt `maps/heimersheim.geojson` enthält 1.984 Objekte; Daten und Lizenz stehen in `maps/README.md`.

Datei vorher auf das Handy kopieren. Im Portal „Echte Offlinekarte“ öffnen, GeoJSON auswählen, danach Einpassen/Plus/Minus oder Touch-Gesten verwenden. Koordinaten aus gespeicherten Meldungsvorlagen erscheinen als Punkte. Abgelaufene Meldungen werden grau dargestellt. Es gibt keine automatische Standortabfrage und keine Navigation.

Die Datei wird lokal verarbeitet und nach erfolgreicher IndexedDB-Speicherung auf demselben Handy wieder geladen. Speicherfehler werden angezeigt. Browserdatenbereinigung oder Speicherverwaltung des Handys können die gespeicherte Karte entfernen; Quelldatei behalten. Die Karte wird nicht über LoRa verteilt und nicht in die ESP32-Apppartition gepackt. Auch das normale Profil ohne SD unterstützt den Kartenimport.

Grenzen: Datei bis 5 MiB, 20.000 Features, 200.000 Koordinaten. Point, LineString, MultiLineString, Polygon und MultiPolygon. Projektion Web Mercator; keine Routing-/Höhen-/Adresssuche. Datenlücken und Kartenalter bleiben sichtbar nicht automatisch korrigiert. Mehrere Kartenregionen müssen vorab zu einer passenden Datei zusammengeführt oder nacheinander importiert werden; jeweils eine aktive Karte wird gespeichert.

Andere Regionen auf einem **PC mit Internet** vorbereiten; Beispielrechteck West/Süd/Ost/Nord:

```powershell
py -3.12 tools/osm_to_geojson.py meine-karte.geojson --bbox 7.13 50.54 7.15 50.55
```

Alternativ vorhandenen OSM-XML-Export konvertieren:

```powershell
py -3.12 tools/osm_to_geojson.py meine-karte.geojson --input karte.osm
```

Der Konverter begrenzt Downloads auf kleine Bereiche und erhält OSM-Attribution; er unterstützt einfache Wege/Flächen, keine komplexen OSM-Multipolygon-Relationen. Für größere oder detailliertere Gebiete extern vorbereitete GeoJSON-Dateien nutzen und deren Lizenz/Quellenangaben erhalten. Erst auf dem verbundenen PC vorbereiten, dann im Offline-Portal importieren.

## Noch erforderliche Hardware-Abnahme

- [ ] Privater Empfänger aus → Auftrag speichern → Empfänger später an → richtiger ACK stoppt Versuche.
- [ ] Absender neu starten, Uhr-Freigabe, Versuchszahl und Ablauf prüfen.
- [ ] Cancel während laufender Funkübertragung, verlorenes ACK und mehr als acht Aufträge.
- [ ] Stromausfall während Auftrags-/SD-Schreibzugriff, volle/fehlende/defekte Karte.
- [ ] SD und LoRa gleichzeitig unter Last; korrekter Resetpin am tatsächlichen Board.
- [ ] Archivrotation, beide Downloads und JSON-Konvertierung mit echten Daten.
- [ ] Karte auf iPhone importieren, Internet trennen, Seite neu laden, Gesten und Meldungspositionen.

Softwaretests und erfolgreiche Builds bestätigen diese realen Abläufe noch nicht.
