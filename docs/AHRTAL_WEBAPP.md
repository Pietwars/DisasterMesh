# DisAHRsterRadio 0.7 – Ahrtal-Webapp und Administration

Die Firmwareoberfläche verwendet Schiefergrün, Weinrot und eine lokal gezeichnete Ahrtal-Landschaft. Keine externen Schriften, Bildserver oder CDNs. Die Demonstration benutzt dieselben HTML-/JS-Dateien mit einer ausdrücklich simulierten API. Eine Nachricht in der Demo geht nicht über Funk.

## iPhone

Mit dem Board-WLAN verbinden und http://192.168.4.1 in Safari öffnen. Teilen → Zum Home-Bildschirm → sofern vorhanden „Als Web-App öffnen“. Name, Standalone-Manifest und Apple-Touch-Icon werden direkt vom ESP32 geliefert. Dafür gibt es keinen Service Worker und keine Push-Benachrichtigungen: Der lokale HTTP-Zugang ist kein HTTPS-PWA-Server. Chat und Administration erfordern eine Verbindung zum eingeschalteten Board. Safari und die Home-Bildschirm-App können getrennte Browserspeicher haben; eine Offlinekarte gegebenenfalls in beiden importieren. iOS-Bedienung am echten iPhone noch prüfen.

## Adminzugang

Bei der ersten Einrichtung erzeugt jedes WLAN-Board ein zufälliges, eigenes Adminpasswort und gibt es einmalig mit 115200 Baud über USB aus. Es ist nicht das WLAN-Passwort. Gespeichert werden Salt und SHA-256-Hash; das Passwort wird nicht in der API veröffentlicht. Sitzungstoken entstehen aus ESP32-Zufallsbytes, gelten maximal 15 Minuten und bleiben im Arbeitsspeicher des Browsers. Eine neue Anmeldung ersetzt die bisherige Adminsitzung. Fünf falsche Anmeldungen sperren weitere Versuche für 60 Sekunden.

Serverseitig geschützt: `/api/name`, `/api/channel`, `/api/radio` und das Ändern des Adminpassworts. Normale Chats, Zeitübernahme, Kontakte lesen und Bekanntgabe bleiben für Teilnehmer im Board-WLAN verfügbar. Administration → neues Passwort: 12–64 UTF-8-Bytes. WLAN- und Adminzugang werden über lokales HTTP genutzt, nicht mit zusätzlicher TLS-Verschlüsselung; nur vertrauenswürdige Personen ins Board-WLAN lassen.

Passwort vergessen: Firmware normal starten, USB-Monitor mit 115200 Baud öffnen, die BOOT-/Benutzertaste im laufenden Betrieb zehn Sekunden halten und loslassen. Ein neues Adminpasswort erscheint über USB, alle Adminsitzungen werden ungültig. Nicht beim Einschalten halten: das aktiviert stattdessen den ESP32-Bootloader. Kontakte, Identität und Nachrichten bleiben bei diesem Adminreset erhalten. Der Tastenablauf muss noch am Board geprüft werden.

## Deutschland: Funkprofile für 868-MHz-Hardware

| Auswahl | MHz | BW kHz | SF | CR |
|---|---:|---:|---:|---:|
| EU/UK Narrow | 869,618 | 62,5 | 8 | 4/8 |
| DisAHRsterRadio bisher | 869,618 | 62,5 | 8 | 4/5 |
| EU/UK alt (Deprecated) | 869,525 | 250 | 11 | 4/5 |

Quelle für die aktuellen MeshCore-Einträge: https://docs.meshcore.io/radio_presets/ und https://api.meshcore.nz/api/v1/config, abgerufen am 15.10.2026. Narrow und Deprecated wurden mit der API abgeglichen; „DisAHRsterRadio bisher“ ist ausdrücklich ein eigenes Kompatibilitätsprofil. Keine Auswahl für 433/915 MHz auf dem 868-MHz-Board. Das Backend nimmt nur diese drei Profil-IDs an und erzeugt die Funkwerte selbst; zusätzliche manipulierte Zahlenfelder werden nicht übernommen.

Jeder Profilwechsel setzt die leitungsgebundene Sendeleistung auf 10 dBm. Die drei DisAHRsterRadio-Rollen verwenden ein festes internes MeshCore-Airtime-Budget von 10 Prozent (Faktor 9), auch mit älteren gespeicherten Budgetwerten. Dieses Token-Budget ist **kein Nachweis eines maximalen Arbeitszyklus in jeder gleitenden Stunde**, insbesondere wegen Startbudget und möglicher Neustarts. Hardware, Antenne, Nebenwellen, tatsächliche Frequenz und Sendezeit müssen für den Betrieb geprüft werden.

Die Bundesnetzagentur nennt für SRD im Teilband 869,4–869,65 MHz bis 500 mW ERP und die dort genannten Zugangs-/Störungsminderungstechniken, alternativ einen Arbeitszyklus ≤10 %. Maßgeblich ist Vfg. 91/2025, Tabelle 2, Band 54; Arbeitszyklusdefinition mit gleitender Stunde auf Seite 3. Die vorgeschlagenen Mittenfrequenzen und nominellen Bandbreiten liegen in diesem Teilband. Antennengewinn und die tatsächliche Abstrahlung bleiben zu berücksichtigen; die Software ersetzt keine Konformitätsprüfung.

Quelle: https://www.bundesnetzagentur.de/DE/Fachthemen/Telekommunikation/Frequenzen/Allgemeinzuteilungen/_DL/vfg91_2025.pdf?__blob=publicationFile&v=3

Frische Installationen starten mit CR 4/8. Appupdates behalten die gespeicherten Funkparameter; bestehende Boards müssen gemeinsam auf dasselbe Profil eingestellt werden. WLAN-Teilnehmer nutzen immer die aktuelle Funkkonfiguration des gemeinsamen Knotens. Repeater und Raumserver weiter über ihre USB-/MeshCore-Verwaltung einstellen; der neue Web-Adminbereich gilt für WLAN-/WLAN-SD-Profile.

## Chatkanäle

Chatkanäle sind keine Funkfrequenzen. Public verwendet den öffentlichen MeshCore-Schlüssel. Ahrtal, Heimersheim und Deutschland sind Namensvorlagen für eigene Gruppen und verlangen einen selbst vereinbarten gemeinsamen Schlüssel. Sie stellen keine verifizierten deutschlandweiten Community-Kanäle dar. Unterschiedliche Kanäle können dieselbe Funkkonfiguration verwenden; unterschiedliche Funkkonfigurationen kommunizieren nicht miteinander.

## Prüfgrenzen

Native Tests prüfen Sitzungstoken, Ablauf, Sperrzeit und die serverseitigen Presetwerte. DOM-/Browserprüfungen verwenden simulierte HTTP-Antworten. ESP32-Builds prüfen die Firmwareintegration; eine reale HTTP-/USB-/Funk-Abnahme steht aus. Ausprobieren nur mit passendem Board und Antenne.
