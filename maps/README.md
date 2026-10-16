# Offline-Karte: Heimersheim und Versorgung bis Bad Neuenahr

Das detaillierte Paket enthält 6.843 reale OSM-Objekte und 90 daraus abgeleitete POIs: 6 Apotheken, 3 Feuerwehrstandorte, 24 medizinische Einrichtungen, 4 Wasserstellen sowie Lebensmittelgeschäfte, Toiletten und Unterstände. Stand der heruntergeladenen Daten siehe `fetchedAt` in der Datei, falls vorhanden. Das ist keine Bestätigung aktueller Öffnung oder Verfügbarkeit.

Quelle: © OpenStreetMap contributors, https://www.openstreetmap.org/copyright. Lizenz: ODbL 1.0; vollständiger Text in `ODbL-1.0.txt`.

Abruf über `https://api.openstreetmap.org/api/0.6/map?bbox=7.12,50.535,7.19,50.555`. Das Paket ist geometrisch an diese Grenzen zugeschnitten. `viewBounds` startet bei Heimersheim/Heppingen/Green; die weiteren Daten erlauben das Einpassen medizinischer Versorgung im benachbarten Bad Neuenahr. Das ist der Detailausschnitt, nicht die Talübersicht.

## Weitere Abschnitte ab 0.7.2

Straßen, Gewässer, Ortsnamen und Versorgung, ohne Gebäudegrundrisse. Vor einem Ausfall auf das Handy laden. Die tägliche Automatik hilft nur bei geöffneter App und Internet.

| Datei | Orte in den Daten | Ungefähr |
|---|---|---|
| `ahrtal.geojson` | Ahr von Blankenheim bis zur Mündung, ohne Gebäude | 0,9 MB |
| `altenahr.geojson` | Altenahr, Mayschoß, Rech | 0,9 MB |
| `dernau.geojson` | Dernau, Walporzheim, Ahrweiler | 1,3 MB |
| `heimersheim.geojson` | Heimersheim, Heppingen, Bad Neuenahr, mit Gebäuden | 2,4 MB |
| `sinzig.geojson` | Sinzig, Westum, Koisdorf | 0,7 MB |

Die Straßenpakete entstehen mit `python tools/osm_to_geojson.py ausgabe.geojson --skip-buildings --bbox WEST SOUTH EAST NORTH`. Die OSM-API lehnt dichte oder zu große Ausschnitte ab; dann kleinere Rechtecke laden und nach `osm_type`/`osm_id` zusammenführen. Altenahr, Dernau und Sinzig sind so am 16.10.2026 entstanden.

`ahrtal.geojson` ist die Übersicht vom 16.10.2026: ein Korridor entlang der Ahr, von der Quelle bei Blankenheim bis zur Mündung in den Rhein. Enthalten sind Straßen ab Anliegerstraße, die Ahr, benannte Bäche, Weinbergflächen als einzelne Ways, Ortsnamen und Versorgungs-POIs. Keine Gebäude. Multipolygon-Relationen sind nicht aufgelöst, deshalb fehlen Weinbergsflächen, die nur als Relation erfasst sind. Keine Routenberechnung. Einzelne Namen am Rand, etwa am Rhein, liegen knapp außerhalb des Talbodens.

Ortskontrolle: Heimersheim, OSM-Node 1542385875, liegt in `heimersheim.geojson` bei 7.1761142 / 50.5425546. Das frühere Paket war irrtümlich als Heimersheim bezeichnet, enthielt aber den Ortskern Bad Neuenahr. Dieses Paket ersetzt sowohl die falsche Zuordnung als auch die weit herausragenden Flussgeometrien.

## Aufbereiten

`tools/osm_to_geojson.py` übernimmt Straßen, Gebäude, Gewässer und Versorgungs-POIs von Nodes und Ways. Es speichert OSM-Objekttyp und -ID zur Quellenverknüpfung. Für Gebäude-POIs legt der Zuschnitt einen repräsentativen Punkt innerhalb der Geometrie an.

Für den Zuschnitt auf einem Entwicklungsrechner: `python -m pip install shapely==2.1.2`, dann `python tools/clip_map.py input.geojson output.geojson --bbox 7.12 50.535 7.19 50.555`. Shapely ist nur für die Datenvorbereitung nötig, nicht für Firmware, Browser oder normale Tests.

Die Datei bleibt nach dem Download auf dem Handy. Sie ist nicht in der ESP32-Apppartition eingebettet und wird nicht über LoRa übertragen. Der Browserrenderer benötigt keine Online-Kacheln. Quelle, ODbL-Attribution, Datenstand und OSM-Verknüpfungen bleiben erhalten.

## Grenzen

Quellen und Brunnen ohne bestätigte OSM-Trinkwasserangabe werden als Trinkbarkeit unbekannt angezeigt. Auch ein als Trinkwasser erfasster Punkt ist keine aktuelle Wasserqualitätsbestätigung. Arztpraxen, Kliniken und Feuerwehrhäuser werden nicht als ständig besetzte Notfallversorgung dargestellt. Der Konverter löst komplexe OSM-Multipolygon-Relationen weiterhin nicht auf; das Paket ist keine Navigation oder Befahrbarkeitsfreigabe.
