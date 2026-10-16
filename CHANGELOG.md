# Änderungen

## 0.8.0 · 16.10.2026

Auf ausdrücklichen Wunsch von Peter Müller vor der Hardware-Abnahme umgesetzt (Ausnahme vom Entwicklungsplan). Keine Hardwarefreigabe.

- Neues Startbild „DisAHRsterRadio · MeshCore-Funknetz fürs Ahrtal“ aus dem Originalfoto (© Pietwars): Mesh-Knoten über Ort und Hügeln, stilisierte Funkwellen. Lokales WebP (ca. 30 KB); das eingebettete Portal wird dadurch rund 50 KB kleiner.
- Ahrtal-Leiste mit dem Flusslauf von Schuld bis Sinzig, Hinweis „Notruf 112“ und ein kurzer Gedenktext zur Flut im Juli 2021.
- Größere Schaltflächen (mind. 52 px, Navigation 60 px), Grundschrift 17 px.
- Schnellmeldungen auf dem Brett: Trinkwasser, Strom/Laden, Medikamente, Verletzt, Evakuierung, „Mir geht es gut“, Hilfe anbieten, Strom vorhanden. Dazu eine Ortsliste, die Ort und ungefähre Koordinaten einträgt.
- Standort teilen: Ortsliste, Karte antippen, Handy-Ortung (nur in sicherem Kontext) oder GPS-Modul am Board. Kompakte Meldung `!DP1` (≈ 35 Byte) mit Genauigkeit grob/mittel/fein, nur auf Knopfdruck, höchstens alle 5 Minuten. Empfangene Positionen erscheinen mit Alter auf der Karte und als lesbare Zeile im Chat.
- Optionales Firmwareprofil `disaster_t3s3_sx1262_wifi_gps` für ein externes NMEA-GPS an GPIO 43/44 (MeshCore `ENV_INCLUDE_GPS`). `/api/state` meldet `gps:{enabled,fix,lat,lon}`. Advert ohne Position.
- Neuer CI-Build für das GPS-Profil. Neue Tests für `!DP1`, Ortsliste, Standort- und Schnellmeldungs-Oberfläche.
- Befund und Anschluss: `docs/GPS_UND_STANDORT.md`.

## 0.7.2 · 16.10.2026

Aufräumen, keine neue Hardwarefreigabe. Die alten TTGO-BINs aus `dist/` sind entfernt; Firmware kommt nur noch aus den Actions-Artefakten oder einem eigenen Build. Öffentlicher Name bleibt DisAHRsterRadio. MeshAhrtal ist die Oberfläche, DisasterMesh der Repository-Name.

- Verlauf im Flash lässt sich im Adminbereich löschen. Er ist unverschlüsselt; Schlüssel und SD-Archiv bleiben.
- Jedes Handy darf höchstens alle 15 Sekunden und höchstens sechsmal in zehn Minuten senden. Das geräteweite Minimum von fünf Sekunden bleibt.
- Optionaler Name an diesem Handy steht vor normalen Nachrichten, nicht vor `!DM1`-Meldungen.
- Auf dem Schwarzen Brett stehen aktuelle Hilfen über Angeboten und dem übrigen Verlauf. Das ist eine Anzeige, keine Funkpriorität.
- Kanalnamen und Schlüssel lassen sich als Kopierzeile auf das zweite Board übertragen. Nicht über Funk schicken.
- Kartenpakete: Heimersheim (mit Gebäuden) plus Altenahr/Mayschoß/Rech, Dernau/Ahrweiler und Sinzig ohne Gebäude. Dazu die Übersicht `ahrtal.geojson` von Blankenheim bis zur Mündung, ohne Gebäude. Vor dem Ausfall laden; die Automatik braucht Internet.
- Architektur und Entwicklungsplan beschreiben SX1262, die Admin-Trennung und den offenen Zwei-Board-Test. iPhone- und Stromgrenzen stehen in eigenen Seiten.

Weiterhin Entwicklungsprototyp. Zwei echte Boards, Repeater, Room über Neustart und ein echtes iPhone sind nicht abgenommen.

## 0.7.1.1 · 15.10.2026

Karten-/POI-Korrektur: falsche Ortszuordnung (Bad Neuenahr statt Heimersheim) behoben, korrektes Regionalpaket mit 90 OSM-Alltags-POIs und medizinischer Versorgung in der Umgebung. Eigene POIs mit Kartenwahl, Bearbeitung, Löschung, Speicherung und GeoJSON-Sicherung ergänzt. Keine Mundraub-Anbindung. Heimersheim-Geometrien auf den Regionalausschnitt begrenzt; alte Kartenspeicher anhand von Straßen und Gebäuden eingepasst. Straßenhierarchie, Wege, Gebäude, Gewässer, kollisionsarme Beschriftung, Nordhinweis und dynamischer Maßstab ergänzt. Paketrevision löst bei aktivierter Automatik eine einmalige Aktualisierung des alten Kartenpakets aus.

- MeshAhrtal-Gestaltung mit dunklen Waldgrüntönen, hellgrünen Bedienelementen und dezentem Funknetzmotiv.
- Originales Ahrtal-Nachtfoto ohne Schrift lokal im Kopfbereich; kein externer Bildabruf.
- Mobile Navigation, Adminbereich und Kartenansicht an das Thema angepasst.
- Desktop-/iPhone-/Admin-/Karten-Vorschau und Demo aktualisiert.
- Firmware und sichtbare Version 0.7.1.1. npm verwendet die gültige SemVer-Schreibweise `0.7.1-1`; `disahrsterradioVersion` trägt die Anzeigeversion.

## 0.7.1 · 15.10.2026

- Heimersheim-Kartenpaket direkt auf dem Handy herunterladen und dauerhaft im Browser speichern.
- Optional bei geöffneter App täglich aktualisieren; bei wiederkehrender Internetverbindung erneut versuchen. Downloads bleiben auf 5 MB und 20 Sekunden begrenzt.
- Karte und Zeitstempel atomar speichern. Fehler erhalten die bisherige Karte, manuell importierte Karten werden nicht automatisch ersetzt.
- Eigene Obst-, Nuss-, Beeren- und Kräuterfundorte mit Kartenmarkern, Erntemonaten, Kategorien-/Saisonfiltern und GeoJSON-Import/Export.
- Geprüftes Startpaket mit aktueller Demo, Heimersheim-Karte, Anleitungen, Prüfsummen und passenden SX1262-Windows-Downloads.
- Versionsanzeige in Firmware, Oberfläche, Demo und npm auf 0.7.1 vereinheitlicht; veraltete Dokumentationsangaben korrigiert.

Weiterhin Entwicklungsprototyp: Hardware-/iPhone-Abnahme offen. Aktuell ein regionales Kartenpaket, Automatik nur bei geöffneter App. Keine direkte Mundraub-Datenanbindung. Appupdates derselben Rolle erhalten das Dateisystem; kein `uploadfs` bei bestehenden Knoten.

## 0.7

Ahrtal-Oberfläche, iPhone-Home-Bildschirm-Zugang, separater Geräte-Adminbereich und auswählbare Deutschland-Funkprofile für die unterstützte 868-MHz-Hardware.
