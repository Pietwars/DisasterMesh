# Quellen, Änderungen und Lizenzen

MeshCore: https://github.com/meshcore-dev/MeshCore
Quellstand: MeshCore 1.18.0, Upstream-Commit 81dbae59 (meshcore-dev/MeshCore main, seit 0.9.0-alpha; vorher v1.17.1 d9296435).

Eigene Ergänzungen liegen unter der MIT-Lizenz des Projektwurzelordners. Vorhandene Autorenhinweise und Lizenzen unter `firmware/MeshCore` und `firmware/MeshCore/lib` gelten für diese Komponenten weiter. Die MIT-Lizenz des Projektwurzelordners ersetzt keine fremden Lizenzhinweise.

Änderungen am eingebetteten MeshCore-Quellbaum:

- `examples/companion_radio/main.cpp`: Portal instanziieren, anmelden und für das Portalprofil automatische SPIFFS-Formatierung bei Mountfehler deaktivieren.
- `DisasterPortal.h`, `HistoryRecord.h`, `PortalPage.h`: neue Dateien.
- `platformio.local.ini`: eigenes Buildprofil.
- `data/disaster.txt`: initiales Dateisystem.
- `test/test_custom_runner.py`: kein automatischer Unity-Download für den Portal-Build; die eigenen Hosttests liegen im Projektwurzelordner. Der Runner meldet bei einem tatsächlichen embedded-Testaufruf ausdrücklich, dass solche Tests nicht implementiert sind.
- `lib/`: seit 0.9.0-alpha nur noch wie im Upstream (ed25519, nrf52). Die übrigen Bibliotheken (RadioLib, Crypto, RTClib, Adafruit, CayenneLPP, Melopero, ArduinoJson, base64) lädt PlatformIO über `lib_deps`; ihre Lizenzen gelten unverändert.

DisasterRadio ist Ideengeber für den lokalen WLAN-/Browserzugang und Nachrichtenverlauf: https://github.com/sudomesh/disaster-radio. Daraus wurde kein Firmware- oder Webcode übernommen. DisAHRsterRadio verwendet dessen Paketformat nicht und ist keine Protokollbrücke.

Werkzeugkette: PlatformIO espressif32 6.11.0, ESP32-Arduino 2.0.17, xtensa-esp32 GCC 8.4.0. Diese Werkzeuge werden nicht als Teil des Quellpakets mitgeliefert.

Ab 0.3: zusätzliche bedingte Hooks in `examples/simple_repeater/main.cpp` für fehlertolerante Inbetriebnahme ohne Autoformatierung und individuelle Zugangsdaten; Diff in `meshcore-repeater-changes.patch`. Die eigene Provisionierung liegt unter `examples/simple_repeater/DisasterRepeater.h` (MIT).

Ab 0.4: bedingte Room-Server-Hooks für Mountprüfung und Journal, ab 0.9: Gastzugang ohne Passwort (nur Lesen, `RoomAccess.h`); siehe `meshcore-room-changes.patch`. Eigenes Journalformat in `examples/simple_room_server/RoomRecord.h` (MIT). Das native MeshCore-Funkprotokoll bleibt unverändert.

Ab 0.5: eigene Warteschlange, SD-Archiv, Vektorkartenrenderer und Werkzeuge (MIT). Kartendaten sind separat ODbL 1.0, © OpenStreetMap contributors, siehe `maps/README.md` und vollständigen Lizenztext. Keine OSM-Daten werden in die Firmware eingebettet. Hersteller-Pins aus dem Block `T3_V1_6_SX1276` in https://github.com/Xinyuan-LilyGO/LilyGo-LoRa-Series/blob/master/examples/ArduinoLoRa/LoRaSender/utilities.h; Framework-SPI-Standardconstructor aus Arduino-ESP32 2.0.17 `libraries/SPI/src/SPI.h`.
