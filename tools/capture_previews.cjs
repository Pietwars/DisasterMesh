// Capture the real demo UI for the README; no hardware connection or radio traffic.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
(async()=>{
 const root=path.resolve(__dirname,'../docs/demo'),out=path.resolve(__dirname,'../docs/images');
 const server=http.createServer((req,res)=>{
  const name={'/':'index.html','/app.webmanifest':'app.webmanifest','/app-icon.png':'app-icon.png'}[req.url.split('?')[0]];
  if(!name){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',name.endsWith('.png')?'image/png':name.endsWith('.webmanifest')?'application/manifest+json':'text/html; charset=utf-8');res.end(fs.readFileSync(path.join(root,name)));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.PREVIEW_CHROMIUM?{executablePath:process.env.PREVIEW_CHROMIUM}:{})});
 try{
  fs.mkdirSync(out,{recursive:true});
  const page=await browser.newPage({viewport:{width:1100,height:900},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(()=>document.querySelector('#messages').textContent.includes('Heimersheim'));
  const shot=async(name,locator)=>{await locator.screenshot({path:path.join(out,name+'.png')});};
  await page.screenshot({path:path.join(out,'ahrtal-desktop.png'),fullPage:true});
  await shot('funktion-chat',page.locator('#conversation'));
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,'ahrtal-iphone.png'),fullPage:false});
  await page.setViewportSize({width:1100,height:900});
  await page.selectOption('#target','d223344556677');await shot('funktion-direktnachrichten',page.locator('#conversation'));
  await page.click('#tab-board');await shot('funktion-brett',page.locator('#conversation'));
  await shot('funktion-meldungen',page.locator('details').filter({has:page.locator('#noticeform')}));
  await page.click('#tab-map');await page.waitForFunction(()=>typeof mapPois!=='undefined'&&mapPois.length>0);
  await page.locator('#mapsection').scrollIntoViewIfNeeded();
  const sectionBox=await page.locator('#mapsection').boundingBox(),canvasBox=await page.locator('#mapcanvas').boundingBox();
  await page.screenshot({path:path.join(out,'funktion-kartendownload.png'),clip:{x:sectionBox.x,y:sectionBox.y,width:sectionBox.width,height:canvasBox.y-sectionBox.y}});
  await page.click('#mapfit');await page.click('#mapin');await page.click('#mapin');await page.click('#mapin');
  const box=await page.locator('#mapcanvas').boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+90,box.y+box.height/2,{steps:8});await page.mouse.up();
  await shot('ahrtal-map',page.locator('#mapcanvas'));
  await page.click('#mapfit');
  await shot('heimersheim-map',page.locator('#mapcanvas'));
  await page.selectOption('#poifilter','pharmacy');await page.locator('#poi-list-details').evaluate(el=>{if(!el.open)throw Error('POI filter must open the source list');});
  await shot('funktion-versorgung',page.locator('#poi-list-details').locator('..'));
  await page.locator('#poi-list-details > summary').click();await page.locator('#poi-editor > summary').click();
  await page.fill('#poiname','Beispiel: eigener Treffpunkt');await page.fill('#poilat','50.5426');await page.fill('#poilon','7.1761');
  await shot('funktion-eigene-pois',page.locator('#poi-editor'));
  const harvest=page.locator('details').filter({has:page.locator('#harvestform')});await harvest.locator('summary').click();
  await shot('funktion-erntefundorte',harvest.locator('..'));
  await page.click('#tab-device');await shot('ahrtal-admin',page.locator('.admin-panel'));
  await shot('funktion-diagnose',page.locator('section[aria-labelledby="diagnosticstitle"]'));
  await shot('funktion-auftraege-sd',page.locator('details').filter({has:page.locator('#outbox')}));
  await page.locator('#adminlogin button').click();
  await page.waitForFunction(()=>!document.querySelector('#radio fieldset').disabled);
  for(const [id,name] of [['rename','funktion-knoten'],['channel','funktion-kanaele'],['radio','funktion-funkprofile']]){
   const details=page.locator('details').filter({has:page.locator('#'+id)});await details.locator('summary').click();await shot(name,details);
  }
  if(errors.length)throw Error(errors.join('\n'));
  console.log('README previews captured from the current demo; no browser errors.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
