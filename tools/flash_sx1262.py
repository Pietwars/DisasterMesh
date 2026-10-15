#!/usr/bin/env python3
"""Verify and flash a DisAHRsterRadio T3-S3/SX1262 package. No device access on Check."""
import argparse
import hashlib
import importlib.metadata
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile

FILES = {'factory.bin', 'firmware.bin', 'partitions.bin', 'spiffs.bin'}
ROLES = {'wifi', 'wifi_sd', 'repeater', 'room'}


def verify(folder):
    folder = Path(folder)
    manifest = json.loads((folder / 'manifest.json').read_text(encoding='utf-8'))
    if (manifest.get('format') != 'DisAHRsterRadio-SX1262-package' or
            manifest.get('version') != 1 or manifest.get('chip') != 'esp32s3' or
            manifest.get('radio') != 'sx1262' or manifest.get('role') not in ROLES or
            manifest.get('flashBytes') != 4194304 or manifest.get('partitionOffset') != 32768 or
            manifest.get('factoryOffset') != 0 or manifest.get('appOffset') != 65536 or
            set(manifest.get('files', {})) != FILES):
        raise ValueError('Unsupported or invalid SX1262 package manifest')
    for name in sorted(FILES):
        spec = manifest['files'][name]
        p = folder / name
        if p.is_symlink():
            raise ValueError('Package images must be regular files')
        size = p.stat().st_size
        if not 0 < size <= 4194304 or size != spec.get('size'):
            raise ValueError('Invalid image size: ' + name)
        if hashlib.sha256(p.read_bytes()).hexdigest() != spec.get('sha256'):
            raise ValueError('Checksum mismatch: ' + name)
    if (folder/'factory.bin').stat().st_size != manifest['flashBytes']:
        raise ValueError('Factory image must cover the complete 4 MB flash')
    return manifest


def execute(folder, action, port=None, same_role=False, runner=subprocess.run):
    folder = Path(folder).resolve()
    m = verify(folder)  # Validate every image before any device access.
    print('Verified: T3-S3 V1.3 / SX1262 / role ' + m['role'], flush=True)
    if action == 'Check':
        return
    if not port or not re.fullmatch(r'COM[1-9][0-9]*', port, re.IGNORECASE):
        raise ValueError('Specify the actual Windows COM port, e.g. COM5')
    if action == 'Update' and not same_role:
        raise ValueError('Update requires --same-role after confirming the same board and role')
    if action not in ('Backup', 'Install', 'Update'):
        raise ValueError('Unknown action')
    if importlib.metadata.version('esptool') != '4.8.1':
        raise ValueError('Install esptool==4.8.1 with this Python interpreter first')
    base = [sys.executable, '-m', 'esptool', '--chip', 'esp32s3', '--port', port, '--baud', '115200']
    if action in ('Backup', 'Install'):
        backup_dir = folder / 'backups'
        backup_dir.mkdir(exist_ok=True)
        import os
        fd, name = tempfile.mkstemp(prefix='esp32s3-', suffix='.partial', dir=backup_dir)
        os.close(fd)
        partial = Path(name)
        runner(base + ['--after', 'hard_reset' if action == 'Backup' else 'no_reset', 'read_flash', '0x0', '0x400000', str(partial)], check=True)
        if partial.stat().st_size != m['flashBytes']:
            raise ValueError('Backup incomplete; no firmware written')
        complete = partial.with_suffix('.bin')
        partial.rename(complete)
        print('Private local flash backup: ' + str(complete), flush=True)
        if action == 'Backup':
            return
    if action == 'Update':
        # Matching partition bytes do not prove the same role; --same-role is still required.
        with tempfile.TemporaryDirectory(prefix='disahr-partitions-') as td:
            current = Path(td) / 'partitions.bin'
            expected = (folder/'partitions.bin').read_bytes()
            runner(base + ['--after', 'no_reset', 'read_flash', hex(m['partitionOffset']), hex(len(expected)), str(current)], check=True)
            if current.read_bytes() != expected:
                raise ValueError('Partition layout differs; application update refused')
        image, offset = 'firmware.bin', m['appOffset']
    else:
        image, offset = 'factory.bin', m['factoryOffset']
    runner(base + ['write_flash', '--flash_size', '4MB', hex(offset), str(folder/image)], check=True)
    print('Upload completed; reset the board and verify it on real hardware.', flush=True)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('action', choices=['Check', 'Backup', 'Install', 'Update'])
    p.add_argument('--port')
    p.add_argument('--same-role', action='store_true')
    args = p.parse_args()
    try:
        execute(Path(__file__).resolve().parent, args.action, args.port, args.same_role)
    except (OSError, ValueError, KeyError, TypeError, importlib.metadata.PackageNotFoundError,
            subprocess.CalledProcessError) as e:
        print('Stopped: ' + str(e), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
