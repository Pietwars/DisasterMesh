# Funktionslücken und konkrete Lösungswege

Stand 0.3 · 15. Oktober 2026. Die folgenden größeren Ausbaustufen sind Entwürfe, keine bereits freigeschalteten Funktionen.

| Bedarf | Funktionaler Lösungsweg | Abnahmekriterium |
|---|---|---|
| Mehr Reichweite | Separates TTGO mit dem mitgelieferten MeshCore-Repeaterprofil; identische Funkparameter. Der Portal-Knoten bleibt Companion. Eigenes Profil `disaster_ttgo_repeater` und getrenntes Actions-Artefakt sind ab 0.3 ergänzt; Funkabnahme steht aus. | A und B kommunizieren nachweislich über C; ohne C ist die Teststrecke unterbrochen. |
| Meldungen für später eintreffende Nutzer | Zuerst vorhandene MeshCore-Room-Server-Funktionen im vendorten Quellstand prüfen; Anmeldung, Abrufcursor, Kapazität und Rechte für ein Schwarzes Brett abbilden. Room-Server ist eine eigene Rolle und ersetzt nicht automatisch die Zustellung privater Nachrichten. | B ist offline, A veröffentlicht, B verbindet sich später und liest genau einmal. |
| Private Nachrichten bei Abwesenheit | Explizite Anwendung mit Nachrichten-ID, Empfänger, Ablaufzeit und Bestätigung entwerfen. Begrenzte Warteschlange und Wiederholungsbudget; keine unkontrollierten Wiederholungen. Erst Interoperabilität und Funklast prüfen. | Neustart, abgelaufene Meldung, Dublette und verloren gegangene Bestätigung korrekt behandeln. |
| Größerer Verlauf | SD-Pinbelegung und Buskonflikte am TTGO zuerst prüfen; append-only Journal mit Rotation und Aufbewahrungsgrenze. Bis dahin begrenzter Flashring plus JSON-Export. | Volle/fehlende Karte und Stromausfall unterbrechen den Funkbetrieb nicht. |
| Position und Offlinekarte | Zunächst manuelle Positionen. Handy-Geolocation auf lokalem HTTP ist nicht zuverlässig verfügbar; GPS-Modul braucht geprüfte freie Pins. Kartenmaterial lokal auf SD oder Handy, über WLAN verteilen. | Karte ohne Internet nutzbar; kein Karten- oder Dateiinhalt über LoRa. |
| Hilfemeldungen | Strukturierte Vorlage mit Ort, Bedarf, Zeit und Ablaufdatum; normaler Versand mit sichtbarem Zustellstatus. Keine Notrufleitstellenanbindung und keine garantierte Priorität behaupten. | Veraltete Meldungen erkennbar, Unicode und Payloadgrenze eingehalten. |
| Zugangsrechte | Admin-Konfiguration vom öffentlichen Chat trennen; erst Authentifizierung, Sitzungen und physische Wiederherstellung entwerfen. Aktuell besitzen alle WLAN-Teilnehmer gemeinsame Rechte. | Nicht angemeldeter Client kann Funkparameter und Kanäle nicht ändern. |
| Funklast und Dauerbetrieb | Tatsächliche Airtime erfassen, daraus ein begrenztes Sendebudget bilden. Die bestehende 5-Sekunden-Pause ist kein Airtime-Limit. Heap, Stromaufnahme und Neustarts messen. | Mehrere WLAN-Clients und 24 Stunden Betrieb, reproduzierbare Messwerte. |

## Bereits in 0.2 umgesetzt

- ACK-Zuordnung für eindeutige gespeicherte Direktnachrichten.
- Suche im lokalen Verlauf und JSON-Export.
- Kein doppelter HTTP-Sendeauftrag während einer laufenden Anfrage.
- Kein versehentliches Löschen neu eingegebener Texte nach Abschluss einer älteren Anfrage.
- Leere Texte und veralteter Onlinezustand aktivieren den Sendeknopf nicht mehr.

## Ab 0.3 umgesetzt

- Eigenes Repeater-Profil für TTGO V2.1_1.6 mit 10-dBm-Ausgangswert.
- Individuelle Admin-Zugangsdaten, deaktiviertes WLAN-OTA, kein automatisches Formatieren bei Mountfehlern.
- Separate Buildartefakte und Windows-Anleitung inklusive Drei-Board-Test.

## Reihenfolge

Zuerst zwei reale Boards und die neuen ACK-Anzeigen testen. Danach ein drittes Board als getrennten Repeater validieren. Anschließend ein Schwarzes Brett mit abrufbarem Verlauf ausarbeiten. Private Store-and-forward-Zustellung folgt erst mit festgelegtem Protokoll, Speicherbudget und Duplikatstrategie. So bleiben Versprechen über Zustellung überprüfbar.
