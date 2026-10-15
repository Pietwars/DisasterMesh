#include <cassert>
#include <cstdint>
#include <iostream>
#include "../firmware/MeshCore/src/TxBudgetDiagnostics.h"
int main() {
  mesh::TxBudgetDiagnostics d;
  assert(!d.waiting() && d.events()==0 && d.seconds(123)==0);
  d.set(true,100);d.set(true,600);d.set(true,1100);
  assert(d.waiting() && d.events()==1 && d.seconds(1600)==1);
  // Repeated snapshots do not double-count the active interval.
  assert(d.seconds(1600)==1);d.set(false,2100);
  assert(!d.waiting() && d.events()==1 && d.seconds(9999)==2);
  d.set(false,3000);d.set(true,4000);d.set(false,7000);
  assert(d.events()==2 && d.seconds(8000)==5);
  // uint32 millisecond rollover, not a new waiting episode.
  mesh::TxBudgetDiagnostics wrap;wrap.set(true,UINT32_MAX-499);wrap.set(true,500);
  assert(wrap.events()==1 && wrap.seconds(500)==1);
  wrap.set(false,1500);assert(wrap.seconds(123)==2);
  mesh::TxBudgetDiagnostics fresh;assert(fresh.events()==0 && fresh.seconds(123)==0);
  std::cout << "TX budget diagnostics: episodes, accumulated time, idle, snapshots and timer rollover passed.\n";
}
