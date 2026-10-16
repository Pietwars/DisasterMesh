# Alltagskarte und eigene POIs

Die Karte arbeitet ohne Mundraub-Anbindung. Die Basis stammt aus OpenStreetMap und wird als regionales GeoJSON-Paket im Browser gespeichert. Sie startet bei **Heimersheim**, OSM-Ortspunkt 1542385875 bei 7.1761142 / 50.5425546. Das frühere Paket zeigte irrtümlich Bad Neuenahr; die Ortszuordnung ist jetzt ausdrücklich getestet.

## Kartenbild

Straßen, Wege, Gebäude, Gewässer und Ortsnamen werden unterschiedlich dargestellt. Beschriftungen werden auf Überlappung geprüft. Norden liegt oben; der Maßstab unten links berücksichtigt Zoom und geografische Breite. Lange Flüsse können den Startausschnitt nicht mehr auf einen entfernten Ortskern verkleinern.

Das Paket enthält **Heimersheim mit Umgebung und Versorgungsdaten bis Bad Neuenahr**, nicht das gesamte Ahrtal. Die Talübersicht liegt getrennt in `maps/ahrtal.geojson`. Alle Geometrien dieses Detailpakets sind auf 7.12 / 50.535 / 7.19 / 50.555 zugeschnitten. Der kleinere Startausschnitt steht in `viewBounds`. Über „Gefilterte POIs einpassen“ lässt sich die Umgebung für eine Kategorie anzeigen.

## Bereits eingetragene Versorgungsorte

90 aus dem Paket abgeleitete OSM-POIs: 6 Apotheken, 3 Feuerwehrstandorte, 24 medizinische Einrichtungen, 4 Wasserstellen, 18 Lebensmittelgeschäfte, 9 Toiletten und 26 Unterstände. Die Auswahl zeigt anfangs wichtige Versorgung und eigene POIs; weitere Alltagskategorien können gefiltert werden.

| Kennzeichen | Kategorie | Wichtige Grenze |
|---|---|---|
| W | Wasser / Quelle | Unbekannte Trinkbarkeit ist keine Trinkwasserfreigabe. Auch OSM-„Trinkwasser“ ist nicht aktuell vor Ort geprüft. |
| A | Apotheke | Öffnungs- und Notdienstzeiten sind nicht live bestätigt. |
| F | Feuerwehr | Ein Gebäude ist keine Zusage einer ständig besetzten Anlaufstelle. |
| + | Medizinische Einrichtung | Arztpraxis, Fach-/Rehaklinik und Krankenhaus sind keine gleichwertige Notfallversorgung; Fachrichtung und Eintrag prüfen. |
| E / WC / S / P | Lebensmittel / Toiletten / Unterstand / sonstiger Ort | Zugang und Verfügbarkeit sind ebenfalls ungeprüft. |

Marker antippen, Einträge durchsuchen oder in der Liste öffnen. Details enthalten erfasste Adresse, Zugang, Öffnungszeiten, Fachrichtung, Telefon und OSM-Quellenlink, soweit vorhanden. Leere Kategorien bedeuten nur, dass keine passenden Einträge in diesen Daten erfasst sind. Die App bietet keine Einsatzübersicht oder verlässliches Notdienstverzeichnis.

## Eigene POIs

„Position auf Karte wählen“ aktivieren und tippen, oder Koordinaten eingeben. Name, Kategorie, Wasserangabe und Hinweis speichern. Eigene Einträge lassen sich bearbeiten und löschen. Karten-POIs bleiben getrennt und können nicht versehentlich aus der OSM-Datensammlung gelöscht werden.

Eigene POIs und Exporte enthalten gegebenenfalls private Standortdaten und sind nicht verschlüsselt. Dateien nicht unbedacht weitergeben.

Eigene POIs liegen unter `pois` im bestehenden IndexedDB-Store `maps`. Es gibt keinen Upload und keine Übertragung über Funk. Export enthält ausschließlich eigene POIs. Import ersetzt die eigene Sammlung erst nach erfolgreicher Prüfung und Speicherung: GeoJSON FeatureCollection mit Point-Features, maximal 1.000 Einträge / 1 MB. Bestehende private Nachrichten und optionale Erntefundorte bleiben unverändert.

Quellen-/Lizenzangaben importierter eigener Einträge werden erhalten. Die Speicherung gilt für den jeweiligen Browser und die jeweilige Adresse. Browserdatenlöschung kann sie entfernen; deshalb exportieren.

## Bestehende Installationen

Die geänderte Paketrevision veranlasst bei eingeschalteter Kartenautomatik eine einmalige Aktualisierung des alten Pakets, sobald die App offen ist und Internet hat. Alternativ „Heimersheim herunterladen“ verwenden. Eigene importierte Karten werden weiterhin nicht ungefragt überschrieben.

Die Oberfläche ist in der Anwendung eingebettet. Für ein bestehendes Board derselben Rolle nur die Anwendung aktualisieren, kein `uploadfs`. Anschließend das Kartenpaket neu laden. Neue Funktionen sind per Softwaretests geprüft; Hardware-/iPhone-Abnahme bleibt offen.
