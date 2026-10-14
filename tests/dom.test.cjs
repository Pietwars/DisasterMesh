const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'../web');
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script.*?<\/script>/gs,'');
 const dom=new JSDOM(html,{url:'http://192.168.4.1',runScripts:'outside-only'}),w=dom.window;
 w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.setInterval=()=>0;
 const sent=[],errors=[];w.addEventListener('error',e=>errors.push(e.message));
 const info=Buffer.alloc(70);info[0]=5;info[2]=10;info.writeUInt32LE(869618,48);Buffer.from('Heimersheim').copy(info,58);
 const channel=Buffer.alloc(34);channel[0]=18;Buffer.from('Public').copy(channel,2);
 const hostile=Buffer.from('<img src=x onerror="window.pwned=1">');const rec=Buffer.alloc(11+hostile.length);rec[0]=17;rec.writeUInt32LE(1792000000,7);hostile.copy(rec,11);
 w.fetch=async(url,opts)=>{
  if(url==='/api/state')return new Response(JSON.stringify({ready:true,storage:true,heap:65000,seq:1,busy:false,result:'Bereit',info:info.toString('hex'),channels:[channel.toString('hex')],contacts:[]}));
  if(url==='/api/history')return new Response('1:'+rec.toString('hex')+'\n');
  sent.push({url,body:opts.body.toString(),header:opts.headers['X-Disaster-Request']});return new Response('In Warteschlange',{status:202});
 };
 w.eval(fs.readFileSync(path.join(root,'protocol.js'),'utf8'));
 w.eval(fs.readFileSync(path.join(root,'app.js'),'utf8'));
 for(let i=0;i<10;i++)await new Promise(r=>setImmediate(r));
 const $=id=>w.document.getElementById(id);
 assert.equal($('node').textContent,'Heimersheim');assert.equal($('target').value,'c0');
 assert.equal(w.document.querySelectorAll('#messages img').length,0);assert.equal(w.pwned,undefined);assert.match($('messages').textContent,/<img/);
 $('text').value='Grüße aus Heimersheim 👋';await $('send').onsubmit({preventDefault(){}});
 assert.equal(sent[0].url,'/api/send');assert.equal(new URLSearchParams(sent[0].body).get('text'),'Grüße aus Heimersheim 👋');assert.equal(sent[0].header,'1');assert.equal($('text').value,'');
 $('text').value='ä'.repeat(51);$('text').dispatchEvent(new w.Event('input'));assert.equal($('sendbutton').disabled,true);
 assert.deepEqual(errors,[]);w.close();console.log('DOM checks passed: target selection, send, UTF-8 limit, XSS text rendering, no JS errors.');
})().catch(e=>{console.error(e);process.exit(1);});
