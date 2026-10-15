# Funklast-Diagnose für DisAHRsterRadio

Die Geräteansicht und die Statuszeile zeigen jetzt den vom Funkkern beobachteten Airtime-Wartezustand. Die Senderegeln, Funkparameter und Wiederholungsversuche bleiben unverändert.

| Feld in `/api/state` → `diagnostics` | Bedeutung |
|---|---|
| `txBudgetWaiting` | Der Scheduler hat sendefällige Pakete, aber sein internes Airtime-Budget reicht beim letzten Prüfen nicht aus. |
| `txBudgetWaitEvents` | Anzahl zusammenhängender Budget-Wartephasen seit Boot. |
| `txBudgetWaitSeconds` | Gesamtdauer dieser Phasen seit Boot, ganze Sekunden. |
| `txQueuePackets` | Pakete in der Funkwarteschlange, einschließlich noch nicht sendefälliger Pakete; ein aktuell gesendetes Paket zählt nicht mit. |

Die Anzeige gilt für den gesamten Knoten, nicht für eine bestimmte Chatnachricht. Sie ist keine Empfangsbestätigung. Andere Verzögerungen, etwa ein belegter Funkkanal oder geplante Sendezeitpunkte, werden nicht als Budget-Wartephase gezählt. Das interne Budget ist kein Nachweis der Einhaltung aller regionalen Funkvorschriften.

Die Zähler liegen im RAM, beginnen bei einem Neustart wieder bei null und werden vom bisherigen Funkstatistik-Reset nicht zurückgesetzt. Der Millisekunden-Timerüberlauf ist berücksichtigt. Phasen werden beim Prüfen des Schedulers geöffnet und geschlossen; die Anzeige ist daher eine Beobachtung dieses Zustands.

## Windows-Aufzeichnung

Der bestehende Recorder `tools/capture_diagnostics.py` übernimmt die vier Felder automatisch in seine JSONL-Messpunkte. Der JSON-Export in der Geräteansicht enthält sie ebenfalls. Kontakte, Nachrichten und Passwörter bleiben vom Export ausgeschlossen. Bei älterer Firmware fehlen die Werte und werden als unbekannt angezeigt.

Kurze Wartephasen können zwischen zwei Messpunkten liegen. Dafür bleiben Anzahl und Gesamtdauer im Knoten bis zum Neustart erhalten. Netzwerkunterbrechungen werden weiterhin als Aufzeichnungslücken erfasst; aus ihnen wird kein Funkzustand abgeleitet.

## Prüfung mit zwei deiner SX1262-Boards

1. Ein Board mit dem WLAN-Profil, das zweite als Repeater starten und beide mit geeigneter 868-MHz-Antenne betreiben.
2. WLAN-Oberfläche öffnen und Diagnoseaufzeichnung starten, wie in der Windows-Anleitung beschrieben.
3. Einige normale Nachrichten senden. Funkwarteschlange und Zähler beobachten. Eine Budget-Wartephase muss bei geringer Last nicht auftreten; kein unkontrolliertes Dauerfeuer erzeugen.
4. Empfang am zweiten Gerät und gegebenenfalls ACK getrennt prüfen. Ein leerer Sendepuffer beweist keine Zustellung.
5. Einen Neustart durchführen und prüfen, dass Laufzeit und Budget-Wartezähler neu beginnen.

## Softwareprüfung

Native C++-Tests prüfen Phasenwechsel, Leerlauf, wiederholte Momentaufnahmen und Timerüberlauf. DOM-Tests prüfen wartend, nicht wartend und unbekannt; HTTP-Recorder-Tests prüfen neue Felder, Nullwerte und die Export-Allowlist. Firmware-Builds müssen zusätzlich die Integration in allen Profilen prüfen. Noch kein Test auf einem realen Board durchgeführt.
