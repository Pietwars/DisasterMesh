import importlib.util
import json
from pathlib import Path
import struct
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[1]
def load(name):
    spec=importlib.util.spec_from_file_location(name,ROOT/'tools'/(name+'.py'))
    m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
pack=load('package_sx1262');flash=load('flash_sx1262')

def entry(typ,sub,offset,size,label):
    return struct.pack('<HBBII16sI',0x50aa,typ,sub,offset,size,label.encode(),0)

class Packages(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.build=self.root/'build';self.build.mkdir()
        self.raw=entry(1,2,0x9000,0x5000,'nvs')+entry(0,0x10,0x10000,0x1e0000,'app0')+entry(1,0x82,0x3d0000,0x30000,'spiffs')+b'\xff'*32
        self.app=b'\xe9'+b'A'*255;self.fs=b'F'*256
        merged=bytearray(b'\xff'*(0x10000+len(self.app)));merged[0]=0xe9;merged[0x8000:0x8000+len(self.raw)]=self.raw;merged[0x10000:]=self.app
        for n,data in [('partitions.bin',self.raw),('firmware.bin',self.app),('spiffs.bin',self.fs),('firmware-merged.bin',merged)]:
            (self.build/n).write_bytes(data)
        self.folder=self.root/'package';pack.package(self.build,self.folder,'wifi','test-commit')
    def tearDown(self):self.tmp.cleanup()
    def test_factory_and_verification(self):
        m=flash.verify(self.folder);self.assertEqual(m['radio'],'sx1262');self.assertEqual(m['role'],'wifi')
        image=(self.folder/'factory.bin').read_bytes()
        self.assertEqual(len(image),4194304);self.assertEqual(image[0x10000:0x10000+len(self.app)],self.app)
        self.assertEqual(image[0x3d0000:0x3d0000+len(self.fs)],self.fs)
        self.assertEqual(image[0x8000:0x8000+len(self.raw)],self.raw)
        flash.execute(self.folder,'Check',runner=lambda *a,**k:self.fail('Check accessed device'))
    def test_damage_blocks_device_access(self):
        (self.folder/'firmware.bin').write_bytes(b'X'*len(self.app))
        with self.assertRaises(ValueError):flash.execute(self.folder,'Install','COM5',runner=lambda *a,**k:self.fail('Invalid package accessed device'))
    def test_invalid_radio_and_manifest_paths(self):
        p=self.folder/'manifest.json';m=json.loads(p.read_text());m['radio']='sx1276';p.write_text(json.dumps(m))
        with self.assertRaises(ValueError):flash.verify(self.folder)
        m['radio']='sx1262';m['files']['../file']=m['files'].pop('spiffs.bin');p.write_text(json.dumps(m))
        with self.assertRaises(ValueError):flash.verify(self.folder)
    def test_partition_and_merged_mismatch(self):
        (self.build/'firmware-merged.bin').write_bytes(b'bad')
        with self.assertRaises(ValueError):pack.package(self.build,self.root/'bad','wifi','x')
        with self.assertRaises(ValueError):pack.partitions(entry(0,0x10,0x10000,0x500000,'bad'))
        with self.assertRaises(ValueError):pack.partitions(entry(0,0x10,0x10000,100,'a')+entry(1,0x82,0x10010,100,'b'))
    def test_install_backups_before_factory_write(self):
        calls=[]
        def runner(cmd,**kw):
            calls.append(cmd)
            if 'read_flash' in cmd:Path(cmd[-1]).write_bytes(b'\xff'*4194304)
        with patch.object(flash.importlib.metadata,'version',return_value='4.8.1'):
            flash.execute(self.folder,'Install','COM5',runner=runner)
        self.assertIn('read_flash',calls[0]);self.assertIn('no_reset',calls[0]);self.assertIn('write_flash',calls[1]);self.assertEqual(calls[1][-2],'0x0');self.assertEqual(Path(calls[1][-1]).name,'factory.bin')
        self.assertEqual(len(list((self.folder/'backups').glob('*.bin'))),1)
    def test_backup_failure_never_writes(self):
        calls=[]
        def runner(cmd,**kw):calls.append(cmd);raise subprocess.CalledProcessError(1,cmd)
        with patch.object(flash.importlib.metadata,'version',return_value='4.8.1'):
            with self.assertRaises(subprocess.CalledProcessError):flash.execute(self.folder,'Install','COM5',runner=runner)
        self.assertEqual(len(calls),1);self.assertEqual(len(list((self.folder/'backups').glob('*.bin'))),0)
    def test_update_requires_role_and_matching_partition(self):
        calls=[]
        def bad(cmd,**kw):calls.append(cmd);Path(cmd[-1]).write_bytes(b'wrong')
        with patch.object(flash.importlib.metadata,'version',return_value='4.8.1'):
            with self.assertRaises(ValueError):flash.execute(self.folder,'Update','COM5',runner=bad)
            self.assertEqual(calls,[])
            with self.assertRaises(ValueError):flash.execute(self.folder,'Update','COM5',True,runner=bad)
            self.assertEqual(len(calls),1)
            calls.clear()
            def good(cmd,**kw):
                calls.append(cmd)
                if 'read_flash' in cmd:Path(cmd[-1]).write_bytes(self.raw)
            flash.execute(self.folder,'Update','COM5',True,runner=good)
        self.assertEqual(len(calls),2);self.assertIn('no_reset',calls[0]);self.assertEqual(calls[1][-2],'0x10000');self.assertEqual(Path(calls[1][-1]).name,'firmware.bin');self.assertNotIn('spiffs.bin',calls[1][-1])

if __name__=='__main__':unittest.main()
