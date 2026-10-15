# Quellen, Änderungen und Lizenzen

MeshCore: https://github.com/meshcore-dev/MeshCore
Quellstand: d92964352441e53b93e8667b802e04f6e072b39e (Companion v1.17.1).

Eigene Ergänzungen liegen unter der MIT-Lizenz des Projektwurzelordners. Vorhandene Autorenhinweise und Lizenzen unter `firmware/MeshCore` und `firmware/MeshCore/lib` gelten für diese Komponenten weiter. Die MIT-Lizenz des Projektwurzelordners ersetzt keine fremden Lizenzhinweise.

Änderungen am eingebetteten MeshCore-Quellbaum:

- `examples/companion_radio/main.cpp`: Portal instanziieren, anmelden und für das Portalprofil automatische SPIFFS-Formatierung bei Mountfehler deaktivieren.
- `DisasterPortal.h`, `HistoryRecord.h`, `PortalPage.h`: neue Dateien.
- `platformio.local.ini`: eigenes Buildprofil.
- `data/disaster.txt`: initiales Dateisystem.
- `test/test_custom_runner.py`: kein automatischer Unity-Download für den Portal-Build; die eigenen Hosttests liegen im Projektwurzelordner. Der Runner meldet bei einem tatsächlichen embedded-Testaufruf ausdrücklich, dass solche Tests nicht implementiert sind.
- `lib/`: benötigte Bibliotheken mit ihren Originalquellen und Hinweisen beigefügt. Manifest-Abhängigkeitsdeklarationen sind entfernt, da alle erforderlichen Bibliotheken lokal enthalten sind. Quellstände/Manifeste: `dependencies.json`. Keine Änderungen am Bibliothekscode.

DisasterRadio ist Ideengeber für den lokalen WLAN-/Browserzugang und Nachrichtenverlauf: https://github.com/sudomesh/disaster-radio. Daraus wurde kein Firmware- oder Webcode übernommen. DisasterMesh verwendet dessen Paketformat nicht und ist keine Protokollbrücke.

Werkzeugkette: PlatformIO espressif32 6.11.0, ESP32-Arduino 2.0.17, xtensa-esp32 GCC 8.4.0. Diese Werkzeuge werden nicht als Teil des Quellpakets mitgeliefert.

Ab 0.3: zusätzliche bedingte Hooks in `examples/simple_repeater/main.cpp` für fehlertolerante Inbetriebnahme ohne Autoformatierung und individuelle Zugangsdaten; Diff in `meshcore-repeater-changes.patch`. Die eigene Provisionierung liegt unter `examples/simple_repeater/DisasterRepeater.h` (MIT).
