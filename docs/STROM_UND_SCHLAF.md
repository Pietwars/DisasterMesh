# Strom und Schlaf

Stand 0.7.2. Es gibt keine gemessene Stromaufnahme. Wer eine Stundenzahl an eine Powerbank hängt, erfindet sie.

Das Portal setzt `WiFi.setSleep(false)` und im Companion-Profil `board.setInhibitSleep(true)`. Der Zugangsknoten bleibt wach, solange er läuft. Das ist Absicht: ein schlafender SoftAP nimmt keine Handys an. Es ist auch der Grund, warum eine Nacht am Powerbank die offene Frage ist, nicht ein gelöstes Feature.

Repeater und Room haben kein Dauer-WLAN. Sie können sparsamer sein. Auch das ist nicht gemessen.

Vor dem nächsten Feldtest einmal messen: mA im Leerlauf mit null Clients, mit einem verbundenen Handy, und beim Senden. Daraus Stunden an der konkreten Powerbank rechnen. Bis dahin das Portal an eine Quelle hängen, die man nachsehen kann, und den Repeater dort lassen, wo niemand täglich das Kabel prüft.

BLE statt SoftAP wäre der größere Spareffekt. MeshCore kann das. Dieses Profil lässt BLE bewusst aus, damit nur eine Companion-Schnittstelle aktiv ist. Das bleibt eine spätere Entscheidung, kein stiller Umbau.
