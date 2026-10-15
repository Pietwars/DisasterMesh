const assert=require('node:assert/strict');
const {mapProject,prepareMap}=require('../web/map.js');
assert.deepEqual(mapProject([0,0]),[.5,.5]);assert.throws(()=>mapProject([181,0]));assert.throws(()=>mapProject([0,NaN]));
const geo={type:'FeatureCollection',attribution:'© OpenStreetMap contributors · ODbL',features:[{type:'Feature',properties:{name:'Straße',highway:'residential'},geometry:{type:'LineString',coordinates:[[7.1,50.5],[7.2,50.6]]}},{type:'Feature',properties:{natural:'water'},geometry:{type:'Polygon',coordinates:[[[7,50],[7.1,50],[7.1,50.1],[7,50]]]}}]};
const m=prepareMap(geo);assert.equal(m.items.length,2);assert.equal(m.items[1].kind,'road');assert.equal(m.items[0].kind,'water');assert.ok(m.bounds[0]<m.bounds[2]&&m.bounds[1]<m.bounds[3]);assert.match(m.credit,/OpenStreetMap/);
assert.throws(()=>prepareMap({type:'FeatureCollection',features:[]}));
assert.throws(()=>prepareMap({type:'FeatureCollection',features:[{geometry:{type:'LineString',coordinates:[[7,Infinity]]}}]}));
console.log('Offline map tests passed: real-coordinate projection, vector styles, bounds, credits, malformed geometry.');
