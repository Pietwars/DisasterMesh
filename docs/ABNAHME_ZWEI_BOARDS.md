# Lokales Abnahmeprotokoll · Zwei-Board-MVP

Status: **NICHT AUSGEFÜHRT**. Vorlage lokal kopieren. Keine Zugangsdaten eintragen.

| Feld | Wert |
|---|---|
| Datum / Prüfer | |
| Git-Commit / Windows-Version | |
| Python / Node / g++ / PlatformIO | |
| Vollständiger Check / Logpfad | |
| Automatische Diagnoseaufzeichnung / Dateipfad / Messlücken | |
| Board A / B: Revision, Flashgröße, Resetpin geprüft | |
| Antennen, Versorgung, Abstand, Standorte | |
| Profil | disaster_t3s3_sx1262_wifi (für A/B mit bestätigtem SX1262) |
| Frequenz / BW / SF / CR / Leistung | |
| Browser / Geräte | |

Je Fall: bestanden, fehlgeschlagen oder nicht geprüft; Log-/Fotoverweis und Abweichung angeben.

| Fall | Soll | Ergebnis / Beleg |
|---|---|---|
| Start A/B | OLED, WLAN, Portal; unterschiedliche Zugangsdaten | |
| Kanal A→B / B→A | Je 10 eindeutige Texte vollständig empfangen | |
| DM A→B / B→A | Je 10 Texte; tatsächlicher Empfang und ACK separat belegt | |
| ACK fehlt / Kanalchat | Keine fälschlich bestätigte Zustellung | |
| UTF-8 | 100-Byte-Grenze; längere Texte blockiert | |
| Empfänger offline → online | Auftrag überlebt, richtiger ACK stoppt Wiederholung | |
| Absenderneustart | Zähler erhalten; ohne Uhrfreigabe kein Wiederholungsversand | |
| Acht aktive Aufträge / neunter | Grenze eingehalten, Ablehnung sichtbar | |
| Ablauf / Abbruch / vier Versuche | Keine weiteren Versuche nach jeweiligem Ende | |
| Wiederholung / ACK-Verlust | Keine zusätzliche Portal-Darstellung desselben privaten Textes mit gleicher Identität/Zeit | |
| Mehr als 96 Ereignisse | Ring begrenzt, neueste gültige Ereignisse erhalten | |
| App-Update ohne uploadfs | Identität, Admin-Zugang, Kontakte, Verlauf und Aufträge erhalten; WLAN offen | |
| Stromunterbrechung während Schreiben | Kein ungültiger Datensatz angezeigt; möglicher Verlust dokumentiert | |
| 24 Stunden / zwei WLAN-Clients | Keine ungeplanten Neustarts; Heap-, Funk- und Fehlerverlauf erfasst | |

## Langzeitmessung

Messintervall, Werkzeug und verfügbare Diagnosefelder festhalten. Fehlende Messwerte nicht
als Null interpretieren. Geräteseite und Windows-Recorder liefern Momentaufnahmen; Budgetwartephasen, Warteereignisse und Funkwarteschlange sind implementiert; ihre tatsächliche Erfassung am Board ist noch zu prüfen. Recorder-Zusammenfassung und jede Messlücke dem Protokoll beilegen.

| Zeitpunkt | Heap | Laufzeit / Reset | gesendet / empfangen / ACK | Budgetaufschub / Fehler |
|---|---|---|---|---|
| Start | | | | |
| 1 h | | | | |
| 6 h | | | | |
| 12 h | | | | |
| 24 h | | | | |

Freigabe: offen. Nicht geprüfte Pflichtfälle verhindern die MVP-Freigabe.
