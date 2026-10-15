#!/usr/bin/env python3
"""Common Windows/Linux validation; never flashes a board."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
RESULTS = ROOT / 'test-results'
PROFILES = ['disaster_ttgo_' + role for role in ('wifi','wifi_sd','repeater','room')] + ['disaster_t3s3_' + chip + '_' + role for chip in ('sx1262','sx1276') for role in ('wifi','wifi_sd','repeater','room')]


def main():
    # Redirected Windows consoles default to cp1252. Playwright's progress bar
    # contains Unicode block characters; forward them as UTF-8, including in CI.
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding='utf-8', errors='replace')
    os.environ['PYTHONUTF8'] = '1'
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--profile', choices=PROFILES, default='disaster_ttgo_wifi')
    parser.add_argument('--skip-browser', action='store_true')
    parser.add_argument('--skip-firmware', action='store_true')
    args = parser.parse_args()
    RESULTS.mkdir(exist_ok=True)
    report = {'started': datetime.now(timezone.utc).isoformat(),
              'platform': sys.platform, 'python': sys.version,
              'profile': args.profile, 'steps': [],
              'skipped': [name for name, skip in [('browser', args.skip_browser),
                          ('firmware', args.skip_firmware)] if skip],
              'hardware': 'NOT TESTED', 'success': False}

    def run(label, command):
        print(f'\n[{label}]', flush=True)
        # Resolve npm.cmd on Windows without invoking a shell.
        command = [shutil.which(command[0]) or command[0], *command[1:]]
        with (RESULTS / 'check.log').open('a', encoding='utf-8') as log:
            log.write(f'\n[{label}] {command!r}\n')
            log.flush()
            proc = subprocess.Popen(command, cwd=ROOT, stdout=subprocess.PIPE,
                                    stderr=subprocess.STDOUT, text=True,
                                    encoding='utf-8', errors='replace')
            for line in proc.stdout:
                print(line, end='', flush=True)
                log.write(line)
            code = proc.wait()
        report['steps'].append({'name': label, 'exit_code': code})
        if code:
            raise RuntimeError(f'{label}: exit {code}')

    (RESULTS / 'check.log').write_text('', encoding='utf-8')
    try:
        report['commit'] = subprocess.check_output(
            ['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
        for label, cmd in [('Node version', ['node', '--version']),
                           ('C++ version', ['g++', '--version']),
                           ('npm dependencies', ['npm', 'ci']),
                           ('JS tests', ['npm', 'test']),
                           ('Python tools', [sys.executable, 'tests/tools.test.py']),
                           ('Board profile checks', [sys.executable, 'tests/board_profiles.test.py']),
                           ('HTTP diagnostic recorder', [sys.executable, 'tests/diagnostics.test.py'])]:
            run(label, cmd)
        for name in ('history', 'repeater', 'room', 'outbox'):
            target = RESULTS / (name + ('.exe' if os.name == 'nt' else '-test'))
            run(name + ' compile', ['g++', '-std=c++17', '-Wall', '-Wextra',
                                   '-Werror', '-I', 'tests/fakes',
                                   f'tests/{name}.test.cpp', '-o', str(target)])
            run(name + ' test', [str(target)])
        if not args.skip_browser:
            run('Chromium install', ['npx', 'playwright', 'install', 'chromium'])
            run('Browser test', ['npm', 'run', 'test:browser'])
        run('Embed UTF-8 portal', [sys.executable, 'tools/embed_web.py'])
        if not args.skip_firmware:
            run('PlatformIO version', [sys.executable, '-m', 'platformio', '--version'])
            base = [sys.executable, '-m', 'platformio', 'run', '-j', '2',
                    '-d', 'firmware/MeshCore', '-e', args.profile]
            run('Firmware build', base)
            run('Merged image', base + ['-t', 'mergebin'])
            run('Filesystem image', base + ['-t', 'buildfs'])
            folder = ROOT / 'firmware/MeshCore/.pio/build' / args.profile
            names = ('firmware.bin', 'firmware-merged.bin', 'spiffs.bin')
            checksums = [hashlib.sha256((folder / n).read_bytes()).hexdigest()
                         + '  ' + n for n in names]
            (folder / 'SHA256SUMS.txt').write_text('\n'.join(checksums) + '\n', encoding='utf-8')
        report['success'] = True
    except (OSError, subprocess.SubprocessError, RuntimeError) as exc:
        report['error'] = str(exc)
        print(f'FAILED: {exc}', file=sys.stderr)
    finally:
        report['finished'] = datetime.now(timezone.utc).isoformat()
        (RESULTS / 'check.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    return 0 if report['success'] else 1


if __name__ == '__main__':
    sys.exit(main())
