# Erste Schritte mit zwei TTGO-Boards

## 1. Meshtastic sichern

Die Umstellung ändert Firmware, Flashaufteilung und Identität. Deshalb zunächst nur zwei Testboards umstellen. Ein Backup enthält private Schlüssel und bleibt ausschließlich bei dir; niemals auf GitHub hochladen.

- Einstellungen und Kanäle in der Meshtastic-App exportieren beziehungsweise dokumentieren.
- Board per USB-Datenkabel an einen Rechner anschließen.
- Optional den gesamten 4-MB-Flash sichern. Beispiel mit esptool 4.8.1; `COM5` durch deinen Anschluss ersetzen (`/dev/ttyUSB0` unter Linux, häufig `/dev/cu.usbserial…` unter macOS):

```sh
python -m pip install esptool==4.8.1
python -m esptool --chip esp32 --port COM5 read_flash 0x0 0x400000 meshtastic-backup.bin
```

Portprogramme und Seriellmonitor vor dem Flashen schließen. Antenne passend zum 868-MHz-Board anschließen, bevor gesendet wird. Die microSD-Karte für die erste Inbetriebnahme herausnehmen; die Version 0.1 nutzt internen Flash.

## 2. Firmware bauen

ZIP entpacken, Terminal im Projektordner öffnen. Alternativ den Projektordner in VS Code mit PlatformIO öffnen; das PlatformIO-Projekt liegt unter `firmware/MeshCore`.

```sh
python -m pip install platformio==6.2.0
python tools/embed_web.py
python -m platformio run -j 2 -d firmware/MeshCore -e disaster_ttgo_wifi
```

Das Buildprofil verwendet das vorhandene MeshCore-Boardprofil `LilyGo_TLora_V2_1_1_6`, mit SX1276 und dessen Pinbelegung. Nicht mit T3-S3 oder T-Beam verwechseln.

## 3. Erstinstallation

**Nur beim ersten Wechsel:** Dateisystem initialisieren. `uploadfs` überschreibt dessen Inhalt, einschließlich MeshCore-Identität, Kontakten und Nachrichtenverlauf. Das Gerät danach erst mit der neuen Firmware normal verwenden.

```sh
python -m platformio run -j 2 -d firmware/MeshCore -e disaster_ttgo_wifi -t upload --upload-port COM5
python -m platformio run -j 2 -d firmware/MeshCore -e disaster_ttgo_wifi -t uploadfs --upload-port COM5
python -m platformio device monitor --port COM5 --baud 115200
```

Vor der Dateisysteminitialisierung kann die Firmware mit `SPIFFS mount failed` anhalten. Nach `uploadfs` neu starten. Bei späteren Firmwareupdates **nur `-t upload` verwenden**, damit die gespeicherten Daten erhalten bleiben. Keine automatische Formatierung bei Mountfehlern.

USB-Verbindung/Boardreset bei Bedarf mit BOOT-Taste unterstützen. Ein erfolgreicher Build bestätigt keine elektrische oder funktechnische Funktion des einzelnen Boards.

## 4. Handy verbinden

- Seriellmonitor öffnen; WLAN-SSID und individuelles Passwort ablesen.
- Am Handy `DisasterMesh-XXXXXX` auswählen und WLAN auch ohne Internet verbunden lassen.
- Im Browser **http://192.168.4.1** öffnen. Keine Web-Bluetooth-Funktion erforderlich.
- Knotenname setzen, kurz warten, Handy-Uhr übernehmen.
- Auf Board B entsprechend wiederholen; die WLAN-Passwörter sind absichtlich unterschiedlich.

Alle mit dem Board-WLAN verbundenen Personen können die dortige Funkidentität und den Verlauf verwenden. Für getrennte Identitäten getrennte Boards nutzen.

## 5. Verbindung testen

Standard des Projekts: **869,618 MHz, 62,5 kHz Bandbreite, SF8, CR 4/5, 10 dBm**. Das sind technische Ausgangswerte, keine universelle Standort-/Antennenfreigabe. Frequenz, Bandbreite, Sendeleistung und Sendezeit müssen zum Einsatzort und zur Antenne passen. Für ein bestehendes MeshCore-Netz dessen tatsächliche Parameter übernehmen.

1. Boards zunächst mit einigen Metern Abstand aufstellen.
2. Auf beiden Oberflächen identische Funkparameter kontrollieren.
3. Zunächst `Public` auf beiden Boards testen. Für private Kanäle denselben 128-Bit-Schlüssel (32 Hex-Zeichen) und denselben Kanalnamen einrichten. Der Kanalplatz kann unterschiedlich sein.
4. Kurze Nachricht von A nach B senden, anschließend umgekehrt. Mindestens fünf Sekunden Sendepause einhalten; dies ersetzt keine vollständige Airtime-Regelung.
5. Beide Knoten einmal bekanntgeben; Kontakte neu lesen. Für die lokale Kontaktentdeckung zunächst ohne Repeater testen.
6. Direktnachricht an den gefundenen Chat-Kontakt senden. Die Oberfläche zeigt zuerst Annahme durch den Funkkern; eine spätere Empfangsbestätigung erscheint als separates Ereignis. Diese Version ordnet Bestätigungen noch keiner einzelnen Nachricht grafisch zu.
7. Board neu starten und prüfen, dass der Nachrichtenverlauf erhalten ist.
8. Erst danach Entfernung vergrößern und einen passend konfigurierten separaten MeshCore-Repeater ergänzen.

Mehrere Funkbefehle werden seriell abgearbeitet. „Beschäftigt“ ist vorübergehend; bei unklarem Sendestatus erfolgt keine automatische Wiederholung, um doppelte Meldungen zu vermeiden.

## Wiederherstellung

Für die Rückkehr zu Meshtastic dessen passende Firmware für **TTGO LoRa32 V2.1_1.6 / 868 MHz** verwenden und die eigenen Einstellungen wiederherstellen. Einen vollständigen Flashdump nur auf demselben Board mit passender Flashgröße und dem passenden esptool-Verfahren zurückschreiben.
