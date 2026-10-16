# Warum MeshCore im Baum liegt

`firmware/MeshCore` ist MeshCore v1.18.0 (Upstream `meshcore-dev/MeshCore`, Branch `main`, Commit `81dbae59`, Stand 16.10.2026; seit 0.9.0-alpha, vorher v1.17.1 `d9296435`). Die eigenen Änderungen stehen als Patch unter `docs/meshcore-main-changes.patch`, `docs/meshcore-repeater-changes.patch` und `docs/meshcore-room-changes.patch`.

Kein Git-Submodul. Ein Submodul fehlt im GitHub-ZIP und in einem einfachen Windows-Klon, und genau so wird hier gebaut und geflasht. Upstream-Workflows, `FUNDING.yml` und `CNAME` im Unterordner gehören zum eingefrorenen Upstream. Sie laufen nicht: GitHub führt nur Workflows aus `.github/workflows` im Repository-Wurzelverzeichnis aus.

Beim Nachziehen einer neueren MeshCore-Version die drei Patches gegen den neuen Stand prüfen, die Pin-Zeile in der README aktualisieren und die Profile in `platformio.local.ini` neu bauen. Nicht still einzelne Dateien aus einem neueren Upstream darüberkopieren.

## Hinweis 0.9.0-alpha

Die früher unter `firmware/MeshCore/lib/` mitgelieferten Bibliotheken (RadioLib, Crypto, RTClib, Adafruit, CayenneLPP …) sind entfernt; wie im Upstream holt PlatformIO sie über `lib_deps` (Profile erben die `lib_deps` der Upstream-Basisumgebungen). Der erste Build braucht daher Internet. Die Patches wurden gegen 1.18.0 neu erzeugt und sind identisch mit denen in [DisAHRsterRadio-MeshCore](https://github.com/Pietwars/DisAHRsterRadio-MeshCore) (bis auf die Oberfläche).
