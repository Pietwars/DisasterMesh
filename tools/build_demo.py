#!/usr/bin/env python3
"""Reproducible static demo from the real portal, without any device connection."""
from pathlib import Path
from web_assets import inline_theme
import shutil
ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'docs/demo';out.mkdir(parents=True,exist_ok=True)
html=inline_theme((ROOT/'web/index.html').read_text(encoding='utf-8'))
html=html.replace('<script src="protocol.js"></script>','<script>'+(ROOT/'web/demo.js').read_text(encoding='utf-8')+'</script><script src="protocol.js"></script>')
for name in ('protocol','map','map-library','app'):
 html=html.replace(f'<script src="{name}.js"></script>','<script>'+(ROOT/f'web/{name}.js').read_text(encoding='utf-8')+'</script>')
data=(ROOT/'maps/heimersheim.geojson').read_text(encoding='utf-8')
html=html.replace('</body>', '<script>useOfflineMap('+data+',false).catch(()=>{});</script></body>')
html=html.replace('<title>MeshAhrtal · DisAHRsterRadio</title>','<title>MeshAhrtal · interaktive Demo 0.7.1.1</title>')
(out/'index.html').write_text(html,encoding='utf-8')
for name in ('app.webmanifest','app-icon.png'):shutil.copyfile(ROOT/'web'/name,out/name)
(out/'.nojekyll').write_text('')
print(f'Demo built: {len(html.encode())} bytes, all simulated API data labelled.')
