"""Inline the local MeshAhrtal theme/photo for firmware and portable demos."""
from pathlib import Path
import base64
ROOT=Path(__file__).resolve().parents[1]
def inline_theme(html):
    css=(ROOT/'web/theme.css').read_text(encoding='utf-8')
    photo=(ROOT/'web/assets/ahrtal-night.jpg').read_bytes()
    if len(photo)>100000:
        raise ValueError('Photo exceeds the embedded portal asset budget')
    css=css.replace('url("assets/ahrtal-night.jpg")','url("data:image/jpeg;base64,'+base64.b64encode(photo).decode()+'")')
    if 'assets/ahrtal-night.jpg' in css:
        raise ValueError('Unresolved local image')
    # One data URI definition avoids storing the same photo twice in flash.
    uri='data:image/jpeg;base64,'+base64.b64encode(photo).decode()
    css=css.replace('url("'+uri+'")','var(--ahrtal-photo)')
    css=':root{--ahrtal-photo:url("'+uri+'")}\n'+css
    marker='<link rel="stylesheet" href="theme.css">'
    if marker not in html:raise ValueError('Missing theme link')
    return html.replace(marker,'<style>'+css+'</style>')
