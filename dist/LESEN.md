# Keine Firmware in diesem Ordner

Die früheren BIN-Dateien waren der Stand 0.1 für TTGO LoRa32 / SX1276. Sie passen nicht zu den aktuellen Versionen (ab 0.8.0) und nicht zum LILYGO T3-S3 / SX1262. Sie wurden entfernt, damit niemand die falsche Datei flasht.

Aktuelle Flashpakete (factory.bin, Einzelteile, `SHA256SUMS`, deutsche `ANLEITUNG.md`) stehen ab 0.9.0-alpha als Assets unter [Releases](https://github.com/Pietwars/DisasterMesh/releases) – ohne GitHub-Anmeldung. Sie werden beim Setzen eines Versions-Tags (`v*`) automatisch vom Workflow „Release“ gebaut. Alternativ den aktuellen Quellstand mit PlatformIO bauen; Anleitung: `docs/SX1262_PAKET.md`.

Das ältere geprüfte Startpaket gehört zum Stand 0.7.1.1 (siehe `docs/STARTPAKET.md`). Keine Hardwarefreigabe.
