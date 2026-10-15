// SPDX-License-Identifier: MIT
#pragma once
#if defined(ENABLE_USB_INTERFACE) || defined(BLE_PIN_CODE) || defined(WIFI_SSID)
#error "The local portal must own the Companion interface in this profile"
#endif
#if LORA_TX_POWER != 10
#error "Unexpected portal default TX power"
#endif
#if defined(ENABLE_PRIVATE_KEY_EXPORT) || defined(ENABLE_PRIVATE_KEY_IMPORT)
#error "Private key transfer must be disabled for the portal profile"
#endif
#include <helpers/BaseSerialInterface.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <WiFi.h>
#include <Preferences.h>
#include <SPIFFS.h>
#include "PortalPage.h"
#include "HistoryRecord.h"
#include "DeliveryOutbox.h"
#include "ArchiveSd.h"

// A single local companion owns the protocol. HTTP clients share its history.
// Raw, arbitrary companion commands and private keys are never exposed to HTTP.
class DisasterPortal : public BaseSerialInterface {
  DeliveryOutbox delivery;
  ArchiveSd archive;
  int activeJob=-1;
  uint32_t routeJob=0;uint8_t routeAttempt=255;
  WebServer http{80};
  DNSServer dns;
  bool enabled = false, storageOK = true;
  uint8_t startup = 0, active = 0;
  uint32_t nextPoll = 0, seq = 0, lastSend = 0, lastStamp = 0;
  bool sentOnce = false, userCommand = false;
  uint8_t pending[MAX_FRAME_SIZE] = {}, pendingLen = 0;
  uint8_t outgoing[MAX_FRAME_SIZE] = {}, outgoingLen = 0;
  String info, contacts[64], channels[8], apName;
  String roomTarget;
  uint8_t roomRights=0, loginLen=0, loginFrame[49]={};
  bool roomPending=false;
  uint32_t roomSince=0;
  // Reject ambiguous short identifiers instead of choosing an arbitrary contact.
  const String *roomContact(const String &target) const {
    if(target.length()!=13||target[0]!='d')return nullptr;
    const String *found=nullptr;
    for(const auto &c:contacts)if(c.length()>=264&&c.substring(2,14)==target.substring(1)&&c.substring(66,68)=="03"){
      if(found)return nullptr;found=&c;
    }
    return found;
  }
  String outcome = "Bereit";
  uint32_t activeSince = 0;
  using Record = disaster::HistoryRecord;
  static_assert(MAX_FRAME_SIZE == disaster::FRAME_BYTES, "Companion frame size changed");
  static String hex(const uint8_t *p, size_t n) {
    static const char digits[]="0123456789abcdef";
    String out; out.reserve(n*2);
    for(size_t i=0;i<n;++i){out+=digits[p[i]>>4];out+=digits[p[i]&15];}
    return out;
  }
  void append(const uint8_t *p, size_t n) {
    if (!n || n>MAX_FRAME_SIZE) return;
    Record r{}; r.seq=++seq; r.len=n; memcpy(r.data,p,n); r.crc=disaster::checksum(r);
    File f=SPIFFS.open("/dr-history.bin", "r+");
    if (!f) f=SPIFFS.open("/dr-history.bin", "w+");
    if (!f || !f.seek(disaster::offset(r.seq)) || f.write((uint8_t*)&r,sizeof(r))!=sizeof(r)) storageOK=false;
    f.close();archive.append(r);
  }
  bool permitted() {
    // Custom header prevents cross-origin form submissions; no CORS is enabled.
    String host=http.hostHeader();
    if (host!="192.168.4.1" && host!="192.168.4.1:80" && host!="disaster.radio") {
      http.send(403,"text/plain","Unbekannter Host"); return false;
    }
    if(http.header("X-Disaster-Request")!="1") {
      http.send(403,"text/plain","Lokale Anfrage erforderlich"); return false;
    }
    http.sendHeader("Cache-Control","no-store");
    return true;
  }
  bool room() {
    if (!permitted()) return false;
    if(startup<12 || pendingLen || active || loginLen) {
      http.send(409,"text/plain","Knoten beschaeftigt. Bitte erneut versuchen."); return false;
    }
    return true;
  }
  void accept(const uint8_t *p,size_t n) {
    memcpy(pending,p,n); pendingLen=n;
    http.send(202,"text/plain","In Warteschlange; noch keine Zustellbestaetigung.");
  }
  void history() {
    if(!permitted()) return;
    http.setContentLength(CONTENT_LENGTH_UNKNOWN); http.send(200,"text/plain","");
    // Physical slot order; client sorts by monotonically increasing sequence.
    File f=SPIFFS.open("/dr-history.bin","r"); Record r;
    while(f && f.read((uint8_t*)&r,sizeof(r))==sizeof(r)) {
      if(disaster::valid(r))
        http.sendContent(String(r.seq)+":"+hex(r.data,r.len)+"\n");
    }
    f.close(); http.sendContent("");
  }
  static bool hasNull(const String &s) {
    for(size_t i=0;i<s.length();++i)if(s[i]==0)return true;
    return false;
  }
  static int nibble(char c) {
    if(c>='0'&&c<='9')return c-'0';
    if(c>='a'&&c<='f')return c-'a'+10;
    if(c>='A'&&c<='F')return c-'A'+10;
    return -1;
  }
public:
  void begin() {
    delivery.begin();lastStamp=delivery.latestStamp();archive.begin();
    File f=SPIFFS.open("/dr-history.bin","r"); Record r;
    while(f && f.read((uint8_t*)&r,sizeof(r))==sizeof(r))
      if(disaster::valid(r) && r.seq>seq) seq=r.seq;
    f.close();
    Preferences prefs; prefs.begin("disaster",false);
    String password=prefs.getString("ap-pass","");
    if(password.length()<12) {
      uint8_t random[8]; esp_fill_random(random,sizeof(random)); password=hex(random,sizeof(random));
      prefs.putString("ap-pass",password);
    }
    prefs.end();
    uint64_t mac=ESP.getEfuseMac(); char suffix[7]; snprintf(suffix,sizeof(suffix),"%06X",(unsigned)(mac&0xffffff));
    apName=String("DisAHRsterRadio-")+suffix;
    WiFi.mode(WIFI_AP); WiFi.setSleep(false);
    WiFi.softAP(apName.c_str(),password.c_str(),1,false,4);
    dns.start(53,"*",WiFi.softAPIP());
    Serial.printf("\nWLAN: %s\nPasswort: %s\nBrowser: http://192.168.4.1\n",apName.c_str(),password.c_str());
    const char *headers[]={"X-Disaster-Request"}; http.collectHeaders(headers,1);
    http.on("/",HTTP_GET,[this](){
      http.sendHeader("Content-Security-Policy","default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
      http.sendHeader("X-Content-Type-Options","nosniff");
      http.send_P(200,"text/html; charset=utf-8",PORTAL_PAGE);
    });
    http.on("/api/state",HTTP_GET,[this](){
      if(!permitted())return;
      String s="{\"ready\":"+String(startup>=12?"true":"false")+",\"storage\":"+String(storageOK?"true":"false")+",\"heap\":"+String(ESP.getFreeHeap())+",\"seq\":"+String(seq)+",\"busy\":"+String((active||pendingLen||loginLen)?"true":"false")+",\"result\":\""+outcome+"\",\"info\":\""+info+"\",\"channels\":[";
      for(int i=0;i<8;i++){if(i)s+=",";s+="\""+channels[i]+"\"";}
      s+="],\"contacts\":["; bool first=true;
      for(auto &c:contacts)if(c.length()){if(!first)s+=",";first=false;s+="\""+c+"\"";}
      s+="],\"archive\":"+String(archive.ready()?"true":"false")+",\"queueReady\":"+String(delivery.ready()?"true":"false")+",\"queueStorage\":"+String(delivery.storageOK()?"true":"false")+",\"room\":{\"target\":\""+roomTarget+"\",\"rights\":"+String(roomRights)+",\"pending\":"+String(roomPending?"true":"false")+"}}";
      http.send(200,"application/json",s);
    });
    http.on("/api/history",HTTP_GET,[this](){history();});
    http.on("/api/archive",HTTP_GET,[this](){
      if(!permitted())return;
      File f=archive.open(http.arg("part")=="previous");
      if(!f){http.send(404,"text/plain","Archiv nicht verfuegbar");return;}
      http.sendHeader("Content-Disposition","attachment; filename=disahrsterradio-archive.bin");
      http.streamFile(f,"application/octet-stream");f.close();
    });
    http.on("/api/outbox",HTTP_GET,[this](){
      if(!permitted())return;String s="[";bool first=true;
      for(size_t i=0;i<disaster::OUTBOX_SLOTS;++i){const auto &j=delivery.get(i);if(!j.id)continue;if(!first)s+=",";first=false;
       s+="{\"id\":"+String(j.id)+",\"target\":\"d"+hex(j.recipient,6)+"\",\"textHex\":\""+hex((const uint8_t*)j.text,strlen(j.text))+"\",\"attempts\":"+String(j.attempts)+",\"state\":"+String(j.state)+",\"expires\":"+String(j.expires)+"}";
      }http.send(200,"application/json",s+"]");
    });
    http.on("/api/outbox-cancel",HTTP_POST,[this](){
      if(!permitted())return;
      bool ok=delivery.cancel(strtoul(http.arg("id").c_str(),nullptr,10));http.send(ok?200:409,"text/plain",ok?"Abgebrochen; bereits gesendete Versuche koennen noch ankommen":"Auftrag nicht abbrechbar / Speicherfehler");
    });
    http.on("/api/outbox",HTTP_POST,[this](){
      if(!room())return;
      String target=http.arg("target"),body=http.arg("text"),ttl=http.arg("hours");
      uint32_t stamp=strtoul(http.arg("time").c_str(),nullptr,10);
      if(body.length()<1||body.length()>100||hasNull(body)||stamp<1700000000u||stamp>4102358400u||(ttl!="1"&&ttl!="6"&&ttl!="24")){http.send(400,"text/plain","Nachricht, Ablaufzeit oder Uhr pruefen");return;}
      const String *contact=nullptr;
      for(const auto &c:contacts)if(c.length()>=264&&target==String("d")+c.substring(2,14)){
        if(contact){http.send(400,"text/plain","Mehrdeutiger Kontakt");return;}contact=&c;
      }
      if(!contact||contact->substring(66,68)!="01"){http.send(400,"text/plain","Nur bekannte private Chat-Kontakte");return;}
      if(stamp<=lastStamp)stamp=lastStamp+1;
      uint8_t key[32];for(int i=0;i<32;++i)key[i]=(nibble((*contact)[2+2*i])<<4)|nibble((*contact)[3+2*i]);
      int slot=delivery.enqueue(key,body.c_str(),stamp,stamp+ttl.toInt()*3600);
      if(slot<0){http.send(slot==-1?409:503,"text/plain",slot==-1?"Warteschlange voll (8 Auftraege)":"Speicherstatus unklar; Auftrag vor erneutem Anlegen kontrollieren");return;}
      lastStamp=stamp;http.send(202,"text/plain","Dauerhaft vorgemerkt: maximal vier Versuche, Absender muss eingeschaltet bleiben");
    });
    http.on("/api/room-login",HTTP_POST,[this](){
      if(!room())return;
      String target=http.arg("target"),password=http.arg("password");
      const String *contact=roomContact(target);
      uint32_t stamp=strtoul(http.arg("time").c_str(),nullptr,10);
      if(!contact||password.length()<1||password.length()>15||hasNull(password)||stamp<1700000000u||stamp>4102444800u){http.send(400,"text/plain","Raum, Passwort (1-15 Bytes) und Uhrzeit pruefen");return;}
      memset(loginFrame,0,sizeof(loginFrame));loginFrame[0]=26;
      for(int i=0;i<32;++i)loginFrame[1+i]=(nibble((*contact)[2+i*2])<<4)|nibble((*contact)[3+i*2]);
      memcpy(loginFrame+33,password.c_str(),password.length());loginLen=33+password.length();
      delivery.syncClock(stamp);roomTarget=target;roomRights=0;roomPending=true;roomSince=millis();
      // First synchronize the companion clock; the next serialized command logs in.
      uint8_t clock[5]={6};memcpy(clock+1,&stamp,4);accept(clock,5);
    });
    http.on("/api/send",HTTP_POST,[this](){
      if(!room())return;
      String text=http.arg("text"), target=http.arg("target");
      if(text.length()<1 || text.length()>100 || hasNull(text)) {http.send(400,"text/plain","1 bis 100 UTF-8-Bytes erforderlich");return;}
      if(sentOnce && millis()-lastSend<5000) {http.send(429,"text/plain","Bitte fuenf Sekunden Sendepause einhalten");return;}
      uint8_t p[MAX_FRAME_SIZE]={}; size_t n;
      uint32_t stamp=(uint32_t)strtoul(http.arg("time").c_str(),nullptr,10);
      if(stamp<1700000000u || stamp>4102444800u) {http.send(400,"text/plain","Handy-Uhr pruefen");return;}
      if(stamp<=lastStamp)stamp=lastStamp+1;
      if(target.length()==2 && target[0]=='c' && target[1]>='0' && target[1]<='7') {
        if(!channels[target[1]-'0'].length()){http.send(400,"text/plain","Kanal nicht eingerichtet");return;}
        p[0]=3;p[2]=target[1]-'0';memcpy(p+3,&stamp,4);n=7;
      } else if(target.length()==13 && target[0]=='d') {
        if(roomContact(target)&&(roomTarget!=target||roomRights<2)){http.send(403,"text/plain","Zuerst am Raum mit Schreibrecht anmelden");return;}
        p[0]=2;memcpy(p+3,&stamp,4);n=13;
        for(int i=0;i<6;i++){int a=nibble(target[1+i*2]),b=nibble(target[2+i*2]);if(a<0||b<0){http.send(400,"text/plain","Ungueltiger Kontakt");return;}p[7+i]=(a<<4)|b;}
      } else {http.send(400,"text/plain","Ungueltiges Ziel");return;}
      memcpy(p+n,text.c_str(),text.length());n+=text.length();
      memcpy(outgoing,p,n);outgoingLen=n;lastStamp=stamp;sentOnce=true;lastSend=millis();
      outcome="Warteschlange";accept(p,n);
    });
    http.on("/api/name",HTTP_POST,[this](){
      if(!room())return;String name=http.arg("name");
      if(name.length()<1||name.length()>24||hasNull(name)){http.send(400,"text/plain","Name: 1 bis 24 UTF-8-Bytes");return;}
      uint8_t p[26]={8};memcpy(p+1,name.c_str(),name.length());accept(p,name.length()+1);
    });
    http.on("/api/time",HTTP_POST,[this](){
      if(!room())return;
      uint32_t t=(uint32_t)strtoul(http.arg("time").c_str(),nullptr,10);
      if(t<1700000000u||t>4102444800u){http.send(400,"text/plain","Ungueltige Zeit");return;}
      delivery.syncClock(t);uint8_t p[5]={6};memcpy(p+1,&t,4);accept(p,5);
    });
    http.on("/api/channel",HTTP_POST,[this](){
      if(!room())return;String slot=http.arg("slot"),name=http.arg("name"),key=http.arg("key");
      if(slot.length()!=1||slot[0]<'0'||slot[0]>'7'||name.length()<1||name.length()>24||hasNull(name)||key.length()!=32){http.send(400,"text/plain","Kanalangaben pruefen");return;}
      uint8_t p[50]={32,(uint8_t)(slot[0]-'0')};memcpy(p+2,name.c_str(),name.length());
      for(int i=0;i<16;i++){int a=nibble(key[2*i]),b=nibble(key[2*i+1]);if(a<0||b<0){http.send(400,"text/plain","Schluessel muss Hex sein");return;}p[34+i]=(a<<4)|b;}
      accept(p,50);
    });
    http.on("/api/radio",HTTP_POST,[this](){
      if(!room())return;
      uint32_t freq=strtoul(http.arg("freq").c_str(),nullptr,10),bw=strtoul(http.arg("bw").c_str(),nullptr,10);
      int sf=http.arg("sf").toInt(),cr=http.arg("cr").toInt();
      if(freq<863000||freq>870000||(bw!=62500&&bw!=125000&&bw!=250000&&bw!=500000)||sf<7||sf>12||cr<5||cr>8){http.send(400,"text/plain","Ungueltige Funkparameter");return;}
      uint8_t p[12]={11};memcpy(p+1,&freq,4);memcpy(p+5,&bw,4);p[9]=sf;p[10]=cr;p[11]=0;accept(p,12);
    });
    http.on("/api/advert",HTTP_POST,[this](){if(!room())return;const uint8_t p[]={7,1};accept(p,2);});
    http.on("/api/refresh",HTTP_POST,[this](){if(!room())return;const uint8_t p[]={4};accept(p,1);});
    http.onNotFound([this](){http.sendHeader("Location","http://192.168.4.1/");http.send(302,"text/plain","");});
    http.begin();
  }
  void enable() override {enabled=true;}
  void disable() override {enabled=false;}
  bool isEnabled() const override {return enabled;}
  bool isConnected() const override {return enabled;}
  bool isWriteBusy() const override {return false;}
  void loop() override {
    dns.processNextRequest();http.handleClient();
    if(roomPending&&millis()-roomSince>45000){roomPending=false;roomRights=0;outcome="Raumanmeldung ohne Antwort; Passwort, Funk und Uhrzeit pruefen";}
  }
  size_t checkRecvFrame(uint8_t *dest) override {
    if(!enabled)return 0;
    if(active) {
      if(millis()-activeSince>15000) {activeJob=-1;active=0;outgoingLen=0;outcome="Antwort unklar; nicht automatisch erneut senden";}
      else return 0;
    }
    size_t n=0;
    if(startup==0){dest[0]=22;dest[1]=3;n=2;startup++;}
    else if(startup==1){memset(dest,0,8);dest[0]=1;n=8;startup++;}
    else if(startup>=2 && startup<10){dest[0]=31;dest[1]=startup-2;n=2;startup++;}
    else if(startup==10){dest[0]=4;n=1;startup++;}
    else if(startup==11){dest[0]=20;n=1;startup++;}
    else if(loginLen&&!pendingLen){userCommand=true;n=loginLen;memcpy(dest,loginFrame,n);loginLen=0;memset(loginFrame,0,sizeof(loginFrame));}
    else if(pendingLen){userCommand=true;n=pendingLen;memcpy(dest,pending,n);pendingLen=0;}
    else if((!sentOnce||millis()-lastSend>=5000)&&delivery.ready()){
      int job=delivery.next();
      if(job>=0){const auto &j=delivery.get(job);bool known=false,ambiguous=false;
        for(const auto &c:contacts)if(c.length()>=264&&c.substring(2,14)==hex(j.recipient,6)){
          if(known||c.substring(2,66)!=hex(j.recipient,32)||c.substring(66,68)!="01")ambiguous=true;known=true;
        }
        if(!known||ambiguous)delivery.defer(job);
        else if(j.attempts&&(routeJob!=j.id||routeAttempt!=j.attempts)){
          dest[0]=13;memcpy(dest+1,j.recipient,32);n=33;routeJob=j.id;routeAttempt=j.attempts;
        }
        else if(delivery.start(job)){
          dest[0]=2;dest[1]=0;dest[2]=j.attempts-1;memcpy(dest+3,&j.stamp,4);memcpy(dest+7,j.recipient,6);
          size_t len=strlen(j.text);memcpy(dest+13,j.text,len);n=13+len;memcpy(outgoing,dest,n);outgoingLen=n;
          activeJob=job;userCommand=true;sentOnce=true;lastSend=millis();
        }
      }
      if(!n&&(int32_t)(millis()-nextPoll)>=0){dest[0]=10;n=1;nextPoll=millis()+1000;}
    }
    else if((int32_t)(millis()-nextPoll)>=0){dest[0]=10;n=1;nextPoll=millis()+1000;}
    if(n){
      if(dest[0]==4)for(auto &contact:contacts)contact="";
      active=dest[0];activeSince=millis();
    }
    return n;
  }
  size_t writeFrame(const uint8_t *p,size_t n) override {
    if(!n||n>MAX_FRAME_SIZE)return 0;
    uint8_t code=p[0];
    if((code==0x85||code==0x86)&&n>=8&&roomTarget.substring(1)==hex(p+2,6)){
      roomPending=false;roomRights=code==0x85&&n>=13?(p[12]&3):0;
      outcome=roomRights>=2?"Raum angemeldet: Lesen und Schreiben":roomRights==1?"Raum angemeldet: nur Lesen":"Raumanmeldung fehlgeschlagen oder ohne Schreibrecht";
    }
    if(code==0x83){nextPoll=0;return n;}
    if(code==5)info=hex(p,n);
    if(code==18 && n>=34 && p[1]<8)channels[p[1]]=hex(p,34); // omit channel secret
    if(code==0x8f && n==33){
      String prefix=hex(p+1,32);
      for(auto &c:contacts)if(c.substring(2,66)==prefix)c="";
    }
    if((code==3 || code==0x8a) && n>=36){
      String prefix=hex(p+1,32);int slot=-1;
      for(int i=0;i<64;i++){if(contacts[i].substring(2,66)==prefix){slot=i;break;}if(slot<0&&!contacts[i].length())slot=i;}
      if(slot>=0)contacts[slot]=hex(p,n);
    }
    if(code==0x82&&n>=9)delivery.acknowledge(p+1);
    if(code==16 || code==17 || code==7 || code==8 || code==0x82)append(p,n);
    if(code<0x80 && active) {
      if(activeJob>=0&&code==6&&n>=10)delivery.tag(activeJob,p+2);
      if((active==2||active==3) && (code==0||code==6||code==1)) {
        if(code!=1 && outgoingLen){uint8_t record[MAX_FRAME_SIZE];memcpy(record,outgoing,outgoingLen);record[0]=active==2?0xf2:0xf3;
          size_t recordLen=outgoingLen;
          // v0.2: preserve the core's ACK tag beside the accepted direct message.
          // f4: legacy 13-byte header, 4-byte tag, UTF-8 text. Old records remain readable.
          if(active==2 && code==6 && n>=10 && outgoingLen>=13 && outgoingLen+4<=MAX_FRAME_SIZE) {
            memmove(record+17,record+13,outgoingLen-13);
            memcpy(record+13,p+2,4);record[0]=0xf4;recordLen+=4;
          }
          append(record,recordLen);outcome="Vom Funkkern angenommen; Zustellung offen";}
        else outcome="Funkkern meldet Sendefehler";
        outgoingLen=0;
      } else if(active==26){
        if(code==1){roomPending=false;roomRights=0;outcome="Raumanmeldung vom Funkkern abgelehnt";}
        else outcome="Anmeldung gesendet; Serverantwort ausstehend";
      } else if(code==1 && userCommand)outcome="Befehl vom Funkkern abgelehnt";
      else if(code==0 && userCommand)outcome="Gespeichert / angenommen";
      bool complete = active==4 ? (code==4||code==1) : true;
      if(complete) {
        if(code==0 && (active==8 || active==11 || active==32)) startup=1;
        active=0; activeJob=-1;userCommand=false;
      }
    }
    return n;
  }
};
