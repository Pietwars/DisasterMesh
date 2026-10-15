# DisAHRsterRadio · TTGO 868 MHz

Der Name verbindet DisasterRadio mit der Ahr und erinnert an die Flut im Juli 2021. Ziel ist lokal nutzbare Kommunikation auch ohne Internet.

## Neu in 0.6

Die Oberfläche hat vier Bereiche: **Chat**, **Schwarzes Brett**, **Offlinekarte** und **Gerät**. Chat zeigt Kanäle und persönliche Kontakte, das Schwarze Brett bekannte Room-Server. Alle Funktionen verwenden die vorhandene Firmware-API; es gibt keine Demo-Werte. Der Kartenbereich zeichnet die importierten lokalen Geodaten.

Bei Firmwareupdates heißt das WLAN jetzt `DisAHRsterRadio-XXXXXX`. Das gespeicherte WLAN-Passwort, Knotenidentität, Verlauf, Warteschlange und die Karten-Datenbank bleiben erhalten. Nur die Anwendung aktualisieren; **kein `uploadfs`** bei einem bestehenden Knoten. Alte Exportformat-Kennungen und technische Profilnamen bleiben für bestehende Daten/Werkzeuge kompatibel.


Deutscher WLAN-Browserchat auf MeshCore für LILYGO TTGO LoRa32 V2.1_1.6 (ESP32, SX1276).

**Version 0.6 — Entwicklungsprototyp.** Kein Ersatz für ein geprüftes Notrufsystem. Ziel ist eine MeshCore-kompatible Umsetzung des DisasterRadio-Bedienkonzepts. Der alte DisasterRadio-Funkstack wird nicht verwendet. Meshtastic-Knoten können nicht direkt mit dieser Firmware kommunizieren.

## Enthalten

- MeshCore **v1.17.1**, Quellstand `d92964352441e53b93e8667b802e04f6e072b39e`.
- WLAN-Access-Point mit pro Gerät erzeugtem, dauerhaft gespeichertem Passwort.
- Lokale deutsche Oberfläche ohne CDNs oder Internetabhängigkeit, geeignet für Handybildschirme.
- Kanalchat und Direktnachrichten an bekannte Chat-Kontakte.
- Bis zu 96 persistent gespeicherte lokale Nachrichten-/Bestätigungsereignisse als Ringpuffer mit Prüfsummen.
- Knotenname, Bekanntgabe, Kontakte, Uhrzeit, Kanaleinrichtung und Funkparameter.
- MeshCore-Annahme wird getrennt von Empfangsbestätigung angezeigt. Kanalnachrichten haben keine individuelle Zustellbestätigung.
- Eindeutige Empfangsbestätigungen werden der passenden Direktnachricht zugeordnet; alte Verlaufsdaten bleiben lesbar.
- Verlaufssuche im gewählten Kanal/Kontakt und JSON-Export aller gespeicherten Nachrichten.
- Schutz vor doppeltem Absenden und vor dem Löschen neuer Texte während einer laufenden Anfrage.
- Separates Repeater-Profil für ein drittes TTGO: `disaster_ttgo_repeater`, mit individuellem Admin-Passwort und USB-Einrichtung.
- Schwarzes Brett: separates Room-Server-Profil `disaster_ttgo_room`, 32 Beiträge im persistenten Prüfsummenring.
- Raumanmeldung und Beiträge über das Portal; Fortsetzung ab MeshCore-Abrufcursor, Anzeige signierter Room-Beiträge ohne Autorbytes im Text.
- Hilfe-/Angebot-/Info-Vorlagen mit Ort, optionalen Koordinaten und sichtbarer Ablaufzeit, innerhalb der 100-Byte-Grenze.
- Private Offline-Zustellaufträge: 8 persistente Aufträge, maximal 4 Versuche, Ablaufzeit und ACK-Stop. Versand vom eingeschalteten Absender, kein privates Relais-Postfach.
- Optionales SD-Portalprofil `disaster_ttgo_wifi_sd`: zwei rotierende, prüfsummengeschützte Archivsegmente, Download über WLAN.
- Echte Offline-Vektorkarte: lokale GeoJSON-Dateien, verschieben/zoomen, Browser-Speicherung, Meldungspositionen. Reales OSM-Kartenpaket Heimersheim mit 1.984 Objekten enthalten; Werkzeug für andere Regionen.
- Eigene Profile korrigieren den LoRa-Reset auf den LILYGO-T3-V1.6-Herstellerwert GPIO23; GPIO14 bleibt für SD-SCLK frei.
- Bestehende MeshCore-OLED-Oberfläche.

Die Funktionen sind implementiert, aber der Status tatsächlicher Prüfungen steht in [docs/VALIDIERUNG.md](docs/VALIDIERUNG.md). Tests mit echten Boards stehen noch aus.

## Noch nicht enthalten

Ein privates Zwischenknoten-Postfach, das bei ausgeschaltetem Absender weiterliefert, automatische GPS-Erfassung, Routing/Navigation, weltweite Kartenkacheln, Dateien über Funk, Benutzerkonten, Priorisierung von Hilferufen und ein zusammengeführter Zugangsknoten/Repeater. Der Verlauf gehört dem lokalen Board; er ist kein netzweit synchronisiertes Archiv. Die WLAN-Nutzer teilen die Knotenidentität. Nachrichten liegen im lokalen Flash unverschlüsselt; ein WLAN-Passwort ersetzt keine getrennten Benutzerkonten.

## Testfirmware und Ausbau

Aktuelle Firmware und SPIFFS-Image gibt es beim erfolgreichen Lauf unter [GitHub Actions](https://github.com/Pietwars/DisasterMesh/actions), Artefakt `disahrsterradio-ttgo-testbuild`. Die BIN-Dateien unter `dist/` bleiben der ältere Stand 0.1; für 0.6 den aktuellen Quellcode bauen oder das passende Actions-Artefakt verwenden.

Konkrete Lösungswege für die noch fehlenden Funktionen: [Entwicklungsplan](docs/ENTWICKLUNGSPLAN.md).

## Schwarzes Brett und Meldungen

[Windows-Anleitung für Room-Server, Anmeldung und Meldungsvorlagen](docs/SCHWARZES_BRETT.md). Zwei Portale plus ein Room-Server benötigen drei Boards. Soll zusätzlich ein separater Repeater verwendet werden, ist ein viertes Board nötig. Der Room-Server arbeitet standardmäßig ohne Weiterleitung.

## Private Offline-Aufträge, SD und Karten

[Windows-Einrichtung und Grenzen der drei neuen Funktionen](docs/OFFLINE_SD_KARTEN.md). Das SD-Profil ist optional; private Aufträge und Offlinekarten funktionieren auch mit dem Standardportal. Die OSM-Kartendaten stehen unter ODbL, siehe [maps/README.md](maps/README.md).

## Einstieg

1. [Sichern, Bauen und Flashen](docs/ERSTE_SCHRITTE.md) lesen.
2. Meshtastic-Einstellungen und vollständigen Flash **lokal sichern**.
3. Firmware und Dateisystem beim ersten Wechsel installieren.
4. USB-Seriellmonitor mit 115200 Baud öffnen: WLAN-Name und Passwort werden ausgegeben.
5. Handy mit `DisAHRsterRadio-XXXXXX` verbinden und `http://192.168.4.1` öffnen.
6. Knoten benennen, Handy-Uhr übernehmen, identische Funkparameter und Kanal auf beiden Boards einstellen.
7. Erst Kanalchat direkt testen, dann Bekanntgaben austauschen und Direktnachrichten prüfen.

Für größere Entfernung steht jetzt ein eigenes, separat gebautes MeshCore-Repeater-Profil bereit: [Drittes TTGO unter Windows einrichten](docs/REPEATER_WINDOWS.md). Companion-Knoten dieser Version leiten fremde Nachrichten nicht als Repeater weiter.

## Nächster MVP: Windows und zwei Boards

Der Windows-Einstieg für die Entwicklung zu 0.7 steht in [docs/WINDOWS_MVP.md](docs/WINDOWS_MVP.md): gemeinsamer Prüflauf, getrennte Erstinstallation und Updates sowie [Abnahmeprotokoll](docs/ABNAHME_ZWEI_BOARDS.md). Hardwareabnahme und erweiterte Diagnose bleiben offen; die aktuelle Firmwareversion ist weiterhin 0.6.

## Entwicklung

Python 3, Node.js (für Tests), Git und PlatformIO werden benötigt.

```sh
python -m pip install platformio==6.2.0
python tools/embed_web.py
npm ci
npm test
g++ -std=c++17 tests/history.test.cpp -o /tmp/history-test
/tmp/history-test
python -m platformio run -j 2 -d firmware/MeshCore -e disaster_ttgo_wifi
```

Optionaler Browsertest (simulierte API, kein Funk):

```sh
npm install --no-save playwright
npx playwright install chromium --only-shell
node tests/browser.test.cjs
```

`web/` ist die Quelle der Oberfläche. `tools/embed_web.py` schreibt daraus `PortalPage.h`. Änderungen anschließend neu kompilieren. Beim Öffnen der HTML-Datei ohne Board ist keine Funkverbindung vorhanden.

## Aufbau und Quellen

- `firmware/MeshCore/`: mitgelieferter MeshCore-Quellstand samt Original-Lizenz und Boardprofilen.
- `firmware/MeshCore/platformio.local.ini`: eigenes Buildprofil `disaster_ttgo_wifi`.
- `firmware/MeshCore/examples/companion_radio/DisasterPortal.h`: lokale HTTP-zu-Companion-Anbindung.
- `web/`: Oberfläche und Protokolldekodierung.
- `tests/`: Protokoll- und Browserprüfungen.
- `docs/`: Flash-Anleitung, Architektur, Testplan und Entwicklungsstand.

Upstream: https://github.com/meshcore-dev/MeshCore

Ideengeber: https://github.com/sudomesh/disaster-radio (kein Quellcode daraus übernommen).

## Lizenzen

Eigene Ergänzungen: MIT, siehe `LICENSE`. Mitgelieferte Komponenten behalten ihre jeweiligen Lizenzen. MeshCore: `firmware/MeshCore/license.txt`. Originale Hinweise bleiben erhalten. Änderungen an MeshCore: Portal-Hooks in `examples/companion_radio/main.cpp`, kein automatisches Formatieren bei SPIFFS-Mountfehler, zusätzliches Buildprofil und Portaldateien.

Die für das Portalprofil benötigten Funk-, Crypto-, RTC-, Display- und JSON-Bibliotheken liegen als Quellcode unter `firmware/MeshCore/lib/`. Versionen und Quellstände stehen in `docs/dependencies.json`. Ihre ursprünglichen Lizenzhinweise bleiben erhalten. Automatische Bibliotheksabhängigkeiten in den mitgelieferten Manifesten sind entfernt, weil diese Abhängigkeiten bereits lokal mitgeliefert werden. Für die ESP32-Werkzeugkette ist beim ersten Build weiterhin ein Download erforderlich. Die ursprünglichen Upstream-Profile bleiben zur Referenz erhalten; Die eigenen Profile `disaster_ttgo_wifi`, `disaster_ttgo_wifi_sd`, `disaster_ttgo_repeater` und `disaster_ttgo_room` werden separat im Workflow gebaut.
