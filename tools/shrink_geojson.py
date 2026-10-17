#!/usr/bin/env python3
"""Verkleinert die OSM-Kartenpakete in maps/*.geojson (Verbesserungsliste 5, Gegenstück zu HaldenFunk/tools/shrink_maps.py).

- Koordinaten auf 5 Nachkommastellen (~1 m) runden, doppelte Punkte entfernen
- Linien/Flächen mit Douglas-Peucker vereinfachen (Gebäude ~0,6 m, Straßen/Gewässer ~2 m, Flächen ~3 m)
- Punkte und alle Objekte, die als POI gelten können (amenity, healthcare, shop, …), behalten ALLE Eigenschaften
- übrige Linien/Flächen behalten nur die von der Weboberfläche genutzten Eigenschaften
  (name, highway, waterway, natural, building, landuse, place) sowie railway/water für DisAHRsterRadio/tools/make_map.py
- kompaktes JSON ohne Leerzeichen; Kopfdaten (Name, Quelle, Stand, bbox, viewBounds, Lizenz) bleiben

Aufruf: python3 tools/shrink_geojson.py maps/*.geojson   (überschreibt die Dateien; idempotent)
"""
import json, math, sys
from pathlib import Path

KEEP = ('name', 'highway', 'waterway', 'natural', 'building', 'landuse', 'place', 'railway', 'water')
POI_KEYS = ('amenity', 'healthcare', 'shop', 'man_made', 'drinking_water', 'emergency', 'tourism', 'poi_position', 'office', 'social_facility')

def tol_m(p):
    if p.get('building'): return 0.6
    if p.get('highway') or p.get('waterway') or p.get('railway'): return 2.0
    return 3.0

def dp(pts, tol, k):  # Douglas-Peucker in Metern (lokal eben)
    if len(pts) < 3: return pts
    sx, sy = 111320 * k, 110540
    keep = [False] * len(pts); keep[0] = keep[-1] = True; st = [(0, len(pts) - 1)]
    while st:
        a, b = st.pop(); ax, ay = pts[a][0] * sx, pts[a][1] * sy; bx, by = pts[b][0] * sx, pts[b][1] * sy
        dx, dy = bx - ax, by - ay; L = math.hypot(dx, dy); best, bi = -1, -1
        for i in range(a + 1, b):
            px, py = pts[i][0] * sx, pts[i][1] * sy
            d = abs(dy * px - dx * py + bx * ay - by * ax) / L if L else math.hypot(px - ax, py - ay)
            if d > best: best, bi = d, i
        if best > tol: keep[bi] = True; st += [(a, bi), (bi, b)]
    return [p for p, f in zip(pts, keep) if f]

def line(cs, tol, k, ring=False):
    r = []
    for c in cs:
        p = [round(c[0], 5), round(c[1], 5)]
        if not r or p != r[-1]: r.append(p)
    if ring and len(r) >= 4:
        s = dp(r[:-1], tol, k) + [r[0]] if r[0] == r[-1] else dp(r, tol, k)
        return s if len(s) >= 4 else r
    return dp(r, tol, k) if len(r) >= 2 else r

def shrink(d):
    b = d.get('bbox') or [6.6, 50.3, 7.3, 50.6]; k = math.cos(math.radians((b[1] + b[3]) / 2))
    out = []
    for f in d['features']:
        g, p = f.get('geometry'), f.get('properties') or {}
        if not g: continue
        t, cs = g['type'], g['coordinates']; tol = tol_m(p)
        if t == 'Point': cs = [round(cs[0], 5), round(cs[1], 5)]
        elif t == 'LineString': cs = line(cs, tol, k)
        elif t == 'MultiLineString': cs = [line(l, tol, k) for l in cs]
        elif t == 'Polygon': cs = [line(r, tol, k, True) for r in cs]
        elif t == 'MultiPolygon': cs = [[line(r, tol, k, True) for r in pg] for pg in cs]
        if t != 'Point' and not any(x in p for x in POI_KEYS):
            p = {x: p[x] for x in KEEP if x in p}
        out.append({'type': 'Feature', 'properties': p, 'geometry': {'type': t, 'coordinates': cs}})
    d = dict(d); d['features'] = out
    return d

if __name__ == '__main__':
    for fn in sys.argv[1:]:
        f = Path(fn); raw = f.read_bytes(); d = json.loads(raw)
        n = json.dumps(shrink(d), ensure_ascii=False, separators=(',', ':')).encode()
        f.write_bytes(n)
        print(f'{f.name:22s} {len(raw):>9} -> {len(n):>9} Bytes ({len(d["features"])} Objekte)')
