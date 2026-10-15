/* SPDX-License-Identifier: MIT
 * Foreground package downloads and a private, local harvest collection.
 * No OSM tile prefetch, third-party credentials, or automatic location upload.
 */
const MAP_PACKAGE={id:'heimersheim',url:'https://raw.githubusercontent.com/Pietwars/DisasterMesh/main/maps/heimersheim.geojson'};
const HARVEST_KINDS=['Obst','Nüsse','Beeren','Kräuter'];
function harvestInSeason(from,to,month){return from<=to?month>=from&&month<=to:month>=from||month<=to;}
function validateHarvest(data){
 if(data?.type!=='FeatureCollection'||!Array.isArray(data.features)||data.features.length>1000)throw Error('Maximal 1.000 Fundorte als GeoJSON FeatureCollection importieren');
 return data.features.map((f,i)=>{
  const p=f?.properties,g=f?.geometry,c=g?.coordinates;
  if(g?.type!=='Point'||!Array.isArray(c)||c.length!==2||!c.every(Number.isFinite)||Math.abs(c[0])>180||Math.abs(c[1])>85||!p||typeof p.name!=='string'||!p.name.trim()||p.name.length>80||!HARVEST_KINDS.includes(p.category)||!Number.isInteger(p.from)||!Number.isInteger(p.to)||p.from<1||p.from>12||p.to<1||p.to>12)throw Error('Ungültiger Fundort '+(i+1));
  for(const key of ['notes','source','license'])if(p[key]!==undefined&&(typeof p[key]!=='string'||p[key].length>500))throw Error('Ungültige Quellen- oder Hinweisangabe');
  return {type:'Feature',geometry:{type:'Point',coordinates:[...c]},properties:{name:p.name.trim(),category:p.category,from:p.from,to:p.to,notes:p.notes||'',source:p.source||'Eigener Eintrag',license:p.license||''}};
 });
}
let harvestFeatures=[],mapAuto=false,mapDownloadBusy=false,mapLastAttempt=0;
async function mapStored(key,value,write=false){
 const db=await mapDatabase();
 try{return await new Promise((resolve,reject)=>{const tx=db.transaction('maps',write?'readwrite':'readonly'),store=tx.objectStore('maps');const request=write?store.put(value,key):store.get(key);tx.oncomplete=()=>resolve(request.result);tx.onerror=tx.onabort=()=>reject(tx.error||Error('Speicherung abgebrochen'));});}finally{db.close();}
}
async function limitedMapJSON(response,limit){
 if(!response.ok)throw Error('Download nicht verfügbar (HTTP '+response.status+')');
 if(Number(response.headers.get('content-length'))>limit)throw Error('Datei zu groß');
 if(!response.body?.getReader){const text=await response.text();if(new TextEncoder().encode(text).length>limit)throw Error('Datei zu groß');return JSON.parse(text);}
 const reader=response.body.getReader(),chunks=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit)throw Error('Datei zu groß');chunks.push(value);}}catch(e){await reader.cancel().catch(()=>{});throw e;}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return JSON.parse(new TextDecoder().decode(bytes));
}
function mapSaveFile(name,data){const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/geo+json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function downloadMapPackage(manual=false){
 if(mapDownloadBusy||(!manual&&!mapAuto))return;
 await mapReady;
 if(mapDownloadBusy)return;
 if(!manual&&(document.hidden||navigator.onLine===false||Date.now()-mapLastAttempt<60000))return;
 mapDownloadBusy=true;const status=document.getElementById('mapdownloadstatus'),button=document.getElementById('mapdownload');button.disabled=true;document.getElementById('mapfile').disabled=true;
 let timer;
 try{
  const meta=await mapStored('download-meta');
  if(!manual&&activeMapData&&meta?.id!==MAP_PACKAGE.id){status.textContent='Importierte Karte bleibt erhalten. Für das automatische Paket zuerst Heimersheim herunterladen.';return;}
  if(!manual&&meta?.id===MAP_PACKAGE.id&&Date.now()-meta.savedAt<86400000){status.textContent='Heimersheim gespeichert · Stand '+new Date(meta.savedAt).toLocaleString('de-DE');return;}
  mapLastAttempt=Date.now();status.textContent='Heimersheim wird geladen …';
  const controller=new AbortController();timer=setTimeout(()=>controller.abort(),20000);
  const data=await limitedMapJSON(await fetch(MAP_PACKAGE.url,{signal:controller.signal,credentials:'omit',cache:'no-cache',referrerPolicy:'no-referrer'}),5*1024*1024);
  prepareMap(data);
  // Commit package and timestamp together; never mark a failed/partial save as current.
  const db=await mapDatabase();try{await new Promise((resolve,reject)=>{const tx=db.transaction('maps','readwrite'),store=tx.objectStore('maps');store.put(data,'active');store.put({id:MAP_PACKAGE.id,savedAt:Date.now()},'download-meta');tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error||Error('Speicherung abgebrochen'));});}finally{db.close();}
  await useOfflineMap(data,false);status.textContent='Heimersheim vollständig auf diesem Handy gespeichert · '+new Date().toLocaleString('de-DE');
 }catch(e){status.textContent='Download / Speicherung fehlgeschlagen. Vorhandene Karte bleibt erhalten. '+(mapAuto?'Automatischer Neuversuch bei geöffneter App. ':'')+(e.name==='AbortError'?'Zeitüberschreitung.':e.message);}
 finally{clearTimeout(timer);mapDownloadBusy=false;button.disabled=false;document.getElementById('mapfile').disabled=false;}
}
function visibleHarvest(){const kind=document.getElementById('harvestfilter').value,season=document.getElementById('harvestseason').checked,month=new Date().getMonth()+1;return harvestFeatures.filter(f=>(!kind||f.properties.category===kind)&&(!season||harvestInSeason(f.properties.from,f.properties.to,month)));}
function drawHarvestMarks(ctx,screen,w,h){
 for(const f of visibleHarvest()){const p=screen(mapProject(f.geometry.coordinates));if(p[0]<0||p[0]>w||p[1]<0||p[1]>h)continue;ctx.fillStyle='#e5bd6c';ctx.beginPath();ctx.arc(...p,7,0,2*Math.PI);ctx.fill();ctx.fillStyle='#fff4d8';ctx.font='12px system-ui';ctx.fillText(f.properties.name,p[0]+10,p[1]-8);}
}
async function saveHarvest(next){await mapStored('harvest',next,true);harvestFeatures=next;renderHarvest();document.getElementById('harveststatus').textContent=next.length+' Fundorte auf diesem Handy gespeichert';}
function renderHarvest(){
 const list=document.getElementById('harvestlist');list.replaceChildren();
 for(const f of visibleHarvest()){
  const p=f.properties,row=document.createElement('article'),text=document.createElement('p'),focus=document.createElement('button'),remove=document.createElement('button');
  text.textContent=p.name+' · '+p.category+' · Ernte '+p.from+'–'+p.to+' · '+f.geometry.coordinates[1]+', '+f.geometry.coordinates[0]+' · '+p.notes+' · Quelle: '+p.source+(p.license?' · '+p.license:'');
  focus.textContent='Auf Karte zeigen';focus.className='secondary';focus.disabled=!offlineMap;focus.onclick=()=>{const [w,h]=mapSize(),point=mapProject(f.geometry.coordinates);mapScale=Math.max(mapScale,100000);mapX=w/2-point[0]*mapScale;mapY=h/2-point[1]*mapScale;drawOfflineMap();document.getElementById('mapcanvas').scrollIntoView({block:'center'});};
  remove.textContent='Löschen';remove.className='secondary';remove.onclick=()=>saveHarvest(harvestFeatures.filter(x=>x!==f)).catch(e=>{document.getElementById('harveststatus').textContent='Nicht gelöscht: '+e.message;});row.append(text,focus,remove);list.append(row);
 }
 if(!list.children.length)list.textContent='Keine Fundorte für diese Auswahl. Eigene Einträge anlegen oder importieren.';
 drawOfflineMap();
}
if(typeof document!=='undefined'){
 const el=id=>document.getElementById(id);
 el('mapdownload').onclick=()=>downloadMapPackage(true).then(renderHarvest);
 el('mapexport').onclick=()=>{if(activeMapData)mapSaveFile('DisAHRsterRadio-Karte.geojson',activeMapData);else el('mapdownloadstatus').textContent='Zuerst eine Karte laden.';};
 el('mapauto').onchange=async()=>{mapAuto=el('mapauto').checked;try{await mapStored('auto-download',mapAuto,true);if(mapAuto)await downloadMapPackage();else el('mapdownloadstatus').textContent='Automatischer Download ausgeschaltet.';}catch(e){mapAuto=false;el('mapauto').checked=false;el('mapdownloadstatus').textContent='Einstellung nicht gespeichert: '+e.message;}};
 el('harvestfilter').onchange=el('harvestseason').onchange=renderHarvest;
 el('harvestform').onsubmit=async e=>{e.preventDefault();try{const next=validateHarvest({type:'FeatureCollection',features:[...harvestFeatures,{geometry:{type:'Point',coordinates:[Number(el('harvestlon').value),Number(el('harvestlat').value)]},properties:{name:el('harvestname').value,category:el('harvestkind').value,from:Number(el('harvestfrom').value),to:Number(el('harvestto').value),notes:el('harvestnotes').value}}]});await saveHarvest(next);el('harvestform').reset();}catch(err){el('harveststatus').textContent='Nicht gespeichert: '+err.message;}};
 el('harvestexport').onclick=()=>mapSaveFile('DisAHRsterRadio-Fundorte.geojson',{type:'FeatureCollection',features:harvestFeatures});
 el('harvestimport').onchange=async()=>{try{const file=el('harvestimport').files[0];if(!file)return;if(file.size>1024*1024)throw Error('Datei größer als 1 MB');await saveHarvest(validateHarvest(JSON.parse(await file.text())));}catch(e){el('harveststatus').textContent='Import fehlgeschlagen; Sammlung bleibt erhalten: '+e.message;}finally{el('harvestimport').value='';}};
 window.addEventListener('online',()=>{mapLastAttempt=0;downloadMapPackage();});document.addEventListener('visibilitychange',()=>{if(!document.hidden)downloadMapPackage();});
 setInterval(()=>downloadMapPackage(),60000);
 mapReady.then(async()=>{try{harvestFeatures=validateHarvest({type:'FeatureCollection',features:(await mapStored('harvest'))||[]});mapAuto=(await mapStored('auto-download'))===true;el('mapauto').checked=mapAuto;renderHarvest();await downloadMapPackage();}catch(e){el('harveststatus').textContent='Lokaler Speicher nicht verfügbar: '+e.message;}});
}
if(typeof module!=='undefined')module.exports={harvestInSeason,validateHarvest,limitedMapJSON};
