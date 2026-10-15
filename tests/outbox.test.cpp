// SPDX-License-Identifier: MIT
#include <cassert>
#include "../firmware/MeshCore/examples/companion_radio/ArchivePolicy.h"
#include <cstdint>
#include <cstdio>
static uint32_t ticks=0;
uint32_t millis(){return ticks;}
#include "fakes/SPIFFS.h"
bool fakeWriteFailure=false;FakeSPIFFS SPIFFS;
#include "../firmware/MeshCore/examples/companion_radio/DeliveryOutbox.h"
static constexpr uint32_t stamp=1792000000;
static uint8_t key[32]={1},ack[4]={1,2,3,4};
void reset(){SPIFFS.files.clear();fakeWriteFailure=false;ticks=0;}
int main(){
 assert(!disaster::archiveRotate(186,186));assert(disaster::archiveRotate(187,186));assert(disaster::archiveRotate(1048482,186));
 reset();DeliveryOutbox box;box.begin();assert(box.next()==-1);
 assert(box.enqueue(key,"Private Nachricht",stamp,stamp+3600)==0);assert(box.ready());assert(box.next()==0);
 assert(box.start(0));assert(box.get(0).attempts==1);box.tag(0,ack);box.acknowledge(ack);assert(box.get(0).state==disaster::DELIVERED);
 DeliveryOutbox reboot;reboot.begin();assert(reboot.get(0).state==disaster::DELIVERED);assert(!reboot.ready());
 reset();DeliveryOutbox full;full.begin();for(int i=0;i<8;++i)assert(full.enqueue(key,"Test",stamp+i,stamp+3600)==i);assert(full.enqueue(key,"Full",stamp+10,stamp+3600)==-1);
 full.cancel(full.get(0).id);assert(full.get(0).state==disaster::CANCELLED);assert(full.enqueue(key,"Reused",stamp+11,stamp+3600)==0);
 reset();DeliveryOutbox retry;retry.begin();retry.enqueue(key,"Retry",stamp,stamp+86400);
 for(int attempt=1;attempt<=4;++attempt){assert(retry.next()==0);assert(retry.start(0));assert(retry.get(0).attempts==attempt);assert(retry.next()==-1);ticks+=disaster::retryDelay(attempt);}
 assert(retry.next()==-1);assert(retry.get(0).state==disaster::UNCONFIRMED);
 reset();DeliveryOutbox torn;torn.begin();torn.enqueue(key,"Power loss",stamp,stamp+3600);assert(torn.start(0));fakeWriteFailure=true;torn.tag(0,ack);assert(!torn.storageOK());assert(torn.next()==-1);fakeWriteFailure=false;
 DeliveryOutbox recovered;recovered.begin();assert(recovered.get(0).attempts==1);assert(recovered.get(0).state==disaster::QUEUED);assert(!recovered.ready());recovered.syncClock(stamp);assert(recovered.next()==-1);ticks+=300000;assert(recovered.next()==0);
 recovered.syncClock(stamp+3601);assert(recovered.next()==-1);assert(recovered.get(0).state==disaster::EXPIRED);
 reset();DeliveryOutbox collision;collision.begin();collision.enqueue(key,"one",stamp,stamp+3600);collision.enqueue(key,"two",stamp+1,stamp+3600);collision.start(0);collision.tag(0,ack);collision.start(1);collision.tag(1,ack);collision.acknowledge(ack);assert(collision.get(0).state==disaster::QUEUED&&collision.get(1).state==disaster::QUEUED);
 puts("Outbox tests passed: durable attempts, restart clock gate, torn write recovery, full queue, cancellation, expiry, four attempts, ACK collision.");
}
