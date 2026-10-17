#!/usr/bin/env python3
"""maps/*.geojson müssen verkleinert vorliegen (tools/shrink_geojson.py idempotent) und alle Punkte/POIs mit Namen behalten."""
import json, sys, unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
import shrink_geojson as sg

class MapsShrink(unittest.TestCase):
    def test_maps_are_shrunk_and_keep_pois(self):
        total = 0
        for f in sorted((ROOT / 'maps').glob('*.geojson')):
            raw = f.read_bytes(); total += len(raw); d = json.loads(raw)
            again = json.dumps(sg.shrink(d), ensure_ascii=False, separators=(',', ':')).encode()
            self.assertEqual(raw, again, f'{f.name}: bitte python3 tools/shrink_geojson.py maps/*.geojson ausführen')
            pts = [x for x in d['features'] if x['geometry']['type'] == 'Point']
            self.assertTrue(pts and all('osm_id' in x['properties'] for x in pts), f.name)
            self.assertIn('ODbL', d.get('attribution', ''), f.name)
        self.assertLess(total, 4_200_000, 'Kartenpakete zusammen zu groß')

    def test_poi_properties_survive(self):
        d = {'type': 'FeatureCollection', 'bbox': [7, 50, 7.2, 50.6], 'features': [
            {'type': 'Feature', 'properties': {'amenity': 'pharmacy', 'name': 'A', 'phone': '1', 'opening_hours': 'Mo'}, 'geometry': {'type': 'Polygon', 'coordinates': [[[7.1, 50.5], [7.1001, 50.5], [7.1001, 50.5001], [7.1, 50.5]]]}},
            {'type': 'Feature', 'properties': {'highway': 'residential', 'name': 'B', 'surface': 'asphalt', 'osm_id': '1'}, 'geometry': {'type': 'LineString', 'coordinates': [[7.1, 50.5], [7.100001, 50.500001], [7.2, 50.5]]}}]}
        o = sg.shrink(d)['features']
        self.assertEqual(o[0]['properties']['phone'], '1')
        self.assertEqual(o[1]['properties'], {'name': 'B', 'highway': 'residential'})
        self.assertEqual(o[1]['geometry']['coordinates'], [[7.1, 50.5], [7.2, 50.5]])

if __name__ == '__main__': unittest.main()
