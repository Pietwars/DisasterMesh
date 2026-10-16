# DisAHRsterRadio auf LILYGO T3-S3 V1.3 · 868 MHz

Diese Erweiterung ergänzt die bisherigen TTGO-Profile um eigene ESP32-S3-Builds. Softwarebasis bleibt DisAHRsterRadio 0.6 / MeshCore 1.17.1. Hardwareabnahme auf T3-S3 V1.3 steht aus. Erfolgreiche CI-Builds belegen Übersetzbarkeit, keine Funkreichweite oder zuverlässige SD-Hardwarefunktion.

## Für deine Bestellung bestätigt: SX1262

Du hast den **SX1262** bestätigt. Für deine fünf Boards ausschließlich `t3s3-sx1262` beziehungsweise die SX1262-Pakete verwenden. Der vereinfachte Weg ohne eigenen Firmwarebuild steht in [SX1262_PAKET.md](SX1262_PAKET.md). Die allgemeine Variantenprüfung unten bleibt als Referenz für andere Boards bestehen.

## Allgemein: genaue Funkvariante feststellen

Die verlinkte [OpenELAB-Seite](https://openelab.de/products/lilygo-t-s3-v1-3-lora-meshcore-modul?variant=52372753613137) beschreibt mehrere Funkchips. Die Shopify-Variante `52372753613137` heißt nur „Default Title“; daraus lässt sich der gelieferte Chip nicht bestimmen. **868 MHz allein unterscheidet SX1262 und SX1276 nicht.** Vor Installation Modulaufdruck, Lieferschein oder eine Bestätigung des Händlers prüfen. Wenn die Abschirmung keinen eindeutigen Aufdruck zeigt, Händler fragen; nicht probeweise unterschiedliche Radio-Firmwares flashen.

Diese Anleitung und Profile gelten ausschließlich für **T3-S3 V1.3, ESP32-S3, 868-MHz-Hardware mit SX1262 oder SX1276**. Sie gelten nicht für LR1121, SX1280/2,4 GHz, PA-Versionen, T-Beam, T-Deck oder die alten ESP32-TTGO-Boards. „T-S3“ wird vom Händler als Kurzbezeichnung verwendet.

## Gerätebeschreibung

Herstellerangaben: ESP32-S3FH4R2, 4 MB Flash und 2 MB QSPI-PSRAM, 0,96-Zoll-OLED SSD1306, USB-C, BOOT/RESET und microSD-Steckplatz. Laut LILYGO haben T3-S3 V1.2 und V1.3 dieselbe Pinbelegung; die Ladeschaltung unterscheidet sich. Das Profil verwendet den vorhandenen MeshCore-Boardtyp `t3_s3_v1_x`, USB-CDC und eine größere App-Partition (`min_spiffs.csv`).

| Anschluss | GPIO |
|---|---:|
| LoRa SCK / MISO / MOSI / CS / RESET | 5 / 3 / 6 / 7 / 8 |
| SX1262 DIO1 / BUSY | 33 / 34 |
| SX1276 DIO0 / DIO1 | 9 / 33 |
| OLED SDA / SCL | 18 / 17 |
| SD SCK / MISO / MOSI / CS | 14 / 2 / 11 / 13 |

Funk und SD verwenden getrennte SPI-Controller: LoRa den vom Board gewählten Standard-FSPI, SD den HSPI-Controller. Der bisherige TTGO nutzt weiter VSPI und SD-MOSI 15. Die S3-Pinbelegung darf nicht auf das alte TTGO übertragen werden.

Primärquellen mit Schaltplan-/Pinübersicht:

- [LILYGO T3-S3 SX1262](https://github.com/Xinyuan-LilyGO/LilyGo-LoRa-Series/blob/master/docs/en/t3_s3_sx1262/t3_s3_sx1262_hw.md)
- [LILYGO T3-S3 SX1276](https://github.com/Xinyuan-LilyGO/LilyGo-LoRa-Series/blob/master/docs/en/t3_s3_sx1276/t3_s3_sx1276_hw.md)
- Mitgelieferter MeshCore-Quellstand: `variants/lilygo_t3s3`, `variants/lilygo_t3s3_sx1276`, `boards/t3_s3_v1_x.json`.

## Firmware und Rollen für fünf Boards

Vorschlag für den ersten Aufbau; noch keine Aussage über erreichbare Entfernung:

| Board | Name nach Einrichtung | Rolle |
|---|---|---|
| A | Ahr-Zugang-01 | WLAN-Portal: Handy A, Chat, Karte, Diagnose |
| B | Ahr-Zugang-02 | WLAN-Portal: Handy B, Chat, Karte, Diagnose |
| C | Ahr-Relay-01 | Separater Repeater |
| D | Ahr-Relay-02 | Zweiter separater Repeater |
| E | Ahr-Brett | Room-Server für das Schwarze Brett |

Zunächst A und B direkt testen. Danach E ergänzen. C und D einzeln zuschalten und die Weiterleitung vergleichen. Alle fünf gleichzeitig am selben Tisch sind kein Reichweitentest. Jede Rolle läuft auf einem eigenen Board; Room und Repeater haben keine WLAN-Chatoberfläche.

| Rolle | SX1262-Profil | SX1276-Profil |
|---|---|---|
| WLAN-Portal | `disaster_t3s3_sx1262_wifi` | `disaster_t3s3_sx1276_wifi` |
| Portal mit SD-Archiv | `disaster_t3s3_sx1262_wifi_sd` | `disaster_t3s3_sx1276_wifi_sd` |
| Repeater | `disaster_t3s3_sx1262_repeater` | `disaster_t3s3_sx1276_repeater` |
| Room-Server | `disaster_t3s3_sx1262_room` | `disaster_t3s3_sx1276_room` |

Portale bieten die bestehende deutsche Oberfläche, Kanäle/DMs, ACK-Anzeige, 96-Ereignis-Verlauf, acht private Zustellaufträge, Offlinekarte, Diagnose und Room-Anmeldung. Das SD-Profil ergänzt zwei rotierende Archivsegmente. Ein privater Zustellauftrag braucht den eingeschalteten Absender. Der Room-Server speichert bis zu 32 gemeinsame Beiträge. Repeater leiten Funkpakete weiter, speichern aber kein privates Offline-Postfach.

Die Profile starten mit den vorhandenen Projektwerten 869,618 MHz / 62,5 kHz / SF8 / CR4/5 / 10 dBm. Das ist eine Konfiguration, kein Zulässigkeitsnachweis für jeden Standort, jede Antenne oder Sendezeit. Bereits gespeicherte Funkparameter bleiben bei Appupdates erhalten; alle Teilnehmer abgleichen. Alte TTGO/SX1276 und neue S3 können bei gleichem MeshCore-Funkprofil grundsätzlich im selben Netz arbeiten; der praktische Mischbetrieb ist zu prüfen. Meshtastic spricht dieses Protokoll nicht.

## Windows vorbereiten

Voraussetzungen und Sicherung: [WINDOWS_MVP.md](WINDOWS_MVP.md) und [ERSTE_SCHRITTE.md](ERSTE_SCHRITTE.md). Node.js 22, Python 3.12, Git; für vollständige native Prüfungen zusätzlich MSYS2/g++. Antenne passend zum 868-MHz-Anschluss montieren, USB-Datenkabel verwenden. Vorinstallierte Identität/Schlüssel bei Bedarf lokal sichern. Keine Sicherungen oder Zugangsdaten veröffentlichen.

Aktuellen Projektstand laden, PowerShell im Projektordner öffnen. Falls bereits vorhanden `git pull --ff-only` ausführen. Einmalig:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\windows\DisAHRsterRadio.ps1 -Action Setup
```

**Nur nach Bestätigung des Funkchips** `t3s3-sx1262` oder `t3s3-sx1276` wählen. Beispiele unten setzen einen **bestätigten SX1262** voraus; für SX1276 den Boardparameter in jedem Befehl ersetzen. `COM5` immer durch den aktuellen Anschluss aus dem Geräte-Manager ersetzen. Nur das zu flashende Board anschließen.

```powershell
# Vollständiger Software-/Firmwarecheck; flasht kein Gerät:
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\windows\DisAHRsterRadio.ps1 -Action Check -Board t3s3-sx1262 -Role wifi

# Erstinstallation von Zugang A/B; ersetzt das Dateisystem:
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\windows\DisAHRsterRadio.ps1 -Action Install -Board t3s3-sx1262 -Role wifi -Port COM5

# USB-Ausgabe öffnen und danach RESET drücken:
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\windows\DisAHRsterRadio.ps1 -Action Monitor -Board t3s3-sx1262 -Role wifi -Port COM5
```

SSID `DisAHRsterRadio-XXXXXX` und individuelles WLAN-Passwort aus der seriellen Ausgabe lokal notieren. Am Handy verbinden und `http://192.168.4.1` öffnen. Kein Internet im WLAN ist normal. Unter Gerät den Knoten benennen und Handy-Uhr übernehmen.

Spätere Updates **derselben Board-/Chip-/Portalrolle**:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\windows\DisAHRsterRadio.ps1 -Action Update -Board t3s3-sx1262 -Role wifi -Port COM5
```

`Update` lädt nur die Anwendung. `Install` lädt zusätzlich SPIFFS und ersetzt Identität, Einstellungen, Kontakte, Verlauf und Aufträge. Beim Wechsel von Fremdfirmware, Board, Partitionierung oder Rolle die Dateien und Sicherung vorher prüfen; keine alten TTGO-BINs auf S3 flashen. Für alle neuen S3-Profile wird dieselbe Partitionierung verwendet. Die optionale SD-Rolle ist `wifi_sd`; eine passende FAT32-Karte bei ausgeschaltetem Board einsetzen, zunächst mit `wifi` testen.

## Repeater C/D und Room E

Pro Board einzeln installieren, tatsächlichen Funkchip und Port einsetzen:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\windows\DisAHRsterRadio.ps1 -Action Install -Board t3s3-sx1262 -Role repeater -Port COM5
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\windows\DisAHRsterRadio.ps1 -Action Monitor -Board t3s3-sx1262 -Role repeater -Port COM5

# Für E stattdessen:
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\windows\DisAHRsterRadio.ps1 -Action Install -Board t3s3-sx1262 -Role room -Port COM5
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\windows\DisAHRsterRadio.ps1 -Action Monitor -Board t3s3-sx1262 -Role room -Port COM5
```

Monitor vor einem weiteren Upload mit Ctrl+C schließen. Die letzte Befehlsgruppe ist für E, nicht zum anschließenden Überschreiben desselben Repeaters gedacht. Die Monitoraktion nutzt bei diesen beiden Rollen CR-Zeilenenden.

Nach RESET erscheinen geräteindividuelle Admin-Passwörter; Room E zeigt zusätzlich das Raum-Passwort. Für die Portalanmeldung nur das Raum-Passwort verwenden. OTA per WLAN und Schlüssel-Import/Export sind in diesen Profilen deaktiviert. Namen/Funk per USB-Konsole setzen, beispielsweise für C:

```text
get name
get radio
set name Ahr-Relay-01
set radio 869.618,62.5,8,5
set tx 10
reboot
```

Danach `advert`. D erhält einen anderen Namen. E erhält `Ahr-Brett`; echte aktuelle UTC-Zeit gemäß [SCHWARZES_BRETT.md](SCHWARZES_BRETT.md) setzen, dann `advert`. Im Portal unter Gerät Kontakte neu lesen; das Schwarze Brett wählen und mit Raum-Passwort anmelden. C/D bleiben ausschließlich Repeater. Detailtests: [REPEATER_WINDOWS.md](REPEATER_WINDOWS.md), [SCHWARZES_BRETT.md](SCHWARZES_BRETT.md).

## USB- und Startprobleme

Bei S3 kann sich der COM-Port zwischen Bootloader und Anwendung ändern. Im Geräte-Manager erneut prüfen. Wenn automatisches Flashen nicht startet: BOOT halten, RESET kurz drücken, BOOT loslassen; danach den Bootloader-Port wählen und Installation wiederholen. Nach dem Flashen RESET ohne gehaltene BOOT-Taste drücken. USB-CDC ist im Boardprofil eingeschaltet. Nach Öffnen des Monitors erneut RESET drücken, um frühe Ausgabe zu sehen. Keine pauschale Änderung von Pins oder Chipprofilen bei einem Funkinitialisierungsfehler.

## Firmwarepakete und Abnahme

Der eigene Workflow **Build T3-S3 V1.3** baut acht Varianten. Artefaktnamen: `disahrsterradio-t3s3-sx1262-wifi`, `…-wifi_sd`, `…-repeater`, `…-room` beziehungsweise `…-sx1276-…`. Ein erfolgreiches Paket enthält `firmware.bin`, `firmware-merged.bin` und `spiffs.bin`. Das zusammengeführte Firmwareimage enthält **kein SPIFFS**. Für die Erstinstallation die Skripte verwenden, damit die zum S3 passenden Adressen automatisch gewählt werden. Nicht TTGO-Flashadressen übernehmen. Unter `dist/` liegen keine Images mehr.

- [ ] Gelieferten Funkchip und Boardrevision dokumentiert; korrekte Antenne.
- [ ] A/B: unterschiedliche Identitäten und SSIDs, OLED und USB-Ausgabe geprüft.
- [ ] Je zehn Kanal- und Direktnachrichten pro Richtung; ACKs getrennt bewertet.
- [ ] Ausschalten/Neustart, Appupdate und Uhrfreigabe der Zustellaufträge geprüft.
- [ ] E: Login, Beitrag, späterer Abruf und Neustartpersistenz geprüft.
- [ ] C und D einzeln sowie gemeinsam: Weiterleitung mit identischen Parametern verglichen.
- [ ] SD optional: gleichzeitiges Senden, Schreiben, Rotation und Download geprüft.
- [ ] iPhone: Karte importiert, Touch/Zoom und Browserspeicherung geprüft.
- [ ] 24 Stunden stabiler Betrieb; Diagnose aufgezeichnet, Messlücken berücksichtigt.

Die Windows-Recorder-Aktion funktioniert auch am S3-Portal-WLAN: `-Action Record -DurationSeconds 60 -IntervalSeconds 10` für einen ersten Test. Sie liest nur den verbundenen Zugangsknoten. Erst nach diesen Prüfungen lässt sich der Aufbau als praktisch erprobt beschreiben.
