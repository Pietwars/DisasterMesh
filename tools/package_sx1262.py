#!/usr/bin/env python3
"""Package an already-built T3-S3 SX1262 profile with a factory image and Windows flasher."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import struct
import subprocess

ROOT = Path(__file__).resolve().parents[1]
ROLES = ('wifi', 'wifi_sd', 'repeater', 'room')
FLASH = 4194304


def partitions(raw):
    result = []
    if not raw or len(raw) % 32 or len(raw) > 4096:
        raise ValueError('Invalid partition-table length')
    for at in range(0, len(raw), 32):
        magic, typ, subtype, offset, size, label, flags = struct.unpack('<HBBII16sI', raw[at:at+32])
        if magic in (0xffff, 0xebeb):
            break
        if magic != 0x50aa or not size or offset + size > FLASH:
            raise ValueError('Invalid partition record')
        result.append((typ, subtype, offset, size))
    if not result:
        raise ValueError('No partition records')
    ranges = sorted((p[2], p[2]+p[3]) for p in result)
    if any(a[1] > b[0] for a,b in zip(ranges, ranges[1:])):
        raise ValueError('Overlapping partitions')
    return result


def package(build, output, role, commit):
    if role not in ROLES:
        raise ValueError('Unknown role')
    build, output = Path(build), Path(output)
    raw = (build/'partitions.bin').read_bytes()
    table = partitions(raw)
    apps = [p for p in table if p[0] == 0]
    spi = [p for p in table if p[:2] == (1, 0x82)]
    if not apps or len(spi) != 1:
        raise ValueError('Expected app and exactly one SPIFFS partition')
    app = min(apps, key=lambda p:p[2]); fs = spi[0]
    # These are the supported ESP32-S3 min_spiffs package layout and write offsets.
    if app[2] != 65536 or min(p[2] for p in table) < 0x9000:
        raise ValueError('Unsupported app/partition offsets')
    firmware = (build/'firmware.bin').read_bytes()
    merged = (build/'firmware-merged.bin').read_bytes()
    spiffs = (build/'spiffs.bin').read_bytes()
    if not firmware or len(firmware) > app[3] or not spiffs or len(spiffs) > fs[3]:
        raise ValueError('Image does not fit partition')
    if (len(merged) > fs[2] or merged[0x8000:0x8000+len(raw)] != raw or
            merged[app[2]:app[2]+len(firmware)] != firmware or not merged or merged[0] != 0xe9):
        raise ValueError('Merged ESP32-S3 image does not match partition table/application')
    image = bytearray(b'\xff' * FLASH)
    image[:len(merged)] = merged
    image[fs[2]:fs[2]+len(spiffs)] = spiffs
    output.mkdir(parents=True, exist_ok=False)
    (output/'factory.bin').write_bytes(image)
    for name in ('firmware.bin', 'partitions.bin', 'spiffs.bin'):
        shutil.copyfile(build/name, output/name)
    shutil.copyfile(ROOT/'tools/flash_sx1262.py', output/'flash_sx1262.py')
    shutil.copyfile(ROOT/'tools/windows/SX1262-Paket.ps1', output/'Flashen.ps1')
    shutil.copyfile(ROOT/'docs/SX1262_PAKET.md', output/'LESEN.md')
    for name in ('SX1262_BOARD.md', 'SX1262_PAKET.md', 'VALIDIERUNG.md'):
        shutil.copyfile(ROOT/'docs'/name, output/name)
    manifest = {'format':'DisAHRsterRadio-SX1262-package', 'version':1,
                'board':'LILYGO T3-S3 V1.3', 'chip':'esp32s3', 'radio':'sx1262',
                'role':role, 'sourceCommit':commit, 'flashBytes':FLASH,
                'factoryOffset':0, 'partitionOffset':32768, 'appOffset':app[2],
                'spiffsOffset':fs[2], 'files':{}}
    for name in ('factory.bin','firmware.bin','partitions.bin','spiffs.bin'):
        data=(output/name).read_bytes()
        manifest['files'][name]={'size':len(data),'sha256':hashlib.sha256(data).hexdigest()}
    (output/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    (output/'SHA256SUMS.txt').write_text(''.join(v['sha256']+'  '+k+'\n' for k,v in manifest['files'].items()),encoding='utf-8')
    return manifest


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--role',choices=ROLES,required=True)
    p.add_argument('--output',type=Path,required=True)
    args=p.parse_args()
    commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    folder=ROOT/'firmware/MeshCore/.pio/build'/('disaster_t3s3_sx1262_'+args.role)
    package(folder,args.output,args.role,commit)
    print(args.output)


if __name__=='__main__':
    main()
