# Kompilierte Testfirmware

Ziel: LILYGO TTGO LoRa32 V2.1_1.6 / ESP32 / SX1276 / 868 MHz. Hardwaretests stehen aus.

- `disastermesh-ttgo-merged.bin`: Bootloader, Partitionstabelle und Anwendung; vollständiger Firmwarestart bei Offset **0x0**.
- `disastermesh-ttgo-app.bin`: nur Anwendung; für die erste manuelle Installation allein nicht ausreichend.
- `SHA256SUMS.txt`: Prüfsummen.

Die Firmware benötigt ein initialisiertes SPIFFS-Dateisystem. Dieses Paket enthält kein vorgebautes SPIFFS-Image. Beim ersten Wechsel von Meshtastic deshalb die Anleitung `docs/ERSTE_SCHRITTE.md` verwenden und einmal `uploadfs` ausführen. Ein Mountfehler formatiert den Speicher nicht automatisch. `uploadfs` löscht darin gespeicherte Identität und Verlauf; bei späteren Updates nicht erneut ausführen.

Zum sicheren Einstieg die PlatformIO-Schritte in der Anleitung verwenden; eine reine BIN-Übertragung ersetzt die Dateisysteminitialisierung nicht. Vor der Umstellung Meshtastic vollständig sichern. Keine reale Funkprüfung durchgeführt.
