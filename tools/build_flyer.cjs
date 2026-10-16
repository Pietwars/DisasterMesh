// Renders docs/flyer/flyer.html to a print-ready A5 PDF and a PNG preview.
// Usage: node tools/build_flyer.cjs [outDir]   (needs the optional playwright dependency)
const path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const src=path.resolve(__dirname,'../docs/flyer/flyer.html'),out=path.resolve(process.argv[2]||path.dirname(src));
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:559,height:794},deviceScaleFactor:2.5});
 const errors=[];page.on('requestfailed',r=>errors.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+src);await page.waitForLoadState('networkidle');
 const overflow=await page.$eval('.page',e=>e.scrollHeight>e.clientHeight+1);
 if(overflow||errors.length)throw Error('Flyer layout/asset problem: '+(overflow?'content overflows page ':'')+errors.join(', '));
 await page.pdf({path:path.join(out,'DisAHRsterRadio-Flyer.pdf'),format:'A5',printBackground:true,margin:{top:0,right:0,bottom:0,left:0}});
 await page.locator('.page').screenshot({path:path.join(out,'flyer-preview.png')});
 await browser.close();console.log('Flyer written to',out);
})().catch(e=>{console.error(e);process.exit(1);});
