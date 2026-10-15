# Architektur und Grenzen

Browser → lokales HTTP (ESP32 SoftAP) → DisasterPortal → MeshCore Companion-Kommandos → MeshCore-Funkstack → SX1276.

`DisasterPortal` implementiert `BaseSerialInterface` und wird als einzige Companion-Schnittstelle registriert. Die Standard-USB-Companion-Schnittstelle ist deaktiviert; USB-Serial bleibt für Diagnose und das initiale WLAN-Passwort verfügbar. Das verhindert konkurrierende Companion-Sitzungen und ermöglicht eine konsistente Befehlszuordnung. BLE und WLAN-Stationbetrieb werden für dieses Profil nicht aktiviert.

## Protokoll

Die Schnittstelle handelt Companion-Appversion 3 aus. Sie initialisiert Selbstinformationen, bis zu acht Kanalnamen und bis zu 64 Kontakte und fragt dann die Offlinequeue ab. Neue Nachrichten werden unabhängig vom verbundenen Browser abgeholt und lokal gespeichert. Maximal ein Companion-Befehl ist gleichzeitig aktiv. Bei 15 Sekunden ohne Antwort wird der Status als unklar angezeigt; kein automatischer erneuter Versand.

Unterstützte HTTP-Aktionen sind explizit implementiert: Kanal-/Direktnachricht, Knotenname, Bekanntgabe, Kontaktliste, Zeit, Kanal und Funkparameter. Es gibt keinen rohen HTTP-Zugriff auf beliebige Companion-Kommandos. Insbesondere werden Kanalgeheimnisse und private Identitätsschlüssel nicht ausgelesen. Die eingelesenen Kanalantworten werden vor der Bereitstellung auf Index und Namen gekürzt.

## Speicherung

Die History liegt unter `/dr-history.bin` in SPIFFS. 96 Slots mit Sequenznummer, Frame-Länge, nullgefülltem Datenpuffer und FNV-1a-Prüfsumme erlauben begrenzten Speicherverbrauch und das Verwerfen beschädigter Einträge beim Booten. Ein Stromausfall kann den gerade geschriebenen Eintrag verlieren; keine Garantie gegen vollständige Dateisystembeschädigung. FNV dient der Fehlererkennung, nicht der Authentifizierung. Häufige Schreibzugriffe beanspruchen Flash; SD-Speicherung ist für einen späteren Ausbau vorgesehen.

## Lokaler Zugang

Pro Gerät wird ein 16-stelliges zufälliges WLAN-Passwort in NVS gespeichert. Die SSID hat ein MAC-basiertes Suffix. Das Passwort wird beim Start über USB-Serial ausgegeben; es wird nicht in Firmware oder Git gespeichert. WLAN-Teilnehmer teilen die Rechte. HTTP ist lokal unverschlüsselt innerhalb des geschützten WLANs; es gibt noch keine Benutzer-/Rollenverwaltung.

HTTP-API-Aufrufe benötigen einen benutzerdefinierten Header, zulässigen Hostnamen und haben kein CORS. HTML-Texte aus Funknachrichten werden über `textContent` ausgegeben. Die Konfiguration liegt im lokalen Netz. Ein kompromittierter WLAN-Teilnehmer bleibt innerhalb der gemeinsamen Vertrauensgrenze. Diese Version enthält keine vollständige Absicherung gegen absichtliche Überlastung durch Teilnehmer.

## Weitere Entwicklung

1. Reale Boardtests und RAM-/Airtime-Messungen.
2. Zustellzeitlimits und aussagekräftige Fehlerereignisse. ACK-Zuordnung ist seit 0.2 implementiert.
3. SD-Verlauf und definierte Aufbewahrung.
4. Room-Server mit Schwarzem Brett, Zugriffsregeln und Ablaufdatum für Meldungen.
5. Echte Store-and-forward-Semantik mit Dublettenvermeidung und Ablaufzeiten.
6. Offlinekarte und Positionen, große Assets lokal über WLAN.

Ein nativer MeshCore-Repeater ist eine getrennte Rolle. Das Projekt ändert weder das MeshCore-Paketformat noch Meshtastic, und implementiert keine automatische Protokollbrücke zwischen beiden Netzen.

## Verlauf und ACKs ab 0.2

Lokaler Datensatz `0xf4`: bisheriger 13-Byte-Direktnachrichtenheader, dann der 4-Byte-ACK-Tag aus MeshCore `RESP_CODE_SENT[2:6]`, dann UTF-8-Text. `0xf2`/`0xf3` bleiben lesbar. Die Ringgröße und das Funkprotokoll ändern sich nicht. Ein vollständiges ACK-Ereignis (`0x82`, mindestens 9 Byte) wird nur zugeordnet, wenn genau eine gespeicherte eigene Nachricht denselben nichtleeren Tag besitzt und ihre Sequenznummer kleiner ist. Doppelte Bestätigungen sind idempotent. Bei Tag-Kollisionen, Ringverlust oder alten Datensätzen wird keine Zustellung behauptet.

Die Suche filtert den gewählten Kanal/Kontakt im Browser. Der JSON-Export enthält alle noch im Ring gespeicherten dekodierbaren Nachrichten und unzugeordneten Bestätigungen, einschließlich Klartext und Kontaktpräfixen. Er enthält keine privaten Schlüssel und ist keine Sicherung der Knotenidentität. Es gibt keinen Import und keine Garantie auf Vollständigkeit älterer Gespräche.
