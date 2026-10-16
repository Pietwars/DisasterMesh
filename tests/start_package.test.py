import importlib.util, json, pathlib, subprocess, tempfile, unittest, zipfile
ROOT = pathlib.Path(__file__).resolve().parents[1]
def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'tools' / f'{name}.py'); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
bsp, rec = load('build_start_package'), load('record_pruefstand')
SHA = 'a' * 40

def git(cwd, *args):
    return subprocess.check_output(['git', *args], cwd=cwd, text=True).strip()

def checklist(**over):
    t = json.loads(rec.TEMPLATE.read_text(encoding='utf-8'))
    c = {'release_version': '0.8.0', 'source_commit': SHA, 'pruefer': 'Peter', 'datum': '2026-11-01',
         'software': {k: {'ergebnis': 'bestanden', 'beleg': 'log.txt'} for k in t['software']},
         'hardware': {k: {'ergebnis': 'bestanden', 'beleg': 'protokoll.pdf'} for k in t['hardware']}}
    c.update(over); return c

CI = {'runs': [{'id': i, 'name': n, 'html_url': 'u', 'head_sha': SHA, 'conclusion': 'success'} for i, n in enumerate(rec.REQUIRED_WORKFLOWS)],
      'artifacts': [{'id': 9, 'name': 'DisAHRsterRadio-SX1262-Windows-wifi_gps', 'workflow_run': {'id': 2}}]}

class StartPackageTest(unittest.TestCase):
    def test_release_refuses_unchecked_tree(self):
        with tempfile.TemporaryDirectory() as d:
            d = pathlib.Path(d)
            git(d, 'init', '-q'); git(d, 'config', 'user.email', 't@t'); git(d, 'config', 'user.name', 't')
            for f in ('web/index.html', 'maps/x.geojson', 'tools/build_demo.py', 'tools/web_assets.py'):
                (d / f).parent.mkdir(parents=True, exist_ok=True); (d / f).write_text('v1')
            git(d, 'add', '.'); git(d, 'commit', '-qm', 'x'); head = git(d, 'rev-parse', 'HEAD')
            ok = {'source_commit': head, 'runs': [{'conclusion': 'success', 'head_sha': head}]}
            bsp.check_evidence(ok, d)
            with self.assertRaisesRegex(ValueError, 'CI'): bsp.check_evidence({**ok, 'runs': [{'conclusion': 'failure'}]}, d)
            with self.assertRaisesRegex(ValueError, 'CI'): bsp.check_evidence({**ok, 'runs': []}, d)
            (d / 'web/index.html').write_text('v2')
            with self.assertRaisesRegex(ValueError, 'web/index.html'): bsp.check_evidence(ok, d)
            (d / 'web/index.html').write_text('v1'); (d / 'web/new.js').write_text('x'); git(d, 'add', '.')
            with self.assertRaisesRegex(ValueError, 'web/new.js'): bsp.check_evidence(ok, d)

    def test_current_evidence_does_not_cover_working_tree(self):
        with self.assertRaises(ValueError):
            bsp.build(evidence_path=ROOT / 'docs/PRUEFSTAND_2026-10-15.json', out_dir=tempfile.mkdtemp())

    def test_preview_is_labelled_and_never_release_named(self):
        with tempfile.TemporaryDirectory() as d:
            out = bsp.build(preview=True, out_dir=d)
            self.assertNotEqual(out.name, bsp.RELEASE_NAME); self.assertIn('UNGEPRUEFT-Vorschau', out.name)
            self.assertEqual([p.name for p in pathlib.Path(d).iterdir()], [out.name])
            with zipfile.ZipFile(out) as z:
                start = z.read('START.html').decode(); names = z.namelist()
                self.assertIn('class="watermark"', start); self.assertIn('UNGEPRÜFT – Vorschau', start)
                self.assertTrue(z.read('LIESMICH.txt').decode().startswith('UNGEPRÜFT'))
                self.assertIn('disaster_t3s3_sx1262_wifi_gps', start); self.assertIn(bsp.current_version(), start)
                self.assertIn('assets/disahrsterradio-header.jpg', names); self.assertNotIn('assets/ahrtal-night.jpg', names)
                self.assertFalse(any(n.startswith('docs/PRUEFSTAND_2') for n in names))

    def test_record_requires_explicit_results(self):
        self.assertEqual(rec.validate(checklist()), [])
        c = checklist(); c['hardware']['utf8_grenze'] = {'ergebnis': None, 'beleg': ''}
        self.assertTrue(any('utf8_grenze' in e for e in rec.validate(c)))
        c = checklist(); c['hardware']['start_ab'] = {'ergebnis': 'bestanden', 'beleg': ''}
        self.assertTrue(any('Beleg' in e for e in rec.validate(c)))
        c = checklist(); c['software']['npm_test'] = {'ergebnis': 'nicht geprüft', 'beleg': ''}
        self.assertTrue(any('npm_test' in e for e in rec.validate(c)))
        self.assertTrue(rec.validate(checklist(source_commit='abc', pruefer='')))

    def test_record_writes_evidence_once(self):
        with tempfile.TemporaryDirectory() as d:
            c = checklist(); c['hardware']['langzeit_24h'] = {'ergebnis': 'nicht geprüft', 'beleg': ''}
            out = rec.record(c, CI, d); data = json.loads(out.read_text(encoding='utf-8'))
            self.assertEqual(out.name, 'PRUEFSTAND_2026-11-01.json'); self.assertFalse(data['hardware_tested'])
            self.assertEqual(len(data['runs']), 4); self.assertEqual(data['artifacts'][0]['id'], 9)
            with self.assertRaisesRegex(ValueError, 'existiert'): rec.record(c, CI, d)
            c = checklist(datum='2026-11-02'); c['hardware']['gps_fix_optional'] = {'ergebnis': 'nicht geprüft', 'beleg': ''}
            self.assertTrue(json.loads(rec.record(c, CI, d).read_text(encoding='utf-8'))['hardware_tested'])
            bad = {**CI, 'runs': [{**CI['runs'][0], 'conclusion': 'failure'}] + CI['runs'][1:]}
            with self.assertRaisesRegex(ValueError, 'nicht erfolgreich'): rec.record(checklist(datum='2026-11-03'), bad, d)
            with self.assertRaisesRegex(ValueError, 'fehlt'): rec.record(checklist(datum='2026-11-03'), {'runs': CI['runs'][:2], 'artifacts': []}, d)

if __name__ == '__main__':
    unittest.main()
