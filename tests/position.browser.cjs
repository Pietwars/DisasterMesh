const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
(async()=>{
 const server=http.createServer((req,res)=>{if(req.url!=='/'){res.writeHead(404).end();return;}res.setHeader('content-type','text/html; charset=utf-8');res.end(fs.readFileSync(path.resolve(__dirname,'../docs/demo/index.html')));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url=`http://127.0.0.1:${server.address().port}/`;
  const prepare=async()=>{await page.goto(url);await page.waitForFunction(()=>state?.ready);await page.click('#tab-map');await page.selectOption('#posplace','Heimersheim');await page.evaluate(()=>{const original=window.fetch;window.testSends=[];window.fetch=async(input,opts)=>{if(input==='/api/send'){window.testSends.push(opts.body.toString());if(window.failSend)return new Response('Testfehler',{status:503});}return original(input,opts);};});};
  await prepare();await page.click('#posshare');await page.waitForFunction(()=>!positionSending&&testSends.length===1);
  const id=await page.evaluate(()=>localStorage.getItem('disahrster-position-id'));
  assert.match(new URLSearchParams(await page.evaluate(()=>testSends[0])).get('text'),/^!DP2\|/);
  await prepare();await page.click('#posshare');await page.waitForFunction(()=>!positionSending);
  assert.equal(await page.evaluate(()=>testSends.length),0);assert.match(await page.locator('#feedback').textContent(),/nächste Position/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('disahrster-position-id')),id);
  // A failed/ambiguous request retains the reservation across reload.
  await page.evaluate(()=>{localStorage.setItem(POSITION_STORAGE_KEY,JSON.stringify({nextAt:Date.now()-1}));window.failSend=true;});
  await page.click('#posshare');await page.waitForFunction(()=>!positionSending&&testSends.length===1);
  await prepare();await page.click('#posshare');assert.equal(await page.evaluate(()=>testSends.length),0);
  // Failure to persist the cooldown must prevent any radio request.
  await page.evaluate(()=>{localStorage.removeItem(POSITION_STORAGE_KEY);const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===POSITION_STORAGE_KEY)throw Error('Quota-Test');return set.call(this,k,v);};});
  await page.click('#posshare');await page.waitForFunction(()=>!positionSending);
  assert.equal(await page.evaluate(()=>testSends.length),0);assert.match(await page.locator('#feedback').textContent(),/Quota-Test/);
  // No stable-name collision and no HTML injection in display labels.
  await page.evaluate(()=>{const now=Math.floor(Date.now()/1000),mk=id=>makePosition({lat:50.54,lon:7.17,stamp:now,name:'<b>Anna</b>',senderId:id});const records=[{body:mk('aaaaaaaaaaaaaaaa'),target:'c0'},{body:mk('bbbbbbbbbbbbbbbb'),target:'c0'}];window.sameNamePositions=latestPositions(records,Date.now());});
  assert.equal(await page.evaluate(()=>sameNamePositions.length),2);
  assert.deepEqual(errors,[]);console.log('Position browser checks passed: DP2, reload cooldown, stable ID, ambiguous failure and unavailable storage.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exit(1);});
