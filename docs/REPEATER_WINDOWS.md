# Drittes TTGO als Repeater · Windows

Stand 0.3. Ziel: LILYGO TTGO LoRa32 V2.1_1.6, 868-MHz-Ausführung, ESP32/SX1276. Reale Hardwaretests stehen aus.

## Rollen

| Board | Buildprofil | Aufgabe |
|---|---|---|
| A | `disaster_ttgo_wifi` | Handy per WLAN, Nachrichten senden/empfangen |
| B | `disaster_ttgo_wifi` | Zweiter Zugang für die Gegenstelle |
| C | `disaster_ttgo_repeater` | MeshCore-Pakete weiterleiten, separates Gerät |

C hat kein DisAHRsterRadio-WLANportal und keine Chatoberfläche. Die Einrichtung erfolgt hier über USB-Serial. Native MeshCore-Fernverwaltung bleibt im Repeater-Quellstand enthalten; das Portal bietet dafür noch keine Bedienung. Ein Repeater speichert keine privaten Nachrichten für später abwesende Empfänger.

## 1. Sichern und installieren

Nur C anschließen, passende Antenne montieren. Vor dem Ersetzen von Meshtastic dessen Einstellungen und optional den gesamten Flash gemäß `ERSTE_SCHRITTE.md` sichern. Python 3.12 und USB-Datenkabel verwenden. Im Geräte-Manager den COM-Port ermitteln. `COM5` unten ersetzen.

PowerShell im aktuellen Projektordner öffnen:

```powershell
py -3.12 -m pip install platformio==6.2.0
py -3.12 -m platformio run -j 2 -d firmware/MeshCore -e disaster_ttgo_repeater -t upload --upload-port COM5
py -3.12 -m platformio run -j 2 -d firmware/MeshCore -e disaster_ttgo_repeater -t uploadfs --upload-port COM5
```

**`uploadfs` nur bei der Erstinstallation bzw. beim bewussten Rollenwechsel verwenden.** Es löscht gespeicherte Identität, Einstellungen und ACLs im Dateisystem. Auch beim Wechsel vom Portal zum Repeater Dateisystem neu initialisieren; die Rollen verwenden unterschiedliche Einstellungen. Bei späteren Updates derselben Rolle nur `-t upload` ausführen.

Bis zur Erstinitialisierung kann `SPIFFS mount failed` erscheinen. Nach `uploadfs` RESET drücken. Ein späterer Mountfehler führt absichtlich zu keinem automatischen Formatieren.

Das separate GitHub-Artefakt `disahrsterradio-ttgo-repeater-testbuild` enthält App, zusammengeführtes Firmware-Image und SPIFFS-Image. Es gehört ausschließlich zu Rolle C. Das zusammengeführte Image enthält das Dateisystem nicht. Die obigen PlatformIO-Schritte übernehmen die passenden Adressen.

## 2. USB-Konsole und Einstellungen

```powershell
py -3.12 -m platformio device monitor --port COM5 --baud 115200 --eol CR
```

Danach RESET drücken. Beim Start erscheinen Repeater-ID und ein **14-stelliges Admin-Passwort**. Es wird auf dem Board erzeugt und mit den Repeater-Einstellungen gespeichert. Es ist kein WLAN-Passwort. Beim nächsten Boot bleibt es erhalten; vor Ort prüfen. Ein vorhandenes eigenes Passwort bleibt bestehen, ein leerer Wert oder das alte Standardpasswort `password` wird ersetzt. Zugangsdaten lokal aufbewahren und nicht ins Repository übernehmen.

Befehle einzeln eingeben und jeweils mit Enter senden:

```text
get name
get radio
get tx
set name Heimersheim-Repeater-01
set radio 869.618,62.5,8,8
set tx 10
reboot
```

`get` zeigt gespeicherte Werte. Nach `set radio` ist der Neustart erforderlich. Die Werte sind die Projekt-Ausgangswerte und müssen zu A/B sowie zum Einsatz passen. Bereits vorhandene Einstellungen werden durch einen Firmwareupload nicht automatisch auf diese Werte zurückgesetzt.

Danach erneut kontrollieren:

```text
get name
get radio
get tx
advert
stats-core
stats-radio
stats-packets
```

Der Repeater übernimmt den bekannten MeshCore-Funkstack; er braucht die privaten Kanalschlüssel von A/B nicht zum Weiterleiten. A und B brauchen untereinander weiterhin denselben Kanalnamen/Schlüssel. Keine Bridge- oder OTA-Funktion wird für dieses eigene Repeater-Profil aktiviert.

## 3. Drei-Board-Abnahme

1. Zunächst A und B ohne C direkt testen: Kanalchat und Direktnachricht samt Empfangsbestätigung.
2. Alle drei mit gleicher Frequenz, Bandbreite, SF und CR betreiben; C zunächst wenige Meter entfernt platzieren. Auf A/B neue Bekanntgaben senden.
3. Kanalnachrichten mit eindeutigen Texten wie `Test 01 A-B` senden, dann in Gegenrichtung. Empfang am anderen Portal prüfen; reine Annahme durch den Funkkern reicht nicht.
4. A/B so platzieren, dass die direkte Verbindung nicht mehr zuverlässig funktioniert, C an einem geeigneten Zwischenstandort betreiben.
5. Bei unveränderten Standorten mehrfach C aus-/einschalten und jeweils neue Nachrichten testen. Allein eine steigende Paketstatistik belegt noch nicht, dass die A/B-Nachricht über C ging. Für einen belastbaren Nachweis Vergleichsversuche und gegebenenfalls Paketlogs verwenden.
6. Direktnachrichten einschließlich ACK testen; Portal zeigt nur eindeutig zugeordnete Bestätigungen als empfangen an.
7. C neu starten: Name, Radioeinstellungen, Identität und Passwort müssen gleich bleiben. Danach mindestens einen längeren Mehrclient-Test durchführen.

## Noch offen

Reale Funkprüfung, geeigneter Standort, Stromaufnahme, Reichweite und Dauerbetrieb. Adminbedienung im Portal, eigenes Room-Server-Profil und Schwarzes Brett folgen separat. Getrennte Rollen nicht auf ein einzelnes Board zusammenflashen.
