const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'../web'),server=http.createServer((req,res)=>{const name=req.url==='/'?'index.html':req.url.slice(1);if(!['index.html','map.js','map-library.js','theme.css','assets/ahrtal-night.jpg'].includes(name)){res.writeHead(404).end();return;}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.jpg')?'image/jpeg':'text/html');let body=fs.readFileSync(path.join(root,name),name.endsWith('.jpg')?undefined:'utf8');if(name==='index.html')body=body.replace('<script src="protocol.js"></script>','').replace('<script src="app.js"></script>','');res.end(body);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();
 try{
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));let downloads=0,fail=false,huge=false;
 const geo=fs.readFileSync(path.resolve(__dirname,'../maps/heimersheim.geojson'),'utf8');
 await page.route('https://raw.githubusercontent.com/**',async route=>{downloads++;if(fail)return route.abort('internetdisconnected');await route.fulfill({status:200,contentType:'application/json',body:huge?'x'.repeat(6*1024*1024):geo});});
 const url=`http://127.0.0.1:${server.address().port}/`;await page.goto(url);
 await page.evaluate(()=>{document.querySelector('#view-map').hidden=false;document.querySelector('#view-chat').hidden=true;});
 await page.waitForFunction(()=>document.querySelector('#harvestlist').textContent.includes('Keine Fundorte'));
 await page.check('#mapauto');await page.waitForFunction(()=>document.querySelector('#mapdownloadstatus').textContent.includes('vollständig'));assert.equal(downloads,1);
 await page.locator('details').filter({has:page.locator('#harvestform')}).locator('summary').click();
 await page.fill('#harvestname','<img src=x onerror=alert(1)>');await page.fill('#harvestlat','50.54');await page.fill('#harvestlon','7.14');await page.locator('#harvestform button').click();
 await page.waitForFunction(()=>document.querySelector('#harveststatus').textContent.includes('1 Fundorte'));assert.equal(await page.locator('#harvestlist img').count(),0);
 await page.reload();await page.waitForFunction(()=>document.querySelector('#mapstatus').textContent.includes('offline geladen'));await page.waitForFunction(()=>document.querySelector('#harvestlist').textContent.includes('<img'));assert.equal(downloads,1);
 await page.evaluate(()=>{document.querySelector('#view-map').hidden=false;document.querySelector('#view-chat').hidden=true;});await page.selectOption('#harvestfilter','Nüsse');assert.match(await page.locator('#harvestlist').textContent(),/Keine Fundorte/);await page.selectOption('#harvestfilter','');
 const before=await page.evaluate(()=>mapStored('active'));fail=true;await page.click('#mapdownload');await page.waitForFunction(()=>document.querySelector('#mapdownloadstatus').textContent.includes('fehlgeschlagen'));assert.deepEqual(await page.evaluate(()=>mapStored('active')),before);
 fail=false;huge=true;await page.click('#mapdownload');await page.waitForFunction(()=>document.querySelector('#mapdownloadstatus').textContent.includes('Datei zu groß'));assert.deepEqual(await page.evaluate(()=>mapStored('active')),before);huge=false;
 // Expired package is retried when the connection returns; fresh packages are not fetched again.
 await page.evaluate(async()=>{await mapStored('download-meta',{id:'heimersheim',savedAt:1},true);window.dispatchEvent(new Event('online'));});await page.waitForFunction(()=>document.querySelector('#mapdownloadstatus').textContent.includes('vollständig'));assert.equal(downloads,4);
 const checkpoint=downloads;
 // Restore the local board page while the internet endpoint is unavailable.
 fail=true;await page.goto(url);await page.waitForFunction(()=>document.querySelector('#mapstatus').textContent.includes('offline geladen'));await page.waitForFunction(()=>document.querySelector('#harvestlist').textContent.includes('<img'));assert.equal(downloads,checkpoint);
 await page.evaluate(()=>{document.querySelector('#view-map').hidden=false;document.querySelector('#view-chat').hidden=true;});
 for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'map overflow '+width);}
 fs.mkdirSync(path.resolve(__dirname,'../test-results'),{recursive:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.resolve(__dirname,'../test-results/maps-iphone.png'),fullPage:true});assert.deepEqual(errors,[]);console.log('Map browser checks passed: atomic package save, offline data reload, daily refresh, network recovery, bounded download, harvest persistence/filter/XSS and mobile layout.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1);});
