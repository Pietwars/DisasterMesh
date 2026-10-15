// SPDX-License-Identifier: MIT
#pragma once
#include "HistoryRecord.h"
#ifdef DISASTER_SD
#include <SD.h>
#include <SPI.h>
#if P_LORA_RESET == 14
#error "SD clock GPIO14 conflicts with LoRa reset: use verified T3 V1.6 GPIO23 profile"
#endif
#endif
class ArchiveSd {
#ifdef DISASTER_SD
 SPIClass bus{VSPI};
#endif
 bool mounted=false;
public:
 void begin(){
#ifdef DISASTER_SD
  bus.begin(14,2,15,13);
  mounted=SD.begin(13,bus,4000000,"/sd",2,false);
  if(mounted&&!SD.exists("/disaster"))mounted=SD.mkdir("/disaster");
  Serial.println(mounted?"SD archive ready":"SD archive unavailable; internal history remains active");
#endif
 }
 bool ready()const{return mounted;}
 void append(const disaster::HistoryRecord &r){
#ifdef DISASTER_SD
  if(!mounted)return;
  auto f=SD.open("/disaster/current.bin",FILE_APPEND);
  if(!f){mounted=false;return;}
  bool rotate=f.size()+sizeof(r)>1048576;f.close();
  if(rotate){if(SD.exists("/disaster/previous.bin")&&!SD.remove("/disaster/previous.bin")){mounted=false;return;}
   if(!SD.rename("/disaster/current.bin","/disaster/previous.bin")){mounted=false;return;}}
  f=SD.open("/disaster/current.bin",FILE_APPEND);
  if(!f||f.write((const uint8_t*)&r,sizeof(r))!=sizeof(r))mounted=false;
  f.close();
#else
  (void)r;
#endif
 }
 File open(bool previous){
#ifdef DISASTER_SD
  if(mounted)return SD.open(previous?"/disaster/previous.bin":"/disaster/current.bin",FILE_READ);
#else
  (void)previous;
#endif
  return File();
 }
};
