# Windows-Einstieg und Abnahme für den nächsten MVP

Ziel: Version 0.7, derzeit Entwicklungsarbeit auf Basis 0.6. Noch keine Hardwarefreigabe.
Geltungsbereich: zwei TTGO LoRa32 V2.1_1.6 mit SX1276, Standardprofil
`disaster_ttgo_wifi`, ohne SD, Room oder Repeater.

## Vorbereitung unter Windows 11

- Git, Python 3.12 mit Python Launcher und Node.js 22 installieren.
- Für die nativen Tests MSYS2 installieren. In dessen **MINGW64**-Terminal
  `pacman -S --needed mingw-w64-x86_64-gcc` ausführen.
- `C:\msys64\mingw64\bin` zum Benutzer-PATH hinzufügen (bei anderem Installationsort anpassen).
  Neues PowerShell-Fenster öffnen; `g++ --version`, `node --version`, `py -3.12 --version`
  und `git --version` müssen funktionieren.
- Projekt in einen kurzen lokalen Pfad wie `C:\src\DisasterMesh` klonen.
  Erster Setup-, Browser- und Toolchain-Download benötigt Internet.

PowerShell im Projektordner; Skripte können ohne Änderung der dauerhaften Ausführungsrichtlinie
in einem eigenen Prozess gestartet werden:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\windows\DisAHRsterRadio.ps1 -Action Setup
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\windows\DisAHRsterRadio.ps1 -Action Check
```

Setup erstellt eine lokale `.venv` mit PlatformIO 6.2.0. Check installiert die fixierten
npm-Abhängigkeiten, führt JS-, Python-, alle vier C++- und Chromium-Tests aus,
bettet die Oberfläche als UTF-8 ein und baut App, zusammengeführtes Image und SPIFFS.
Check flasht kein Gerät. Der erste Fehler beendet den Lauf mit Fehlercode.
`test-results/check.json` und `check.log` enthalten Ergebnis und übersprungene Schritte;
die BIN-Prüfsummen liegen im Buildordner als `SHA256SUMS.txt`.
Erfolgreiche Softwareprüfung bedeutet keine bestandene Hardwareabnahme.

Für schnelle Softwareprüfungen ohne Firmware/Browser, nach Setup:

```powershell
.\.venv\Scripts\python.exe tools/check.py --skip-firmware --skip-browser
```

Ein solcher Lauf ersetzt den vollständigen Check nicht. Bei einem Prüfsummenvergleich
müssen alle Dateien aus demselben Build stammen.

## Erstinstallation und Update

Vorbereitung und lokales Meshtastic-Backup nach `ERSTE_SCHRITTE.md` durchführen.
Boardrevision und Resetpin vor Ort prüfen. Nur ein Board anschließen, tatsächlichen
COM-Port im Geräte-Manager bestimmen, Monitor schließen, passende Antenne montieren.

**Install ist ausschließlich der erste Wechsel auf dieses Profil.** Es führt `uploadfs`
aus und ersetzt gespeicherte Identität, Kontakte und Verlauf. Update derselben Rolle
verwendet ausschließlich App-Upload. Beide Aktionen bauen die eingebettete Oberfläche neu.

```powershell
# Nur Erstinstallation; COM5 ist ein Beispiel!
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\windows\DisAHRsterRadio.ps1 -Action Install -Port COM5

# Spätere Aktualisierung derselben Portalrolle:
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\windows\DisAHRsterRadio.ps1 -Action Update -Port COM5

# Nach Installation RESET drücken, dann WLAN-Zugangsdaten lokal ablesen:
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\windows\DisAHRsterRadio.ps1 -Action Monitor -Port COM5
```

Ein Mountfehler wird nicht automatisch repariert oder formatiert. Erstinstallation
kann bis zum Dateisystem-Upload einen Mountfehler anzeigen. App-/Merged-Images ersetzen
kein SPIFFS-Image. Alte `dist/`-BINs sind Version 0.1 und gehören nicht zu dieser Abnahme.

## Freigabebedingungen

Das Protokoll in `ABNAHME_ZWEI_BOARDS.md` lokal kopieren und ausfüllen. Keine Passwörter,
privaten Schlüssel, Flashbackups oder privaten Nachrichten in Git einchecken.

1. Vollständiger Windows-Check mit Commit und Werkzeugversionen erfolgreich.
2. Zehn Kanal- und zehn Direktnachrichten pro Richtung im festgehaltenen Nahbereich;
   Empfang und ACK getrennt protokollieren, keine falsche Bestätigung.
3. Warteschlange: Empfänger offline/online, Neustart mit Uhrfreigabe, acht Slots,
   Ablauf, Abbruch und vier Versuche geprüft. Fehlendes ACK beweist keinen Empfangsausfall.
4. Update und Neustart erhalten Identität, Zugangsdaten, Kontakte und gültigen Verlauf.
5. 24-Stunden-Test mit zwei WLAN-Clients, ohne ungeplanten Neustart; Speicher und
   Funklast protokollieren. Diagnose und sichtbarer Budgetaufschub sind noch zu ergänzen.

MeshCore enthält bereits ein Airtime-Budget in `src/Dispatcher.cpp`. Dessen wirksame
Konfiguration und Messwerte müssen geprüft werden; die Portalpause allein genügt nicht.
Hardwaretests und die noch fehlende Diagnose sind offene Aufgaben, keine durch diesen
Windows-Einstieg erledigten Prüfungen. CI prüft künftig Windows separat; der bestehende
Linux-Workflow und die vier Profile bleiben erhalten.
