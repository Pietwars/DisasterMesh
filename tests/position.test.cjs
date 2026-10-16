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
assert.equal(list.length,1);assert.equal(list[0].lat,50.550);
assert.equal(P.nearestPlace(50.5426,7.1761).name,'Heimersheim');assert.equal(P.nearestPlace(50.5344,7.0435).name,'Dernau');
assert.ok(P.AHR_PLACES.length>=12&&P.AHR_PLACES.every(([,a,o])=>a>50.4&&a<50.6&&o>6.8&&o<7.3));
console.log('Position tests passed: compact !DP1 encoding, precision levels, parsing with node prefix, invalid input, age, newest-per-name, Ahrtal places.');
