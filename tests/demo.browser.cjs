const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'../docs/demo');
 const server=http.createServer((req,res)=>{const p=req.url.split('?')[0];const files={'/':'index.html','/app.webmanifest':'app.webmanifest','/app-icon.png':'app-icon.png'};if(!files[p]){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',p.endsWith('.png')?'image/png':p.endsWith('.webmanifest')?'application/manifest+json':'text/html; charset=utf-8');res.end(fs.readFileSync(path.join(root,files[p])));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({headless:true});
 try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const external=[];page.on('request',r=>{if(!r.url().startsWith(url))external.push(r.url());});
 await page.goto(url);
 const photo=await page.locator('.hero').evaluate(el=>getComputedStyle(el).backgroundImage);assert.match(photo,/data:image\/webp;base64/);assert.match(await page.locator('h1').textContent(),/DisAHRsterRadio/);
 const picture=await page.evaluate(()=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image.naturalWidth);image.onerror=()=>resolve(0);image.src=getComputedStyle(document.documentElement).getPropertyValue('--ahrtal-photo').trim().slice(5,-2);}));assert.ok(picture>=900,'Embedded MeshAhrtal header image must decode');
 await page.waitForFunction(()=>document.querySelector('#messages').textContent.includes('Heimersheim'));
 await page.fill('#text','Test aus der Vorschau');await page.click('#sendbutton');await page.waitForFunction(()=>document.querySelector('#messages').textContent.includes('Test aus der Vorschau'));
 await page.click('#tab-device');assert.equal(await page.locator('#radio button').isDisabled(),true);
 assert.equal(await page.locator('#demo-banner').textContent().then(t=>/passw/i.test(t)),false);await page.locator('#adminlogin button').click();await page.waitForFunction(()=>!document.querySelector('#radio fieldset').disabled);
 await page.locator('details').filter({has:page.locator('#radio')}).locator('summary').click();await page.selectOption('#radiopreset','eu-legacy');assert.equal(await page.inputValue('#freq'),'869.525');await page.locator('#radio button').click();await page.waitForFunction(()=>document.querySelector('#radio-current').textContent.includes('869.525'));
 await page.click('#adminlogout');assert.equal(await page.locator('#radio button').isDisabled(),true);
 for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:900});for(const view of ['chat','board','map','device']){await page.click('#tab-'+view);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Overflow '+view+' '+width);}}
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 fs.mkdirSync(path.resolve(__dirname,'../test-results'),{recursive:true});
 await page.reload();await page.waitForFunction(()=>document.querySelector('#messages').textContent.includes('Heimersheim'));await page.setViewportSize({width:1280,height:1100});await page.click('#tab-chat');await page.screenshot({path:path.resolve(__dirname,'../test-results/ahrtal-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.resolve(__dirname,'../test-results/ahrtal-iphone.png'),fullPage:false});
 await page.click('#tab-device');await page.screenshot({path:path.resolve(__dirname,'../test-results/ahrtal-admin.png'),fullPage:true});
 await page.click('#tab-map');await page.screenshot({path:path.resolve(__dirname,'../test-results/ahrtal-map.png'),fullPage:true});
 console.log('Demo browser checks passed: simulated chat, authentication UI, presets, no external requests, responsive widths and real screenshots.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1);});
