const { chromium }=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const root=path.resolve(__dirname,'../web'),sent=[];let rights=0;
 const info=Buffer.alloc(70);info[0]=5;info[2]=10;info.writeUInt32LE(869618,48);Buffer.from('Heimersheim').copy(info,58);
 const channel=Buffer.alloc(34);channel[0]=18;Buffer.from('Public').copy(channel,2);
 const room=Buffer.alloc(132);room[0]=3;room[33]=3;Buffer.from('112233445566','hex').copy(room,1);Buffer.from('Ahrtal Brett').copy(room,100);
 const hostile=Buffer.from('<img src=x onerror="window.pwned=1">');const rec=Buffer.alloc(11+hostile.length);rec[0]=17;rec.writeUInt32LE(1792000000,7);hostile.copy(rec,11);
 await page.route('http://192.168.4.1/**',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.pathname==='/api/admin/login')return route.fulfill({json:{token:'a'.repeat(32)}});
  if(url.pathname==='/api/state')return route.fulfill({json:{ready:true,storage:true,heap:65000,diagnostics:{firmware:'test-build',uptimeSeconds:3661,resetReason:1,minHeapBytes:40000,largestHeapBlockBytes:30000,wifiClients:2,txFlood:3,txDirect:4,rxFlood:5,rxDirect:6,txAirMs:7,rxAirMs:8,txBudgetMs:0},busy:false,result:'Bereit',info:info.toString('hex'),channels:[channel.toString('hex')],contacts:[room.toString('hex')],room:{target:'d112233445566',rights,pending:false},archive:false,queueReady:true,queueStorage:true}});
  if(url.pathname==='/api/outbox')return route.fulfill({json:[]});
  if(url.pathname==='/api/history')return route.fulfill({body:'1:'+rec.toString('hex')+'\n'});
  if(url.pathname.startsWith('/api/')){sent.push({path:url.pathname,body:req.postData(),header:req.headers()['x-disaster-request']});if(url.pathname==='/api/room-login')rights=2;return route.fulfill({status:202,body:'In Warteschlange'});}
  const file=url.pathname==='/'?'index.html':url.pathname.slice(1);
  return route.fulfill({body:fs.readFileSync(path.join(root,file)),contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.jpg')?'image/jpeg':'text/html'});
 });
 await page.goto('http://192.168.4.1/');await page.waitForFunction(()=>document.querySelector('#outboxstatus').textContent==='0 aktive Zustellaufträge');
 assert.equal(await page.title(),'DisAHRsterRadio · MeshAhrtal');
 assert.equal(await page.locator('#node').textContent(),'Heimersheim');
 assert.equal(await page.locator('#messages img').count(),0);assert.equal(await page.evaluate(()=>window.pwned),undefined);
 assert.match(await page.locator('#messages').textContent(),/<img/);
 await page.fill('#text','Grüße aus Heimersheim 👋');await page.click('#sendbutton');await page.waitForFunction(()=>document.querySelector('#text').value==='');
 assert.equal(sent[0].path,'/api/send');assert.equal(new URLSearchParams(sent[0].body).get('text'),'Grüße aus Heimersheim 👋');assert.equal(sent[0].header,'1');
 await page.fill('#text','ä'.repeat(51));assert.equal(await page.locator('#sendbutton').isDisabled(),true);
 await page.click('#tab-board');assert.equal(await page.locator('#target option').count(),1);
 await page.fill('#text','Testbeitrag');assert.equal(await page.locator('#sendbutton').isDisabled(),true);
 assert.equal(await page.locator('#roompassword').count(),0);await page.click('#roomloginbutton');await page.waitForFunction(()=>!document.querySelector('#sendbutton').disabled);
 assert.equal(sent.at(-1).path,'/api/room-login');
 await page.click('#tab-map');
 await page.setInputFiles('#mapfile',path.resolve(__dirname,'../maps/heimersheim.geojson'));
 await page.waitForFunction(()=>document.querySelector('#mapstatus').textContent.includes('Kartenobjekte'));
 // Ensure actual drawing takes place rather than only validating imported geometry.
 assert.ok(await page.locator('#mapcanvas').evaluate(c=>{const p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let i=0;i<p.length;i+=4)if(p[i+3]>0&&(p[i]!==22||p[i+1]!==46||p[i+2]!==54))return true;return false;}));
 await page.click('#mapin');await page.click('#mapout');await page.click('#mapfit');
 await page.click('#tab-device');assert.match(await page.locator('#diagnostics').textContent(),/1 h 1 min 1 s/);assert.equal(await page.locator('#exportdiagnostics').isEnabled(),true);assert.equal(await page.locator('#archivecurrent').isDisabled(),true);
 await page.fill('#adminpassword','DemoAdmin2026!');await page.locator('#adminlogin button').click();await page.waitForFunction(()=>!document.querySelector('#radio fieldset').disabled);
 await page.locator('details').filter({has:page.locator('#rename')}).locator('summary').click();
 await page.fill('#name','Ahr-01');await Promise.all([page.waitForResponse(r=>r.url().endsWith('/api/name')),page.locator('#rename button').click()]);assert.equal(sent.at(-1).path,'/api/name');
 // Every view must fit small phones as well as a desktop browser.
 for(const width of [320,390,768,1024]){await page.setViewportSize({width,height:844});for(const id of ['chat','board','map','device']){await page.click('#tab-'+id);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Overflow '+id+' at '+width);}}
 assert.deepEqual(errors,[]);
 fs.mkdirSync(path.resolve(__dirname,'../test-results'),{recursive:true});
 await page.setViewportSize({width:390,height:844});await page.click('#tab-chat');await page.screenshot({path:path.resolve(__dirname,'../test-results/disahrsterradio-mobile.png'),fullPage:true});
 await browser.close();console.log('Browser checks passed: navigation, room login, send, imported real map, settings, UTF-8, XSS and responsive widths.');
})().catch(e=>{console.error(e);process.exit(1);});
