const { chromium }=require('playwright');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const root=path.resolve(__dirname,'../web');const sent=[];
 const info=Buffer.alloc(70);info[0]=5;info[2]=10;info.writeUInt32LE(869618,48);Buffer.from('Heimersheim').copy(info,58);
 const channel=Buffer.alloc(34);channel[0]=18;Buffer.from('Public').copy(channel,2);
 const hostile=Buffer.from('<img src=x onerror="window.pwned=1">');const rec=Buffer.alloc(11+hostile.length);rec[0]=17;rec.writeUInt32LE(1792000000,7);hostile.copy(rec,11);
 await page.route('http://192.168.4.1/**',async route=>{
  const req=route.request(),url=new URL(req.url());
  if(url.pathname==='/api/state')return route.fulfill({json:{ready:true,storage:true,heap:65000,seq:1,busy:false,result:'Bereit',info:info.toString('hex'),channels:[channel.toString('hex')],contacts:[]}});
  if(url.pathname==='/api/history')return route.fulfill({body:'1:'+rec.toString('hex')+'\n'});
  if(url.pathname.startsWith('/api/')){sent.push({path:url.pathname,body:req.postData(),header:req.headers()['x-disaster-request']});return route.fulfill({status:202,body:'In Warteschlange'});}
  const file=url.pathname==='/'?'index.html':url.pathname.slice(1);
  return route.fulfill({body:fs.readFileSync(path.join(root,file)),contentType:file.endsWith('.js')?'text/javascript':'text/html'});
 });
 await page.goto('http://192.168.4.1/');await page.waitForFunction(()=>document.querySelector('#link').textContent==='Knoten online');
 assert.equal(await page.locator('#node').textContent(),'Heimersheim');
 assert.equal(await page.locator('#messages img').count(),0);assert.equal(await page.evaluate(()=>window.pwned),undefined);
 assert.match(await page.locator('#messages').textContent(),/<img/);
 await page.fill('#text','Grüße aus Heimersheim 👋');await page.click('#sendbutton');await page.waitForFunction(()=>document.querySelector('#text').value==='');
 assert.equal(sent[0].path,'/api/send');assert.equal(new URLSearchParams(sent[0].body).get('text'),'Grüße aus Heimersheim 👋');assert.equal(sent[0].header,'1');
 await page.fill('#text','ä'.repeat(51));assert.equal(await page.locator('#sendbutton').isDisabled(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);
 await page.screenshot({path:path.resolve(__dirname,'../../portal-mobile-qa.png'),fullPage:true});
 await browser.close();console.log('Mobile browser checks passed: send, UTF-8 limit, XSS text rendering, width, no JS errors.');
})().catch(e=>{console.error(e);process.exit(1);});
