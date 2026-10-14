#include "../firmware/MeshCore/examples/companion_radio/HistoryRecord.h"
#include <cassert>
#include <cstring>
#include <iostream>
int main(){
 using namespace disaster;
 HistoryRecord r{};r.seq=1;r.len=5;memcpy(r.data,"hello",5);r.crc=checksum(r);
 assert(valid(r));assert(offset(1)==0);assert(offset(97)==0);assert(offset(96)==95*sizeof(r));
 HistoryRecord corrupt=r;corrupt.data[2]^=1;assert(!valid(corrupt));
 corrupt=r;corrupt.crc^=0x100;assert(!valid(corrupt));
 corrupt=r;corrupt.len=177;corrupt.crc=checksum(corrupt);assert(!valid(corrupt));
 corrupt=r;corrupt.seq=0;corrupt.crc=checksum(corrupt);assert(!valid(corrupt));
 corrupt=r;corrupt.len=0;corrupt.crc=checksum(corrupt);assert(!valid(corrupt));
 // A torn record loses its trailing checksum and must not be replayed.
 corrupt=r;memset(reinterpret_cast<unsigned char*>(&corrupt)+sizeof(r)-4,0,4);assert(!valid(corrupt));
 std::cout<<"History checks passed: ring wrap, corruption, torn record, length bounds.\n";
}
