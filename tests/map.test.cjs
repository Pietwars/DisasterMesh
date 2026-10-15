const assert=require('node:assert/strict');
const {mapProject,prepareMap}=require('../web/map.js');
assert.deepEqual(mapProject([0,0]),[.5,.5]);assert.throws(()=>mapProject([181,0]));assert.throws(()=>mapProject([0,NaN]));
const geo={type:'FeatureCollection',attribution:'© OpenStreetMap contributors · ODbL',features:[{type:'Feature',properties:{name:'Straße',highway:'residential'},geometry:{type:'LineString',coordinates:[[7.1,50.5],[7.2,50.6]]}},{type:'Feature',properties:{natural:'water'},geometry:{type:'Polygon',coordinates:[[[7,50],[7.1,50],[7.1,50.1],[7,50]]]}}]};
const m=prepareMap(geo);assert.equal(m.items.length,2);assert.equal(m.items[1].kind,'road');assert.equal(m.items[0].kind,'water');assert.ok(m.bounds[0]<m.bounds[2]&&m.bounds[1]<m.bounds[3]);assert.match(m.credit,/OpenStreetMap/);
assert.throws(()=>prepareMap({type:'FeatureCollection',features:[]}));
assert.throws(()=>prepareMap({type:'FeatureCollection',features:[{geometry:{type:'LineString',coordinates:[[7,Infinity]]}}]}));
console.log('Offline map tests passed: real-coordinate projection, vector styles, bounds, credits, malformed geometry.');
const {validateHarvest,harvestInSeason,limitedMapJSON}=require('../web/map-library.js');
const fruit={geometry:{type:'Point',coordinates:[7.14,50.54]},properties:{name:'Apfel',category:'Obst',from:8,to:10,source:'Eigener Eintrag'}};
const collection=features=>({type:'FeatureCollection',features});
assert.equal(validateHarvest(collection([fruit]))[0].properties.name,'Apfel');
assert.equal(harvestInSeason(11,2,1),true);assert.equal(harvestInSeason(11,2,6),false);assert.equal(harvestInSeason(8,10,10),true);
for(const change of [{from:0},{to:13},{from:1.2},{category:'Pilze'},{name:''},{source:{}}])assert.throws(()=>validateHarvest(collection([{...fruit,properties:{...fruit.properties,...change}}])));
assert.throws(()=>validateHarvest(collection([{...fruit,geometry:{type:'Point',coordinates:[7,Infinity]}}])));
(async()=>{assert.deepEqual(await limitedMapJSON(new Response(JSON.stringify(collection([fruit]))),1000),collection([fruit]));await assert.rejects(()=>limitedMapJSON(new Response('x'.repeat(1024)),20));await assert.rejects(()=>limitedMapJSON(new Response('{}',{status:503}),100));console.log('Harvest and download validation passed.');})().catch(e=>{console.error(e);process.exitCode=1;});
// A complete OSM river way must not shrink a cached village map to a tiny speck.
const {mapScaleBar,mapRoadWidth}=require('../web/map.js');
const local={type:'FeatureCollection',features:[{geometry:{type:'LineString',coordinates:[[7.13,50.54],[7.15,50.55]]},properties:{highway:'residential'}},{geometry:{type:'LineString',coordinates:[[7,50.53],[7.8,50.56]]},properties:{waterway:'river'}}]};
const old=prepareMap(local);assert.ok((old.fitBounds[2]-old.fitBounds[0])<(old.bounds[2]-old.bounds[0])/20);
const explicit=prepareMap({...local,viewBounds:[7.13,50.54,7.15,50.55]});assert.deepEqual(explicit.fitBounds,[...mapProject([7.13,50.55]),...mapProject([7.15,50.54])]);
assert.throws(()=>prepareMap({...local,viewBounds:[7,51,7,52]}));assert.throws(()=>prepareMap({...local,viewBounds:[10,52,11,53]}));
assert.ok(mapRoadWidth('primary')>mapRoadWidth('residential'));assert.ok(mapRoadWidth('residential')>mapRoadWidth('footway'));
const meters=mapScaleBar(1e7,180-mapProject([7.14,50.545])[1]*1e7,360);assert.ok(meters.pixels>20&&meters.pixels<=90);assert.ok(meters.meters>=100&&meters.meters<=500);assert.match(meters.text,/m$/);
const actual=JSON.parse(require('node:fs').readFileSync(require('node:path').resolve(__dirname,'../maps/heimersheim.geojson'),'utf8'));
function checkBounds(c){if(typeof c[0]==='number'){assert.ok(c[0]>=7.12-1e-9&&c[0]<=7.19+1e-9&&c[1]>=50.535-1e-9&&c[1]<=50.555+1e-9);}else c.forEach(checkBounds);}
for(const f of actual.features)checkBounds(f.geometry.coordinates);
assert.equal(actual.features.filter(f=>f.properties.waterway==='river').length>0,true);
console.log('Map readability regression checks passed: bounded region, legacy river outlier, road hierarchy and geographic scale.');

const heimersheim=actual.features.find(f=>f.properties?.place&&f.properties.name==='Heimersheim');assert.ok(heimersheim,'Package must contain the actual Heimersheim place node');assert.ok(Math.abs(heimersheim.geometry.coordinates[0]-7.1761142)<.0001);assert.ok(Math.abs(heimersheim.geometry.coordinates[1]-50.5425546)<.0001);
