# Architektur und Grenzen

Browser → lokales HTTP (ESP32 SoftAP) → DisasterPortal → MeshCore Companion-Kommandos → MeshCore-Funkstack → SX1262 auf dem LILYGO T3-S3 V1.3 (Zielhardware) oder SX1276 auf den älteren TTGO-Profilen. Nicht die Firmware der einen Variante auf die andere flashen.

`DisasterPortal` implementiert `BaseSerialInterface` und wird als einzige Companion-Schnittstelle registriert. Die Standard-USB-Companion-Schnittstelle ist deaktiviert; USB-Serial bleibt für Diagnose und die initialen Admin-Zugangsdaten verfügbar. Das verhindert konkurrierende Companion-Sitzungen und ermöglicht eine konsistente Befehlszuordnung. BLE und WLAN-Stationbetrieb werden für dieses Profil nicht aktiviert.

## Protokoll

Die Schnittstelle handelt Companion-Appversion 3 aus. Sie initialisiert Selbstinformationen, bis zu acht Kanalnamen und bis zu 64 Kontakte und fragt dann die Offlinequeue ab. Neue Nachrichten werden unabhängig vom verbundenen Browser abgeholt und lokal gespeichert. Maximal ein Companion-Befehl ist gleichzeitig aktiv. Bei 15 Sekunden ohne Antwort wird der Status als unklar angezeigt; kein automatischer erneuter Versand bei normalen Sendeanfragen. Explizit angelegte Zustellaufträge ab 0.5 besitzen dagegen ein eigenes begrenztes Wiederholungsbudget.

Unterstützte HTTP-Aktionen sind explizit implementiert: Kanal-/Direktnachricht, Knotenname, Bekanntgabe, Kontaktliste, Zeit, Kanal und Funkparameter. Es gibt keinen rohen HTTP-Zugriff auf beliebige Companion-Kommandos. Insbesondere werden Kanalgeheimnisse und private Identitätsschlüssel nicht ausgelesen. Die eingelesenen Kanalantworten werden vor der Bereitstellung auf Index und Namen gekürzt.

## Speicherung

Die History liegt unter `/dr-history.bin` in SPIFFS, im Klartext. 96 Slots mit Sequenznummer, Frame-Länge, nullgefülltem Datenpuffer und FNV-1a-Prüfsumme erlauben begrenzten Speicherverbrauch und das Verwerfen beschädigter Einträge beim Booten. Ein Stromausfall kann den gerade geschriebenen Eintrag verlieren; keine Garantie gegen vollständige Dateisystembeschädigung. FNV dient der Fehlererkennung, nicht der Authentifizierung. Häufige Schreibzugriffe beanspruchen Flash; Ab 0.5 ergänzt das optionale SD-Profil den internen Ring um ein rotierendes Archiv. Ab 0.7.2 kann der Admin den internen Ring löschen (`POST /api/history-wipe`). Die Sequenznummer läuft weiter, Schlüssel und SD-Archiv bleiben. Wer das Board findet, liest den Verlauf.

## Lokaler Zugang

Das WLAN ist offen (`softAP(ssid, nullptr, 1, false, 4)`). Die SSID hat ein MAC-basiertes Suffix. Ein früher gespeicherter AP-Schlüssel wird beim Start entfernt; Adminzugang und Funkidentität bleiben unabhängig erhalten. Für Chat gibt es bewusst keine Vertrauensgrenze mehr: alle Teilnehmer senden als derselbe Funkknoten und lesen denselben Verlauf. Funkprofil, Kanäle, Knotenname und das Löschen des Verlaufs sind seit 0.3/0.7.2 an eine eigene Admin-Sitzung gebunden (15 Minuten, Header `X-Disaster-Admin`). HTTP ist lokal unverschlüsselt innerhalb dieses WLANs.

HTTP-API-Aufrufe benötigen einen benutzerdefinierten Header, zulässigen Hostnamen und haben kein CORS. HTML-Texte aus Funknachrichten werden über `textContent` ausgegeben. Ein kompromittierter WLAN-Teilnehmer bleibt innerhalb der gemeinsamen Vertrauensgrenze. Ab 0.7.2 begrenzt das Portal zusätzlich jedes Handy: höchstens eine Nachricht alle 15 Sekunden und sechs Nachrichten in zehn Minuten (`X-Disaster-Client`). Ohne gültige Client-Kennung teilen sich alte Seiten ein gemeinsames Budget. Das geräteweite 5-Sekunden-Minimum und das interne Airtime-Budget bleiben. Das ersetzt keinen messtechnischen Konformitätsnachweis und keine Priorisierung von Hilferufen im Funkprotokoll.

## Ursprüngliche Ausbaureihenfolge (Stand 0.1)

Mehrere dieser Punkte sind inzwischen implementiert; der aktuelle Status steht in `ENTWICKLUNGSPLAN.md` und den Abschnitten zu 0.2–0.5 unten.

1. Reale Boardtests und RAM-/Airtime-Messungen.
2. Zustellzeitlimits und aussagekräftige Fehlerereignisse. ACK-Zuordnung ist seit 0.2 implementiert.
3. SD-Verlauf und definierte Aufbewahrung.
4. Room-Server mit Schwarzem Brett, Zugriffsregeln und Ablaufdatum für Meldungen.
5. Echte Store-and-forward-Semantik mit Dublettenvermeidung und Ablaufzeiten.
6. Offlinekarte und Positionen, große Assets lokal über WLAN.

Ein nativer MeshCore-Repeater ist eine getrennte Rolle. Ab 0.3 baut `disaster_ttgo_repeater` den vorhandenen `simple_repeater` für das TTGO mit eigenen Vorgaben. WLAN-OTA und private Schlüsselübertragung sind in diesem Profil deaktiviert. Leeres bzw. bekanntes altes Admin-Standardpasswort wird nach dem Laden der Einstellungen durch einen zufälligen Wert ersetzt und gespeichert; eigene Passwörter bleiben erhalten. USB-Serial zeigt das aktuelle Passwort. Mountfehler stoppen das Gerät statt automatischer Formatierung. Die bisherigen Upstream-Profile behalten ihr Verhalten. Das Projekt ändert weder das MeshCore-Paketformat noch Meshtastic, und implementiert keine automatische Protokollbrücke zwischen beiden Netzen.

## Verlauf und ACKs ab 0.2

Lokaler Datensatz `0xf4`: bisheriger 13-Byte-Direktnachrichtenheader, dann der 4-Byte-ACK-Tag aus MeshCore `RESP_CODE_SENT[2:6]`, dann UTF-8-Text. `0xf2`/`0xf3` bleiben lesbar. Die Ringgröße und das Funkprotokoll ändern sich nicht. Ein vollständiges ACK-Ereignis (`0x82`, mindestens 9 Byte) wird nur zugeordnet, wenn genau eine gespeicherte eigene Nachricht denselben nichtleeren Tag besitzt und ihre Sequenznummer kleiner ist. Doppelte Bestätigungen sind idempotent. Bei Tag-Kollisionen, Ringverlust oder alten Datensätzen wird keine Zustellung behauptet.

Die Suche filtert den gewählten Kanal/Kontakt im Browser. Der JSON-Export enthält alle noch im Ring gespeicherten dekodierbaren Nachrichten und unzugeordneten Bestätigungen, einschließlich Klartext und Kontaktpräfixen. Er enthält keine privaten Schlüssel und ist keine Sicherung der Knotenidentität. Es gibt keinen Import und keine Garantie auf Vollständigkeit älterer Gespräche.

## Gebündelter Ausbau ab 0.4

`disaster_ttgo_room` baut den nativen Room-Server mit 32 Einträgen. Der zusätzliche Prüfsummenring enthält vollständige Public-Keys der Autoren, Serverzeit und Text. Die physische Ringposition folgt der Sequenz; beim Booten werden gültige Einträge des letzten Ringfensters geladen. Die Uhr wird nötigenfalls hinter den letzten gespeicherten Beitrag gesetzt, ohne damit korrekte UTC zu behaupten. Posts bleiben auch bei Schreibfehlern im RAM verwendbar; USB meldet den Verlust der Persistenzgarantie. Das Funkprotokoll und die native ACK-Semantik bleiben unverändert.

Portal-Login: bekannter Room-Kontakt → serialisiertes Setzen der Handyzeit → Login mit vollständigem Room-Public-Key und dem öffentlichen Gast-Passwort `hello` (Firmware-Konstante, kein Eingabefeld) → asynchrone Loginantwort mit ACL-Rechten. Passwörter gelangen nicht ins lokale Nachrichtenjournal. Aktuell eine aktive Raumanmeldung pro Board, von allen WLAN-Nutzern geteilt. Schreibrechte werden im Adapter und in der Oberfläche kontrolliert; der native Server ist weiterhin für seine ACL maßgeblich.

Room-Pushs enthalten einen zusätzlichen 4-Byte-Autorpräfix vor dem Text. Decoder berücksichtigt diesen Offset. Anzeige dedupliziert nach Server, Autorpräfix, Serverzeit und Text. Abrufcursor und ACK-Wiederholungen werden vom vorhandenen MeshCore-Stack verwaltet. Ein unbegrenztes Archiv oder eine private Store-and-forward-Queue wird nicht behauptet.

Meldungsvorlagen sind eine Klartext-Anwendungsschicht (`!DM1`), maximal 100 UTF-8-Bytes. Ablauf wird im Portal anhand der Handy-Uhr angezeigt, nicht im Room-Journal erzwungen. Manuelle Koordinaten sind keine Offlinekarte und kein GPS-Modul.

## Zustellaufträge, SD und Karte ab 0.5

`DeliveryOutbox` hält acht Zustellaufträge. Jede Zustandsänderung wird alternierend in zwei 171-Byte-Kopien pro Slot geschrieben und zurückgelesen; Revision und Prüfsumme wählen beim Booten die neuere gültige Kopie. Vor einem Sendeversuch wird dessen Zähler gespeichert. Der Scheduler wartet auf eine bestätigte lokale Uhr, freien Companion-Kanal und Sendepause, prüft vollständige Empfängeridentität und Chattyp und verwendet die nativen Attempt-Werte 0..3. Vor Wiederholungen wird der Pfad zurückgesetzt. In gespeicherten Aufträgen mehrdeutige ACK-Tags werden nicht zugeordnet. Ein ACK bestätigt nativen Empfang, keine genau-einmal-Zustellung. Lokale Klartextspeicherung und gemeinsame WLAN-Identität bleiben bestehen.

`ArchiveSd` ist nur im eigenen SD-Profil aktiv. LoRa verwendet im vendorten Target die Standard-HSPI-Instanz; SD bekommt eine explizite VSPI-Instanz mit den Herstellerpins 14/2/15/13. Eigene Profile überschreiben den falschen geerbten Radio-Reset14 mit GPIO23. Archiv rotiert zwei Segmente bis je 1 MiB; die API öffnet nur diese festen Dateinamen, keine beliebigen Pfade.

`web/map.js` enthält lokalen GeoJSON-Validator, Web-Mercator-Projektion, Canvas-Renderer, Gesten und IndexedDB-Ablage. Kartendaten bleiben im Browser; die große reale GeoJSON-Datei wird getrennt verteilt und niemals in `PortalPage.h` eingebettet. Nur Renderer und Bedienung werden eingebettet. Die Python-Vorbereitung nutzt die öffentliche OSM-API ausschließlich vorab am verbundenen PC.

