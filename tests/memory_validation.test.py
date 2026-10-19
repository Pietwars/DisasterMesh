"""Hosttests für tools/validate_memory.py (aus DisAHRsterRadio-MeshCore 0.9.4, angepasst an klassische ESP32).

Synthetische ESP-Abbilder und echtes Binärformat der Partitionstabelle (Layout min_spiffs wie im Build).
"""
import hashlib
import json
import struct
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
import validate_memory as v

APP, APP_SIZE, FS, FS_SIZE = 0x10000, 0x1E0000, 0x3D0000, 0x20000


def image(payload=b'firmware', size_code=2, chip=0, digest=True):
    header = bytearray(24)
    header[:4] = bytes((0xE9, 1, 2, size_code << 4 | 15))
    struct.pack_into('<H', header, 12, chip)
    header[23] = int(digest)
    data = header + struct.pack('<II', 0x3F400020, len(payload)) + payload
    checksum = 0xEF
    for byte in payload:
        checksum ^= byte
    data += bytes(15 - len(data) % 16) + bytes((checksum,))
    if digest:
        data += hashlib.sha256(data).digest()
    return bytes(data)


def partition(label, kind, subtype, offset, size):
    return struct.pack('<HBBII16sI', 0x50AA, kind, subtype, offset, size, label.encode(), 0)


def table(rows=None):
    rows = rows if rows is not None else [
        partition('nvs', 1, 2, 0x9000, 0x5000),
        partition('otadata', 1, 0, 0xE000, 0x2000),
        partition('app0', 0, 0x10, APP, APP_SIZE),
        partition('app1', 0, 0x11, 0x1F0000, APP_SIZE),
        partition('spiffs', 1, 0x82, FS, FS_SIZE),
        partition('coredump', 1, 3, 0x3F0000, 0x10000)]
    data = b''.join(rows)
    data += b'\xeb\xeb' + b'\xff' * 14 + hashlib.md5(data).digest()
    return data + b'\xff' * (0xC00 - len(data))


class MemoryValidation(unittest.TestCase):
    def setUp(self):
        self.boards = json.loads(v.BOARDS.read_text())
        self.board = self.boards['TTGO_T3_V161_WLAN']
        self.firmware, self.boot, self.table, self.fs = image(), image(b'boot'), table(), b'fs'
        self.log = ('RAM:   [===       ]  25.4% (used 83336 bytes from 327680 bytes)\n'
                    'Flash: [=======   ]  65.7% (used 1291461 bytes from 1966080 bytes)\n')

    def validate(self, **overrides):
        args = dict(board=self.board, firmware=self.firmware, bootloader=self.boot,
                    table=self.table, filesystem=self.fs, log=self.log)
        args.update(overrides)
        return v.validate_artifacts(**args)

    def test_board_contracts(self):
        envs = [b['env'] for b in self.boards.values()]
        self.assertEqual(len(envs), len(set(envs)))
        ini = (ROOT / 'firmware/MeshCore/platformio.local.ini').read_text()
        for env in envs:
            self.assertIn(f'[env:{env}]', ini)
        report = self.validate()
        self.assertEqual(report['memory']['ram']['free'], 327680 - 83336)
        self.assertEqual(report['flash_unused_bytes'], 0)
        heltec = self.boards['Heltec_V2_WLAN']  # 8 MiB Flash, Layout nutzt nur 4 MiB
        report = self.validate(board=heltec, firmware=image(size_code=3), bootloader=image(b'boot', size_code=3))
        self.assertEqual(report['flash_unused_bytes'], 4 * 1024 * 1024)

    def test_bad_headers(self):
        for data in [b'', image(size_code=3), image(chip=9), self.firmware[:24],
                     self.firmware[:-1], self.firmware + b'x']:
            with self.subTest(data=data[:4]), self.assertRaises(ValueError):
                self.validate(firmware=data)
        with self.assertRaisesRegex(ValueError, 'header flash size'):
            self.validate(bootloader=image(size_code=3))

    def test_corrupt_payload_checksum_and_digest(self):
        for index in [32, 47, -1]:
            bad = bytearray(self.firmware)
            bad[index] ^= 1
            with self.subTest(index=index), self.assertRaises(ValueError):
                self.validate(firmware=bad)

    def test_partition_integrity_and_bounds(self):
        bad = bytearray(self.table)
        bad[12] ^= 1
        with self.assertRaisesRegex(ValueError, 'MD5'):
            self.validate(table=bad)
        for rows in [[partition('app0', 0, 0x10, APP, 0x400000)],
                     [partition('nvs', 1, 2, 0x8000, 0x1000)],
                     [partition('a', 1, 2, 0x9000, 0x5000), partition('b', 1, 2, 0xA000, 0x1000)],
                     [partition('nvs', 1, 2, 0x9000, 0x1000)]]:
            with self.subTest(rows=rows), self.assertRaises(ValueError):
                self.validate(table=table(rows))

    def test_oversize_firmware_and_filesystem(self):
        with self.assertRaisesRegex(ValueError, 'application partition'):
            self.validate(firmware=image(b'x' * APP_SIZE))
        with self.assertRaisesRegex(ValueError, 'spiffs.bin'):
            self.validate(filesystem=b'x' * (FS_SIZE + 1))
        firmware = image(b'x' * (APP_SIZE - 80))
        self.assertEqual(len(firmware), APP_SIZE)
        self.assertEqual(self.validate(firmware=firmware)['app_free_bytes'], 0)

    def test_invalid_size_reports(self):
        for log in ['', self.log.replace('327680', '100000'),
                    self.log.replace('83336', '400000'), self.log.replace('1966080', '3145728')]:
            with self.subTest(log=log), self.assertRaises(ValueError):
                self.validate(log=log)

    def test_cli_writes_reports_and_fails_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            d = Path(directory)
            for name, data in [('firmware.bin', self.firmware), ('bootloader.bin', self.boot),
                               ('partitions.bin', self.table), ('spiffs.bin', self.fs)]:
                (d / name).write_bytes(data)
            (d / 'build.log').write_text(self.log)
            command = [sys.executable, str(ROOT / 'tools/validate_memory.py'), '--env', self.board['env'],
                       '--build-dir', str(d), '--build-log', str(d / 'build.log'), '--output', str(d / 'memory')]
            subprocess.run(command, check=True, capture_output=True)
            self.assertEqual(json.loads((d / 'memory.json').read_text())['device'], 'TTGO_T3_V161_WLAN')
            self.assertIn('Statisches RAM', (d / 'memory.md').read_text())
            (d / 'firmware.bin').write_bytes(image(size_code=3))
            self.assertNotEqual(subprocess.run(command, capture_output=True).returncode, 0)
            unknown = command[:]
            unknown[unknown.index('--env') + 1] = 'gibt_es_nicht'
            self.assertNotEqual(subprocess.run(unknown, capture_output=True).returncode, 0)


if __name__ == '__main__':
    unittest.main()
