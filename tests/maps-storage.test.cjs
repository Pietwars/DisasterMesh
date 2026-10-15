const {JSDOM}=require('jsdom'),{IDBFactory}=require('fake-indexeddb'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../web'),html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script.*?<\/script>/gs,''),database=new IDBFactory();
const geo={type:'FeatureCollection',features:[{geometry:{type:'LineString',coordinates:[[7.1,50.5],[7.2,50.6]]},properties:{highway:'residential'}}]};
let requests=0,mode='ok',release;
function start(){
 const dom=new JSDOM(html,{url:'http://192.168.4.1',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.AbortController=AbortController;w.indexedDB=database;w.setInterval=()=>0;w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{},set:()=>true});
 w.fetch=async()=>{requests++;if(mode==='offline')throw Error('Kein Internet');if(mode==='wait')await new Promise(r=>release=r);if(mode==='huge')return new Response('x'.repeat(100),{headers:{'content-length':String(6*1024*1024)}});if(mode==='invalid')return new Response('{"type":"FeatureCollection","features":[]}');return new Response(JSON.stringify(geo));};
 w.eval(fs.readFileSync(path.join(root,'map.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'map-library.js'),'utf8')+'\nwindow.testReady=mapReady;');
 return {dom,w,$:id=>w.document.getElementById(id)};
}
const settle=async()=>{for(let i=0;i<30;i++)await new Promise(r=>setImmediate(r));};
(async()=>{
 let app=start();await settle();const {w,$}=app;assert.equal(requests,0);
 $('mapauto').checked=true;await $('mapauto').onchange();assert.equal(requests,1);assert.match($('mapdownloadstatus').textContent,/vollständig/);assert.equal((await w.mapStored('active')).features.length,1);
 await w.downloadMapPackage();assert.equal(requests,1);
 for(const errorMode of ['offline','huge','invalid']){mode=errorMode;await w.downloadMapPackage(true);assert.match($('mapdownloadstatus').textContent,/fehlgeschlagen/);assert.equal((await w.mapStored('active')).features.length,1);}
 mode='wait';const pending=w.downloadMapPackage(true);await settle();assert.equal($('mapfile').disabled,true);const count=requests;await w.downloadMapPackage(true);assert.equal(requests,count);release();await pending;assert.equal($('mapfile').disabled,false);
 // A transaction aborted by storage pressure keeps both the old map and timestamp.
 const savedMeta=await w.mapStored('download-meta'),realDB=w.mapDatabase;
 w.mapDatabase=async()=>{const db=await realDB();const original=db.transaction.bind(db);db.transaction=(name,access)=>{const tx=original(name,access);if(access==='readwrite')queueMicrotask(()=>tx.abort());return tx;};return db;};mode='ok';await w.downloadMapPackage(true);assert.match($('mapdownloadstatus').textContent,/fehlgeschlagen/);w.mapDatabase=realDB;assert.deepEqual(await w.mapStored('download-meta'),savedMeta);
 $('harvestname').value='<img src=x onerror=alert(1)>';$('harvestlat').value='50.54';$('harvestlon').value='7.14';await $('harvestform').onsubmit({preventDefault(){}});assert.match($('harveststatus').textContent,/1 Fundorte/);assert.equal($('harvestlist').querySelectorAll('img').length,0);assert.equal((await w.mapStored('harvest')).length,1);
 $('harvestfilter').value='Nüsse';$('harvestfilter').onchange();assert.match($('harvestlist').textContent,/Keine Fundorte/);
 app.dom.window.close();mode='offline';const oldRequests=requests;app=start();await settle();assert.match(app.$('mapstatus').textContent,/offline geladen/);assert.match(app.$('harvestlist').textContent,/<img/);assert.equal(app.$('mapauto').checked,true);assert.equal(requests,oldRequests);
 // A custom import clears automatic package metadata, so an online event cannot replace it.
 await app.w.useOfflineMap(geo,true);await app.w.downloadMapPackage();assert.equal(requests,oldRequests);assert.match(app.$('mapdownloadstatus').textContent,/Importierte Karte bleibt/);
 app.dom.window.close();console.log('Map storage integration passed: download, TTL, failures, size limits, concurrent calls, aborted transaction, harvest persistence/XSS/filter and offline reload.');
})().catch(e=>{console.error(e);process.exitCode=1;});
