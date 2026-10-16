#!/usr/bin/env python3
"""Prepare matching release assets; recheck the pinned source's CI on GitHub."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import sys
import zipfile
from build_start_package import build, current_version, ROOT
from record_pruefstand import fetch_ci, check_ci


def prepare(manifest_path):
    manifest = json.loads(Path(manifest_path).read_text())
    version = manifest['version']
    if not re.fullmatch(r'\d+\.\d+\.\d+', version) or version != current_version():
        raise ValueError('Releaseversion passt nicht zum Arbeitsstand')
    evidence_path = ROOT / 'docs' / manifest['evidence']
    if evidence_path.parent != ROOT / 'docs' or not re.fullmatch(r'PRUEFSTAND_[\w.-]+\.json', evidence_path.name):
        raise ValueError('Ungültiger Prüfstandpfad')
    evidence = json.loads(evidence_path.read_text())
    if evidence['release_version'] != version:
        raise ValueError('Prüfstand-Version passt nicht')
    source = evidence['source_commit']
    if not re.fullmatch(r'[a-f0-9]{40}', source):
        raise ValueError('Ungültiger Quellstand')
    subprocess.run(['git', 'merge-base', '--is-ancestor', source, 'HEAD'], cwd=ROOT, check=True)
    subprocess.run(['git', 'diff', '--exit-code', source, '--', 'web', 'maps', 'firmware', 'package.json', 'package-lock.json', 'tools/build_demo.py', 'tools/web_assets.py'], cwd=ROOT, check=True)
    ci = fetch_ci(source)
    failures = check_ci(ci, source)
    live_artifacts = {a['id']: a for a in ci['artifacts'] if not a.get('expired')}
    for a in evidence['artifacts']:
        live = live_artifacts.get(a['id'])
        if not live or live.get('digest') != a.get('digest'):
            failures.append('Artefakt fehlt, ist abgelaufen oder verändert: ' + a['name'])
    if failures:
        raise ValueError('\n'.join(failures))
    out = ROOT / 'release-assets'
    out.mkdir(exist_ok=True)
    package = build(evidence_path=evidence_path, out_dir=out)
    demo = out / 'DisAHRsterRadio-Ahrtal-Demo.zip'
    with zipfile.ZipFile(demo, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        for name in ('index.html', 'START-HIER.txt', 'app.webmanifest', 'app-icon.png'):
            z.write(ROOT / 'docs/demo' / name, name)
    report = out / evidence_path.name
    report.write_bytes(evidence_path.read_bytes())
    (out / 'SHA256SUMS.txt').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest() + '  ' + p.name + '\n' for p in (package, demo, report)))
    for p in (package, demo):
        with zipfile.ZipFile(p) as z:
            if z.testzip():
                raise ValueError('ZIP beschädigt: ' + p.name)
    print('Release ' + version + ': Quellstand, CI, Artefakte und ZIPs geprüft; keine Hardwarefreigabe.')


if __name__ == '__main__':
    prepare(sys.argv[1])
