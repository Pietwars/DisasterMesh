# Was auf dem iPhone wirklich gilt

Stand 0.9.0-alpha. Das ist keine Abnahme. Ein Screenshot im Browser ist kein iPhone am Board-WLAN.

## So öffnen

1. Mit dem WLAN `DisAHRsterRadio-……` verbinden. Das Passwort steht beim Start auf USB-Serial, nicht in Git.
2. Die automatische Anmeldeseite von iOS oft schließen. Sie bietet häufig kein „Zum Home-Bildschirm“.
3. Safari selbst öffnen und `http://192.168.4.1` eintippen. Nicht über eine gespeicherte Online-Demo.
4. Teilen → Zum Home-Bildschirm. Chat und Einstellungen brauchen danach weiterhin dieses WLAN.

## Was nicht funktioniert oder unsicher ist

- Ortung über `http://` gibt es nicht. Positionen bleiben manuell.
- iOS kann IndexedDB und damit die gespeicherte Karte verwerfen, besonders bei wenig Speicher oder nach längerer Zeit.
- Die Home-Bildschirm-App und Safari können getrennte Speicher haben. Karte exportieren, bevor das Netz wechselt.
- Es gibt kein Zertifikat für das lokale Portal. Das WLAN-Passwort ist die Vertrauensgrenze.
- Ein nasses Display und Handschuhe sind nicht geprüft. Die Navigation ist unten und die Tasten sind mindestens 48 Pixel hoch; das ersetzt keinen Feldtest.

## Abnahme, die noch fehlt

Safari am echten T3-S3, Nachricht hin und zurück, Karte nach einem Tag noch da, Home-Bildschirm überlebt einen WLAN-Wechsel nicht stillschweigend mit einer leeren Seite.
