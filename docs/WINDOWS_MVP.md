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
   Funklast protokollieren. Gerätediagnose und Budget-Momentaufnahme sind im Portal verfügbar. Ein expliziter Budgetaufschub-Status ist noch offen.

MeshCore enthält bereits ein Airtime-Budget in `src/Dispatcher.cpp`. Dessen wirksame
Konfiguration und Messwerte müssen geprüft werden; die Portalpause allein genügt nicht.
Hardwaretests und die Erfassung konkreter Budgetaufschübe sind offene Aufgaben, keine durch diesen
Windows-Einstieg erledigten Prüfungen. CI prüft künftig Windows separat; der bestehende
Linux-Workflow und die vier Profile bleiben erhalten.

## Gerätediagnose im Portal

Unter **Gerät → Gerätediagnose** erscheinen Firmwareversion, Laufzeit seit Boot,
ESP32-Neustartgrund, freier und minimaler Heap, größter freier Heapblock,
WLAN-Clientanzahl, TX/RX-Paketzähler und Funkzeiten in Millisekunden sowie das interne
MeshCore-TX-Budget. Die Laufzeit nutzt den 64-Bit-ESP32-Timer und springt nicht nach
49 Tagen wie `millis()` um. Die Paketzähler enthalten Steuerverkehr und sind keine
Zählung erfolgreich zugestellter Chatnachrichten. 32-Bit-Funkzähler können überlaufen.

**Diagnose als JSON speichern** exportiert eine Momentaufnahme ohne Nachrichten,
Kontakte oder Schlüssel. Der Exportzeitpunkt stammt vom Browser. Für den Langzeittest die automatische Aufzeichnung unten nutzen und Messzeiten im Abnahmeprotokoll festhalten. Bei Verbindungsverlust
werden die Anzeige als nicht aktuell markiert und der Export gesperrt. Ältere Firmware
ohne Diagnosefelder wird unterstützt und zeigt einen entsprechenden Hinweis.

Das angezeigte TX-Budget ist kein Nachweis für eingehaltene Sendezeitvorgaben. Es zeigt
auch nicht, ob ein bestimmtes Paket gerade auf Budget wartet. Ein vollständiges Protokoll
solcher Wartezustände bleibt ein weiterer Entwicklungsschritt.

## Automatische Aufzeichnung auf Windows

Der Windows-PC muss mit dem WLAN **des zu prüfenden Boards** verbunden bleiben.
Die Diagnose-Firmware aus dieser Änderung muss installiert sein. Der Recorder liest
nur `/api/state`; er sendet weder Nachrichten noch Konfigurationsbefehle. Neben dem
Windows-PC kann ein Handy als zweiter WLAN-Client genutzt werden. Zwei Boards mit
getrennten WLANs benötigen für gleichzeitige Aufzeichnung je einen verbundenen PC
bzw. eine bewusst eingerichtete zusätzliche Netzwerkschnittstelle.

Zunächst eine Minute als Verbindungstest, anschließend 24 Stunden:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\windows\DisAHRsterRadio.ps1 -Action Record -DurationSeconds 60 -IntervalSeconds 10
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\windows\DisAHRsterRadio.ps1 -Action Record
```

Ohne weitere Angaben wird alle 60 Sekunden gelesen und eine neue Datei
`test-results/diagnostics-DATUM-UHRZEIT.jsonl` angelegt. Vorhandene Dateien werden
nicht überschrieben. Eigener Dateiname: `-OutputFile test-results/board-A.jsonl`;
der übergeordnete Ordner muss existieren. Der Recorder umgeht System-Proxys.

Jede Zeile ist ein JSON-Objekt: `start`, `sample`, `unavailable` oder `summary`.
API-Ausfälle und ungültige Antworten werden als `unavailable` erfasst; der Recorder
versucht beim nächsten Intervall erneut zu lesen. Nachrichten, Kontakte,
Passwörter und HTTP-Fehlertexte werden nicht gespeichert. Fehlende Messwerte sind
`null`, nicht Nullmessungen. `recordedAt` stammt von der PC-Uhr; die Aufzeichnungsdauer
verwendet eine monotone Uhr. Standby des PCs deaktivieren und für stabile Versorgung sorgen.

`uptimeDecreased` kennzeichnet eine gegenüber der letzten gültigen Messung gesunkene
Gerätelaufzeit. Das ist ein Neustarthinweis, keine vollständige Neustartzählung:
Neustarts während Messlücken oder zwischen zwei Abfragen können unerkannt bleiben.
Funkzähler und ACKs müssen weiterhin mit den eigentlichen Chatversuchen verglichen werden.

Ctrl+C beendet die Aufzeichnung mit Zusammenfassung, soweit der Python-Prozess geordnet
beendet wird. Code 0 bedeutet vollständige Aufnahme ohne Abfragefehler, Code 2
Messlücken/Abbruch, Code 1 einen lokalen Start-/Dateifehler. Der PowerShell-Aufruf
meldet Nichtnullcodes als Fehler; Details stehen in der JSONL-Datei. Ein erfolgreicher
Recorder-Lauf allein ist keine Hardwarefreigabe. Bei Prozessabbruch kann die letzte
Zeile bzw. Zusammenfassung fehlen. Lokale Aufzeichnungen bleiben in `test-results/`
und werden nicht ins Repository übernommen.
