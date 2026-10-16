# Warum MeshCore im Baum liegt

`firmware/MeshCore` ist MeshCore v1.17.1, Commit `d92964352441e53b93e8667b802e04f6e072b39e`. Die eigenen Änderungen stehen als Patch unter `docs/meshcore-main-changes.patch`, `docs/meshcore-repeater-changes.patch` und `docs/meshcore-room-changes.patch`.

Kein Git-Submodul. Ein Submodul fehlt im GitHub-ZIP und in einem einfachen Windows-Klon, und genau so wird hier gebaut und geflasht. Upstream-Workflows, `FUNDING.yml` und `CNAME` im Unterordner gehören zum eingefrorenen Upstream. Sie laufen nicht: GitHub führt nur Workflows aus `.github/workflows` im Repository-Wurzelverzeichnis aus.

Beim Nachziehen einer neueren MeshCore-Version die drei Patches gegen den neuen Stand prüfen, die Pin-Zeile in der README aktualisieren und die Profile in `platformio.local.ini` neu bauen. Nicht still einzelne Dateien aus einem neueren Upstream darüberkopieren.
