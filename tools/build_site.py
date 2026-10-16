#!/usr/bin/env python3
"""Assemble the static project page (docs/site) with images and the live demo into one folder.

Usage: python tools/build_site.py [out_dir]   (default: _site, used by .github/workflows/pages.yml)
"""
from pathlib import Path
import re
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def build(out):
    out = Path(out)
    if out.exists():
        shutil.rmtree(out)
    shutil.copytree(ROOT / 'docs/site', out)
    page = (out / 'index.html').read_text(encoding='utf-8')
    (out / 'images').mkdir()
    for name in sorted(set(re.findall(r'images/([\w.-]+)', page))):
        shutil.copy2(ROOT / 'docs/images' / name, out / 'images' / name)
    subprocess.run([sys.executable, str(ROOT / 'tools/build_demo.py')], cwd=ROOT, check=True)
    shutil.copytree(ROOT / 'docs/demo', out / 'demo')
    (out / '.nojekyll').write_text('')
    print(f'{out}: Projektseite mit {len(list((out / "images").iterdir()))} Bildern und Demo')
    return out


if __name__ == '__main__':
    build(sys.argv[1] if len(sys.argv) > 1 else ROOT / '_site')
