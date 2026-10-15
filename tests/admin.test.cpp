#include <cassert>
#include <iostream>
#include "../firmware/MeshCore/examples/companion_radio/AdminSession.h"
int main(){
 disaster::AdminSession a;const char* token="0123456789abcdef0123456789abcdef";
 assert(!a.valid(token,0));a.issue(token,100);
 assert(a.valid(token,101)&&!a.valid("wrong",101));
 assert(!a.valid("1123456789abcdef0123456789abcdef",101));
 assert(a.valid(token,900099)&&!a.valid(token,900100));
 a.issue(token,UINT32_MAX-100);assert(a.valid(token,100));a.clear();assert(!a.valid(token,101));
 for(int i=0;i<5;++i){a.failed(200);}assert(a.locked(201));assert(!a.locked(60200));
 a.failed(60200);assert(!a.locked(60201));
 a.issue(token,60300);assert(!a.locked(60300));a.issue("bad",60400);assert(!a.valid(token,60401));
 disaster::AdminSession wrap;for(int i=0;i<5;++i){wrap.failed(UINT32_MAX-100);}assert(wrap.locked(200));assert(!wrap.locked(60000));
 disaster::RadioPreset p{};assert(disaster::dePreset("de-narrow",p));assert(p.freq==869618&&p.bw==62500&&p.sf==8&&p.cr==8);
 assert(disaster::dePreset("ahr-legacy",p)&&p.cr==5);
 assert(disaster::dePreset("eu-legacy",p)&&p.freq==869525&&p.bw==250000&&p.sf==11&&p.cr==5);
 assert(!disaster::dePreset("US915",p));assert(!disaster::dePreset("",p));
 std::cout<<"Admin checks: token, expiry, invalidation, cooldown, rollover and DE preset allowlist passed.\n";
}
