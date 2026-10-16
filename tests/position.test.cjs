const assert=require('node:assert/strict');
const P=require('../web/position.js');
const t=1792100000;
const m=P.makePosition({lat:50.54441,lon:7.14562,stamp:t,precision:'mittel',name:'Anna'});
assert.equal(m,'!DP1|50.544,7.146|1792100000|Anna');
assert.ok(new TextEncoder().encode(m).length<=40);
assert.equal(P.makePosition({lat:50.54441,lon:7.14562,stamp:t,precision:'grob'}),'!DP1|50.54,7.15|1792100000');
assert.equal(P.makePosition({lat:50.54441,lon:7.14562,stamp:t,precision:'fein'}),'!DP1|50.5444,7.1456|1792100000');
for(const bad of [{lat:91,lon:7},{lat:50,lon:NaN},{lat:50,lon:7,stamp:5},{lat:50,lon:7,precision:'exakt'},{lat:50,lon:7,name:'a|b'},{lat:50,lon:7,name:'x'.repeat(17)}])
 assert.throws(()=>P.makePosition({stamp:t,...bad}));
const p=P.parsePosition(m);assert.deepEqual({...p},{lat:50.544,lon:7.146,stamp:t,name:'Anna',decimals:3,radius:100});
assert.equal(P.parsePosition('Heimersheim-01: !DP1|50.54,7.15|1792100000').name,'Heimersheim-01');
assert.equal(P.parsePosition('!DP1|50.54,7.15|1792100000').radius,1000);
for(const bad of ['!DP1|50.5,7.1|1792100000','!DP1|95.00,7.10|1792100000','!DP1|50.54,7.15|17921','DP1|50.54,7.15|1792100000','!DP1|50.54,7.15|1792100000|<img src=x>|x','!DM1|H|1792100000|-|a|b'])
 assert.equal(P.parsePosition(bad),null,bad);
assert.equal(P.positionAge(t,(t+30)*1000),'gerade eben');assert.equal(P.positionAge(t,(t+600)*1000),'vor 10 Min.');assert.equal(P.positionAge(t,(t+7200)*1000),'vor 2 Std.');
const list=P.latestPositions([m,P.makePosition({lat:50.55,lon:7.16,stamp:t+60,name:'Anna'}),P.makePosition({lat:50.53,lon:7.05,stamp:t-200000,name:'Alt'}),'Hallo'],(t+120)*1000);
assert.equal(list.length,2);assert.equal(list[0].lat,50.550); // Legacy names cannot identify a sender.
assert.equal(P.nearestPlace(50.5426,7.1761).name,'Heimersheim');assert.equal(P.nearestPlace(50.5344,7.0435).name,'Dernau');
assert.ok(P.AHR_PLACES.length>=12&&P.AHR_PLACES.every(([,a,o])=>a>50.4&&a<50.6&&o>6.8&&o<7.3));
const idA='aaaaaaaaaaaaaaaa',idB='bbbbbbbbbbbbbbbb';
const v2=(senderId,stamp=t,name='Anna')=>P.makePosition({lat:50.54,lon:7.17,stamp,name,senderId});
assert.equal(P.parsePosition(v2(idA)).senderId,idA);
assert.equal(P.parsePosition('Board: '+v2(idA)).name,'Anna');
assert.equal(P.parsePosition(v2(idA,t,'')).name,'Unbekannt');
assert.ok(new TextEncoder().encode(v2(idA,t,'😀'.repeat(8))).length<=100);
assert.throws(()=>v2('not-an-id'));assert.equal(P.parsePosition(v2(idA).replace(idA,'INVALID')),null);
const positions=P.latestPositions([{body:v2(idA),target:'c0'},{body:v2(idB),target:'c0'},{body:v2(idA,t+1,'Neu'),target:'c0'},{body:v2(idA),target:'c1'}],(t+10)*1000);
assert.equal(positions.length,3);assert.equal(positions[0].name,'Neu');
assert.notEqual(P.positionLabel(positions[0]),P.positionLabel(positions[1]));
const memory=new Map(),storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)},now=t*1000;
const fakeCrypto={getRandomValues:b=>b.fill(17)};
assert.equal(P.positionSenderId(storage,fakeCrypto),'1111111111111111');
assert.equal(P.positionSenderId(storage,{getRandomValues:()=>{throw Error('must reuse');}}),'1111111111111111');
P.reservePositionSend(storage,now);
assert.throws(()=>P.reservePositionSend(storage,now+1),/nächste Position/);
// New storage facade models a reopened document sharing persistent storage.
assert.throws(()=>P.reservePositionSend({...storage},now+299999),/nächste Position/);
assert.throws(()=>P.reservePositionSend(storage,now-1000),/nächste Position/);
P.reservePositionSend(storage,now+300000);
assert.throws(()=>P.reservePositionSend({getItem:()=>null,setItem:()=>{throw Error('quota');}},now),/quota/);
assert.throws(()=>P.reservePositionSend({getItem:()=>'{',setItem:()=>{}},now),/beschädigt/);
assert.throws(()=>P.reservePositionSend({getItem:()=>'{"nextAt":-1}',setItem:()=>{}},now),/ungültig/);
console.log('Position tests passed: DP1 compatibility, DP2 identities/scopes, safe labels, persistence, expiry, clock rollback and storage errors.');
