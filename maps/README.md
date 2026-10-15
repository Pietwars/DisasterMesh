# Offline-Karte: Heimersheim und Versorgung bis Bad Neuenahr

Das Paket enthält 6.843 reale OSM-Objekte und 90 daraus abgeleitete POIs: 6 Apotheken, 3 Feuerwehrstandorte, 24 medizinische Einrichtungen, 4 Wasserstellen sowie Lebensmittelgeschäfte, Toiletten und Unterstände. Stand der heruntergeladenen Daten siehe `fetchedAt` in der Datei. Das ist keine Bestätigung aktueller Öffnung oder Verfügbarkeit.

Quelle: © OpenStreetMap contributors, https://www.openstreetmap.org/copyright. Lizenz: ODbL 1.0; vollständiger Text in `ODbL-1.0.txt`.

Abruf über `https://api.openstreetmap.org/api/0.6/map?bbox=7.12,50.535,7.19,50.555`. Das Paket ist geometrisch an diese Grenzen zugeschnitten. `viewBounds` startet bei Heimersheim/Heppingen/Green; die weiteren Daten erlauben das Einpassen medizinischer Versorgung im benachbarten Bad Neuenahr. Es ist kein vollständiges Ahrtal-Paket.

Ortskontrolle: Heimersheim, OSM-Node 1542385875, liegt in diesen Daten bei 7.1761142 / 50.5425546. Das frühere Paket war irrtümlich als Heimersheim bezeichnet, enthielt aber den Ortskern Bad Neuenahr. Dieses Paket ersetzt sowohl die falsche Zuordnung als auch die weit herausragenden Flussgeometrien.

## Aufbereiten

`tools/osm_to_geojson.py` übernimmt Straßen, Gebäude, Gewässer und Versorgungs-POIs von Nodes und Ways. Es speichert OSM-Objekttyp und -ID zur Quellenverknüpfung. Für Gebäude-POIs legt der Zuschnitt einen repräsentativen Punkt innerhalb der Geometrie an.

Für den Zuschnitt auf einem Entwicklungsrechner: `python -m pip install shapely==2.1.2`, dann `python tools/clip_map.py input.geojson output.geojson --bbox 7.12 50.535 7.19 50.555`. Shapely ist nur für die Datenvorbereitung nötig, nicht für Firmware, Browser oder normale Tests.

Die Datei bleibt nach dem Download auf dem Handy. Sie ist nicht in der ESP32-Apppartition eingebettet und wird nicht über LoRa übertragen. Der Browserrenderer benötigt keine Online-Kacheln. Quelle, ODbL-Attribution, Datenstand und OSM-Verknüpfungen bleiben erhalten.

## Grenzen

Quellen und Brunnen ohne bestätigte OSM-Trinkwasserangabe werden als Trinkbarkeit unbekannt angezeigt. Auch ein als Trinkwasser erfasster Punkt ist keine aktuelle Wasserqualitätsbestätigung. Arztpraxen, Kliniken und Feuerwehrhäuser werden nicht als ständig besetzte Notfallversorgung dargestellt. Der Konverter löst komplexe OSM-Multipolygon-Relationen weiterhin nicht auf; das Paket ist keine Navigation oder Befahrbarkeitsfreigabe.
