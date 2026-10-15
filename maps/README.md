# Reale Offline-Kartendaten · Heimersheim

`heimersheim.geojson` enthält 1.984 reale OSM-Objekte: Straßen/Wege, Gewässer, einfache Flächen, Gebäude und Ortsnamen, soweit im Export vorhanden. Keine erfundenen Straßendaten, keine Positionsmarkierung einer Privatadresse.

Quelle: © OpenStreetMap contributors, https://www.openstreetmap.org/copyright

Lizenz: Open Database License 1.0 (ODbL), vollständiger Text in `ODbL-1.0.txt`.

Abruf: 15. Oktober 2026 über `https://api.openstreetmap.org/api/0.6/map?bbox=7.13,50.54,7.15,50.55`. OSM-Ways können über die angefragte Box hinausreichen. Verarbeitung: `tools/osm_to_geojson.py`, Auswahl unterstützter Geometrien und Umwandlung nach GeoJSON. Die Attribution steht auch in der Datei und wird im Portal angezeigt.

Die Kartendaten sind eine Momentaufnahme, keine Navigations- oder Befahrbarkeitsfreigabe. Der einfache Konverter löst komplexe OSM-Multipolygon-Relationen nicht auf. Für bessere Daten eigene kompatible GeoJSON-Pakete importieren.

## Auf dem Handy verwenden

Datei aus GitHub herunterladen bzw. ZIP-Artefakt `disahrsterradio-offline-map-heimersheim` entpacken und die GeoJSON-Datei in der Dateien-App ablegen. Im Board-WLAN im Portal „Echte Offlinekarte“ öffnen und Datei importieren. Nach erfolgreicher Browser-Speicherung funktioniert sie auch nach Neuladen ohne Internet. Browserdaten nicht löschen; Speicherung kann vom Betriebssystem wieder freigegeben werden, daher Quelldatei aufbewahren.

Die Datei wird nicht in die begrenzte ESP32-Apppartition eingebettet. Sie verbleibt auf dem Handy. Es gibt keine Online-Tile-Anfragen. Andere Regionen lassen sich auf einem verbundenen Windows-PC mit dem dokumentierten Konverter vorbereiten.
