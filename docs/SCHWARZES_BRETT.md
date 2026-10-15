# Schwarzes Brett, nachträglicher Abruf und Meldungsvorlagen · 0.4

## Was zusammenkommt

| Rolle | Profil | Funktion |
|---|---|---|
| A/B · WLAN-Zugänge | `disaster_ttgo_wifi` | Kanalchat, Direktnachrichten, Anmeldung am Schwarzen Brett, Beiträge schreiben/lesen |
| C · optionaler Repeater | `disaster_ttgo_repeater` | Funkstrecke erweitern |
| D · Schwarzes Brett | `disaster_ttgo_room` | Gemeinsame Beiträge speichern und angemeldeten Teilnehmern nachliefern |

Für einen direkten Versuch reichen A, B und D; C benötigt ein weiteres Board. Jeder TTGO bekommt genau ein Profil. D ist weder WLANportal noch automatisch ein zusätzlicher Repeater. Die eigene Portaloberfläche zeigt Raumkontakte mit dem Präfix „Schwarzes Brett“ an.

## D unter Windows einrichten

Boardtyp weiterhin TTGO LoRa32 V2.1_1.6 mit SX1276/868 MHz. Bestehendes Meshtastic sichern, passende Antenne anschließen. PowerShell im Projektordner, `COM5` ersetzen:

```powershell
py -3.12 -m pip install platformio==6.2.0
py -3.12 -m platformio run -j 2 -d firmware/MeshCore -e disaster_ttgo_room -t upload --upload-port COM5
py -3.12 -m platformio run -j 2 -d firmware/MeshCore -e disaster_ttgo_room -t uploadfs --upload-port COM5
py -3.12 -m platformio device monitor --port COM5 --baud 115200 --eol CR
```

`uploadfs` löscht Identität, Einstellungen, ACLs und das Journal. Nur für Erstinstallation bzw. bewussten Rollenwechsel verwenden. Für Updates derselben Rolle nur `upload`. Beim Mountfehler wird nicht automatisch formatiert.

RESET drücken. Über USB erscheinen zwei unterschiedliche, geräteindividuelle Zugangsdaten: Admin-Passwort und Raum-Passwort für Lesen/Schreiben. Für die normale Portal-Anmeldung **nur das Raum-Passwort** verwenden. Passwörter werden nicht auf GitHub gespeichert. Bestehende eigene Werte bleiben erhalten; die leeren beziehungsweise alten Standardwerte `password`/`hello` werden ersetzt. Unangemeldetes Mitlesen ist im eigenen Room-Profil deaktiviert. Teilnehmer des gemeinsamen Raum-Passworts können alle Raumbeiträge lesen und schreiben; getrennte Benutzerkonten bestehen nicht.

Einzeln in der USB-Konsole senden:

```text
set name Heimersheim-Brett
set radio 869.618,62.5,8,5
set tx 10
reboot
```

Projekt-Ausgangswerte, keine automatische Anpassung an ein fremdes Netz. Mit A/B abgleichen. Danach aktuelle UTC-Zeit in Unix-Sekunden setzen; in PowerShell beispielsweise mit `[DateTimeOffset]::UtcNow.ToUnixTimeSeconds()` ermitteln und das Ergebnis nach `time ` eingeben:

```text
time 1792020000
advert
```

**Die Zahl im Beispiel nicht als aktuelle Uhrzeit übernehmen.** Nach Stromausfall die reale UTC-Uhr erneut prüfen. Beim Laden des Journals setzt die Firmware eine zu alte Uhr mindestens hinter den letzten Beitragszeitstempel, damit neue Abrufcursor weiter voranschreiten. Das ersetzt keine RTC oder echte UTC-Synchronisation.

Eigenes Buildartefakt: `disastermesh-ttgo-room-testbuild`. Es enthält App, zusammengeführtes Firmware-Image und separates SPIFFS-Image. Die Firmwaredateien unter `dist/` bleiben der alte Portalstand 0.1.

## Im Portal anmelden und veröffentlichen

1. A und B auf 0.4 aktualisieren, ihre Dateisysteme beim reinen Update erhalten.
2. D per `advert` bekanntgeben. Im Portal Kontakte neu lesen; bei Bedarf erneut bekanntgeben. Raumkontakt muss bekannt sein, bevor die Anmeldung möglich ist. Auf beiden Seiten gleiche Funkparameter.
3. „Schwarzes Brett: Heimersheim-Brett“ als Ziel wählen, Raum-Passwort eingeben und anmelden. Der Portaladapter setzt zuerst die Handy-Uhr im Companion, dann sendet er den MeshCore-Login. Das Passwort wird nicht im Nachrichtenjournal gespeichert.
4. Auf „Angemeldet · Lesen und Schreiben“ warten. Eine angenommene HTTP-Anfrage allein ist noch keine Anmeldung. Keine Antwort nach 45 Sekunden: Funk, Passwort, Uhr und Bekanntgabe prüfen, dann manuell erneut versuchen.
5. Beiträge mit dem normalen Sendefeld veröffentlichen. „Empfang bestätigt“ bedeutet ACK des Room-Servers; es garantiert weder Empfang bei allen Teilnehmern noch einen erfolgreichen Flash-Schreibzugriff.
6. Später erneut anmelden: MeshCore übermittelt den gespeicherten Abrufcursor. Der Server liefert verfügbare neuere Beiträge anderer Autoren nach und verwendet seine vorhandenen ACK-/Wiederholungsmechanismen. Es gibt kein unbeschränktes Archiv und keinen manuellen Cursor-Rücksetzknopf.

Nach einem Neustart des Room-Servers bei Bedarf erneut anmelden, da normale Teilnehmer-Sitzungen nicht dauerhaft gespeichert werden. Browser im selben Board-WLAN teilen die Companion-Identität, den Abrufcursor und die Raumanmeldung. Je Zugangsknoten wird hier nur eine aktive Raumanmeldung verwaltet. Native MeshCore-Clients bleiben über das unveränderte Funkprotokoll kompatibel; deren tatsächliches Zusammenspiel ist noch zu testen.

## Meldungsvorlagen

„Hilfe, Angebot oder Info vorbereiten“ öffnen. Ort/Treffpunkt, Bedarf/Hinweis und Gültigkeit ausfüllen; Koordinaten nur bei Bedarf manuell angeben. „Als Nachricht vorbereiten“ setzt einen kompakten Text ins normale Sendefeld. Ziel kontrollieren und bewusst senden.

Format: `!DM1|H/A/I|Ablauf-Unixzeit|Breite,Länge oder -|Ort|Text`. Fremde Clients können diesen Klartext lesen. Das Portal erkennt das Format, zeigt Typ und Ablaufzeit an und markiert abgelaufene Meldungen. Es löscht oder priorisiert sie nicht automatisch. Ort/Text dürfen keine `|`, Nullzeichen oder Zeilenumbrüche enthalten; insgesamt maximal 100 UTF-8-Bytes. Länge und Koordinaten werden vor der Vorbereitung geprüft. Ablaufdarstellung hängt von der Handy-Uhr ab.

Koordinaten sind Teil der versendeten Meldung. Es gibt keine GPS-Erfassung, keine Kartenkacheln und keine angeblich garantierte Notrufzustellung. Das lokale Portal und die Vorlagen benötigen kein Internet.

## Speicherung und Grenzen

- D hält maximal 32 Beiträge im RAM und in `/dr-room.bin`: 32 feste Datensätze à 196 Byte, insgesamt maximal 6.272 Byte Journalinhalt.
- Jeder Datensatz enthält Sequenz, Serverzeit, Autoren-Public-Key, Text und FNV-Prüfsumme. Keine Verschlüsselung im Flash. Älteste Einträge werden überschrieben.
- Beschädigte oder unvollständige Datensätze werden beim Booten übersprungen. Der zuletzt geschriebene Beitrag oder bei Dateisystemschäden weitere Daten können verloren gehen; ACK ist keine Dauerhaftigkeitsgarantie. Schreibfehler werden über USB gemeldet.
- A/B behalten weiterhin ihren eigenen 96-Ereignis-Verlauf. Der JSON-Export exportiert diesen lokalen Verlauf, nicht das gesamte Serverjournal. Eigene Raumbeiträge werden vom Server nicht an denselben Autor zurückgespiegelt; sie bleiben im lokalen Sendeverlauf sichtbar.
- Wiederholte identische Room-Beiträge mit gleichem Server, Autorpräfix, Zeitstempel und Text werden in der Browseranzeige zusammengefasst. Das ist keine globale Exactly-once-Zusage.
- Nachträglicher Abruf betrifft gemeinsame Raumbeiträge. Ab 0.5 gibt es private Absender-Zustellaufträge, ein optionales SD-Archiv und echte Offline-Vektorkarten; siehe `OFFLINE_SD_KARTEN.md`. Ein privates Zwischenknoten-Postfach bei ausgeschaltetem Absender, große Dateien über Funk und Portal-Adminrollen bleiben offen.

## Abnahme am Gerät

- [ ] Drei Boards: Bekanntgabe, Raumanmeldung, falsches Passwort, Beitrag A → D → B.
- [ ] B ausschalten, A schreibt neue Beiträge, B einschalten und anmelden: verfügbare neue Beiträge erscheinen.
- [ ] D neu starten: Journal, Identität und Passwörter bleiben erhalten; A/B können sich neu anmelden.
- [ ] Mehr als 32 Beiträge: älteste Beiträge verschwinden, Speicher bleibt begrenzt.
- [ ] Stromunterbrechung während Schreiben und Flashfehler untersuchen.
- [ ] Wiederholte Anmeldung erzeugt keine sichtbaren Dubletten vorhandener Room-Beiträge.
- [ ] Meldungsvorlage mit Umlauten, Koordinaten, ungültigen Werten und Ablauf testen.
- [ ] Mehrclientbetrieb und optionaler Repeater in der Strecke.

Diese Abnahme ist noch nicht durchgeführt. Softwaretests prüfen Decoder, Formularabläufe und Journalformat; sie ersetzen keine Funk- und Dauerbetriebsprüfung.
