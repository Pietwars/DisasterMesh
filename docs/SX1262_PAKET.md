# DisAHRsterRadio · dein T3-S3 V1.3 / SX1262 / 868 MHz

Der Funkchip deiner fünf Boards wurde als **SX1262** bestätigt. Diese Pakete sind ausschließlich für LILYGO T3-S3 V1.3 mit ESP32-S3, 4 MB Flash und SX1262 vorgesehen. Die Hardwareabnahme steht noch aus. Dieses Paket braucht keinen PlatformIO-Build auf deinem Windows-PC.

Herstellerabgleich und Versorgung: [SX1262_BOARD.md](SX1262_BOARD.md) im Quellprojekt.

## Vier Pakete für fünf Boards

| Paketrolle | Boards | Aufgabe |
|---|---|---|
| `wifi` | A und B | WLAN-Chat, Direktnachrichten, Offlinekarte, Raumzugang und Diagnose |
| `wifi_sd` | Optional statt `wifi` für A/B | Zusätzlich rotierendes microSD-Archiv |
| `repeater` | C und D | Weiterleitung; USB-Verwaltung, keine WLAN-Chatoberfläche |
| `room` | E | Schwarzes Brett mit bis zu 32 persistenten Beiträgen |

Jedes Board bekommt genau eine Rolle. A/B zunächst direkt testen, danach E und einzeln C/D ergänzen. Keine feste Reichweite zugesagt. Alle Funkparameter müssen zusammenpassen; die bisherigen Projekt-Ausgangswerte sind 869,618 MHz / BW 62,5 kHz / SF8 / CR4/8 / 10 dBm. Für den Einsatz gelten weiterhin Standort, Antenne und Sendezeitvorgaben.

## Inhalt eines fertig gebauten Pakets

- `factory.bin`: vollständiges 4-MB-Erstinstallationsimage einschließlich Bootloader, Partitionstabelle, Anwendung und SPIFFS.
- `firmware.bin`: nur die Anwendung für Updates derselben Rolle.
- `partitions.bin`, `spiffs.bin`: zum selben Build gehörige Einzelimages.
- `manifest.json`, `SHA256SUMS.txt`: Rolle, Source-Commit, Flashadressen und Binärprüfsummen.
- `Flashen.ps1`, `flash_sx1262.py`: Windows-Aufruf und Prüf-/Flashwerkzeug.

Das Paket wird aus dem jeweiligen tatsächlichen Build zusammengesetzt. Der Packager liest die SPIFFS-Adresse aus der erzeugten Partitionstabelle und prüft, ob App und Partitionstabelle mit dem zusammengeführten Image übereinstimmen. Prüfsummen erkennen beschädigte oder vertauschte Dateien; sie sind keine digitale Signatur. Nur das zusammengehörige Paket aus dem erwarteten GitHub-Lauf verwenden.

## Windows: vorbereiten und prüfen

1. Python 3.12 mit Python Launcher installieren, falls noch nicht vorhanden.
2. Das passende **SX1262**-Artefakt aus **Build T3-S3 V1.3** herunterladen und vollständig entpacken. Darin zum Ordner mit `Flashen.ps1` wechseln. Den Paketordner auf einer lokalen beschreibbaren Festplatte ablegen.
3. PowerShell dort öffnen. Antenne anschließen, ein einziges Board mit USB-Datenkabel verbinden. Aktuellen COM-Port im Geräte-Manager ablesen; `COM5` ist nur ein Beispiel. Serienmonitor vorher schließen.

Einmalig mit Internet:

```powershell
py -3.12 -m pip install esptool==4.8.1
```

Paketprüfung ohne Zugriff auf ein Board:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Flashen.ps1 -Action Check
```

Die Prüfung zeigt die feste Paketrolle. Es gibt keine Funkchip-Auswahl mehr. Nach der Werkzeuginstallation brauchen Prüfung und Flashen keinen Internetzugang.

## Erstinstallation: mit automatischer Sicherung

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Flashen.ps1 -Action Install -Port COM5
```

Vor jeder Erstinstallation liest das Werkzeug die gesamten 4 MB Flash in eine neue Datei unter `backups/`. Erst wenn der Lesevorgang erfolgreich und die Dateigröße vollständig ist, schreibt es `factory.bin` ab Adresse `0x0`. Eine fehlgeschlagene Sicherung stoppt den Ablauf; unvollständige Dateien tragen `.partial`. Das Backup kann Schlüssel, Passwörter und Nachrichten enthalten: lokal aufbewahren, nicht veröffentlichen. Eine vollständige Dateigröße allein beweist noch keine erfolgreich getestete Wiederherstellung.

**Install ersetzt den gesamten Flashinhalt**, einschließlich bisheriger Identität, Zugangsdaten, Kontakte und Verlauf. Es ist für den ersten Wechsel auf DisAHRsterRadio bzw. einen bewusst vorbereiteten Rollenwechsel gedacht. Der ESP32-S3-Chiptyp wird durch esptool geprüft; der Funkchip ist deine bestätigte Hardwareangabe und wird nicht elektronisch ausgelesen.

Nur sichern, ohne neue Firmware zu schreiben:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Flashen.ps1 -Action Backup -Port COM5
```

Bei Install/Update bleibt das Gerät zwischen Lesen und Schreiben im Bootloader, damit die USB-Anwendung den Anschluss nicht dazwischen wechselt. Nach dem abschließenden Schreiben bzw. einem Abbruch bei Bedarf RESET drücken. Wenn USB nicht erkannt wird: BOOT halten, RESET kurz drücken, BOOT loslassen und den aktuellen Bootloader-Port im Geräte-Manager wählen.

## Späteres Update derselben Rolle

Wenn auf dem Board bereits DisAHRsterRadio für **denselben T3-S3/SX1262 und dieselbe Rolle** läuft:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Flashen.ps1 -Action Update -Port COM5 -SameRole
```

`-SameRole` ist deine ausdrückliche Bestätigung, dass Board und Rolle gleich geblieben sind. Ohne sie startet kein Update. Das Werkzeug liest vor dem Schreiben die vorhandene Partitionstabelle und vergleicht sie bytegenau mit der Paketdatei. Bei Abweichung wird abgebrochen. Eine gleiche Partitionstabelle beweist weder gleiche Firmware noch gleiche Rolle; daher bleibt die Rollenprüfung durch dich nötig.

Update schreibt ausschließlich `firmware.bin` ab `0x10000`, nicht SPIFFS oder NVS. Dadurch sollen Identität, Zugangsdaten und Verlauf erhalten bleiben; den Erhalt anschließend am Board prüfen. Ein Update enthält kein automatisches vollständiges Flash-Backup; bei Bedarf vorher `Backup` ausführen. Für Fremdfirmware oder einen Rollenwechsel **nicht** `Update -SameRole` verwenden.

## Erster Start und Abnahme

Bei A/B nach RESET im USB-Monitor mit 115200 Baud SSID `DisAHRsterRadio-XXXXXX` ablesen. Am Handy mit dem offenen WLAN verbinden und `http://192.168.4.1` öffnen. Beide Zugänge unterschiedlich benennen, Handy-Uhr übernehmen und Funkparameter/Kanal abgleichen. E benötigt zusätzlich Raum-Passwort und korrekte Uhr; C/D bekommen eigene Repeaternamen.

Die ausführlichen USB-Kommandos und Abnahmeschritte stehen in `docs/T3S3_V13_WINDOWS.md` und `docs/SCHWARZES_BRETT.md` im Quellprojekt. Für einen einfachen seriellen Monitor kann esptool's Python-Umgebung um `pyserial` ergänzt werden; folgende Befehle verwenden nur dessen Miniter:

```powershell
# pyserial wird von esptool mitinstalliert. Zum Beenden: Ctrl+].
py -3.12 -m serial.tools.miniterm COM5 115200 --raw
# Für Repeater/Room mit CR-Zeilenende:
py -3.12 -m serial.tools.miniterm COM5 115200 --eol CR
```

Nach Öffnen RESET drücken, damit die Startausgabe sichtbar wird. Der COM-Port kann beim Übergang aus dem Bootloader wechseln; dann den Anwendungsport neu auswählen. Nach dem Flashen zuerst Kanalchat A ↔ B testen, dann Direktnachrichten/ACKs, Neustartpersistenz, Room E und Repeater C/D. SD zunächst separat testen. Der erfolgreiche Build ersetzt keine dieser Hardwareprüfungen.

## Neu ab 0.7

Ahrtal-Oberfläche, iPhone-Web-App auf dem Home-Bildschirm und separater Adminzugang: siehe [AHRTAL_WEBAPP.md](AHRTAL_WEBAPP.md). Das Adminpasswort wird bei erstmaliger Einrichtung einmalig über USB ausgegeben. Bei vergessenem Passwort die BOOT-Taste im laufenden Betrieb zehn Sekunden halten und ein neues Passwort über USB ablesen. Frische Installationen verwenden CR 4/8; Appupdates behalten gespeicherte Funkparameter. Alle Boards gemeinsam auf dasselbe Profil einstellen.
