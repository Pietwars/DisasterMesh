// SPDX-License-Identifier: MIT
#include <cassert>
#include <cstdint>
#include <cstring>
#include <cstddef>
#include <cstdio>
#define ESP32 1
#define DISABLE_WIFI_OTA 1
#define LORA_TX_POWER 10
static unsigned entropyCalls=0;
void esp_fill_random(void *dest, size_t n) {
  ++entropyCalls;
  auto *bytes=static_cast<uint8_t*>(dest);
  for(size_t i=0;i<n;++i) bytes[i]=static_cast<uint8_t>(17*i+entropyCalls);
}
struct FakeSerial { template<class... T> void printf(const char*,T...) {} } Serial;
struct MyMesh {
  struct Prefs { char password[16]{}; uint8_t sentinel=0xa5; } prefs;
  unsigned saves=0;
  Prefs *getNodePrefs(){return &prefs;}
  void savePrefs(){++saves;}
};
#include "../firmware/MeshCore/examples/simple_repeater/DisasterRepeater.h"
int main() {
  MyMesh first;
  disasterRepeaterCredentials(first);
  assert(std::strlen(first.prefs.password)==14);
  assert(first.prefs.sentinel==0xa5 && first.saves==1 && entropyCalls==1);
  assert(std::strspn(first.prefs.password,"0123456789abcdef")==14);
  char saved[16];std::memcpy(saved,first.prefs.password,sizeof(saved));
  disasterRepeaterCredentials(first);
  assert(std::strcmp(first.prefs.password,saved)==0 && first.saves==1 && entropyCalls==1);
  MyMesh migrated;std::strcpy(migrated.prefs.password,"password");
  disasterRepeaterCredentials(migrated);
  assert(std::strcmp(migrated.prefs.password,"password")!=0 && migrated.saves==1);
  MyMesh custom;std::strcpy(custom.prefs.password,"MyCustomPass");
  disasterRepeaterCredentials(custom);
  assert(std::strcmp(custom.prefs.password,"MyCustomPass")==0 && custom.saves==0);
  puts("Repeater provisioning passed: generation, bounds, preservation, legacy default migration.");
}
