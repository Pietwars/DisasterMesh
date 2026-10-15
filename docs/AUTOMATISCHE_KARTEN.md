# Automatische Offlinekarte und essbare Landschaft

Dieser Ausbau ergänzt die bestehende Weboberfläche. Er ist noch nicht auf einem echten iPhone/Board abgenommen. Er übernimmt keine Funktionen oder Daten aus der nativen MeshCore-App.

## Auf dem Handy

1. In der Karte **Heimersheim herunterladen** wählen oder den Schalter **Bei Internetverbindung automatisch laden / täglich aktualisieren** einschalten.
2. Der Automatikschalter wird erst nach erfolgreicher Speicherung dauerhaft übernommen. Der Paketdownload prüft den tatsächlichen Internetzugang, nicht nur die WLAN-Verbindung.
3. Erst nach vollständigem Download, GeoJSON-Prüfung und erfolgreicher IndexedDB-Transaktion erscheint „vollständig auf diesem Handy gespeichert“. Karte und Zeitstempel werden gemeinsam geschrieben. Bei Fehlern bleibt das letzte gespeicherte Paket erhalten.
4. Automatik: beim Öffnen, bei Rückkehr in die App, bei einem `online`-Ereignis und alle 60 Sekunden prüfen. Erfolgreich geladene Pakete höchstens einmal täglich laden. Nach einem Fehler frühestens nach 60 Sekunden erneut versuchen, bei neuem `online`-Ereignis sofort. Downloadgrenze 5 MB, Zeitlimit 20 Sekunden, nur ein laufender Download.
5. Nach erfolgreicher Speicherung lässt sich dieselbe Karte unter derselben Adresse ohne Internet laden. Die Weboberfläche muss weiterhin vom Board erreichbar sein. Das Board-WLAN selbst stellt keinen Internetzugang bereit. Gleichzeitige Mobilfunknutzung ist abhängig von iOS und Netzwahl und hier nicht am Gerät getestet.

Aktuell ist **ein reales Paket Heimersheim** (ca. 0,7 MB) enthalten, keine automatische weltweite Kartenversorgung. Quelle: `maps/heimersheim.geojson` aus diesem Repository, Download per HTTPS von `raw.githubusercontent.com`. Die im GeoJSON enthaltenen OpenStreetMap-/ODbL-Hinweise bleiben erhalten. Es werden keine öffentlichen OSM-Kachelserver massenhaft abgefragt. Es gibt keinen Download bei geschlossener App und keine automatische Standortübermittlung. Mobile Daten können beim aktivierten Download verbraucht werden.

Eine selbst importierte Karte wird nicht automatisch durch Heimersheim ersetzt. Erst ein ausdrücklich gestarteter Heimersheim-Download wechselt wieder zum Paket. Die Automatik ist anfangs aus und lässt sich einmalig aktivieren. Der Kartenimport ist während eines Downloads gesperrt.

## Speicherung und Adressen

IndexedDB `DisasterMesh-maps`, Version 1, bestehender Store `maps`:

- `active`: bisheriges GeoJSON-Format, weiterhin lesbar.
- `download-meta`: Paketkennung und erfolgreicher Speicherzeitpunkt; bei Dateiimport gelöscht bzw. auf `null` gesetzt.
- `auto-download`: dauerhaft gespeicherter Automatikschalter.
- `harvest`: unabhängige Fundortsammlung.

Browser-Speicherung gehört zur jeweiligen Adresse und zum Browserprofil. Eine HTTPS-Demo und `http://192.168.4.1` teilen keinen Speicher. **Karte exportieren** und am Board über den bestehenden Import laden, wenn das Handy nur außerhalb des Board-WLANs Internetzugang hat. Fundorte haben einen eigenen Export/Import. Browserdatenlöschung und automatische Speicherbereinigung können lokale Daten entfernen; Exporte dienen zur Sicherung. Karten sind nicht automatisch im Flash des Boards oder per Funk verfügbar.

## Fundorte wie auf einer Erntekarte

Eigene Einträge mit Name, Koordinaten, Kategorie (Obst, Nüsse, Beeren, Kräuter), Erntemonaten und Zugangshinweis speichern. Filter nach Kategorie und eingetragenem Erntemonat. Monatsbereiche über den Jahreswechsel werden unterstützt. Erntezeit ist eine eigene Angabe, keine aktuelle Reifemeldung. Gelbe Marker erscheinen auf der geladenen Karte; **Auf Karte zeigen** zentriert einen Eintrag. Löschen entfernt den Eintrag aus der lokalen Sammlung.

Bis zu 1.000 Fundorte, Import bis 1 MB. Import ersetzt die gesamte lokale Sammlung erst nach vollständiger Validierung und erfolgreicher Speicherung. Vorher exportieren, um die alte Sammlung zu behalten. GeoJSON: `FeatureCollection` mit `Point`-Features und Properties `name`, `category`, `from`, `to`, optional `notes`, `source`, `license`. Quellen-/Lizenzangaben bleiben bei Export erhalten. Eigene Einträge werden nicht veröffentlicht oder per Funk gesendet.

**Keine direkte Mundraub-Datenanbindung:** Der Link öffnet die originale Karte separat. Kein Mundraub-Login, kein Upload und kein automatischer Datenabruf. Dieser Ausbau liefert vergleichbare lokale Fundortfunktionen. Ein unterstützter, überprüfter Abrufweg zur Mundraub-Datenbank ist noch offen.

## Prüfung und noch offene Abnahme

`npm test`: Projekttests plus Validierung und Integration mit emulierter IndexedDB: erfolgreicher Download, tägliche Begrenzung, Netz-/JSON-/Größenfehler, parallele Aufrufe, Transaktionsabbruch, Erhalt der vorherigen Karte, Neustart ohne Internet, Fundorte/Filter und Schutz vor HTML-Injektion.

`npm run test:browser`: bestehende Portal-/Demotests plus `tests/maps.browser.cjs`, mit simuliertem Paketserver. Prüft zusätzlich mobile Breiten und erzeugt `test-results/maps-iphone.png`. Die Simulation beweist keinen Internetzugang im realen Board-WLAN.

Echte Abnahme: iPhone mit Board verbinden, Paket über tatsächlich vorhandenen Internetzugang laden, Automatik aktivieren, Verbindung unterbrechen und wiederherstellen, App neu öffnen, Karte/Fundorte prüfen. Zusätzlich Download mit Mobilfunk aus und unterbrochenem Internet, Speicherfehler und Export/Import zwischen Online-Adresse und Board testen. Kein erfolgreicher Hardwaretest wird durch diese Softwareprüfungen behauptet.
