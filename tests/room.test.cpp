// SPDX-License-Identifier: MIT
#include "../firmware/MeshCore/examples/simple_room_server/RoomRecord.h"
#include <cassert>
#include <cstring>
#include <array>
#include <cstdio>
int main(){
 std::array<disaster::RoomRecord,32> ring{};
 for(uint32_t seq=1;seq<=65;++seq){
  disaster::RoomRecord r{};r.seq=seq;r.stamp=1700000000+seq;strcpy(r.text,"Heimersheim: Wasser");r.author[0]=42;r.crc=disaster::roomChecksum(r);
  assert(disaster::roomValid(r));ring[disaster::roomOffset(seq)/sizeof(r)]=r;
 }
 uint32_t min=100,max=0,count=0;
 for(auto r:ring){assert(disaster::roomValid(r));if(r.seq<min)min=r.seq;if(r.seq>max)max=r.seq;++count;}
 assert(min==34&&max==65&&count==32);
 auto damaged=ring[0];damaged.text[0]^=1;assert(!disaster::roomValid(damaged));
 damaged=ring[0];damaged.crc=0;assert(!disaster::roomValid(damaged));
 damaged=ring[0];memset(damaged.text,'x',sizeof(damaged.text));damaged.crc=disaster::roomChecksum(damaged);assert(!disaster::roomValid(damaged));
 damaged=ring[0];damaged.stamp=0;damaged.crc=disaster::roomChecksum(damaged);assert(!disaster::roomValid(damaged));
 puts("Room journal checks passed: bounded ring, wrap, checksum, torn/unterminated/zero-time record.");
}
