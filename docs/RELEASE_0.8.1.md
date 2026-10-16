# DisAHRsterRadio 0.8.1 · Stabilisierung

Entwicklungsprototyp, keine Hardwarefreigabe. Echte Boards, Funkreichweite, GPS, Stromversorgung und iPhone-Abnahme stehen aus.

- Neue Standortmeldungen `!DP2` tragen eine zufällige, separat gespeicherte Browserkennung. Gleiche Anzeigenamen werden nicht mehr zusammengeführt; die Kennung ist kein authentifizierter Identitätsnachweis.
- Alte `!DP1`-Meldungen bleiben lesbar und werden mangels eindeutiger Kennung getrennt angezeigt. Empfänger vor 0.8.1 zeigen neue `!DP2`-Meldungen als Text; für Kartenanzeige beide Portale aktualisieren.
- Die fünfminütige Standort-Sendepause wird vor dem Sendeversuch gespeichert und überlebt Neuladen. Auch bei unklarer/fehlgeschlagener Antwort bleibt sie erhalten; bei gesperrtem oder beschädigtem Speicher wird nicht gesendet. Löschen des Browserspeichers oder ein anderer Browser kann diese lokale Begrenzung zurücksetzen; sie ist keine Sicherheits- oder Funkregulierungsgrenze.
- Demo und Startpaket enthalten denselben geprüften Laufzeitstand 0.8.1. Das Startpaket enthält alle fünf Kartenpakete, Anleitungen, Vorschauen und geprüfte Firmwarelinks. Firmware-BINs werden separat geladen; GPS bleibt eine gesonderte ungeprüfte Hardwareoption.
- Release-Erstellung prüft Versionsgleichheit, Quellstand, erfolgreiche CI-Läufe, verfügbare Artefakte und ZIP-Prüfsummen. `SHA256SUMS.txt` und Prüfstand liegen als Release-Dateien bei.

ZIP vollständig entpacken: Startpaket über `START.html`, reine Demo über `index.html` öffnen. Demo-Adminpasswort: `DemoAdmin2026!`; kein echtes Board wird gesteuert. Bestehende Geräte derselben Rolle nur per App-Update aktualisieren, kein Dateisystem-Reset.

Große Kartenansicht, Favoriten und Mehrregionen-Speicherung sind nicht Teil dieser Stabilisierung. Ein Kartenimport/-download ersetzt weiterhin die aktive Karte; die fünf Dateien im Paket können separat aufbewahrt werden.
