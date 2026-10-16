import importlib.util, pathlib, re, tempfile, unittest
ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('build_site', ROOT / 'tools/build_site.py'); site = importlib.util.module_from_spec(spec); spec.loader.exec_module(site)

class SiteTest(unittest.TestCase):
    def test_site_is_complete_and_local(self):
        with tempfile.TemporaryDirectory() as d:
            out = site.build(pathlib.Path(d) / 'site'); page = (out / 'index.html').read_text(encoding='utf-8')
            for ref in re.findall(r'(?:src|href)="([^"#]+)"', page):
                if ref.startswith('https://'): continue
                target = out / ref
                self.assertTrue((target / 'index.html').exists() if ref.endswith('/') else target.exists(), ref)
            self.assertNotRegex(page, r'<(?:script|link)[^>]+(?:src|href)="https?://')
            for text in ('Im Notfall immer 112', 'Prototyp', '© Pietwars', 'OpenStreetMap', 'releases/latest', 'demo/'):
                self.assertIn(text, page)
            self.assertIn('lang="de"', page); self.assertIn('width=device-width', page)

    def test_flyer_source_and_qr(self):
        flyer = (ROOT / 'docs/flyer/flyer.html').read_text(encoding='utf-8')
        self.assertIn('github.com/Pietwars/DisasterMesh', flyer); self.assertIn('Im Notfall immer 112', flyer); self.assertNotIn('whatsapp', flyer.lower())
        self.assertTrue((ROOT / 'docs/flyer/qr-github.svg').exists()); self.assertTrue((ROOT / 'docs/flyer/DisAHRsterRadio-Flyer.pdf').read_bytes().startswith(b'%PDF'))

if __name__ == '__main__':
    unittest.main()
