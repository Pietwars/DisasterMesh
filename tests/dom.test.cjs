const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'../web');
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script.*?<\/script>/gs,'');
 const dom=new JSDOM(html,{url:'http://192.168.4.1',runScripts:'outside-only'}),w=dom.window;
 w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.setInterval=()=>0;
 let drawCount=0;w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(_,key)=>()=>{if(key==='fillRect')drawCount++;},set:()=>true});
 let diagnostics=null;let extraContacts=[],roomSession={target:'',rights:0,pending:false};let holdSend=null;const sent=[],errors=[];w.addEventListener('error',e=>errors.push(e.message));
 const info=Buffer.alloc(70);info[0]=5;info[2]=10;info.writeUInt32LE(869618,48);Buffer.from('Heimersheim').copy(info,58);
 const channel=Buffer.alloc(34);channel[0]=18;Buffer.from('Public').copy(channel,2);
 const hostile=Buffer.from('<img src=x onerror="window.pwned=1">');const rec=Buffer.alloc(11+hostile.length);rec[0]=17;rec.writeUInt32LE(1792000000,7);hostile.copy(rec,11);
 w.fetch=async(url,opts)=>{
  if(url==='/api/admin/login')return new Response(JSON.stringify({token:'a'.repeat(32)}));
  if(url==='/api/state')return new Response(JSON.stringify({ready:true,storage:true,heap:65000,diagnostics,seq:1,busy:false,result:'Bereit',info:info.toString('hex'),channels:[channel.toString('hex')],contacts:extraContacts,room:roomSession}));
  if(url==='/api/outbox'&&!opts.body)return new Response('[]');
  if(url==='/api/history')return new Response('1:'+rec.toString('hex')+'\n');
  if(holdSend)await holdSend;sent.push({url,body:opts.body.toString(),header:opts.headers['X-Disaster-Request'],client:opts.headers['X-Disaster-Client']});return new Response('In Warteschlange',{status:202});
 };
 w.eval(fs.readFileSync(path.join(root,'protocol.js'),'utf8'));
 w.eval(fs.readFileSync(path.join(root,'map.js'),'utf8'));
 w.eval(fs.readFileSync(path.join(root,'position.js'),'utf8'));
 w.eval(fs.readFileSync(path.join(root,'app.js'),'utf8'));
 for(let i=0;i<10;i++)await new Promise(r=>setImmediate(r));
 const $=id=>w.document.getElementById(id);
 assert.equal($('exportdiagnostics').disabled,true);
 diagnostics={firmware:'v1.17.1-ahr0.6',uptimeSeconds:90061,resetReason:9,minHeapBytes:40000,largestHeapBlockBytes:30000,wifiClients:2,txFlood:5,txDirect:6,rxFlood:7,rxDirect:8,txAirMs:123,rxAirMs:456,txBudgetMs:0,password:'DO NOT EXPORT'};
 await w.update();assert.match($('diagnostics').textContent,/25 h 1 min 1 s/);assert.match($('diagnostics').textContent,/Unterspannung/);assert.match($('diagnostics').textContent,/TX-Budget: 0 ms/);
 const snapshot=w.diagnosticSnapshot();assert.equal(snapshot.txBudgetMs,0);assert.equal(snapshot.password,undefined);assert.equal(snapshot.contacts,undefined);assert.equal(snapshot.heapBytes,65000);
 diagnostics.txBudgetWaiting=true;diagnostics.txBudgetWaitEvents=2;diagnostics.txBudgetWaitSeconds=7;diagnostics.txQueuePackets=3;await w.update();assert.match($('txstatus').textContent,/wartet/);assert.equal(w.diagnosticSnapshot().txBudgetWaitEvents,2);assert.match($('diagnostics').textContent,/3 Pakete/);
 diagnostics.txBudgetWaiting=false;await w.update();assert.match($('txstatus').textContent,/aktuell nicht/);
 diagnostics.txBudgetWaiting='true';await w.update();assert.equal(w.diagnosticSnapshot().txBudgetWaiting,null);assert.match($('txstatus').textContent,/nicht verfügbar/);
 diagnostics={firmware:'<img src=x onerror=alert(1)>'};await w.update();assert.equal(w.document.querySelectorAll('#diagnostics img').length,0);assert.match($('diagnostics').textContent,/unbekannt/);assert.equal(w.diagnosticSnapshot().txBudgetMs,null);
 diagnostics=null;await w.update();assert.equal($('exportdiagnostics').disabled,true);
 assert.equal($('node').textContent,'Heimersheim');assert.equal($('target').value,'c0');
 assert.equal(w.document.querySelectorAll('#messages img').length,0);assert.equal(w.pwned,undefined);assert.match($('messages').textContent,/<img/);
 $('text').value='Grüße aus Heimersheim 👋';await $('send').onsubmit({preventDefault(){}});
 assert.equal(sent[0].url,'/api/send');assert.equal(new URLSearchParams(sent[0].body).get('text'),'Grüße aus Heimersheim 👋');assert.equal(sent[0].header,'1');assert.match(sent[0].client,/^[a-f0-9]{16}$/);assert.equal($('text').value,'');
 $('text').value='ä'.repeat(51);$('text').dispatchEvent(new w.Event('input'));assert.equal($('sendbutton').disabled,true);
 // Search must filter without injecting markup.
 $('search').value='does-not-exist';$('search').dispatchEvent(new w.Event('input'));assert.equal(w.document.querySelectorAll('.message').length,0);
 $('search').value='img';$('search').dispatchEvent(new w.Event('input'));assert.equal(w.document.querySelectorAll('.message').length,1);
 let exported;w.URL.createObjectURL=blob=>{exported=blob;return 'blob:test';};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};
 $('export').click();assert.ok(exported);assert.equal(exported.type,'application/json');
 diagnostics={firmware:'test',uptimeSeconds:5,resetReason:1,password:'PRIVATE'};await w.update();$('exportdiagnostics').click();
 const exportText=await new Promise((resolve,reject)=>{const reader=new w.FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsText(exported);});
 const diagExport=JSON.parse(exportText);assert.equal(diagExport.format,'DisAHRsterRadio-diagnostics');assert.equal(diagExport.uptimeSeconds,5);assert.equal(diagExport.password,undefined);assert.equal(diagExport.messages,undefined);assert.equal(diagExport.contacts,undefined);

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
 assert.equal($('roompassword'),null);await $('roomlogin').onsubmit({preventDefault(){}});
 assert.equal(sent.at(-1).url,'/api/room-login');assert.equal(new URLSearchParams(sent.at(-1).body).has('password'),false);
 roomSession={target:'d112233445566',rights:1,pending:false};await w.update();assert.match($('roomstatus').textContent,/nur Lesen/);assert.equal($('sendbutton').disabled,true);
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
 assert.equal($('radio').querySelector('fieldset').disabled,true);$('adminpassword').value='DemoAdmin2026!';await $('adminlogin').onsubmit({preventDefault(){}});assert.equal($('radio').querySelector('fieldset').disabled,false);assert.equal($('adminpassword').value,'');
 $('radiopreset').value='eu-legacy';$('radiopreset').onchange();assert.equal($('freq').value,'869.525');assert.equal($('sf').value,'11');$('radiopreset').value='de-narrow';$('radiopreset').onchange();assert.equal($('cr').value,'8');
 $('name').value='Ahr-01';$('rename').onsubmit({preventDefault(){}});await new Promise(r=>setImmediate(r));assert.equal(sent.at(-1).url,'/api/name');assert.equal(new URLSearchParams(sent.at(-1).body).get('name'),'Ahr-01');
 $('freq').value='869.618';$('radio').onsubmit({preventDefault(){}});await new Promise(r=>setImmediate(r));assert.equal(sent.at(-1).url,'/api/radio');assert.equal(new URLSearchParams(sent.at(-1).body).get('freq'),'869618');assert.equal(new URLSearchParams(sent.at(-1).body).get('preset'),'de-narrow');
 $('channelpreset').value='Public';$('channelpreset').onchange();assert.equal($('key').value,'8b3387e9c5cdea6ac9e5edbaa115cd72');$('channelpreset').value='Ahrtal';$('channelpreset').onchange();assert.equal($('key').value,'');
 $('channelname').value='Ahr';$('key').value='a'.repeat(32);await $('channel').onsubmit({preventDefault(){}});assert.equal(sent.at(-1).url,'/api/channel');assert.equal($('key').value,'');
 $('channelname').value='Ahr';$('key').value='ab'.repeat(16);$('key').dispatchEvent(new w.Event('input'));assert.match($('paircard').textContent,/^DisAHRsterRadio\|0\|Ahr\|abababababababababababababababab\|/);
 $('sendername').value='Anna';$('text').value='Hallo Tal';await $('send').onsubmit({preventDefault(){}});assert.equal(new URLSearchParams(sent.at(-1).body).get('text'),'[Anna] Hallo Tal');$('sendername').value='';$('text').value='Entwurf bleibt';
 w.confirm=()=>true;await $('wipehistory').onclick();assert.equal(sent.at(-1).url,'/api/history-wipe');
 $('tab-chat').focus();$('tab-chat').dispatchEvent(new w.KeyboardEvent('keydown',{key:'End'}));assert.equal($('tab-device').getAttribute('aria-selected'),'true');assert.equal(w.document.activeElement,$('tab-device'));

 $('tab-chat').click();assert.equal($('target').value,'d112233445566');assert.equal($('text').value,'Entwurf bleibt');
 // Empty room list cannot send or log in, even with an existing room session.
 extraContacts=[];await w.update();$('tab-board').click();assert.equal($('targetempty').hidden,false);assert.equal($('sendbutton').disabled,true);assert.equal($('roomloginbutton').disabled,true);
 assert.equal($('archivecurrent').disabled,true);
 // All element IDs are unique; status remains visible outside any hidden tab.
 const ids=[...w.document.querySelectorAll('[id]')].map(e=>e.id);assert.equal(new Set(ids).size,ids.length);
 assert.equal($('feedback').closest('[data-panel]'),null);
 // Position: insecure http blocks geolocation with a clear hint; place choice and share send a compact !DP1 message once per 5 minutes.
 $('posgeo').click();assert.match($('posstatus').textContent,/HTTPS|keine Ortung/);
 assert.equal($('posshare').disabled,true);
 diagnostics={gps:{enabled:true,fix:true,lat:50.54261,lon:7.17602}};await w.update();$('posgeo').click();assert.match($('posstatus').textContent,/GPS-Modul am Board/);assert.match($('posstatus').textContent,/Heimersheim/);diagnostics=null;await w.update();
 $('posplace').value='Heimersheim';$('posplace').dispatchEvent(new w.Event('change'));assert.match($('posstatus').textContent,/Heimersheim/);assert.equal($('posprecision').value,'grob');
 assert.equal($('posshare').disabled,false);const posBefore=sent.length;$("posshare").click();for(let i=0;i<10;i++)await new Promise(r=>setImmediate(r));
 const shared=sent.slice(posBefore).find(x=>x.url==='/api/send');assert.ok(shared);const params=new URLSearchParams(shared.body);assert.match(params.get('text'),/^!DP1\|50\.54,7\.18\|\d{10}/);assert.equal(params.get('target'),'c0');
 const again=sent.length;$('posshare').click();for(let i=0;i<5;i++)await new Promise(r=>setImmediate(r));assert.equal(sent.length,again);assert.match($('feedback').textContent,/nächste Position/);
 // Quick templates prefill the notice form; place choice fills approximate coordinates.
 w.document.querySelector('.quick-btn[data-need^="Trinkwasser"]').click();assert.equal($('noticekind').value,'H');assert.match($('noticeneed').value,/Trinkwasser/);
 $('noticeplacepick').value='Dernau';$('noticeplacepick').dispatchEvent(new w.Event('change'));assert.equal($('noticeplace').value,'Dernau');assert.equal($('noticelat').value,'50.5344');
 // !DM1 notices render as cards; malformed ones stay raw text.
 {const recOf=t=>{const b=Buffer.from(t);const r=Buffer.alloc(11+b.length);r[0]=17;r.writeUInt32LE(1792000000,7);b.copy(r,11);return r.toString('hex');};
  const exp=Math.floor(Date.now()/1000)+3600;
  $('search').value='';if(!$('target').querySelector('option[value=c0]'))$('target').append(new w.Option('Public','c0'));$('target').value='c0';w.renderHistory(['1:'+recOf('Maria: !DM1|H|'+exp+'|50.54270,7.17560|Heimersheim Kirche|<b>Wasser</b> für 4'),'2:'+recOf('!DM1|A|'+exp+'|-|Dernau|Strom vorhanden'),'3:'+recOf('!DM1|X|'+exp+'|-|Ort|kaputt'),'4:'+recOf('!DM1|I|1700000001|-|Sinzig|alt')].join('\n'));
  const cards=$('messages').querySelectorAll('.dm1-card');assert.equal(cards.length,3);
  assert.match(cards[0].textContent,/🆘Hilfe gesucht · Maria/);assert.match(cards[0].textContent,/📍 Heimersheim Kirche \(50\.543, 7\.176\)/);assert.match(cards[0].textContent,/<b>Wasser<\/b> für 4/);assert.equal(cards[0].querySelector('b').textContent,'Hilfe gesucht');assert.match(cards[0].textContent,/gültig bis/);
  assert.ok(cards[0].closest('.message').classList.contains('help'));assert.match(cards[1].textContent,/Hilfe angeboten/);assert.ok(cards[1].closest('.message').classList.contains('offer'));
  assert.match(cards[2].textContent,/Info/);assert.match(cards[2].textContent,/ABGELAUFEN/);assert.ok(cards[2].closest('.message').classList.contains('expired'));
  const raw=[...$('messages').querySelectorAll('.message')].find(e=>!e.querySelector('.dm1-card'));assert.match(raw.textContent,/!DM1\|X\|/);}
 // Failed connection must not leave stale online state that re-enables sending.
 w.fetch=async()=>{throw Error('offline');};await w.update();$('text').dispatchEvent(new w.Event('input'));assert.equal($('sendbutton').disabled,true);assert.equal($('archivecurrent').disabled,true);assert.match($('archivestatus').textContent,/unbekannt/);
 assert.equal($('exportdiagnostics').disabled,true);assert.match($('diagnostics').textContent,/Verbindung/);assert.deepEqual(errors,[]);w.close();console.log('DOM checks passed: target selection, send, UTF-8 limit, XSS text rendering, no JS errors.');
})().catch(e=>{console.error(e);process.exit(1);});
