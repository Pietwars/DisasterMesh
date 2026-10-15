#!/usr/bin/env python3
"""Read-only diagnostic recording over board Wi-Fi. Never sends radio commands."""
import argparse
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, ProxyHandler, build_opener

NUMBERS = ('uptimeSeconds', 'resetReason', 'minHeapBytes', 'largestHeapBlockBytes',
           'wifiClients', 'txFlood', 'txDirect', 'rxFlood', 'rxDirect',
           'txAirMs', 'rxAirMs', 'txBudgetMs')
LIMIT = 65536


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def snapshot(state):
    if not isinstance(state, dict) or not isinstance(state.get('diagnostics'), dict):
        raise ValueError('Firmware liefert keine Diagnosedaten')
    diag = state['diagnostics']
    out = {}
    for key in NUMBERS:
        value = diag.get(key)
        out[key] = value if type(value) in (int, float) and 0 <= value <= 2**53 and math.isfinite(value) else None
    if out['uptimeSeconds'] is None:
        raise ValueError('Gueltige Geraetelaufzeit fehlt')
    firmware = diag.get('firmware')
    out['firmware'] = firmware[:128] if isinstance(firmware, str) else None
    heap = state.get('heap')
    out['heapBytes'] = heap if type(heap) is int and heap >= 0 else None
    for key in ('storage', 'queueStorage'):
        value = state.get(key)
        out[key] = value if type(value) is bool else None
    return out


def endpoint(url):
    parts = urlsplit(url)
    if (parts.scheme not in ('http', 'https') or not parts.hostname or
            parts.username or parts.password or parts.query or parts.fragment or
            parts.path not in ('', '/')):
        raise ValueError('URL muss eine Basisadresse ohne Zugangsdaten sein')
    return url.rstrip('/') + '/api/state'


def read_snapshot(url, timeout):
    req = Request(endpoint(url), headers={'X-Disaster-Request': '1'})
    # Offline board traffic must not be routed through Windows/system proxy settings.
    opener = build_opener(ProxyHandler({}))
    with opener.open(req, timeout=timeout) as response:
        raw = response.read(LIMIT + 1)
    if len(raw) > LIMIT:
        raise ValueError('API-Antwort zu gross')
    return snapshot(json.loads(raw))


def capture(output, url, interval, duration, timeout):
    """Append flushed JSONL samples; exclusive creation prevents accidental overwrite."""
    endpoint(url)  # Invalid configuration fails immediately, not after 24 hours.
    started = time.monotonic()
    counts = {'samples': 0, 'failures': 0, 'uptimeDecreases': 0}
    last_uptime = None
    stopped = 'duration'
    with output.open('x', encoding='utf-8', newline='\n') as stream:
        def write(record):
            stream.write(json.dumps({'recordedAt': utc_now(), **record},
                                    ensure_ascii=False, allow_nan=False) + '\n')
            stream.flush()
        write({'type': 'start', 'format': 'DisAHRsterRadio-diagnostics-log',
               'version': 1, 'intervalSeconds': interval, 'durationSeconds': duration})
        try:
            while time.monotonic() - started < duration:
                try:
                    diag = read_snapshot(url, min(timeout, max(0.01, duration - (time.monotonic() - started))))
                    decreased = last_uptime is not None and diag['uptimeSeconds'] < last_uptime
                    counts['samples'] += 1
                    counts['uptimeDecreases'] += int(decreased)
                    last_uptime = diag['uptimeSeconds']
                    write({'type': 'sample', 'elapsedSeconds': round(time.monotonic() - started, 3),
                           'uptimeDecreased': decreased, 'diagnostics': diag})
                except (OSError, URLError, ValueError, UnicodeError) as exc:
                    counts['failures'] += 1
                    # Never persist HTTP response bodies or unfiltered API state.
                    error = 'HTTP ' + str(exc.code) if isinstance(exc, HTTPError) else type(exc).__name__
                    write({'type': 'unavailable', 'elapsedSeconds': round(time.monotonic() - started, 3), 'error': error})
                remaining = duration - (time.monotonic() - started)
                if remaining > 0:
                    time.sleep(min(interval, remaining))
        except KeyboardInterrupt:
            stopped = 'interrupted'
        write({'type': 'summary', **counts, 'stopped': stopped,
               'elapsedSeconds': round(time.monotonic() - started, 3)})
    # Nonzero means the recording is incomplete or contains gaps, not an RF verdict.
    return 0 if counts['samples'] and not counts['failures'] and stopped == 'duration' else 2


def positive(value):
    number = float(value)
    if not math.isfinite(number) or number <= 0:
        raise argparse.ArgumentTypeError('Wert muss positiv und endlich sein')
    return number


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='http://192.168.4.1')
    parser.add_argument('--interval', type=positive, default=60, help='Sekunden zwischen Abfragen (Standard 60)')
    parser.add_argument('--duration', type=positive, default=86400, help='Gesamtdauer in Sekunden (Standard 86400)')
    parser.add_argument('--timeout', type=positive, default=5)
    parser.add_argument('--output', type=Path, required=True, help='Neue lokale JSONL-Datei; wird nie ueberschrieben')
    args = parser.parse_args()
    try:
        result = capture(args.output, args.url, args.interval, args.duration, args.timeout)
        print('Diagnoseaufzeichnung gespeichert. Code 0: vollstaendig; Code 2: Luecken/Abbruch. Keine Hardwarefreigabe.')
        return result
    except (OSError, ValueError) as exc:
        print('Aufzeichnung nicht moeglich: ' + type(exc).__name__, file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
