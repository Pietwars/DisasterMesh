# DisAHRsterRadio

> **Aktueller Stand:** offenes WLAN `DisAHRsterRadio-XXXXXX` → `http://192.168.4.1`, MeshCore-App per Bluetooth ohne PIN, Schwarzes Brett mit dem öffentlichen Gast-Passwort `hello` (sendet die Weboberfläche automatisch) – einfach verbinden, nichts eingeben. Betreiberfunktionen nur mit Admin-Passwort über USB/Adminbereich. [Zugang auf einen Blick](#zugang-auf-einen-blick) · [Zugang, Update und Abnahme](docs/OFFENER_ZUGANG.md)


[![DisAHRsterRadio – MeshCore-Funknetz fürs Ahrtal](docs/images/disahrsterradio-header.jpg)](docs/images/disahrsterradio-header.jpg)

**Lokale Kommunikation im Ahrtal – auch ohne Internet, Strom- oder Mobilfunknetz.** DisAHRsterRadio verbindet LoRa-Funkknoten auf Basis von [MeshCore](https://github.com/meshcore-dev/MeshCore) mit einer deutschen Weboberfläche im Handy-Browser: Chat, Schwarzes Brett, Schnellmeldungen, Offlinekarten und Standort teilen. Der Name trägt die Ahr in sich und erinnert an die Flut im Juli 2021.

**Version 0.9.1 · Entwicklungsprototyp · MeshCore 1.18.0 · LILYGO T3-S3 V1.3 (SX1262/SX1276), LILYGO T3 V1.6.1 (SX1276), Heltec WiFi LoRa 32 V2 (SX1276) · 868 MHz**

> ⚠️ Kein geprüftes Notfunksystem und kein Ersatz für den Notruf **112**. Software und Firmware-Builds sind automatisch geprüft. Hardware: LILYGO T3 V1.6.1 lief beim Nutzer mit der Schwester-Firmware DisAHRsterRadio vollständig (OLED, WLAN, Weboberfläche, Chat, LoRa-Empfang); DisasterMesh 0.9.1 selbst ist **auf keinem Board abgenommen** (auf Hardware getestet ist 0.9.1 nur in der Schwester-Firmware [DisAHRsterRadio-MeshCore](https://github.com/Pietwars/DisAHRsterRadio-MeshCore) auf T-Deck Plus und Heltec V2). Heltec V2 zeigte mit älteren Ständen ein Strom-/Brownout-Problem (WLAN-AP erschien nicht); der gestaffelte WLAN-Start ist als Gegenmaßnahme enthalten. Funkreichweite, GPS-Modul, Stromaufnahme und iPhone sind nicht abgenommen.

<!-- projektfamilie:start (in allen fünf Repositorys identisch; erzeugt mit DisasterMesh/tools/projektfamilie.py) -->
### Projektfamilie DisAHRsterRadio / HaldenFunk

| Repository | Inhalt | Funk | Version | Demo · Download · Flyer |
|---|---|---|---|---|
| [Pietwars/DisasterMesh](https://github.com/Pietwars/DisasterMesh) | Original-Repo: MeshCore 1.18 mit der großen Weboberfläche MeshAhrtal, Karten, Werkzeuge, Doku (Ahrtal) | MeshCore | 0.9.1 | [Live-Demo](https://pietwars.github.io/DisasterMesh/demo/) · [Release v0.9.1](https://github.com/Pietwars/DisasterMesh/releases/tag/v0.9.1) · Flyer [Druck](https://pietwars.github.io/DisasterMesh/flyer/DisasterMesh-Flyer.pdf) / [digital](https://pietwars.github.io/DisasterMesh/flyer/DisasterMesh-Flyer-digital.pdf) |
| [Pietwars/DisAHRsterRadio-MeshCore](https://github.com/Pietwars/DisAHRsterRadio-MeshCore) | MeshCore 1.18 mit kompakter MeshAhrtal-Oberfläche per WLAN plus Bluetooth für die MeshCore-App; Firmware für LILYGO T-Deck Plus und Heltec V2 (Ahrtal) | MeshCore | 0.9.1 | [Live-Demo](https://pietwars.github.io/DisAHRsterRadio-MeshCore/) · [Release v0.9.1](https://github.com/Pietwars/DisAHRsterRadio-MeshCore/releases/tag/v0.9.1) · Flyer [Druck](https://pietwars.github.io/DisAHRsterRadio-MeshCore/flyer/DisAHRsterRadio-MeshCore-Flyer.pdf) / [digital](https://pietwars.github.io/DisAHRsterRadio-MeshCore/flyer/DisAHRsterRadio-MeshCore-Flyer-digital.pdf) |
| [Pietwars/DisAHRsterRadio](https://github.com/Pietwars/DisAHRsterRadio) | Ohne MeshCore: modernisiertes disaster-radio (LoRaLayer2, RadioLib) mit kompakter MeshAhrtal-Oberfläche (Ahrtal) | LoRaLayer2 | 0.9.1 | [Live-Demo](https://pietwars.github.io/DisAHRsterRadio/) · [Release v0.9.1](https://github.com/Pietwars/DisAHRsterRadio/releases/tag/v0.9.1) · Flyer [Druck](https://pietwars.github.io/DisAHRsterRadio/flyer/DisAHRsterRadio-Flyer.pdf) / [digital](https://pietwars.github.io/DisAHRsterRadio/flyer/DisAHRsterRadio-Flyer-digital.pdf) |
| [Pietwars/HaldenFunk](https://github.com/Pietwars/HaldenFunk) | Regionalvariante von DisAHRsterRadio für Sangerhausen / Mansfelder Land, ohne MeshCore | LoRaLayer2 | 0.9.1 | [Live-Demo](https://pietwars.github.io/HaldenFunk/) · [Release v0.9.1](https://github.com/Pietwars/HaldenFunk/releases/tag/v0.9.1) · Flyer [Druck](https://pietwars.github.io/HaldenFunk/flyer/HaldenFunk-Flyer.pdf) / [digital](https://pietwars.github.io/HaldenFunk/flyer/HaldenFunk-Flyer-digital.pdf) |
| [Pietwars/HaldenFunk-MeshCore](https://github.com/Pietwars/HaldenFunk-MeshCore) | Regionalvariante von DisAHRsterRadio-MeshCore für das Mansfelder Land: MeshCore 1.18, WLAN + Bluetooth, Gerätematrix | MeshCore | 0.9.1 | [Live-Demo](https://pietwars.github.io/HaldenFunk-MeshCore/) · [Release v0.9.1](https://github.com/Pietwars/HaldenFunk-MeshCore/releases/tag/v0.9.1) · Flyer [Druck](https://pietwars.github.io/HaldenFunk-MeshCore/flyer/HaldenFunk-MeshCore-Flyer.pdf) / [digital](https://pietwars.github.io/HaldenFunk-MeshCore/flyer/HaldenFunk-MeshCore-Flyer-digital.pdf) |

Gleiche Spalte **Funk** = Geräte können miteinander funken (gleiches Funkprofil vorausgesetzt). MeshCore- und LoRaLayer2-Varianten verstehen sich **nicht**.

**Namen:** **DisAHRsterRadio** = Projekt und Marke (WLAN `DisAHRsterRadio-XXXXXX`) · **MeshAhrtal** = die Weboberfläche im Handy-Browser · **DisasterMesh** = das Original-Repository · **HaldenFunk** = Regionalvariante fürs Mansfelder Land (WLAN `HaldenFunk-XXXXXX`).

Firmware 0.9.1 auf echter Hardware getestet: **LILYGO T-Deck Plus** und **Heltec WiFi LoRa 32 V2** (868 MHz) mit DisAHRsterRadio-MeshCore. Die Releases enthalten nur Firmware für diese beiden Boards (soweit das jeweilige Repository sie unterstützt); weitere Boards bleiben im Code, sind aber vorerst nicht im Release. Druck-Flyer haben QR-Codes, digitale Flyer klickbare Links. Alle Demos sind simuliert.

> ⚠️ Prototyp, kein zertifiziertes Notrufsystem. **Im Notfall immer 112.**
<!-- projektfamilie:end -->

### English summary

DisAHRsterRadio (repository DisasterMesh) is an offline LoRa mesh messenger for the Ahr valley (Germany), built on MeshCore 1.18. Each ESP32 node opens its own Wi-Fi; phones use a German web UI (MeshAhrtal) for channel chat, direct messages, a bulletin board (room server), quick emergency templates, offline vector maps of the valley and opt-in position sharing (compact `!DP1` messages, coarse/medium/fine precision). Supported main boards: LILYGO T3-S3 V1.3 (SX1262 or SX1276), LILYGO T3 V1.6.1 (SX1276) and Heltec WiFi LoRa 32 V2 (SX1276), all 868 MHz; repeater and room-server profiles are included, an external NMEA GPS module is optional. Version and firmware ID come from the single `VERSION` file. Status: development prototype – CI-tested software and firmware builds; this version has **not been accepted on real hardware** (only the LILYGO T3 V1.6.1 ran the sister firmware DisAHRsterRadio at the user's site). Not a certified emergency system.

## Funktionen 0.9.1

| Bereich | Funktionen |
|---|---|
| Kommunikation | Kanalchat, Direktnachrichten, Kontakte, Verlaufssuche, JSON-Export, begrenzte Zustellaufträge |
| Schwarzes Brett | Room-Server, Portal tritt automatisch mit öffentlichem Gast-Passwort `hello` bei (lesen/schreiben), 32 Beiträge, Vorlagen Hilfe / Angebot / Info (`!DM1`), aktuelle Hilfe oben |
| Schnellmeldungen | Trinkwasser, Strom/Laden, Medikamente, Verletzt, Evakuierung, „Mir geht es gut“, Hilfe anbieten, Strom vorhanden |
| Ahrtal-Orte | 14 Orte von Schuld bis Kripp für Meldungen und Standort (gerundete Ortsmitten nach OSM) |
| Standort | Ortsliste, Karte antippen, Handy-Ortung (nur in sicherem Kontext), optionales GPS-Modul; Teilen als `!DP1` mit Genauigkeit grob/mittel/fein, höchstens alle 5 Minuten. [Details](docs/GPS_UND_STANDORT.md) |
| Offlinekarten | Ahrtal-Übersicht Quelle–Mündung, Heimersheim mit Gebäuden, Altenahr, Dernau/Ahrweiler, Sinzig; Speicherung auf dem Handy, automatische Aktualisierung bei Internet. [Karten](docs/AUTOMATISCHE_KARTEN.md) |
| Versorgung und eigene Orte | OSM-Versorgungspunkte (Wasser, Apotheke, Feuerwehr, Arzt, Lebensmittel, WC, Unterstand), eigene POIs und Erntefundorte, GeoJSON-Import/-Export |
| Gerät und Administration | Diagnose, Knotenname, Uhrzeit, Adminzugang (Admin-Passwort nur für Betreiber), Chatkanäle, 868-MHz-Funkprofile, Verlauf löschen, optionales SD-Archiv |

## Zugang auf einen Blick

| Zugang | Aktueller Stand |
|---|---|
| WLAN `DisAHRsterRadio-XXXXXX` | **offen, ohne Passwort** – verbinden, `http://192.168.4.1` öffnen, nichts eingeben (höchstens 4 Handys je Board) |
| Bluetooth (MeshCore-App) | **ohne PIN** („Just Works“) – das Handy fragt höchstens „Koppeln?“; alte Kopplung bei Bedarf am Handy entfernen |
| Schwarzes Brett (Room-Server) | öffentliches MeshCore-Standard-Gast-Passwort **`hello`**: damit lesen und schreiben. Die Weboberfläche sendet `hello` beim „Beitreten“ automatisch, niemand muss etwas eintippen. In der MeshCore-App `hello` eingeben; ohne Passwort nur lesen |
| Admin (nur Betreiber) | Für Betreiberfunktionen (Funkprofil, Name, Kanäle, Verwaltung von Repeater/Room-Server) gibt es ein Admin-Passwort. Es ist für jedes Gerät eigen, steht weder im Code noch in der Doku und wird nur beim ersten Start über USB (115200 Baud) angezeigt. Der Betreiber muss es dort ablesen und sicher aufbewahren oder ein eigenes setzen (im Adminbereich der Weboberfläche ändern (12–64 Zeichen); bei Repeater und Room-Server per USB-Befehl `password <neu>`). |

Außer dem öffentlichen Standard `hello` stehen keine Passwörter in Code, Doku, Flyern oder der Live-Demo; die Live-Demo öffnet den Adminbereich ohne Anmeldung. Details: [Offener Zugang](docs/OFFENER_ZUGANG.md).

> Download: [Release v0.9.1](https://github.com/Pietwars/DisasterMesh/releases/tag/v0.9.1) mit dem Paket für **Heltec WiFi LoRa 32 V2** (`factory.bin` an **0x0** flashen; überschreibt Einstellungen, Identität und Verlauf). Pakete für weitere Boards sind vorerst nicht im Release; ältere Releases (bis 0.9.0-alpha) enthalten noch die alten Zugangsregeln.

## Schnellstart

1. **Demo ansehen:** [Live-Demo im Browser](https://pietwars.github.io/DisasterMesh/demo/) – Stand 0.9.1, alles simuliert, Adminbereich ohne Anmeldung. Offline: `python tools/build_demo.py` erzeugt dieselbe Demo in `docs/demo/`. Demo-ZIPs und Startpakete in den älteren [Releases](https://github.com/Pietwars/DisasterMesh/releases) (0.7.x/0.8.0) sind veraltet und beschreiben noch den früheren Demo-Adminzugang – bitte die Live-Demo oder `tools/build_demo.py` verwenden. [Startpaket](docs/STARTPAKET.md)
2. **Firmware:** [Release v0.9.1](https://github.com/Pietwars/DisasterMesh/releases/tag/v0.9.1) mit dem Paket für Heltec V2 (`…-factory.bin` an 0x0, Einzelteile, `SHA256SUMS`, deutsche `ANLEITUNG.md`). Weitere Boards und Profile (T3-S3 V1.3, T3 V1.6.1, Repeater, Room-Server, SD, GPS, SX1276) bleiben im Code, sind aber vorerst nicht im Release: Builds der Workflows „Build T3-S3 V1.3“ und „Build DisAHRsterRadio TTGO“ unter [Actions](https://github.com/Pietwars/DisasterMesh/actions) (GitHub-Anmeldung nötig) oder selbst bauen (siehe unten). [Flashen mit Sicherung](docs/SX1262_PAKET.md) · [Startpaket und Windows](docs/STARTPAKET.md)
3. Vorherige Firmware und Einstellungen **lokal sichern**. Bei bestehender DisAHRsterRadio-Installation gleicher Rolle nur die Anwendung aktualisieren, **kein `uploadfs`**.
4. Nur Betreiber: USB-Seriellmonitor (115200 Baud) öffnen und das beim ersten Start angezeigte Admin-Passwort sicher aufbewahren oder ein eigenes setzen. Für WLAN, Bluetooth und Brett muss niemand etwas eingeben.
5. Handy mit `DisAHRsterRadio-XXXXXX` verbinden, `http://192.168.4.1` öffnen. [Web-App auf dem iPhone](docs/AHRTAL_WEBAPP.md)
6. Knoten benennen, Uhr übernehmen, Funkprofil und Kanäle auf allen Boards abstimmen.
7. Erst zwei Boards direkt testen, dann Repeater und Room-Server ergänzen. [Abnahmeprotokoll](docs/ABNAHME_ZWEI_BOARDS.md)

## Hardware

**Funkprofil (alle Geräte, alle Rollen):** MeshCore-Standard-Preset **EU/UK (Narrow)** – **869,618 MHz, Bandbreite 62,5 kHz, SF8, CR 4/8**, MeshCore-Standard-Syncword (privat, 0x12). Gesetzt über die Build-Flags `LORA_FREQ=869.618`, `LORA_BW=62.5`, `LORA_SF=8`, `LORA_CR=8` in `firmware/MeshCore/platformio.ini` (gilt für alle Upstream-Gerätevarianten und die eigenen Profile). Teilband 869,4–869,65 MHz (SRD, ETSI EN 300 220 / BNetzA): max. 500 mW ERP (27 dBm), 10 % Sendezeit; die Firmware bleibt bei der bisherigen boardsicheren Sendeleistung (nicht erhöht). Alle Knoten eines Netzes müssen dasselbe Profil nutzen – Geräte mit älterem Stand (CR 4/5) einmal in der Weboberfläche auf „EU/UK Narrow“ stellen oder per CLI `set radio 869.618,62.5,8,8`.

Zielaufbau: **fünf LILYGO T3-S3 V1.3** (ESP32-S3, SX1262, 868-MHz-Antenne). [Board, Pins, Strom](docs/SX1262_BOARD.md) · [Fünf-Board-Aufbau](docs/T3S3_V13_WINDOWS.md)

| Boards | Rolle | Firmwareprofil |
|---|---|---|
| A und B | WLAN-Portal mit MeshAhrtal-Oberfläche | `disaster_t3s3_sx1262_wifi` |
| optional | WLAN-Portal mit SD-Archiv | `disaster_t3s3_sx1262_wifi_sd` |
| optional | WLAN-Portal mit GPS-Modul | `disaster_t3s3_sx1262_wifi_gps` |
| C und D | Repeater | `disaster_t3s3_sx1262_repeater` |
| E | Room-Server (Schwarzes Brett) | `disaster_t3s3_sx1262_room` |

Weitere Boards und Profile:

| Board | Rolle | Firmwareprofil | Stand |
|---|---|---|---|
| LILYGO T3-S3 V1.3 mit SX1276 | WLAN / Repeater / Room / SD | `disaster_t3s3_sx1276_*` | baut, ungeprüft |
| LILYGO T3 V1.6.1 (TTGO LoRa32 V2.1_1.6, SX1276) | WLAN-Portal | `disaster_tlora_v2_1_sx1276_wifi` | baut; Hardware mit DisAHRsterRadio geprüft |
| TTGO LoRa32 V2.1_1.6 | WLAN / SD / Repeater / Room | `disaster_ttgo_wifi`, `_wifi_sd`, `_repeater`, `_room` | baut, ungeprüft |
| Heltec WiFi LoRa 32 V2 (SX1276) | WLAN-Portal (WLAN 8,5 dBm, 2 s später gestartet) | `disaster_heltec_v2_sx1276_wifi` | baut; Brownout-Problem bekannt |
| Heltec WiFi LoRa 32 V2 | Diagnose (Boot-Marker seriell) | `disaster_heltec_v2_sx1276_wifi_diag` | baut |

Firmware nie auf eine andere Funkchip-Variante flashen. Meshtastic-Knoten sprechen nicht mit MeshCore. WLAN-Name `DisAHRsterRadio-XXXXXX`. Das WLAN ist offen – einfach verbinden, nichts eingeben. Der Room-Server (Board E) nutzt das öffentliche Gast-Passwort `hello`.

**Optionales GPS-Modul** (NMEA, 9600 Baud, z. B. ATGM336H, NEO-6M, L76K) – nicht an Hardware geprüft:

| Modul | T3-S3 |
|---|---|
| VCC | 3V3 |
| GND | GND |
| TX | GPIO 44 |
| RX | GPIO 43 |

## Vorschauen

Echte Browseraufnahmen der Demo; Geräte- und Funkwerte sind simuliert.

<img src="docs/images/funktion-startbild.jpg" width="230" alt="Startbildschirm"> <img src="docs/images/funktion-schnellmeldung.jpg" width="230" alt="Schnellmeldungen"> <img src="docs/images/funktion-standort.jpg" width="230" alt="Karte mit geteilten Positionen">

| | | |
|---|---|---|
| [![Chat](docs/images/funktion-chat.png)](docs/images/funktion-chat.png) Chat | [![Schwarzes Brett](docs/images/funktion-brett.png)](docs/images/funktion-brett.png) Schwarzes Brett | [![Meldungen](docs/images/funktion-meldungen.png)](docs/images/funktion-meldungen.png) Meldungsvorlagen |
| [![Kartendownload](docs/images/funktion-kartendownload.png)](docs/images/funktion-kartendownload.png) Kartendownload | [![Versorgung](docs/images/funktion-versorgung.png)](docs/images/funktion-versorgung.png) Versorgung | [![Eigene POIs](docs/images/funktion-eigene-pois.png)](docs/images/funktion-eigene-pois.png) Eigene POIs |
| [![Admin](docs/images/ahrtal-admin.png)](docs/images/ahrtal-admin.png) Adminzugang | [![Diagnose](docs/images/funktion-diagnose.png)](docs/images/funktion-diagnose.png) Diagnose | [![Funkprofile](docs/images/funktion-funkprofile.png)](docs/images/funktion-funkprofile.png) Funkprofile |

Weitere: [Desktop](docs/images/ahrtal-desktop.png) · [Direktnachrichten](docs/images/funktion-direktnachrichten.png) · [Kanäle](docs/images/funktion-kanaele.png) · [Knoten](docs/images/funktion-knoten.png) · [Zustellaufträge/SD](docs/images/funktion-auftraege-sd.png) · [Erntefundorte](docs/images/funktion-erntefundorte.png) · [Heimersheim-Karte](docs/images/heimersheim-map.png)

## Status und Grenzen

- **Prototyp.** Nicht zertifiziert, kein Anschluss an Leitstellen, keine Funkpriorität für Hilferufe.
- **Hardware ungeprüft:** Funk, Reichweite, Repeater, Room-Server über Neustart, Stromausfall, SD-Last, GPS-Modul, Stromaufnahme, echtes iPhone/Android. Siehe [Validierung](docs/VALIDIERUNG.md), [Entwicklungsplan](docs/ENTWICKLUNGSPLAN.md), [iPhone](docs/IOS_REALITAET.md), [Strom](docs/STROM_UND_SCHLAF.md).
- Handy-Ortung ist über `http://192.168.4.1` vom Browser gesperrt; Ortsliste, Karte oder GPS-Modul verwenden.
- Alle WLAN-Nutzer eines Boards teilen eine Knotenidentität. Verlauf im Flash, eigene POIs und Exporte sind **unverschlüsselt**.
- Positionen im Kanal sind für alle mit dem Kanalschlüssel lesbar (im Public-Kanal für alle).
- Karten müssen **vor** dem Ausfall auf dem Handy liegen; keine Karteninhalte über Funk.
- Im Ordner `dist/` liegen bewusst keine Firmwaredateien ([Hinweis](dist/LESEN.md)).

## Entwicklung und Tests

Benötigt: Python 3, Node.js 20, Git, PlatformIO 6.2.

```sh
npm ci --omit=optional && npm test          # JS-Tests ohne Browser
python tests/tools.test.py                   # Python-Tests: tests/*.test.py
g++ -std=c++17 -I tests/fakes tests/history.test.cpp -o /tmp/t && /tmp/t   # C++-Tests: tests/*.test.cpp
python tools/embed_web.py                    # Oberfläche in die Firmware einbetten
python -m platformio run -d firmware/MeshCore -e disaster_t3s3_sx1262_wifi
```

Browserprüfungen und Vorschauen: `npm ci && npx playwright install chromium`, dann `npm run test:browser`, `python tools/build_demo.py`, `node tools/capture_previews.cjs`.

CI ([Actions](https://github.com/Pietwars/DisasterMesh/actions)): „Tests“ (JS, Python, C++, Versionsprüfung `tools/version.py --check`, feste Bibliotheksversionen `tools/pin_libs.py --check`), „Build DisAHRsterRadio TTGO“ (TTGO-, T3-V1.6.1- und Heltec-Profile + Browser), „Build T3-S3 V1.3“ (8 Profile + GPS-Profil, Windows-Pakete), „Windows MVP checks“, „Release“ (bei jedem Tag `v*`: Paket für Heltec V2 bauen, prüfen und veröffentlichen; Versionen mit Zusatz wie `-alpha` als Vorabversion), „Projektseite (GitHub Pages)“.

Version und Firmwarekennung stehen nur in der Datei `VERSION`; `python tools/version.py` überträgt sie in Oberfläche, Demo, README, Flyer und Projektseite.

Weitere Doku: [Architektur](docs/ARCHITEKTUR.md) · [Windows-Entwicklung](docs/WINDOWS_MVP.md) · [MeshCore-Anpassungen](docs/UPSTREAM.md) · [Änderungen](CHANGELOG.md)

## Mitmachen

Fehler und Ideen bitte als [Issue](https://github.com/Pietwars/DisasterMesh/issues). Pull Requests gegen `main`; alle Checks müssen grün sein. Dokumentation und Oberfläche sind auf Deutsch. Hardware-Testberichte (zwei Boards, Repeater, iPhone, GPS-Modul) mit dem [Abnahmeprotokoll](docs/ABNAHME_ZWEI_BOARDS.md) sind besonders willkommen.

**Flyer (A5):** [Druck-PDF mit QR-Codes](docs/flyer/DisasterMesh-Flyer.pdf) · [Digital-PDF mit klickbaren Links](docs/flyer/DisasterMesh-Flyer-digital.pdf) · [Vorschau](docs/flyer/DisasterMesh-Flyer-vorschau.jpg); erzeugt mit dem gemeinsamen Flyer-Generator `python3 tools/flyer/flyer.py` (Konfiguration `tools/flyer/flyer.json`, Version aus `VERSION`, schreibt auch die Druckquelle `docs/flyer/flyer.html`); beide PDFs hängen auch am Release. **Projektseite:** Quelle `docs/site/index.html`, lokal bauen mit `python tools/build_site.py` (Seite, Bilder und Live-Demo in `_site/`); Veröffentlichung über den Workflow „Projektseite (GitHub Pages)“.

## Lizenz und Quellen

- Code: [MIT](LICENSE). MeshCore und weitere Komponenten unter ihren eigenen Lizenzen, siehe [Quellen und Lizenzen](docs/QUELLEN_UND_LIZENZEN.md).
- Kartendaten: © [OpenStreetMap](https://www.openstreetmap.org/copyright)-Mitwirkende, [ODbL 1.0](maps/ODbL-1.0.txt).
- Foto und Startbild: © Pietwars, nicht unter MIT ([Bildquellen](web/assets/README.md)). Schrift im Startbild: Rajdhani (SIL Open Font License).
