#!/usr/bin/env python3
"""Build the DisAHRsterRadio start package (demo, maps, guides, previews).

Release mode (default) only builds from a checked revision: the newest
docs/PRUEFSTAND_*.json (or --evidence) must contain successful CI runs and the
packaged software must be byte-identical to its source_commit. Firmware stays in
the CI artifacts linked from the evidence file.

--preview builds a clearly labelled "UNGEPRÜFT – Vorschau" package from the
working tree for local review. It never carries the release asset name.
New evidence files are written by tools/record_pruefstand.py.
"""
from pathlib import Path
import argparse
import hashlib
import html
import json
import re
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
RELEASE_NAME = 'DisAHRsterRadio-Startpaket.zip'
PINNED_DIRS = ('web', 'maps')
PINNED_FILES = ('tools/build_demo.py', 'tools/web_assets.py')
HEADER = 'docs/images/disahrsterradio-header.jpg'
PREVIEWS = [('ahrtal-desktop.png', 'Desktop'), ('ahrtal-iphone.png', 'iPhone'), ('ahrtal-admin.png', 'Admin'),
            ('ahrtal-map.png', 'Karte'), ('heimersheim-map.png', 'Heimersheim im Detail'), ('funktion-brett.png', 'Schwarzes Brett')]
ROLE_TEXT = {'wifi': 'WLAN-Portal (Board A/B)', 'wifi_sd': 'WLAN-Portal mit SD-Archiv', 'wifi_gps': 'WLAN-Portal mit GPS-Modul (optional)',
             'repeater': 'Repeater (Board C/D)', 'room': 'Room-Server / Schwarzes Brett (Board E)'}


def preview_name(version):
    return f'DisAHRsterRadio-Startpaket-{version}-UNGEPRUEFT-Vorschau.zip'


def current_version(root=ROOT):
    return json.loads((root / 'package.json').read_text(encoding='utf-8'))['disahrsterradioVersion']


def firmware_envs(root=ROOT):
    names = set()
    for ini in (root / 'firmware/MeshCore').rglob('*.ini'):
        names.update(re.findall(r'^\[env:(disaster_t3s3_sx1262_\w+)\]', ini.read_text(encoding='utf-8', errors='replace'), re.M))
    return sorted(names)


def latest_evidence(root=ROOT):
    files = sorted((root / 'docs').glob('PRUEFSTAND_2*.json'))
    if not files:
        raise ValueError('Kein Prüfstand gefunden (docs/PRUEFSTAND_*.json)')
    return files[-1]


def tracked(root, rev=None):
    cmd = ['git', 'ls-tree', '-r', '--name-only', rev] if rev else ['git', 'ls-files']
    try:
        out = subprocess.check_output(cmd + ['--', *PINNED_DIRS, *PINNED_FILES], cwd=root, text=True, stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        raise ValueError('Geprüfter Commit nicht verfügbar: ' + str(rev) + ' (git fetch --unshallow?)')
    return set(out.split())


def check_evidence(evidence, root=ROOT):
    """Raise unless the evidence is complete and the working tree matches its commit."""
    runs = evidence.get('runs') or []
    if not runs or any(r.get('conclusion') != 'success' for r in runs):
        raise ValueError('Prüfstand ohne vollständig erfolgreiche CI-Läufe')
    commit = evidence['source_commit']
    if any(r.get('head_sha') not in (None, commit) for r in runs):
        raise ValueError('CI-Lauf gehört nicht zum geprüften Softwarestand')
    then, now = tracked(root, commit), tracked(root)
    if then != now:
        raise ValueError('Software changed since checked revision: Dateien hinzugefügt/entfernt: ' + ', '.join(sorted(then ^ now)[:5]))
    for name in sorted(now):
        checked = subprocess.check_output(['git', 'show', commit + ':' + name], cwd=root)
        if (root / name).read_bytes() != checked:
            raise ValueError('Software changed since checked revision: ' + name)


def start_page(version, evidence, preview, envs):
    esc = html.escape
    if preview:
        status = ('<div class="watermark" aria-hidden="true">UNGEPRÜFT – Vorschau</div>'
                  '<p class="warn"><b>UNGEPRÜFT – Vorschau.</b> Lokal aus dem Arbeitsstand gebaut, ohne Prüfstand. '
                  'Nicht weitergeben, nicht als Release verwenden. Hardware ungetestet.</p>')
        downloads = ('<p>Keine geprüften Firmware-Downloads. Firmware selbst bauen oder die Builds der Workflows unter '
                     '<a href="https://github.com/Pietwars/DisasterMesh/actions">GitHub Actions</a> verwenden (Anmeldung nötig).</p><ul>'
                     + ''.join('<li><code>' + esc(e) + '</code> · ' + esc(ROLE_TEXT.get(e.split('sx1262_', 1)[-1], '')) + '</li>' for e in envs) + '</ul>')
        source = 'Arbeitsstand (ungeprüft)'
    else:
        hw = 'Hardware am Gerät geprüft (siehe Prüfstand).' if evidence.get('hardware_tested') else 'Tests mit echten Boards und iPhone stehen aus.'
        status = '<section><h2>Prüfung abgeschlossen</h2><p>Alle CI-Läufe des Prüfstands bestanden. ' + esc(hw) + '</p></section>'
        cards = []
        for a in evidence.get('artifacts', []):
            url = f"https://github.com/Pietwars/DisasterMesh/actions/runs/{a['workflow_run']['id']}/artifacts/{a['id']}"
            cards.append('<li><a href="' + esc(url) + '">' + esc(a['name']) + '</a></li>')
        downloads = '<p>Firmware separat laden; GitHub-Anmeldung kann erforderlich sein. Alle Artefakte gehören zum geprüften Quellstand.</p><ul>' + ''.join(cards) + '</ul>'
        source = esc(evidence['source_commit'])
    gps = ' Optional: <code>disaster_t3s3_sx1262_wifi_gps</code> für ein externes GPS-Modul (<a href="docs/GPS_UND_STANDORT.md">Anschluss</a>).' if any(e.endswith('wifi_gps') for e in envs) else ''
    prev = ' · '.join('<a href="previews/' + n + '">' + l + '</a>' for n, l in PREVIEWS)
    return ('<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
            '<title>DisAHRsterRadio · Startpaket ' + esc(version) + (' · UNGEPRÜFT' if preview else '') + '</title><style>'
            'body{font:17px/1.6 system-ui;background:#07130f;color:#eaf2f7;max-width:860px;margin:auto;padding:28px 18px}a{color:#b9f48d}'
            'section{background:#0e2119;padding:20px;border-radius:16px;margin:18px 0}h1{font-size:28px}h2{font-size:21px}code{overflow-wrap:anywhere}li{margin:10px 0}'
            '.hero{width:100%;border-radius:16px;display:block}.button{display:inline-block;background:#b9f48d;color:#10261c;padding:12px;border-radius:10px;text-decoration:none}'
            '.warn{background:#5a1d1d;border:2px solid #ff8a7a;padding:14px;border-radius:12px}'
            '.watermark{position:fixed;inset:0;display:grid;place-items:center;pointer-events:none;font:800 clamp(32px,9vw,90px)/1 system-ui;color:#ff8a7a33;transform:rotate(-24deg);z-index:9}'
            '</style>' + status +
            '<img class="hero" src="assets/disahrsterradio-header.jpg" alt="DisAHRsterRadio · MeshCore-Funknetz fürs Ahrtal">'
            '<h1>DisAHRsterRadio · Startpaket ' + esc(version) + '</h1><p>MeshAhrtal · T3-S3 V1.3 / SX1262 / 868 MHz · Prototyp, im Notfall immer 112.</p>'
            '<section><h2>Demo</h2><a class="button" href="demo/index.html">Demo öffnen</a><p>Chat und Gerätewerte simuliert. Demo-Adminpasswort: <code>DemoAdmin2026!</code>. '
            'Schnellmeldungen, Standort teilen, Karten und eigene Orte sind in der Oberfläche ausprobierbar.</p></section>'
            '<section><h2>Firmware</h2><p>Für A/B wifi, C/D repeater, E room; wifi_sd optional.' + gps + '</p>' + downloads + '</section>'
            '<section><h2>Vorschauen und Startbild</h2><p>' + prev + ' · <a href="assets/disahrsterradio-header.jpg">Startbild</a></p></section>'
            '<section><h2>Einrichtung und Abnahme</h2><p><a href="docs/STARTPAKET.md">Windows-Anleitung und Prüfergebnis</a> · <a href="docs/SX1262_PAKET.md">Flashen mit Sicherung</a> · '
            '<a href="docs/ABNAHME_ZWEI_BOARDS.md">Hardware-Abnahmeprotokoll</a> · <a href="docs/POI_KARTE.md">Karte und POIs</a></p>'
            '<p><a href="maps/heimersheim.geojson" download>Regionalpaket Heimersheim / Versorgung</a> · <a href="docs/AUTOMATISCHE_KARTEN.md">Karten und Fundorte</a></p>'
            '<p>Eigene POIs und Erntefundorte sind lokale Sammlungen. Wasserqualität, Zugang und Notdienst sind nicht live geprüft. Demo und Board haben getrennten Speicher.</p></section>'
            '<p>Softwarestand: <code>' + source + '</code></p></html>')


def build(preview=False, evidence_path=None, root=ROOT, out_dir=None):
    out_dir = Path(out_dir or root / 'docs')
    envs = firmware_envs(root)
    if preview:
        evidence, version = None, current_version(root)
        out = out_dir / preview_name(version)
    else:
        evidence_path = Path(evidence_path or latest_evidence(root))
        evidence = json.loads(evidence_path.read_text(encoding='utf-8'))
        check_evidence(evidence, root)
        version, out = evidence['release_version'], out_dir / RELEASE_NAME
    subprocess.run([sys.executable, str(root / 'tools/build_demo.py')], cwd=root, check=True)
    files = {}
    for name in ('index.html', 'app.webmanifest', 'app-icon.png'):
        files['demo/' + name] = (root / 'docs/demo' / name).read_bytes()
    if '<script src=' in files['demo/index.html'].decode():
        raise ValueError('Demo scripts are not self-contained')
    for p in sorted((root / 'docs').glob('*.md')):
        files['docs/' + p.name] = p.read_bytes()
    for name in ('maps/heimersheim.geojson', 'maps/README.md', 'maps/ODbL-1.0.txt', 'LICENSE', 'CHANGELOG.md'):
        files[name] = (root / name).read_bytes()
    if not preview:
        files['docs/' + evidence_path.name] = evidence_path.read_bytes()
    for name, _ in PREVIEWS:
        files['previews/' + name] = (root / 'docs/images' / name).read_bytes()
    files['assets/disahrsterradio-header.jpg'] = (root / HEADER).read_bytes()
    files['assets/README.md'] = (root / 'web/assets/README.md').read_bytes()
    files['START.html'] = start_page(version, evidence, preview, envs).encode('utf-8')
    head = 'UNGEPRÜFT – VORSCHAU. Nicht weitergeben. Kein Prüfstand, Hardware ungetestet.\n' if preview else ''
    files['LIESMICH.txt'] = (head + f'DisAHRsterRadio-Startpaket {version}\nZIP vollständig entpacken. Zuerst START.html öffnen.\n'
                             'Demo unter demo/index.html.\nWindows-Anleitung: docs/STARTPAKET.md.\n'
                             'Firmware separat laden (siehe START.html).\nPrototyp, keine Hardwarefreigabe. Im Notfall immer 112.\n').encode('utf-8')
    files['SHA256SUMS.txt'] = ''.join(hashlib.sha256(d).hexdigest() + '  ' + n + '\n' for n, d in sorted(files.items())).encode()
    out_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for name, data in sorted(files.items()):
            entry = zipfile.ZipInfo(name, date_time=(2026, 10, 15, 20, 0, 0)); entry.compress_type = zipfile.ZIP_DEFLATED; entry.external_attr = 0o644 << 16
            z.writestr(entry, data)
    with zipfile.ZipFile(out) as z:
        if z.testzip():
            raise ValueError('Broken ZIP')
        for line in z.read('SHA256SUMS.txt').decode().splitlines():
            digest, name = line.split('  ', 1)
            if hashlib.sha256(z.read(name)).hexdigest() != digest:
                raise ValueError('Checksum mismatch')
    print(f'{out}: {len(files)} files, {out.stat().st_size} bytes, all checksums verified' + (' · UNGEPRÜFT – Vorschau' if preview else ''))
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--preview', '--unchecked', action='store_true', help='ungeprüfte, deutlich markierte Vorschau aus dem Arbeitsstand bauen')
    ap.add_argument('--evidence', help='Prüfstand-JSON (Standard: neueste docs/PRUEFSTAND_*.json)')
    ap.add_argument('--out-dir', help='Zielordner (Standard: docs/)')
    a = ap.parse_args(argv)
    try:
        build(a.preview, a.evidence, out_dir=a.out_dir)
    except ValueError as e:
        sys.exit('Startpaket nicht gebaut: ' + str(e) + '\nFür eine lokale Vorschau: python tools/build_start_package.py --preview')


if __name__ == '__main__':
    main()
