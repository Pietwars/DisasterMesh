# T3-S3 V1.3 / SX1262 – Hardwarebasis für DisAHRsterRadio

Herstellerreferenz, geprüft am 15.10.2026: [LILYGO Hardwaredokumentation](https://github.com/Xinyuan-LilyGO/LilyGo-LoRa-Series/blob/master/docs/en/t3_s3_sx1262/t3_s3_sx1262_hw.md). Vollständige Herstellerinformationen und Abbildungen bleiben dort maßgeblich.

## Hardwareangaben des Herstellers

| Bereich | Angabe |
|---|---|
| Prozessor / Speicher | ESP32-S3FH4R2; 4 MB Flash, 2 MB QSPI-PSRAM |
| OLED | SSD1306; I²C-Adresse 0x3C |
| USB-C / Akku | 5 V / 3,7-V-Lithiumakku, PH2.0 |
| V1.3-Solareingang / Ladestrom | 4,5–5,6 V / 500 mA |
| Funk | SX1262; geliefert: 868-MHz-Version |
| LoRa-Rate laut Referenz | 0,018–62,5 kbit/s; keine erreichbare Chat-Nutzdatenrate zugesagt |

| Signalgruppe | GPIOs in angegebener Reihenfolge |
|---|---|
| LoRa SCK / MISO / MOSI / CS / RESET / DIO1 / BUSY | 5 / 3 / 6 / 7 / 8 / 33 / 34 |
| SD SCK / MISO / MOSI / CS | 14 / 2 / 11 / 13 |
| OLED SDA / SCL | 18 / 17 |
| BOOT / Batterie-ADC / Benutzer-LED | 0 / 1 / 37 |
| QWIIC TX / RX | 43 / 44 |

V1.2/V1.3: gleiche Pins, geänderte Ladeschaltung. GPIO10/21 sind nicht ohne Bestückungsänderung frei. USB-CDC aktivieren, QSPI-PSRAM wählen. Vor dem Senden Antenne anschließen.

**Stromversorgung:** Kein vollständiges BMS; geschützten Akku verwenden. Solareingang höchstens 5,6 V, VBAT höchstens 4,2 V. USB-C/VBUS beziehungsweise Akkuanschluss/VBAT sind jeweils gekoppelt. Bei extern ladendem BMS USB-C nicht gleichzeitig anschließen. Die Lade-LED zeigt Laden, Voll oder fehlenden Akku an.

Weiterführend: [V1.3-Schaltplan](https://github.com/Xinyuan-LilyGO/LilyGo-LoRa-Series/blob/master/schematic/T3_S3_V1.3.pdf), [Antennenspezifikation](https://github.com/Xinyuan-LilyGO/LilyGo-LoRa-Series/blob/master/docs/datasheet/T3-ANT.pdf), [SX1262-Datenblatt](https://www.semtech.com/products/wireless-rf/lora-transceivers/sx1262).

## Umsetzung in unserem Projekt

Die Rollen bleiben getrennt: A/B sind WLAN-Portale, C/D Repeater und E der Room-Server. Das Portal verbindet den lokalen Browser mit MeshCore; es ist keine LoRaWAN-Firmware und keine Meshtastic-Protokollbrücke. Die Karte wird auf dem Handy gezeichnet, nicht über LoRa übertragen.

Im Firmwareprojekt sind die Funkpins durch das MeshCore-Profil `LilyGo_T3S3_sx1262` festgelegt. Der SD-Zusatz nutzt einen getrennten Controller und GPIO11 als MOSI. Die Profile reduzieren den Ausgangswert der Sendeleistung auf die bisherigen Projektwerte; sie ersetzen keine individuelle Einsatzprüfung. Der vorhandene SX1262-Treiber verwendet DIO2 für die Funkumschaltung und die im Boardprofil gesetzte TCXO-Konfiguration. Diese Angaben beschreiben Quellcodekonfiguration, noch keine Messung an deinen Geräten.

Die Portale bekommen feste SX1262-Windows-Pakete mit automatischem Backup bei Erstinstallation und separatem Anwendungsupdate. Bedienung und Installation: [SX1262_PAKET.md](SX1262_PAKET.md). Nachweisstand: [VALIDIERUNG.md](VALIDIERUNG.md).

## Noch am Gerät zu bestimmen

Für einen belastbaren Solaraufbau fehlen reale Verbrauchswerte der jeweiligen Rolle, Verhalten bei niedriger Akkuspannung, Nachtreserve, täglicher Energiebedarf und Prüfung der gewählten Solar-/Reglerkombination. Herstellergrenzwerte allein bestimmen weder Panelleistung noch Akkulaufzeit. Bei USB-C-Solarversorgung muss die konkrete Quelle die passende geregelte Versorgung liefern; ein beliebiges Panel lässt sich nicht allein anhand seiner Nennspannung freigeben.

Für Gehäuse und Originalantenne außerdem Freiraum, Kabelknickschutz, Wassereintritt, Wärme, Kondensat und Antennenabstand am tatsächlichen Aufbau prüfen. Aus dieser Firmwarebeschreibung folgt keine geprüfte Wetterfestigkeit oder Gehäusemaßhaltigkeit.
