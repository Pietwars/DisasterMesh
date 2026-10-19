# @PREFIX@ für @BOARD@

MeshCore-Companion mit der Weboberfläche MeshAhrtal (WLAN) · Version @VERSION@ · Commit @COMMIT@ · @REPO@

> ⚠️ Kein zertifiziertes Notrufsystem. In Lebensgefahr immer **112** wählen. Vorabversion, auf echter Hardware **nicht abgenommen** (Stand siehe README).

## 1. Zuerst die Antenne!

**Antenne anschrauben, bevor das Board Strom bekommt.**

## 2. Erstinstallation

1. Board per USB-Datenkabel anschließen, Chrome oder Edge am PC/Mac.
2. https://espressif.github.io/esptool-js/ öffnen, **Connect**, Port wählen.
   - T-Deck Plus: Wird kein Port gefunden, den **Trackball** gedrückt halten und einschalten (bzw. Reset), dann loslassen.
   - T-Watch S3: USB-C neu einstecken; bei ausgeschalteter Uhr kurz die Seitentaste drücken.
3. Optional **Erase Flash**.
4. Flash Address **`0x0`**, Datei `@PREFIX@-@ZIP@-factory.bin`, **Program**.
5. Danach **RST** drücken.

Enthalten: Bootloader (@BOOT@), Partitionen (0x8000), boot_app0 (0xe000), Firmware mit Weboberfläche (0x10000), SPIFFS-Dateisystem (@FSOFF@).

Das Display zeigt nur das DisAHRsterRadio-Bild, eine Akkuzeile und den Knopf **„Advert senden“** (Flood-Advert: T-Deck Plus Trackball 2,5 s drücken, T-Watch S3 Knopf antippen oder Seitentaste lang). Kurz drücken schaltet das Display an/aus. Nachrichten und Einstellungen laufen über die Weboberfläche.

## 3. Verbinden

Am Handy das offene WLAN `DisAHRsterRadio-XXXXXX` auswählen und verbinden (höchstens 4 Handys, nichts eingeben). Bei „Kein Internet“ verbunden bleiben, dann `http://192.168.4.1` öffnen. Achtung: offenes, unverschlüsseltes WLAN – jede Person in Reichweite kann mitlesen und senden.

Nur für Betreiber: Die Admin-Zugangsdaten für den Admin-Bereich (Knotenname, Kanäle, Funkprofil) erscheinen einmalig beim ersten Start seriell mit **115200** Baud (esptool-js → Disconnect → Console, **RST** drücken) – notieren. Neu erzeugen: BOOT-Taste 10 s halten (T-Deck Plus: Trackball; dabei wird nach 2,5 s auch ein Advert gesendet. T-Watch S3 hat dafür keine Taste).

## 4. Update (nur Firmware)

**Nur `teile/firmware.bin` an `0x10000`** flashen. **Nicht** die factory-Datei: sie überschreibt das SPIFFS mit Schlüssel (Knotenidentität), Kontakten und Verlauf.

## 5. Prüfsummen

`SHA256SUMS` – Linux/Mac `sha256sum -c SHA256SUMS`, Windows `certutil -hashfile Datei SHA256`.

| Datei | Adresse |
|---|---|
| factory.bin | 0x0 |
| teile/bootloader.bin | @BOOT@ |
| teile/partitions.bin | 0x8000 |
| teile/boot_app0.bin | 0xe000 |
| teile/firmware.bin | 0x10000 |
| teile/spiffs.bin | @FSOFF@ |

Hinweis: Beim Umstieg von einer Version mit anderer Partitionstabelle **einmal komplett mit der factory-Datei** flashen.

MeshCore © Scott Powell / rippleradios.com u. a. (MIT). Karten © OpenStreetMap-Mitwirkende (ODbL).
