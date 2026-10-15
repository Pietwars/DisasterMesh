# DisAHRsterRadio · geprüftes Startpaket

Prüfung vom **16.10.2026**, Softwarestand **ead206f67d0fc09b82efed478456dbbdc1c73c4d**, Version 0.7.1.1. Änderungsumfang: [PR #5](https://github.com/Pietwars/DisasterMesh/pull/5). Die folgenden Pakete wurden aus genau diesem Quellstand gebaut. Das Startpaket enthält Demo, Karte, Anleitungen und Downloadverweise; die Firmware-BINs werden separat über die geprüften Actions-Artefakte heruntergeladen.

## Prüfergebnis

| Prüfung | Ergebnis / Beleg |
|---|---|
| Acht T3-S3-Profile, SX1262 und SX1276, je vier Rollen | [Bestanden](https://github.com/Pietwars/DisasterMesh/actions/runs/38814785962) |
| Vier ältere TTGO-Profile | [Bestanden](https://github.com/Pietwars/DisasterMesh/actions/runs/38814855434) |
| JavaScript-/C++-/Python-Prüfungen, Portal einbetten | Bestanden im Linux- und Windows-Prüflauf |
| Browser, Demo und Karte, Bildschirmbreiten 320–1280 px | Bestanden im Linux- und Windows-Prüflauf |
| Windows-Einrichtung und vollständige Prüfung | [Bestanden](https://github.com/Pietwars/DisasterMesh/actions/runs/38814785917) |
| SX1262-Rollenpakete, Image-Zusammenstellung und Paketprüfung ohne Board | Bestanden, vier Pakete vorhanden |
| Flashen, echtes Funknetz, Reichweite, Stromversorgung, iOS-Verbindungsverhalten | **Noch nicht am Gerät geprüft** |

Ein erfolgreicher Windows-Lauf baut das alte TTGO-Portal. Die T3-S3/SX1262-Firmware wird separat unter Linux gebaut und als Windows-Flashpaket bereitgestellt. Das ist keine erfolgreiche Windows-Flashabnahme mit einem angeschlossenen Board.

## Passende Downloads für deine fünf Boards

Die Links öffnen die Downloads des geprüften GitHub-Laufs. Für Actions-Artefakte ist gewöhnlich eine GitHub-Anmeldung erforderlich. Laut GitHub-Metadaten verfügbar bis 13.01.2027. Danach erneut aus dem angegebenen Quellstand bauen. Keine SX1276-/TTGO-Pakete für deine bestätigten SX1262-Boards verwenden.

| Board / Rolle | Paket |
|---|---|
| A und B: WLAN-Portal | [SX1262 Windows wifi](https://github.com/Pietwars/DisasterMesh/actions/runs/38814785962/artifacts/12010556428) |
| Optional statt WLAN-Portal: mit SD-Archiv | [SX1262 Windows wifi_sd](https://github.com/Pietwars/DisasterMesh/actions/runs/38814785962/artifacts/12010541396) |
| C und D: Weiterleitung | [SX1262 Windows repeater](https://github.com/Pietwars/DisasterMesh/actions/runs/38814785962/artifacts/12010546368) |
| E: Schwarzes Brett | [SX1262 Windows room](https://github.com/Pietwars/DisasterMesh/actions/runs/38814785962/artifacts/12009389877) |
| Browser-Demo des Karten-Ausbaus | [Aktuelle Demo](https://github.com/Pietwars/DisasterMesh/actions/runs/38814855434/artifacts/12009488674) |
| Echte Browser-Aufnahmen / Prüfausgaben | [GUI-Prüfpaket](https://github.com/Pietwars/DisasterMesh/actions/runs/38814855434/artifacts/12010017776) |

## Demo im Startpaket

Das ZIP vollständig entpacken. `START.html` ist die Übersicht, `demo/index.html` die Oberfläche. Funk, Chat, Gerätezustand und Administration sind dort simuliert; lokale Fundorte und Downloads verwenden den Browser. Demo-Adminpasswort: `DemoAdmin2026!`. Die Heimersheim-Karte ist eingebettet und zusätzlich unter `maps/heimersheim.geojson` enthalten. Manche Browser beschränken dauerhafte Speicherung unter `file://`; für eine echte Offline-Speicherabnahme den Board-Zugang oder einen lokalen Webserver verwenden.

## Windows: zuerst Board A, dann B

1. Originalantenne anschließen, ein Board mit USB-Datenkabel verbinden. Das **wifi**-Paket herunterladen und vollständig entpacken.
2. Python 3.12 mit Launcher bereitstellen. In PowerShell `py -3.12 --version` ausführen. Falls `py` fehlt, Python-Installation mit Launcher ergänzen; das mitgelieferte `Flashen.ps1` benötigt ausdrücklich den Launcher.
3. Einmalig `py -3.12 -m pip install esptool==4.8.1` ausführen. COM-Port im Geräte-Manager ablesen; unten ist COM5 nur ein Beispiel. Serienmonitor vor dem Flashen schließen.
4. Paket prüfen:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Flashen.ps1 -Action Check
```

5. Beim ersten Wechsel von Fremdfirmware: Erstinstallation. Sie sichert zuerst den gesamten Flash unter `backups/` und ersetzt danach den Flash einschließlich alter Identität und Zugangsdaten. Bei unvollständiger Sicherung stoppt der Vorgang.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Flashen.ps1 -Action Install -Port COM5
```

6. Läuft bereits DisAHRsterRadio auf demselben Board mit derselben Rolle, stattdessen Anwendung aktualisieren. Optional vorher separat sichern. Kein `uploadfs`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Flashen.ps1 -Action Backup -Port COM5
powershell -NoProfile -ExecutionPolicy Bypass -File .\Flashen.ps1 -Action Update -Port COM5 -SameRole
```

7. USB-Monitor öffnen, danach RESET drücken. Der COM-Port kann beim Wechsel vom Bootloader zur Anwendung wechseln:

```powershell
py -3.12 -m serial.tools.miniterm COM5 115200 --raw
```

WLAN-Zugang und individuelles Adminpasswort lokal ablesen, nicht öffentlich teilen. Handy mit `DisAHRsterRadio-XXXXXX` verbinden, `http://192.168.4.1` öffnen. Mit Ctrl+] den Monitor beenden.

8. Board B gleich einrichten, unterschiedliche Knotennamen setzen, Handy-Uhr übernehmen und auf beiden Boards dasselbe Funkprofil und denselben Kanal einstellen. Zuerst A ↔ B ohne Repeater testen. Danach Room E und einzeln Repeater C/D ergänzen. Ausführliche Anleitung: [SX1262_PAKET.md](SX1262_PAKET.md).

## Karten und Fundorte abnehmen

- In der Karte Heimersheim herunterladen; auf „vollständig auf diesem Handy gespeichert“ warten. Automatik einmal aktivieren.
- Internet abschalten, Board-WLAN beibehalten. Seite neu laden: Karte muss erscheinen. Browserprofil und Adresse beibehalten.
- Einen eigenen Fundort anlegen, Kategorie und Erntemonate filtern, Karte zentrieren, Seite neu laden, Fundort prüfen.
- Karte und Fundorte getrennt exportieren und importieren. Der Fundortimport ersetzt die vorhandene Sammlung.
- Download unterbrechen: die vorher gespeicherte Karte muss erhalten bleiben. Internet wiederherstellen: Automatik erneut prüfen.
- Download läuft bei geöffneter App; aktuell nur das Heimersheim-Paket. Gleichzeitiges Board-WLAN und Mobilfunk ist auf dem echten iPhone noch offen. Alternativ Karte bei Internetzugang exportieren und unter der Board-Adresse importieren.
- Fundorte sind eigene lokale Daten. Keine direkte Mundraub-Datenbank, kein Mundraub-Login oder automatischer Upload. Die originale Mundraub-Karte ist verlinkt.

Vollständige Funktionsgrenzen: [AUTOMATISCHE_KARTEN.md](AUTOMATISCHE_KARTEN.md). Hardwareabnahme: [ABNAHME_ZWEI_BOARDS.md](ABNAHME_ZWEI_BOARDS.md). **Hardwarefreigabe bleibt offen.**

## MeshAhrtal-Gestaltung in 0.7.1.1

Die neue GUI übernimmt das grüne Netzmotiv der bereitgestellten Vorlage. Das Originalfoto ohne Schrift ist unverändert lokal eingebettet; weder Foto noch Theme benötigen externe Bildserver. Die Firmware heißt weiterhin DisAHRsterRadio, der sichtbare Kopfbereich MeshAhrtal. Auf Updates bleiben WLAN-Name, Adminzugang und Datenformate erhalten. Die Vorschauen unter `docs/images/` zeigen echte Browseraufnahmen der Demo.

## Karten-/POI-Korrektur

Das neue Paket startet beim tatsächlichen Heimersheim und enthält Versorgungsdaten bis Bad Neuenahr. Es korrigiert die frühere falsche Ortszuordnung und verkleinerte Darstellung. Wasser, Apotheken, Feuerwehr und medizinische Einrichtungen sind als ungeprüfte OSM-POIs markiert. Eigene Alltags-POIs lassen sich per Kartentipp anlegen, bearbeiten, löschen und als GeoJSON sichern. Kein externer POI-Dienst wird benötigt.

Nach Aktualisierung der Anwendung das Kartenpaket neu laden. Die Versionsanzeige bleibt 0.7.1.1; Paketmanifest und dieser Bericht nennen den neuen Source-Commit. Details: [POI_KARTE.md](POI_KARTE.md).
