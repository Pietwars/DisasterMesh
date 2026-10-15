"""Exercise actual HTTP/JSONL recording without board hardware."""
import importlib.util
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import tempfile
import threading
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('capture', Path(__file__).resolve().parents[1] / 'tools/capture_diagnostics.py')
capture = importlib.util.module_from_spec(spec)
spec.loader.exec_module(capture)


class RecordingTest(unittest.TestCase):
    def setUp(self):
        self.replies = []
        self.requests = []
        owner = self
        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                owner.requests.append((self.path, self.headers.get('X-Disaster-Request')))
                status, body = owner.replies.pop(0) if owner.replies else (503, b'PRIVATE BODY')
                self.send_response(status)
                self.end_headers()
                self.wfile.write(body)
            def log_message(self, *args):
                pass
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.url = 'http://127.0.0.1:' + str(self.server.server_port)

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()

    def state(self, uptime):
        return json.dumps({'heap': 12345, 'storage': True, 'queueStorage': False,
                           'contacts': ['PRIVATE CONTACT'], 'messages': ['PRIVATE TEXT'],
                           'diagnostics': {'uptimeSeconds': uptime, 'firmware': 'test',
                                           'txBudgetMs': 0, 'txBudgetWaiting': False, 'txBudgetWaitEvents': 0, 'txBudgetWaitSeconds': 7, 'txQueuePackets': 3, 'txFlood': True, 'password': 'SECRET'}}).encode()

    def test_real_http_allowlist_and_missing_values(self):
        self.replies.append((200, self.state(20)))
        data = capture.read_snapshot(self.url, 2)
        self.assertEqual(self.requests, [('/api/state', '1')])
        self.assertEqual(data['txBudgetMs'], 0)
        self.assertIs(data['txBudgetWaiting'], False)
        self.assertEqual(data['txBudgetWaitEvents'], 0)
        self.assertEqual(data['txBudgetWaitSeconds'], 7)
        self.assertEqual(data['txQueuePackets'], 3)
        self.assertIsNone(data['txFlood'])
        self.assertIsNone(data['rxDirect'])
        self.assertFalse(data['queueStorage'])
        self.assertNotIn('contacts', data)
        self.assertNotIn('password', data)

    def test_invalid_or_oversized_api(self):
        for raw in (b'not json', b'{}', b'[]', b'x' * (capture.LIMIT + 1)):
            self.replies.append((200, raw))
            with self.assertRaises(ValueError):
                capture.read_snapshot(self.url, 2)
        with self.assertRaises(ValueError):
            capture.read_snapshot('http://user:secret@localhost', 2)

    def test_capture_gaps_uptime_drop_and_no_overwrite(self):
        self.replies = [(200, self.state(100)), (503, b'PRIVATE BODY'), (200, self.state(2))]
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / 'log.jsonl'
            code = capture.capture(output, self.url, 0.02, 1, 2)
            raw = output.read_text(encoding='utf-8')
            rows = [json.loads(line) for line in raw.splitlines()]
            self.assertEqual(code, 2)
            samples = [r for r in rows if r['type'] == 'sample']
            self.assertEqual(len(samples), 2)
            self.assertTrue(samples[1]['uptimeDecreased'])
            self.assertEqual(rows[-1]['uptimeDecreases'], 1)
            self.assertGreaterEqual(rows[-1]['failures'], 1)
            self.assertNotIn('PRIVATE', raw)
            self.assertNotIn('SECRET', raw)
            with self.assertRaises(FileExistsError):
                capture.capture(output, self.url, 1, 1, 1)
            self.assertEqual(output.read_text(encoding='utf-8'), raw)

    def test_complete_short_recording(self):
        self.replies = [(200, self.state(n)) for n in range(100)]
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / 'log.jsonl'
            self.assertEqual(capture.capture(output, self.url, 0.02, 0.25, 2), 0)
            last = json.loads(output.read_text(encoding='utf-8').splitlines()[-1])
            self.assertEqual(last['failures'], 0)
            self.assertEqual(last['stopped'], 'duration')

    def test_interruption_writes_summary(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / 'log.jsonl'
            with patch.object(capture, 'read_snapshot', side_effect=KeyboardInterrupt):
                self.assertEqual(capture.capture(output, self.url, 1, 10, 2), 2)
            last = json.loads(output.read_text(encoding='utf-8').splitlines()[-1])
            self.assertEqual(last['stopped'], 'interrupted')
            self.assertEqual(last['samples'], 0)


if __name__ == '__main__':
    unittest.main()
