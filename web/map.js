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
 for(const feature of data.features){const g=feature?.geometry;if(!g)continue;const props=feature.properties||{},name=String(props.name||'').slice(0,100),kind=props.highway?'road':props.waterway||props.natural==='water'?'water':props.building?'building':'land',detail={road:String(props.highway||''),land:String(props.landuse||props.natural||''),place:!!props.place,priority:props.place?4:['trunk','primary','secondary','tertiary'].includes(props.highway)?3:props.highway?2:0};
  if(g.type==='Point')items.push({type:'point',lines:[line([g.coordinates])],name,kind,...detail});
  else if(g.type==='LineString')items.push({type:'line',lines:[line(g.coordinates)],name,kind,...detail});
  else if(g.type==='MultiLineString')items.push({type:'line',lines:g.coordinates.map(line),name,kind,...detail});
  else if(g.type==='Polygon')items.push({type:'polygon',lines:g.coordinates.map(line),name,kind,...detail});
  else if(g.type==='MultiPolygon')for(const polygon of g.coordinates)items.push({type:'polygon',lines:polygon.map(line),name,kind,...detail});
 }
 if(!vertices)throw Error('Keine unterstützten Kartenobjekte enthalten');
 items.sort((a,b)=>({polygon:0,line:1,point:2}[a.type])-({polygon:0,line:1,point:2}[b.type]));
 const fitBounds=mapFitBounds(data,items,bounds);
 return {items,bounds,fitBounds,credit:typeof data.attribution==='string'?data.attribution.slice(0,500):'Importierte Geodaten · Quelle und Lizenz der Datei prüfen'};
}
let activeMapData=null;
let mapReady=Promise.resolve();
let offlineMap=null,mapMarks=[],mapMarkKey='',mapPositions=[],myMapPos=null,mapPosKey='',mapScale=1,mapX=0,mapY=0;
function mapSize(){const c=document.getElementById('mapcanvas');return [Math.max(200,c.clientWidth||600),360];}
function mapFitBounds(data,items,bounds){
 if(data.viewBounds!==undefined){const b=data.viewBounds;if(!Array.isArray(b)||b.length!==4||!b.every(Number.isFinite)||b[0]>=b[2]||b[1]>=b[3])throw Error('Ungültiger Kartenausschnitt');const nw=mapProject([b[0],b[3]]),se=mapProject([b[2],b[1]]);if(nw[0]>bounds[2]||se[0]<bounds[0]||nw[1]>bounds[3]||se[1]<bounds[1])throw Error('Kartenausschnitt liegt außerhalb der Daten');return [...nw,...se];}
 // Old cached exports contain complete river ways beyond the requested region.
 const anchors=items.filter(i=>i.kind==='road'||i.kind==='building');if(!anchors.length)return bounds;
 const b=[Infinity,Infinity,-Infinity,-Infinity];for(const item of anchors)for(const line of item.lines)for(const p of line){b[0]=Math.min(b[0],p[0]);b[1]=Math.min(b[1],p[1]);b[2]=Math.max(b[2],p[0]);b[3]=Math.max(b[3],p[1]);}return b;
}
function mapScaleBar(scale,y,height){
 const center=(height/2-y)/scale,lat=Math.atan(Math.sinh(Math.PI*(1-2*center))),metersPerPixel=40075016.686*Math.cos(lat)/scale;
 const target=metersPerPixel*90,power=10**Math.floor(Math.log10(target)),distance=[1,2,5,10].map(n=>n*power).filter(n=>n<=target).pop()||power;
 return {pixels:distance/metersPerPixel,text:distance>=1000?(distance/1000)+' km':Math.round(distance)+' m',meters:distance};
}
function mapRoadWidth(road){return ['motorway','trunk','primary'].includes(road)?5:['secondary','tertiary'].includes(road)?4:['footway','path','track','cycleway','steps','bridleway'].includes(road)?1.5:2.7;}
function fitOfflineMap(){if(!offlineMap)return;const [w,h]=mapSize(),b=offlineMap.fitBounds;mapScale=Math.min((w-32)/Math.max(b[2]-b[0],1e-6),(h-46)/Math.max(b[3]-b[1],1e-6));mapX=w/2-(b[0]+b[2])/2*mapScale;mapY=h/2-(b[1]+b[3])/2*mapScale;drawOfflineMap();}
function drawOfflineMap(){
 if(!offlineMap)return;
 const c=document.getElementById('mapcanvas'),[w,h]=mapSize(),ratio=Math.min(window.devicePixelRatio||1,2);c.width=w*ratio;c.height=h*ratio;const ctx=c.getContext('2d');if(!ctx)return;ctx.scale(ratio,ratio);ctx.fillStyle='#e1e7d6';ctx.fillRect(0,0,w,h);
 const screen=p=>[p[0]*mapScale+mapX,p[1]*mapScale+mapY],labels=[];
 function path(item){ctx.beginPath();for(const line of item.lines){for(let i=0;i<line.length;i++){const p=screen(line[i]);if(!i)ctx.moveTo(...p);else ctx.lineTo(...p);}if(item.type==='polygon')ctx.closePath();}}
 for(const item of offlineMap.items){if(item.kind==='road')continue;path(item);
  if(item.type==='polygon'){ctx.fillStyle=item.kind==='water'?'#9cced5':item.kind==='building'?'#bfb8a8':['forest','wood','orchard','vineyard'].includes(item.land)?'#bbd0a2':'#d1dcb8';ctx.fill('evenodd');ctx.strokeStyle=item.kind==='building'?'#a69c88':'#b3c197';ctx.lineWidth=.6;ctx.stroke();}
  else if(item.kind==='water'){ctx.strokeStyle='#8dbfc9';ctx.lineWidth=4;ctx.lineJoin='round';ctx.stroke();}
 }
 // Draw paths first, then road casings, then road centers so junctions stay clear.
 const roads=offlineMap.items.filter(i=>i.kind==='road').sort((a,b)=>mapRoadWidth(a.road)-mapRoadWidth(b.road));
 for(const item of roads){path(item);ctx.setLineDash([]);ctx.lineJoin=ctx.lineCap='round';ctx.strokeStyle='#b5b19c';ctx.lineWidth=mapRoadWidth(item.road)+1.5;ctx.stroke();}
 for(const item of roads){path(item);const narrow=mapRoadWidth(item.road)<2;ctx.setLineDash(narrow?[3,3]:[]);ctx.strokeStyle=narrow?'#93896b':item.priority===3?'#fff4bf':'#fffef4';ctx.lineWidth=mapRoadWidth(item.road);ctx.stroke();}ctx.setLineDash([]);
 // Place names first, one road name per view, and no overlapping label boxes.
 const used=new Set();
 for(const item of [...offlineMap.items].sort((a,b)=>b.priority-a.priority)){
  if(!item.name||(!item.place&&item.kind!=='road'&&item.kind!=='water'))continue;
  if(used.has(item.name)||(!item.place&&item.priority<3&&mapScale<4e6))continue;
  let chosen=null,best=Infinity;
  for(const line of item.lines)for(let i=0;i<line.length;i++){const p=screen(line[i]);if(p[0]<24||p[0]>w-24||p[1]<22||p[1]>h-36)continue;const d=Math.hypot(p[0]-w/2,p[1]-h/2);if(d<best){best=d;chosen=p;}}
  if(!chosen)continue;ctx.font=(item.place?'600 14px':'11px')+' system-ui';const measured=ctx.measureText(item.name),tw=measured?.width||item.name.length*7;if(tw>w-20)continue;const x=Math.max(8,Math.min(w-tw-8,chosen[0]-tw/2)),y=chosen[1]-5,box=[x-4,y-13,x+tw+4,y+5];
  if(labels.some(b=>box[0]<b[2]&&box[2]>b[0]&&box[1]<b[3]&&box[3]>b[1]))continue;
  labels.push(box);used.add(item.name);ctx.lineWidth=3;ctx.strokeStyle='#f4f5e9';ctx.strokeText(item.name,x,y);ctx.fillStyle=item.kind==='water'?'#316e7c':'#344632';ctx.fillText(item.name,x,y);
 }
 if(typeof drawHarvestMarks==='function')drawHarvestMarks(ctx,screen,w,h);
 if(typeof drawPoiMarks==='function')drawPoiMarks(ctx,screen,w,h);
 for(const n of mapMarks){const p=screen(mapProject([Number(n.lon),Number(n.lat)]));ctx.fillStyle=Date.now()/1000>n.expires?'#74796e':n.kind==='H'?'#ba4137':'#397849';ctx.beginPath();ctx.arc(...p,6,0,Math.PI*2);ctx.fill();ctx.font='12px system-ui';ctx.fillStyle='#253820';ctx.fillText(n.place,p[0]+9,p[1]);}
 for(const q of [...mapPositions.map(x=>({...x,own:false})),...(myMapPos?[{...myMapPos,own:true,name:'Du',radius:0}]:[])]){const p=screen(mapProject([q.lon,q.lat])),r=Math.max(7,Math.min(80,(q.radius||0)/(40075016*Math.cos(q.lat*Math.PI/180))*mapScale));if(q.radius){ctx.fillStyle='#38c6d433';ctx.strokeStyle='#1d8b98';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(...p,r,0,Math.PI*2);ctx.fill();ctx.stroke();}ctx.fillStyle=q.own?'#1f6feb':'#0f8a98';ctx.strokeStyle='#fff';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(...p,7,0,Math.PI*2);ctx.fill();ctx.stroke();const label=q.own?'Du':q.name+' · '+positionAgeText(q.stamp);ctx.font='600 12px system-ui';const tw=ctx.measureText(label)?.width||label.length*7,lx=p[0]+10+tw>w-4?Math.max(4,p[0]-10-tw):p[0]+10;ctx.lineWidth=3;ctx.strokeStyle='#f4f5e9';ctx.strokeText(label,lx,p[1]+4);ctx.fillStyle='#0b3d44';ctx.fillText(label,lx,p[1]+4);}
 const bar=mapScaleBar(mapScale,mapY,h);ctx.fillStyle='#f8faeeec';ctx.fillRect(8,h-31,Math.max(100,bar.pixels+18),25);ctx.strokeStyle='#344632';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(16,h-19);ctx.lineTo(16,h-13);ctx.lineTo(16+bar.pixels,h-13);ctx.lineTo(16+bar.pixels,h-19);ctx.stroke();ctx.fillStyle='#263b26';ctx.font='11px system-ui';ctx.fillText(bar.text,20,h-19);ctx.fillStyle='#f8faeeec';ctx.fillRect(w-29,8,21,24);ctx.fillStyle='#263b26';ctx.font='600 12px system-ui';ctx.fillText('N',w-23,24);
 c.setAttribute('aria-label','Offlinekarte mit Straßen, Gebäuden und Gewässern; Maßstab '+bar.text);c.dataset.scale=bar.text;c.dataset.labelCount=String(labels.length);
}
function positionAgeText(stamp){return typeof positionAge==='function'?positionAge(stamp,Date.now()):'';}
function updateMapPositions(list,mine){const key=JSON.stringify([list,mine,Math.floor(Date.now()/60000)]);if(key===mapPosKey)return;mapPosKey=key;mapPositions=list||[];myMapPos=mine||null;drawOfflineMap();}
function updateMapNotices(notices){const marks=notices.filter(n=>n.lat!==''&&n.lon!=='');const key=JSON.stringify(marks.map(n=>[n,Date.now()/1000>n.expires]));if(key===mapMarkKey)return;mapMarkKey=key;mapMarks=marks;drawOfflineMap();}
function mapZoom(factor,x,y){const old=mapScale;mapScale=Math.max(100,Math.min(1e8,mapScale*factor));const ratio=mapScale/old;mapX=x-(x-mapX)*ratio;mapY=y-(y-mapY)*ratio;drawOfflineMap();}
async function mapDatabase(){return new Promise((resolve,reject)=>{const request=indexedDB.open('DisasterMesh-maps',1);request.onupgradeneeded=()=>request.result.createObjectStore('maps');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function useOfflineMap(data,save,metadata=null){const prepared=prepareMap(data);offlineMap=prepared;activeMapData=data;if(typeof updateMapPois==='function')updateMapPois(data);document.getElementById('mapcredit').textContent=prepared.credit;document.getElementById('mapstatus').textContent=prepared.items.length+' Kartenobjekte · offline geladen';fitOfflineMap();if(typeof renderHarvest==='function')renderHarvest();if(save){try{const db=await mapDatabase();await new Promise((resolve,reject)=>{const tx=db.transaction('maps','readwrite');tx.objectStore('maps').put(data,'active');tx.objectStore('maps').put(metadata,'download-meta');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();document.getElementById('mapstatus').textContent+=' · auf diesem Handy gespeichert';}catch{document.getElementById('mapstatus').textContent+=' · Browser-Speicherung fehlgeschlagen; nach Neuladen erneut importieren';}}}
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
if(typeof module!=='undefined')module.exports={mapProject,prepareMap,mapFitBounds,mapScaleBar,mapRoadWidth};
