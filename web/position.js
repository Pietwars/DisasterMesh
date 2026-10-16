/* SPDX-License-Identifier: MIT */
// Compact position messages: !DP1|lat,lon|unix|name  (name optional, max 16 chars)
// Precision is carried by the number of decimals: 2 ≈ 1 km, 3 ≈ 100 m, 4 ≈ 10 m.
var AHR_PLACES=[
 ['Schuld',50.4461,6.8869],['Altenahr',50.5169,6.9921],['Mayschoß',50.5220,7.0198],['Rech',50.5132,7.0369],
 ['Dernau',50.5344,7.0435],['Walporzheim',50.5312,7.0794],['Ahrweiler',50.5430,7.0965],['Bad Neuenahr',50.5449,7.1377],
 ['Heppingen',50.5512,7.1646],['Heimersheim',50.5426,7.1761],['Lohrsdorf',50.5515,7.1865],['Bad Bodendorf',50.5579,7.2200],
 ['Sinzig',50.5452,7.2491],['Kripp (Ahrmündung)',50.5609,7.2691]
];
// Ortsmitten nach OpenStreetMap/Nominatim (gerundet), Stand Oktober 2026.
var POSITION_PRECISION={fein:4,mittel:3,grob:2};
var POSITION_MIN_INTERVAL_MS=5*60*1000;
function makePosition({lat,lon,stamp,precision='mittel',name=''}){
 const d=POSITION_PRECISION[precision];if(d===undefined)throw Error('Genauigkeit ungültig');
 lat=Number(lat);lon=Number(lon);
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)throw Error('Position ungültig');
 if(!Number.isSafeInteger(stamp)||stamp<1700000000||stamp>4102444800)throw Error('Zeitstempel ungültig');
 name=String(name||'').trim();if(name.length>16||/[|\r\n\0\[\]]/.test(name))throw Error('Name: höchstens 16 Zeichen, ohne | [ ]');
 const out=['!DP1',lat.toFixed(d)+','+lon.toFixed(d),stamp].concat(name?[name]:[]).join('|');
 if(new TextEncoder().encode(out).length>100)throw Error('Positionsmeldung zu lang');
 return out;
}
function parsePosition(body){
 const m=/^(?:(.{1,32}?): )?!DP1\|(-?\d{1,2}\.\d{2,4}),(-?\d{1,3}\.\d{2,4})\|(\d{10})(?:\|([^|\r\n\0\[\]]{1,16}))?$/.exec(String(body||''));
 if(!m)return null;
 const lat=Number(m[2]),lon=Number(m[3]),stamp=Number(m[4]);
 if(Math.abs(lat)>90||Math.abs(lon)>180||stamp<1700000000||stamp>4102444800)return null;
 const decimals=Math.min(m[2].split('.')[1].length,m[3].split('.')[1].length);
 return {lat,lon,stamp,name:(m[5]||m[1]||'Unbekannt').trim(),decimals,radius:decimals>=4?10:decimals===3?100:1000};
}
function positionAge(stamp,nowMs){
 const s=Math.max(0,Math.floor(nowMs/1000)-stamp);
 if(s<90)return 'gerade eben';if(s<3600)return 'vor '+Math.round(s/60)+' Min.';
 if(s<172800)return 'vor '+Math.round(s/3600)+' Std.';return 'vor '+Math.round(s/86400)+' Tagen';
}
// Newest position per name; stale (older than maxAge) entries are dropped.
function latestPositions(bodies,nowMs,maxAgeS=86400){
 const best=new Map();
 for(const b of bodies){const p=parsePosition(b);if(!p||nowMs/1000-p.stamp>maxAgeS||p.stamp-nowMs/1000>600)continue;const o=best.get(p.name);if(!o||o.stamp<p.stamp)best.set(p.name,p);}
 return [...best.values()].sort((a,b)=>b.stamp-a.stamp);
}
function nearestPlace(lat,lon){
 let best=null,dist=Infinity;
 for(const [n,a,o] of AHR_PLACES){const d=Math.hypot((a-lat)*111,(o-lon)*71);if(d<dist){dist=d;best=n;}}
 return {name:best,km:dist};
}
if(typeof module!=='undefined')module.exports={AHR_PLACES,POSITION_PRECISION,POSITION_MIN_INTERVAL_MS,makePosition,parsePosition,positionAge,latestPositions,nearestPlace};
