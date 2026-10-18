#!/usr/bin/env python3
"""Schreibt den gemeinsamen Projektfamilie-Block in README-Dateien (zwischen den Markern)."""
import re, sys, json
from pathlib import Path
DATA = json.load(open(Path(__file__).with_suffix('.json'), encoding='utf-8'))
def row(r):
    gh = f"https://github.com/Pietwars/{r['repo']}"
    pages = f"https://pietwars.github.io/{r['repo']}/"
    links = [f"[Live-Demo]({pages}{r.get('demo','')})"]
    if r.get('release'):
        links.append(f"[Release v{r['release']}]({gh}/releases/tag/v{r['release']})")
    else:
        links.append(f"Firmware über [Actions]({gh}/actions)")
    fl = r['flyer']
    links.append(f"Flyer [Druck]({pages}flyer/{fl}-Flyer.pdf) / [digital]({pages}flyer/{fl}-Flyer-digital.pdf)")
    return f"| [Pietwars/{r['repo']}]({gh}) | {r['inhalt']} | {r['funk']} | {r['version']} | {' · '.join(links)} |"
def block():
    lines = ["<!-- projektfamilie:start (in allen fünf Repositorys identisch; erzeugt mit DisasterMesh/tools/projektfamilie.py) -->",
             "## Projektfamilie DisAHRsterRadio / HaldenFunk", "",
             "| Repository | Inhalt | Funk | Version | Demo · Download · Flyer |", "|---|---|---|---|---|"]
    lines += [row(r) for r in DATA['repos']]
    for x in DATA['text']: lines += ["", x]
    lines += ["<!-- projektfamilie:end -->"]
    return "\n".join(lines)
def apply(path):
    p = Path(path); t = p.read_text(encoding='utf-8')
    new, n = re.subn(r"<!-- projektfamilie:start.*?<!-- projektfamilie:end -->", lambda m: block(), t, flags=re.S)
    if n != 1: sys.exit(f"{path}: Marker nicht gefunden ({n})")
    p.write_text(new, encoding='utf-8'); print("aktualisiert:", path)
if __name__ == '__main__':
    for a in sys.argv[1:]: apply(a)
    if not sys.argv[1:]: print(block())
