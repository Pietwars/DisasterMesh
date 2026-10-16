"""Cross-board SD isolation and explicit hardware-profile regression checks."""
import configparser
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
ROOT=Path(__file__).resolve().parents[1]

class BoardProfiles(unittest.TestCase):
    def test_s3_profiles(self):
        cfg=configparser.ConfigParser(interpolation=None)
        cfg.read(ROOT/'firmware/MeshCore/platformio.local.ini')
        for chip in ('sx1262','sx1276'):
            for role,uprole in [('wifi','companion_radio_usb'),('repeater','repeater'),('room','room_server')]:
                p=cfg[f'env:disaster_t3s3_{chip}_{role}']
                self.assertEqual(p['extends'],f'env:LilyGo_T3S3_{chip}_{uprole}')
                self.assertEqual(p['board_build.partitions'],'min_spiffs.csv')
                self.assertIn('-D LORA_TX_POWER=10',p['build_flags'])
                self.assertNotIn('P_LORA_RESET=23',p['build_flags'])
                self.assertIn('-D ENABLE_PRIVATE_KEY_EXPORT=1',p['build_unflags'])
                if role=='wifi':self.assertIn('-D DISASTER_PORTAL=1',p['build_flags'])
                else:
                    self.assertIn('-D DISABLE_WIFI_OTA=1',p['build_flags'])
                    self.assertIn('-D ADMIN_PASSWORD=\'""\'',p['build_flags'])
            self.assertEqual(cfg[f'env:disaster_t3s3_{chip}_wifi_sd']['extends'],f'env:disaster_t3s3_{chip}_wifi')
        gps=cfg['env:disaster_t3s3_sx1262_wifi_gps']
        self.assertEqual(gps['extends'],'env:disaster_t3s3_sx1262_wifi')
        for flag in ('-D ENV_INCLUDE_GPS=1','-D DISASTER_GPS=1','-D GPS_BAUD_RATE=9600'):self.assertIn(flag,gps['build_flags'])
        self.assertIn('MicroNMEA',gps['lib_deps'])
        import re
        pins={int(re.search(r'-D '+k+r'=(\d+)',gps['build_flags']).group(1)) for k in ('PIN_GPS_TX','PIN_GPS_RX')}
        # LoRa 3/5/6/7/8/33/34, SD 2/11/13/14, I2C 17/18, OLED reset 21, button 0, VBAT 1, LED 37
        self.assertFalse(pins & {0,1,2,3,5,6,7,8,11,13,14,17,18,21,33,34,37})

    def compile_bus(self,target,s3,reset):
        source='''
#define FSPI 0
#define HSPI 1
#define VSPI 3
#define P_LORA_SCLK 5
#define P_LORA_MOSI 6
#define P_LORA_NSS 7
#include "firmware/MeshCore/examples/companion_radio/ArchiveBusConfig.h"
static_assert(disaster::sdSck==14 && disaster::sdMiso==2 && disaster::sdCs==13,"SD pin map");
#if defined(CONFIG_IDF_TARGET_ESP32S3)
static_assert(disaster::sdBus==HSPI && disaster::sdBus!=FSPI && disaster::sdMosi==11,"S3 bus isolation");
#else
static_assert(disaster::sdBus==VSPI && disaster::sdBus!=HSPI && disaster::sdMosi==15,"ESP32 bus isolation");
#endif
int main(){return 0;}
'''
        with tempfile.TemporaryDirectory() as td:
            p=Path(td)/'bus.cpp';p.write_text(source)
            cmd=[shutil.which('g++') or 'g++','-std=c++17','-Werror','-I',str(ROOT),f'-D{target}=1',f'-DP_LORA_RESET={reset}']
            if s3:cmd.append('-DLILYGO_T3S3=1')
            return subprocess.run(cmd+[str(p),'-o',str(Path(td)/'bus.exe')],capture_output=True).returncode

    def test_bus_isolation(self):
        self.assertEqual(self.compile_bus('CONFIG_IDF_TARGET_ESP32S3',True,8),0)
        self.assertEqual(self.compile_bus('CONFIG_IDF_TARGET_ESP32',False,23),0)
        self.assertNotEqual(self.compile_bus('CONFIG_IDF_TARGET_ESP32',False,14),0)
        self.assertNotEqual(self.compile_bus('CONFIG_IDF_TARGET_ESP32S3',False,8),0)

if __name__=='__main__':unittest.main()
