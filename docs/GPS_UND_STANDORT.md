# GPS und Standort · Stand 0.8.1

## Stabilisierung in 0.8.1

Neue Meldungen: `!DP2|breite,länge|unixzeit|kennung|name`. Die Kennung besteht aus 16 zufälligen Hex-Zeichen und wird separat vom technischen HTTP-Client-Identifier im Browser gespeichert. Gleiche Anzeigenamen bleiben als verschiedene Sender sichtbar; Kanal-/Gesprächskontexte werden getrennt behandelt. Namen und Kennungen sind keine kryptografisch bestätigten Identitäten und können nachgeahmt werden.

`!DP1` wird weiterhin gelesen. Ohne eindeutige Kennung bleiben alte Einzelmeldungen getrennt; es wird keine Personenzuordnung anhand eines Namens behauptet. Empfänger vor 0.8.1 zeigen `!DP2` als normalen Text statt als Kartenposition. Beide Portale aktualisieren, wenn die neue Kartenanzeige gewünscht ist.

Die fünfminütige Pause wird vor dem Netzwerkaufruf im Browser gespeichert. Sie bleibt bei Neuladen, Fehlerantwort oder unklarem Empfang bestehen. Bei Speicherfehlern wird die Standortübertragung abgewiesen. Uhr-Rückstellung verkürzt die Pause nicht. Ein anderer Browser, geänderte Uhrzeit nach vorn oder bewusst gelöschter Browserspeicher kann die lokale Begrenzung umgehen; sie ersetzt weder das Board-Sendebudget noch Funkkonformität. Die Funktion ist kein Schutz gegen absichtlichen Missbrauch. Eigene Kennung und Pause gelten nur für diese Browseradresse; Demo und Board sind getrennt.

Kurz: Das LILYGO T3-S3 V1.3 hat **kein GPS**. Die Handy-Ortung ist über das Board-WLAN (`http://192.168.4.1`) in aktuellen Browsern **gesperrt**. Deshalb gibt es drei Wege zur eigenen Position und einen optionalen vierten mit Zusatzmodul.

## 1. Befund Handy-Ortung (Geolocation-API)

- Die Geolocation-API ist nur in einem *sicheren Kontext* erlaubt (HTTPS, `localhost`, `file://` je nach Browser). Das Board liefert die Seite über unverschlüsseltes HTTP aus seinem eigenen WLAN.
- Chrome/Android und Safari/iOS lehnen `navigator.geolocation` auf `http://192.168.4.1` ab (Fehler „permission denied“, ohne Nachfrage). Firefox verhält sich gleich.
- Ein HTTPS-Zertifikat für eine lokale IP ohne Internet lässt sich nicht so ausstellen, dass Handys ihm ohne manuelle Installation vertrauen. Für Notfallnutzer ist das keine Lösung.
- Die Oberfläche prüft `window.isSecureContext` und erklärt die Sperre. In der Online-/Datei-Demo kann die Ortung funktionieren.
- **Nicht auf echten Geräten abgenommen.** Bitte bei der iPhone-/Android-Abnahme bestätigen.

## 2. Was in 0.8.0 umgesetzt ist

| Weg | Funktion |
|---|---|
| Ortsliste | 14 Orte von Schuld bis Kripp (Ortsmitte nach OSM, gerundet). Setzt die Genauigkeit automatisch auf „grob“. |
| Karte antippen | Position direkt auf der Offlinekarte wählen. |
| Handy-Ortung | Nur wenn der Browser sie erlaubt (sicherer Kontext). |
| Board-GPS | Wenn die GPS-Firmware einen gültigen Fix meldet, übernimmt „Handy-Ortung versuchen“ zuerst diese Position. |

### Positionsmeldung `!DP1`

```
!DP1|<breite>,<länge>|<unixzeit>|<name optional>
!DP1|50.543,7.176|1792100000|Anna      (≈ 35 Byte)
```

- Genauigkeit über die Nachkommastellen: 2 ≈ 1 km (grob), 3 ≈ 100 m (mittel), 4 ≈ 10 m (fein). Keine feinere Stufe.
- Wird als normale Kanalnachricht gesendet, nur auf Knopfdruck, höchstens alle 5 Minuten pro Handy. Es gilt zusätzlich das bestehende Sendebudget (15 s, 6 pro 10 Minuten) und das geräteweite Minimum.
- Kein automatisches oder periodisches Senden. Kein Tracking.
- Lesbar für alle mit dem Kanalschlüssel; im Public-Kanal für alle.
- Empfangene Positionen erscheinen auf der Karte mit Name, kurzer Kennung, Alter und Genauigkeitskreis. Pro DP2-Kennung und Gespräch zählt die neueste; älter als 24 Stunden wird ausgeblendet. Die alte DP1-Syntax oben bleibt als Kompatibilitätsreferenz erhalten.

## 3. Optionales GPS-Modul am Board

MeshCore bringt einen NMEA-Leser mit (`MicroNMEALocationProvider`, `EnvironmentSensorManager`, Flag `ENV_INCLUDE_GPS`). Für den T3-S3 gibt es das Profil **`disaster_t3s3_sx1262_wifi_gps`**.

| Modul | Board T3-S3 |
|---|---|
| VCC | 3V3 |
| GND | GND |
| TX (Modul sendet) | GPIO 44 (`PIN_GPS_TX`) |
| RX (Modul empfängt) | GPIO 43 (`PIN_GPS_RX`) |

- 9600 Baud (`GPS_BAUD_RATE`). Typische Module mit NMEA-Ausgabe bei 9600 Baud: ATGM336H, u-blox NEO-6M/M8N, Quectel L76K. **Keines davon ist am Board abgenommen.**
- 43/44 kollidieren nicht mit LoRa (3, 5–8, 33, 34), SD (2, 11, 13, 14), I²C (17, 18) und OLED-Reset (21). Andere Pins in `platformio.local.ini` ändern.
- GPS ist in diesem Profil standardmäßig eingeschaltet. Der Fix erscheint unter Gerät / Diagnose und in `/api/state` als `gps:{enabled,fix,lat,lon}` (lat/lon nur bei gültigem Fix).
- Die Knotenbekanntgabe (Advert) sendet weiterhin **keine** Position: `advert_loc_policy` bleibt auf `NONE`.
- Zusätzlicher Strombedarf typischerweise 25–45 mA. Nicht gemessen; siehe `STROM_UND_SCHLAF.md`.
- Kaltstart braucht freie Sicht zum Himmel und kann mehrere Minuten dauern.
