const assert=require('node:assert/strict');
const {bytes,decodeRecord}=require('../web/protocol.js');
const hex=p=>Buffer.from(p).toString('hex');
const make=(code,size)=>{const p=Buffer.alloc(size);p[0]=code;return p;};
assert.throws(()=>bytes('xyz'));
assert.throws(()=>bytes('a'));
assert.equal(bytes('').length,0);
assert.equal(decodeRecord('11'),null);
let msg=Buffer.from('Heimersheim: Grüße 👋');
let p=make(17,11+msg.length);p[4]=2;p.writeUInt32LE(1792000000,7);msg.copy(p,11);
let r=decodeRecord(hex(p));assert.equal(r.body,msg.toString());assert.equal(r.target,'c2');assert.equal(r.own,false);
p=make(16,16+msg.length);Buffer.from('aabbccddeeff','hex').copy(p,4);p.writeUInt32LE(1792000000,12);msg.copy(p,16);
r=decodeRecord(hex(p));assert.equal(r.target,'daabbccddeeff');assert.equal(r.body,msg.toString());
p=make(0xf2,13+msg.length);Buffer.from('112233445566','hex').copy(p,7);p.writeUInt32LE(1792000001,3);msg.copy(p,13);
r=decodeRecord(hex(p));assert.equal(r.target,'d112233445566');assert.equal(r.own,true);assert.match(r.label,/Zustellung offen/);
p=make(0xf3,7+msg.length);p[2]=7;p.writeUInt32LE(1792000002,3);msg.copy(p,7);
r=decodeRecord(hex(p));assert.equal(r.target,'c7');assert.equal(r.body,msg.toString());
assert.match(decodeRecord('82').body,/Empfangsbestätigung/);
// Untrusted markup remains text for the UI; it is never rendered with innerHTML.
p=make(17,11+28);Buffer.from('<img src=x onerror=alert(1)>').copy(p,11);
assert.match(decodeRecord(hex(p)).body,/<img/);
console.log('Protocol tests passed: UTF-8, lengths, destinations, timestamps, delivery labels.');
const {decodeHistory}=require('../web/protocol.js');
const direct=Buffer.alloc(17+msg.length);direct[0]=0xf4;direct.writeUInt32LE(1792000001,3);Buffer.from('112233445566','hex').copy(direct,7);Buffer.from('abcd1234','hex').copy(direct,13);msg.copy(direct,17);
const ack=Buffer.from('82abcd12342a000000','hex');
const row=(seq,p)=>seq+':'+hex(p)+'\n';
let history=decodeHistory(row(2,ack)+row(1,direct));
assert.equal(history.length,1);assert.equal(history[0].delivered,true);assert.match(history[0].label,/Empfang bestätigt/);assert.equal(history[0].body,msg.toString());
assert.equal(decodeHistory(row(1,direct)+row(2,ack)+row(3,ack)).length,1);
assert.equal(decodeHistory(row(1,ack)+row(2,direct)).length,2);
assert.equal(decodeHistory(row(1,direct)+row(2,direct)+row(3,ack)).length,3);
assert.equal(decodeHistory(row(2,ack)).length,1);
assert.equal(decodeHistory('bad\n1:xyz\n2:f4\n').length,0);
assert.equal(decodeRecord(hex(direct.subarray(0,16))),null);
console.log('ACK correlation passed: unique send, duplicate ACK, collision, orphan, ordering, truncated record.');

const {makeNotice,parseNotice}=require('../web/protocol.js');
const signed=Buffer.alloc(20+msg.length);signed[0]=16;signed[11]=2;signed.writeUInt32LE(1792000000,12);Buffer.from('aabbccddeeff','hex').copy(signed,4);Buffer.from('11223344','hex').copy(signed,16);msg.copy(signed,20);
r=decodeRecord(hex(signed));assert.equal(r.body,msg.toString());assert.equal(r.author,'11223344');assert.equal(r.roomPost,true);assert.equal(r.target,'daabbccddeeff');
assert.equal(decodeRecord(hex(signed.subarray(0,19))),null);
assert.equal(decodeHistory(row(1,signed)+row(2,signed)).length,1);
signed.writeUInt32LE(1792000001,12);assert.equal(decodeHistory(row(1,signed)+row(2,signed)).length,1);
const notice=makeNotice({kind:'H',expires:1792020000,lat:'50.55',lon:'7.15',place:'Heimersheim',need:'Wasser'});
assert.equal(parseNotice(notice).need,'Wasser');assert.equal(parseNotice(notice).lat,'50.55000');
assert.equal(parseNotice('!DM1|H|1792020000|100,7|Ort|Text'),null);
assert.equal(parseNotice('hello'),null);
assert.throws(()=>makeNotice({kind:'X',expires:1792020000,place:'Ort',need:'Text'}));
assert.throws(()=>makeNotice({kind:'H',expires:1792020000,place:'Ort|x',need:'Text'}));
assert.throws(()=>makeNotice({kind:'H',expires:1792020000,place:'Ort',need:'ä'.repeat(100)}));
assert.throws(()=>makeNotice({kind:'H',expires:1792020000,lat:'50',lon:'',place:'Ort',need:'Text'}));
console.log('Room/notice tests passed: signed offsets, deduplication, coordinates, UTF-8 bounds, invalid payloads.');
const {boardOrder}=require('../web/protocol.js');
const now=1792010000*1000;
const ordered=boardOrder([
 {seq:1,body:'hallo'},
 {seq:2,body:makeNotice({kind:'A',expires:1792020000,place:'Ort',need:'Decke'})},
 {seq:3,body:makeNotice({kind:'H',expires:1792020000,place:'Ort',need:'Wasser'})},
 {seq:4,body:makeNotice({kind:'H',expires:1700000001,place:'Ort',need:'Alt'})}
], now);
assert.equal(parseNotice(ordered[0].body).kind,'H');
assert.equal(parseNotice(ordered[1].body).kind,'A');
assert.equal(ordered[2].seq,1);
assert.equal(ordered[3].seq,4);
console.log('Board order passed: active help, then offers, then ordinary and expired notices.');

{const {parseNotice,noticeCard}=require('../web/protocol.js');const {JSDOM}=require('jsdom');
 const n=parseNotice('Jonas: !DM1|A|1792020000|-|Dernau|Strom vorhanden');assert.equal(n.sender,'Jonas');assert.equal(n.kind,'A');
 assert.equal(parseNotice('!DM1|H|1792020000|-|Ort|Text').sender,undefined);
 assert.equal(parseNotice('Jonas: Hallo !DM1|H|1792020000|-|Ort|Text'),null);assert.equal(parseNotice('!DM1|H|1792020000|-|Ort'),null);assert.equal(parseNotice(''),null);
 const doc=new JSDOM('').window.document;const c=noticeCard(doc,{...parseNotice('!DM1|I|1792020000|-|<img src=x>|Text'),sender:'<i>x</i>'},1792000000*1000);
 assert.equal(c.querySelector('img'),null);assert.equal(c.querySelector('i'),null);assert.match(c.textContent,/ℹ️Info · <i>x<\/i>📍 <img src=x>Text/);
 assert.match(noticeCard(doc,parseNotice('!DM1|H|1792020000|-|Ort|Text'),1792030000*1000).textContent,/ABGELAUFEN/);}
console.log('Notice cards passed: sender prefix, malformed fallback, safe text rendering, expiry.');
