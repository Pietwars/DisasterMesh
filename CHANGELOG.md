# Änderungen

## 0.7.2 · 16.10.2026

Aufräumen, keine neue Hardwarefreigabe. Die alten TTGO-BINs aus `dist/` sind entfernt; Firmware kommt nur noch aus den Actions-Artefakten oder einem eigenen Build. Öffentlicher Name bleibt DisAHRsterRadio. MeshAhrtal ist die Oberfläche, DisasterMesh der Repository-Name.

- Verlauf im Flash lässt sich im Adminbereich löschen. Er ist unverschlüsselt; Schlüssel und SD-Archiv bleiben.
- Jedes Handy darf höchstens alle 15 Sekunden und höchstens sechsmal in zehn Minuten senden. Das geräteweite Minimum von fünf Sekunden bleibt.
- Optionaler Name an diesem Handy steht vor normalen Nachrichten, nicht vor `!DM1`-Meldungen.
- Auf dem Schwarzen Brett stehen aktuelle Hilfen über Angeboten und dem übrigen Verlauf. Das ist eine Anzeige, keine Funkpriorität.
- Kanalnamen und Schlüssel lassen sich als Kopierzeile auf das zweite Board übertragen. Nicht über Funk schicken.
- Kartenpakete: Heimersheim (mit Gebäuden) plus Altenahr/Mayschoß/Rech, Dernau/Ahrweiler und Sinzig ohne Gebäude. Vor dem Ausfall laden; die Automatik braucht Internet.
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
