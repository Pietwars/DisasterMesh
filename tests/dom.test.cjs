const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'../web');
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script.*?<\/script>/gs,'');
 const dom=new JSDOM(html,{url:'http://192.168.4.1',runScripts:'outside-only'}),w=dom.window;
 w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.setInterval=()=>0;
 let drawCount=0;w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(_,key)=>()=>{if(key==='fillRect')drawCount++;},set:()=>true});
 let extraContacts=[],roomSession={target:'',rights:0,pending:false};let holdSend=null;const sent=[],errors=[];w.addEventListener('error',e=>errors.push(e.message));
 const info=Buffer.alloc(70);info[0]=5;info[2]=10;info.writeUInt32LE(869618,48);Buffer.from('Heimersheim').copy(info,58);
 const channel=Buffer.alloc(34);channel[0]=18;Buffer.from('Public').copy(channel,2);
 const hostile=Buffer.from('<img src=x onerror="window.pwned=1">');const rec=Buffer.alloc(11+hostile.length);rec[0]=17;rec.writeUInt32LE(1792000000,7);hostile.copy(rec,11);
 w.fetch=async(url,opts)=>{
  if(url==='/api/state')return new Response(JSON.stringify({ready:true,storage:true,heap:65000,seq:1,busy:false,result:'Bereit',info:info.toString('hex'),channels:[channel.toString('hex')],contacts:extraContacts,room:roomSession}));
  if(url==='/api/outbox'&&!opts.body)return new Response('[]');
  if(url==='/api/history')return new Response('1:'+rec.toString('hex')+'\n');
  if(holdSend)await holdSend;sent.push({url,body:opts.body.toString(),header:opts.headers['X-Disaster-Request']});return new Response('In Warteschlange',{status:202});
 };
 w.eval(fs.readFileSync(path.join(root,'protocol.js'),'utf8'));
 w.eval(fs.readFileSync(path.join(root,'map.js'),'utf8'));
 w.eval(fs.readFileSync(path.join(root,'app.js'),'utf8'));
 for(let i=0;i<10;i++)await new Promise(r=>setImmediate(r));
 const $=id=>w.document.getElementById(id);
 assert.equal($('node').textContent,'Heimersheim');assert.equal($('target').value,'c0');
 assert.equal(w.document.querySelectorAll('#messages img').length,0);assert.equal(w.pwned,undefined);assert.match($('messages').textContent,/<img/);
 $('text').value='Grüße aus Heimersheim 👋';await $('send').onsubmit({preventDefault(){}});
 assert.equal(sent[0].url,'/api/send');assert.equal(new URLSearchParams(sent[0].body).get('text'),'Grüße aus Heimersheim 👋');assert.equal(sent[0].header,'1');assert.equal($('text').value,'');
 $('text').value='ä'.repeat(51);$('text').dispatchEvent(new w.Event('input'));assert.equal($('sendbutton').disabled,true);
 // Search must filter without injecting markup.
 $('search').value='does-not-exist';$('search').dispatchEvent(new w.Event('input'));assert.equal(w.document.querySelectorAll('.message').length,0);
 $('search').value='img';$('search').dispatchEvent(new w.Event('input'));assert.equal(w.document.querySelectorAll('.message').length,1);
 let exported;w.URL.createObjectURL=blob=>{exported=blob;return 'blob:test';};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};
 $('export').click();assert.ok(exported);assert.equal(exported.type,'application/json');
 $('text').value='';await w.update();assert.equal($('sendbutton').disabled,true);
 // Editing during an outstanding request must preserve the new draft, and block duplicates.
 let release;holdSend=new Promise(r=>{release=r;});$('text').value='First';
 const pending=$('send').onsubmit({preventDefault(){}});
 $('text').value='New draft';$('text').dispatchEvent(new w.Event('input'));assert.equal($('sendbutton').disabled,true);
 await $('send').onsubmit({preventDefault(){}});release();await pending;holdSend=null;
 assert.equal(sent.length,2);assert.equal($('text').value,'New draft');
 // Room selection requires a successful login before posting.
 const room=Buffer.alloc(132);room[0]=3;room[33]=3;Buffer.from('112233445566','hex').copy(room,1);Buffer.from('Unser Brett').copy(room,100);extraContacts=[room.toString('hex')];await w.update();
 $('tab-board').click();$('target').value='d112233445566';$('target').dispatchEvent(new w.Event('change'));assert.equal($('roompanel').hidden,false);assert.equal($('sendbutton').disabled,true);
 $('roompassword').value='RoomSecret1234';await $('roomlogin').onsubmit({preventDefault(){}});
 assert.equal(sent.at(-1).url,'/api/room-login');assert.equal(new URLSearchParams(sent.at(-1).body).get('password'),'RoomSecret1234');assert.equal($('roompassword').value,'');
 roomSession={target:'d112233445566',rights:2,pending:false};await w.update();assert.equal($('sendbutton').disabled,false);
 $('noticeplace').value='Heimersheim';$('noticeneed').value='Wasser';$('noticeform').onsubmit({preventDefault(){}});assert.match($('text').value,/^!DM1\|H\|/);assert.ok(new TextEncoder().encode($('text').value).length<=100);
 // Private offline delivery must use its own durable endpoint, not normal send.
 const privateContact=Buffer.from(room);privateContact[33]=1;extraContacts=[privateContact.toString('hex')];await w.update();$('tab-chat').click();$('target').value='d112233445566';$('target').dispatchEvent(new w.Event('change'));
 assert.equal($('queueoptions').hidden,false);$('deferdelivery').checked=true;$('text').value='Offline privat';await $('send').onsubmit({preventDefault(){}});assert.equal(sent.at(-1).url,'/api/outbox');assert.equal(new URLSearchParams(sent.at(-1).body).get('hours'),'6');
 // Navigation separates rooms from chat while retaining a chosen contact and draft.
 $('text').value='Entwurf bleibt';
 extraContacts=[privateContact.toString('hex'),room.toString('hex')];await w.update();
 assert.equal($('target').options.length,2);assert.equal($('target').value,'d112233445566');
 $('tab-board').click();assert.equal($('target').options.length,1);assert.equal($('target').options[0].textContent,'Raum: Unser Brett');
 assert.equal($('conversation').parentElement.id,'view-board');assert.equal($('view-chat').hidden,true);assert.equal($('tab-board').getAttribute('aria-selected'),'true');
 $('tab-map').click();assert.equal($('view-map').hidden,false);assert.equal($('view-board').hidden,true);
 await w.useOfflineMap({type:'FeatureCollection',features:[{type:'Feature',properties:{highway:'residential'},geometry:{type:'LineString',coordinates:[[7.15,50.54],[7.16,50.55]]}}]},false);
 const before=drawCount;$('tab-map').click();assert.ok(drawCount>before);assert.match($('mapstatus').textContent,/1 Kartenobjekte/);
 $('tab-device').click();assert.equal($('view-device').hidden,false);
 $('name').value='Ahr-01';$('rename').onsubmit({preventDefault(){}});await new Promise(r=>setImmediate(r));assert.equal(sent.at(-1).url,'/api/name');assert.equal(new URLSearchParams(sent.at(-1).body).get('name'),'Ahr-01');
 $('freq').value='869.618';$('radio').onsubmit({preventDefault(){}});await new Promise(r=>setImmediate(r));assert.equal(sent.at(-1).url,'/api/radio');assert.equal(new URLSearchParams(sent.at(-1).body).get('freq'),'869618');
 $('channelname').value='Ahr';$('key').value='a'.repeat(32);await $('channel').onsubmit({preventDefault(){}});assert.equal(sent.at(-1).url,'/api/channel');assert.equal($('key').value,'');
 $('tab-chat').focus();$('tab-chat').dispatchEvent(new w.KeyboardEvent('keydown',{key:'End'}));assert.equal($('tab-device').getAttribute('aria-selected'),'true');assert.equal(w.document.activeElement,$('tab-device'));

 $('tab-chat').click();assert.equal($('target').value,'d112233445566');assert.equal($('text').value,'Entwurf bleibt');
 // Empty room list cannot send or log in, even with an existing room session.
 extraContacts=[];await w.update();$('tab-board').click();assert.equal($('targetempty').hidden,false);assert.equal($('sendbutton').disabled,true);assert.equal($('roomloginbutton').disabled,true);
 assert.equal($('archivecurrent').disabled,true);
 // All element IDs are unique; status remains visible outside any hidden tab.
 const ids=[...w.document.querySelectorAll('[id]')].map(e=>e.id);assert.equal(new Set(ids).size,ids.length);
 assert.equal($('feedback').closest('[data-panel]'),null);
 // Failed connection must not leave stale online state that re-enables sending.
 w.fetch=async()=>{throw Error('offline');};await w.update();$('text').dispatchEvent(new w.Event('input'));assert.equal($('sendbutton').disabled,true);assert.equal($('archivecurrent').disabled,true);assert.match($('archivestatus').textContent,/unbekannt/);
 assert.deepEqual(errors,[]);w.close();console.log('DOM checks passed: target selection, send, UTF-8 limit, XSS text rendering, no JS errors.');
})().catch(e=>{console.error(e);process.exit(1);});
