/* SPDX-License-Identifier: MIT */
function mapProject(coordinate){
 const [lon,latitude]=coordinate;
 if(!Number.isFinite(lon)||!Number.isFinite(latitude)||Math.abs(lon)>180||Math.abs(latitude)>90)throw Error('Ungültige Kartenkoordinate');
 const lat=Math.max(-85.05112878,Math.min(85.05112878,latitude))*Math.PI/180;
 return [(lon+180)/360,(1-Math.log(Math.tan(Math.PI/4+lat/2))/Math.PI)/2];
}
function prepareMap(data){
 if(data?.type!=='FeatureCollection'||!Array.isArray(data.features)||data.features.length>20000)throw Error('GeoJSON FeatureCollection erforderlich, maximal 20.000 Objekte');
 const items=[],bounds=[Infinity,Infinity,-Infinity,-Infinity];let vertices=0;
 function line(coords){if(!Array.isArray(coords))throw Error('Ungültige Geometrie');return coords.map(c=>{if(!Array.isArray(c)||c.length<2||++vertices>200000)throw Error('Kartendatei zu komplex');const p=mapProject(c);bounds[0]=Math.min(bounds[0],p[0]);bounds[1]=Math.min(bounds[1],p[1]);bounds[2]=Math.max(bounds[2],p[0]);bounds[3]=Math.max(bounds[3],p[1]);return p;});}
 for(const feature of data.features){const g=feature?.geometry;if(!g)continue;const props=feature.properties||{},name=String(props.name||'').slice(0,100),kind=props.highway?'road':props.waterway||props.natural==='water'?'water':props.building?'building':'land';
  if(g.type==='Point')items.push({type:'point',lines:[line([g.coordinates])],name,kind});
  else if(g.type==='LineString')items.push({type:'line',lines:[line(g.coordinates)],name,kind});
  else if(g.type==='MultiLineString')items.push({type:'line',lines:g.coordinates.map(line),name,kind});
  else if(g.type==='Polygon')items.push({type:'polygon',lines:g.coordinates.map(line),name,kind});
  else if(g.type==='MultiPolygon')for(const polygon of g.coordinates)items.push({type:'polygon',lines:polygon.map(line),name,kind});
 }
 if(!vertices)throw Error('Keine unterstützten Kartenobjekte enthalten');
 items.sort((a,b)=>({polygon:0,line:1,point:2}[a.type])-({polygon:0,line:1,point:2}[b.type]));
 return {items,bounds,credit:typeof data.attribution==='string'?data.attribution.slice(0,500):'Importierte Geodaten · Quelle und Lizenz der Datei prüfen'};
}
let activeMapData=null;
let mapReady=Promise.resolve();
let offlineMap=null,mapMarks=[],mapMarkKey='',mapScale=1,mapX=0,mapY=0;
function mapSize(){const c=document.getElementById('mapcanvas');return [Math.max(200,c.clientWidth||600),360];}
function fitOfflineMap(){if(!offlineMap)return;const [w,h]=mapSize(),b=offlineMap.bounds;mapScale=Math.min(w/Math.max(b[2]-b[0],1e-6),h/Math.max(b[3]-b[1],1e-6))*.9;mapX=w/2-(b[0]+b[2])/2*mapScale;mapY=h/2-(b[1]+b[3])/2*mapScale;drawOfflineMap();}
function drawOfflineMap(){
 if(!offlineMap)return;
 const c=document.getElementById('mapcanvas'),[w,h]=mapSize(),ratio=Math.min(window.devicePixelRatio||1,2);c.width=w*ratio;c.height=h*ratio;const ctx=c.getContext('2d');if(!ctx)return;ctx.scale(ratio,ratio);ctx.fillStyle='#162e36';ctx.fillRect(0,0,w,h);
 const screen=p=>[p[0]*mapScale+mapX,p[1]*mapScale+mapY];
 for(const item of offlineMap.items){ctx.beginPath();let label;
  for(const line of item.lines){for(let i=0;i<line.length;i++){const p=screen(line[i]);if(!i)ctx.moveTo(...p);else ctx.lineTo(...p);if(i===Math.floor(line.length/2))label=p;}if(item.type==='polygon')ctx.closePath();}
  if(item.type==='polygon'){ctx.fillStyle=item.kind==='water'?'#285d7c':item.kind==='building'?'#775c49':'#294b3e';ctx.fill('evenodd');}
  ctx.strokeStyle=item.kind==='road'?'#d9c69b':item.kind==='water'?'#6098bc':'#547569';ctx.lineWidth=item.kind==='road'?2:1;ctx.stroke();
  if(item.type==='point'&&label){ctx.fillStyle='#eaf2f7';ctx.beginPath();ctx.arc(...label,2,0,Math.PI*2);ctx.fill();}
  if(item.name&&label&&label[0]>0&&label[0]<w&&label[1]>0&&label[1]<h&&mapScale>15000){ctx.fillStyle='#eaf2f7';ctx.font='11px system-ui';ctx.fillText(item.name,label[0]+4,label[1]-4);}
 }
 if(typeof drawHarvestMarks==='function')drawHarvestMarks(ctx,screen,w,h);
 for(const n of mapMarks){const p=screen(mapProject([Number(n.lon),Number(n.lat)]));ctx.fillStyle=Date.now()/1000>n.expires?'#8b9499':n.kind==='H'?'#ff9b80':'#a9e4bb';ctx.beginPath();ctx.arc(...p,6,0,Math.PI*2);ctx.fill();ctx.font='12px system-ui';ctx.fillText(n.place,p[0]+9,p[1]);}
}
function updateMapNotices(notices){const marks=notices.filter(n=>n.lat!==''&&n.lon!=='');const key=JSON.stringify(marks.map(n=>[n,Date.now()/1000>n.expires]));if(key===mapMarkKey)return;mapMarkKey=key;mapMarks=marks;drawOfflineMap();}
function mapZoom(factor,x,y){const old=mapScale;mapScale=Math.max(100,Math.min(1e8,mapScale*factor));const ratio=mapScale/old;mapX=x-(x-mapX)*ratio;mapY=y-(y-mapY)*ratio;drawOfflineMap();}
async function mapDatabase(){return new Promise((resolve,reject)=>{const request=indexedDB.open('DisasterMesh-maps',1);request.onupgradeneeded=()=>request.result.createObjectStore('maps');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function useOfflineMap(data,save,metadata=null){const prepared=prepareMap(data);offlineMap=prepared;activeMapData=data;document.getElementById('mapcredit').textContent=prepared.credit;document.getElementById('mapstatus').textContent=prepared.items.length+' Kartenobjekte · offline geladen';fitOfflineMap();if(typeof renderHarvest==='function')renderHarvest();if(save){try{const db=await mapDatabase();await new Promise((resolve,reject)=>{const tx=db.transaction('maps','readwrite');tx.objectStore('maps').put(data,'active');tx.objectStore('maps').put(metadata,'download-meta');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();document.getElementById('mapstatus').textContent+=' · auf diesem Handy gespeichert';}catch{document.getElementById('mapstatus').textContent+=' · Browser-Speicherung fehlgeschlagen; nach Neuladen erneut importieren';}}}
if(typeof document!=='undefined'){
 const el=id=>document.getElementById(id),canvas=el('mapcanvas');
 el('mapfile').onchange=async()=>{try{const file=el('mapfile').files[0];if(!file)return;if(file.size>5*1024*1024)throw Error('Kartendatei größer als 5 MB');await useOfflineMap(JSON.parse(await file.text()),true);}catch(e){el('mapstatus').textContent=e.message;}};
 el('mapfit').onclick=fitOfflineMap;el('mapin').onclick=()=>{const [w,h]=mapSize();mapZoom(1.5,w/2,h/2);};el('mapout').onclick=()=>{const [w,h]=mapSize();mapZoom(1/1.5,w/2,h/2);};
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{if(canvas.clientWidth>0)fitOfflineMap();}).observe(canvas);
 canvas.addEventListener('wheel',e=>{if(!offlineMap)return;e.preventDefault();mapZoom(e.deltaY<0?1.2:1/1.2,e.offsetX,e.offsetY);},{passive:false});
 const pointers=new Map();canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.offsetX,e.offsetY]);};
 canvas.onpointermove=e=>{if(!pointers.has(e.pointerId)||!offlineMap)return;const old=[...pointers.values()];pointers.set(e.pointerId,[e.offsetX,e.offsetY]);const current=[...pointers.values()];if(old.length===1){mapX+=current[0][0]-old[0][0];mapY+=current[0][1]-old[0][1];drawOfflineMap();}else if(old.length===2){const center=p=>[(p[0][0]+p[1][0])/2,(p[0][1]+p[1][1])/2],a=center(old),b=center(current),dist=p=>Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);mapX+=b[0]-a[0];mapY+=b[1]-a[1];mapZoom(dist(current)/Math.max(dist(old),1),b[0],b[1]);}};
 canvas.onpointerup=canvas.onpointercancel=e=>pointers.delete(e.pointerId);
 if(typeof indexedDB!=='undefined')mapReady=mapDatabase().then(db=>{return new Promise((resolve,reject)=>{const tx=db.transaction('maps'),r=tx.objectStore('maps').get('active');r.onsuccess=()=>{if(r.result)useOfflineMap(r.result,false).catch(()=>{});};tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});}).catch(()=>{});
}
if(typeof module!=='undefined')module.exports={mapProject,prepareMap};
