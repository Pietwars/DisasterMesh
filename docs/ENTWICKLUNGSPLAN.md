# Funktionslücken und konkrete Lösungswege

Stand 0.9.0-alpha · 16. Oktober 2026. Größere Ausbaustufen unter der Tabelle sind Entwürfe oder schon gebaute Stufen, keine Hardwarefreigabe.

**Ausnahme 0.8.0:** Auf ausdrücklichen Wunsch von Peter Müller (Pietwars) wurden vor der Hardware-Abnahme Oberfläche (Startbild, Ahrtal-Bezug, Schnellmeldungen) und Standortfunktion erweitert. Die folgende Reihenfolge gilt unverändert weiter; 0.8.0 ist keine Hardwarefreigabe.

Nächster Schritt ist nicht die nächste Oberfläche. Zuerst zwei echte T3-S3-Boards, dann der Repeater, dann das Schwarze Brett über Ausschalten und Neustart, dann ein echtes iPhone. Solange das offen ist, keine weiteren POI-Arten.

| Bedarf | Stand | Abnahmekriterium |
|---|---|---|
| Mehr Reichweite | Repeater-Profil gebaut, Funkabnahme offen | A und B kommunizieren nachweislich über C; ohne C ist die Teststrecke unterbrochen |
| Meldungen für später eintreffende Nutzer | Room-Profil, 32 Beiträge, Anmeldung; reale Abnahme offen | B ist offline, A veröffentlicht, B liest später genau einmal |
| Private Nachrichten bei Abwesenheit | Absender-Warteschlange mit vier Versuchen. Zwischenknoten-Postfach fehlt bewusst | Neustart, Ablauf, Dublette und verlorene Bestätigung |
| Größerer Verlauf | Optionales SD-Profil, zwei Segmente; Hardwarelast offen | Volle oder fehlende Karte und Stromausfall unterbrechen den Funk nicht |
| Position und Offlinekarte | Heimersheim mit Gebäuden; ab 0.7.2 zusätzlich Altenahr, Dernau/Ahrweiler, Sinzig und die Talübersicht Quelle–Mündung, jeweils ohne Gebäude. Ab 0.8.0 Positionsmeldung `!DP1` (Ortsliste, Karte, Handy-Ortung nur mit HTTPS) und optionales GPS-Modul (`disaster_t3s3_sx1262_wifi_gps`). Siehe `GPS_UND_STANDORT.md` | Karte ohne Internet nutzbar; kein Karteninhalt über LoRa; Pakete vor dem Ausfall auf dem Handy; GPS-Modul liefert Fix am echten Board |
| Hilfemeldungen | Vorlage `!DM1`. Ab 0.7.2 zeigt das Brett aktuelle Hilfe vor Angebot und dem übrigen Verlauf. Keine Funkpriorität | Veraltete Meldungen erkennbar; Unicode und 100-Byte-Grenze |
| Zugangsrechte | Admin für Funk, Kanäle, Name, Verlauf löschen. Chat-Identität bleibt gemeinsam | Nicht angemeldeter Client ändert Funkparameter nicht |
| Funklast | Internes Airtime-Budget plus ab 0.7.2 Handy-Budget (15 s, 6/10 min). Nicht gemessen, kein Konformitätsnachweis | Mehrere Clients und 24 Stunden, reproduzierbare Messwerte |
| Strom | SoftAP und `setInhibitSleep` lassen den Knoten wach. Nicht gemessen. Siehe `STROM_UND_SCHLAF.md` | mA und Stunden an einer bekannten Powerbank, bevor jemand das Netz darauf verlässt |
| iPhone | Oberfläche vorbereitet, echte Abnahme offen. Siehe `IOS_REALITAET.md` | Safari am Board-WLAN, Home-Bildschirm, Karte bleibt nach einem Tag |

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

## Ab 0.4 umgesetzt

- Room-Server mit eigenem Profil und Prüfsummenjournal.
- Portal-Beitritt ohne Passwort (Gäste nur lesen), Schreiben mit Betreiber-Schreibrecht und native Nachlieferung neuer Beiträge.
- Signed-Room-Decoder und lokale Dublettenvermeidung.
- Meldungsvorlagen mit manueller Position und Ablaufanzeige.

## Ab 0.5 umgesetzt

- Begrenzte private Offline-Aufträge auf dem eingeschalteten Absender mit ACK-Stop und Neustartwiederaufnahme.
- Optionales SD-Archiv mit Rotation und Download.
- Echte Offline-Vektorkarte mit lokalem Kartenpaket, Touchbedienung und Browserablage.
- Hersteller-Pinbelegung für T3 V1.6 übernommen und separate SPI-Busse für SD/LoRa.

## Reihenfolge

Zuerst zwei reale Boards und die neuen ACK-Anzeigen testen. Danach ein drittes Board als getrennten Repeater validieren. Anschließend das implementierte Schwarze Brett mit Ausschalt-/Neustarttests validieren. Das weiterführende private Zwischenknoten-Postfach benötigt weiterhin ein festgelegtes Protokoll, Speicherbudget und eine Duplikatstrategie. Die Absender-Warteschlange von 0.5 ist davon unabhängig. So bleiben Versprechen über Zustellung überprüfbar.
