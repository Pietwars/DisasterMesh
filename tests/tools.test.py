import importlib.util, pathlib,struct,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
def load(name):
    spec=importlib.util.spec_from_file_location(name,ROOT/'tools'/f'{name}.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
class ToolsTest(unittest.TestCase):
    def test_osm(self):
        data=load('osm_to_geojson').convert(b'<osm><node id="1" lat="50" lon="7"/><node id="2" lat="50.1" lon="7.1"/><way id="3"><nd ref="1"/><nd ref="2"/><tag k="highway" v="residential"/><tag k="name" v="Teststrasse"/></way></osm>')
        self.assertEqual(data['features'][0]['geometry']['coordinates'],[[7,50],[7.1,50.1]])
        self.assertIn('OpenStreetMap',data['attribution'])
    def test_archive(self):
        p=bytes([0xf3,0,2])+struct.pack('<I',1792000000)+b'Hello';chunk=struct.pack('<IH176s',1,len(p),p);h=2166136261
        for b in chunk:h=((h^b)*16777619)&0xffffffff
        raw=chunk+struct.pack('<I',h);parser=load('archive_to_json').records
        self.assertEqual(parser(raw)[0]['text'],'Hello');self.assertEqual(parser(raw)[0]['target'],'c2')
        self.assertEqual(parser(raw[:-1]),[]);self.assertEqual(parser(raw[:12]+b'X'+raw[13:]),[])
if __name__=='__main__':unittest.main()
