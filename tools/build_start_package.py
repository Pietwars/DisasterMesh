#!/usr/bin/env python3
"""Assemble the checked demo, local map and guides; firmware stays in CI artifacts."""
from pathlib import Path
import hashlib
import html
import json
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'docs/PRUEFSTAND_2026-10-15.json'

def main():
    evidence = json.loads(EVIDENCE.read_text(encoding='utf-8'))
    if evidence['hardware_tested'] or any(r['conclusion'] != 'success' for r in evidence['runs']):
        raise ValueError('Unexpected validation snapshot')
    # Pin the software used to make this package to the reviewed revision.
    for name in ('web/index.html','web/app.js','web/map.js','web/map-library.js','web/poi.js','maps/heimersheim.geojson','web/protocol.js','web/demo.js','web/theme.css','web/assets/ahrtal-night.jpg','tools/web_assets.py','tools/build_demo.py'):
        checked = subprocess.check_output(['git','show',evidence['source_commit']+':'+name],cwd=ROOT)
        if (ROOT/name).read_bytes() != checked:
            raise ValueError('Software changed since checked revision: '+name)
    subprocess.run([sys.executable,str(ROOT/'tools/build_demo.py')],cwd=ROOT,check=True)
    files = {}
    for p in (ROOT/'docs/demo').iterdir():
        if p.is_file() and p.name in ('index.html','app.webmanifest','app-icon.png'):
            files['demo/'+p.name] = p.read_bytes()
    if '<script src=' in files['demo/index.html'].decode():
        raise ValueError('Demo scripts are not self-contained')
    for p in sorted((ROOT/'docs').glob('*.md')):
        files['docs/'+p.name] = p.read_bytes()
    for name in ('maps/heimersheim.geojson','maps/README.md','maps/ODbL-1.0.txt','LICENSE','CHANGELOG.md','docs/PRUEFSTAND_2026-10-15.json'):
        files[name] = (ROOT/name).read_bytes()
    artifacts = evidence['artifacts']
    cards = []
    for a in artifacts:
        run = a['workflow_run']['id']
        url = f"https://github.com/Pietwars/DisasterMesh/actions/runs/{run}/artifacts/{a['id']}"
        cards.append('<li><a href="'+url+'">'+html.escape(a['name'])+'</a></li>')
    page = '''<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>DisAHRsterRadio · Startpaket</title><style>body{font:17px/1.6 system-ui;background:#07130f;color:#eaf2f7;max-width:860px;margin:auto;padding:28px 18px}a{color:#b9f48d}section{background:#0e2119;padding:20px;border-radius:16px;margin:18px 0}h1{font-size:28px}h2{font-size:21px}code{overflow-wrap:anywhere}li{margin:12px 0}button,.button{display:inline-block;background:#b9f48d;color:#10261c;padding:12px;border-radius:10px;text-decoration:none}</style><h1>MeshAhrtal · Startpaket 0.7.1.1</h1><p>16. Oktober 2026 · T3-S3 V1.3 / SX1262 / 868 MHz</p><section><h2>Prüfung abgeschlossen</h2><p>12 Firmwareprofile, Browser und vollständiger Windows-Prüflauf bestanden. Tests mit echten Boards und iPhone stehen aus. Änderungsumfang und Abnahmegrenzen sind in PR #5 dokumentiert.</p><a class="button" href="demo/index.html">Aktuelle Demo öffnen</a><p>Chat und Gerätewerte simuliert. Demo-Adminpasswort: <code>DemoAdmin2026!</code>. Eigene lokale Fundorte und Karten-Download in der Oberfläche.</p></section><section><h2>Passende Downloads</h2><p>Für A/B wifi, C/D repeater, E room. wifi_sd optional. Firmware-BINs separat laden; GitHub-Anmeldung kann erforderlich sein. Alle folgenden Artefakte gehören zum geprüften Quellstand.</p><ul>'''+''.join(cards)+'''</ul></section><section><h2>Einrichtung und Abnahme</h2><p><a href="docs/POI_KARTE.md">Kartenkorrektur und Alltags-POIs</a></p><p><a href="docs/STARTPAKET.md">Windows-Anleitung und Prüfergebnis</a> · <a href="docs/SX1262_PAKET.md">Flashen mit Sicherung</a> · <a href="docs/ABNAHME_ZWEI_BOARDS.md">Hardware-Abnahmeprotokoll</a></p><p><a href="maps/heimersheim.geojson" download>Regionalpaket Heimersheim / Versorgung speichern</a> · <a href="docs/AUTOMATISCHE_KARTEN.md">Karten und Fundorte</a></p><p>Aktuell ein regionales Paket. Automatik läuft bei geöffneter App. Eigene POIs und Erntefundorte sind lokale Sammlungen; kein externer POI-Dienst. Wasserqualität, Zugang und Notdienst sind nicht live geprüft. Unter file:// kann der Browser die Speicherung beschränken. Demo und Board haben getrennten Speicher.</p></section><p>Geprüfter Softwarestand: <code>'''+evidence['source_commit']+'''</code>. <a href="https://github.com/Pietwars/DisasterMesh/pull/5">Änderung auf GitHub</a></p></html>'''
    page=page.replace('</section><section><h2>Einrichtung und Abnahme</h2>', '</section><section><h2>Vorschauen und Originalfoto</h2><p>'+''.join('<a href="previews/'+name+'">'+label+'</a> · ' for name,label in [('ahrtal-desktop.png','Desktop'),('ahrtal-iphone.png','iPhone'),('ahrtal-admin.png','Admin'),('ahrtal-map.png','Karte'),('heimersheim-map.png','Heimersheim im Detail')])+'</p><a href="assets/ahrtal-night.jpg">Originalfoto ohne Schrift</a></section><section><h2>Einrichtung und Abnahme</h2>')
    for name in ('ahrtal-desktop.png','ahrtal-iphone.png','ahrtal-admin.png','ahrtal-map.png','heimersheim-map.png'):
        files['previews/'+name]=(ROOT/'docs/images'/name).read_bytes()
    files['assets/ahrtal-night.jpg']=(ROOT/'web/assets/ahrtal-night.jpg').read_bytes()
    files['assets/README.md']=(ROOT/'web/assets/README.md').read_bytes()
    files['START.html'] = page.encode('utf-8')
    files['LIESMICH.txt'] = ('ZIP vollständig entpacken. Zuerst START.html öffnen.\nDemo unter demo/index.html.\nWindows-Anleitung: docs/STARTPAKET.md.\nFirmware-BINs separat über die verlinkten geprüften GitHub-Artefakte laden.\nKeine Hardwarefreigabe.\n').encode('utf-8')
    files['SHA256SUMS.txt'] = ''.join(hashlib.sha256(data).hexdigest()+'  '+name+'\n' for name,data in sorted(files.items())).encode()
    out = ROOT/'docs/DisAHRsterRadio-Startpaket.zip'
    with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for name,data in sorted(files.items()):
            entry=zipfile.ZipInfo(name,date_time=(2026,10,15,20,0,0));entry.compress_type=zipfile.ZIP_DEFLATED;entry.external_attr=0o644<<16;z.writestr(entry,data)
    with zipfile.ZipFile(out) as z:
        if z.testzip(): raise ValueError('Broken ZIP')
        for line in z.read('SHA256SUMS.txt').decode().splitlines():
            digest,name=line.split('  ',1)
            if hashlib.sha256(z.read(name)).hexdigest()!=digest: raise ValueError('Checksum mismatch')
    print(f'{out}: {len(files)} files, {out.stat().st_size} bytes, all checksums verified')

if __name__=='__main__':
    main()
