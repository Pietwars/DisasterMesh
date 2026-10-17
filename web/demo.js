/* Development-only simulation. This file is NEVER embedded in the board firmware. */
(()=>{
 const original=window.fetch.bind(window),encoder=new TextEncoder(),hex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
 const put=(b,at,s)=>b.set(encoder.encode(s),at),u32=(b,at,n)=>new DataView(b.buffer).setUint32(at,n,true);
 const info=new Uint8Array(90);info[0]=5;info[2]=10;u32(info,48,869618);u32(info,52,62500);info[56]=8;info[57]=8;put(info,58,'Heimersheim · Demo');
 const channelData=['Public','Ahrtal'].map((name,i)=>{const b=new Uint8Array(34);b[0]=18;b[1]=i;put(b,2,name);return hex(b);});
 const channels=Array.from({length:8},(_,i)=>channelData[i]||'');
 const room=new Uint8Array(132);room[0]=3;room.set([0x11,0x22,0x33,0x44,0x55,0x66],1);room[33]=3;put(room,100,'Ahrtal · Schwarzes Brett');
 const contact=new Uint8Array(132);contact[0]=3;contact.set([0x22,0x33,0x44,0x55,0x66,0x77],1);contact[33]=1;put(contact,100,'Sinzig · Demo');
 const rows=[];let seq=0,rights=0,logged=false,result='Demomodus · keine Funkübertragung',token='d'.repeat(32);
 function message(body,own=false,channel=0){const text=encoder.encode(body),b=new Uint8Array((own?7:11)+text.length);b[0]=own?0xf3:17;b[own?2:4]=channel;u32(b,own?3:7,Math.floor(Date.now()/1000)-90+seq*15);b.set(text,own?7:11);rows.push((++seq)+':'+hex(b));}
 message('Hallo aus Heimersheim! Wer liest im Ahrtal mit?');message('Hier ist Sinzig. Der Test läuft. 👋');message('Grüße zurück! Wir probieren das lokale Netz aus.',true);
 const now=Math.floor(Date.now()/1000);message('!DP1|50.546,7.170|'+(now-480)+'|Jonas');message('!DP1|50.55,7.19|'+(now-2700)+'|Maria');message('!DM1|H|'+(now+6*3600)+'|50.54270,7.17560|Heimersheim Kirche|Trinkwasser benötigt, 4 Personen');message('Maria: !DM1|A|'+(now+8*3600)+'|-|Lohrsdorf Dorfplatz|Strom vorhanden, 3 Handys laden');message('!DM1|I|'+(now+12*3600)+'|-|Bad Neuenahr|B266 ab Heppingen frei');
 const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}}),plain=(text,status=200)=>new Response(text,{status});
 window.fetch=async(input,opts={})=>{
  const url=new URL(typeof input==='string'?input:input.url,location.href);if(!url.pathname.startsWith('/api/'))return original(input,opts);
  const path=url.pathname.slice(5),data=new URLSearchParams(opts.body||''),headers=new Headers(opts.headers||{});
  const admin=logged&&headers.get('X-Disaster-Admin')===token;
  if(path==='state')return json({ready:true,storage:true,heap:147456,seq,busy:false,result,info:hex(info),channels,contacts:[hex(contact),hex(room)],archive:false,queueReady:true,queueStorage:true,room:{target:'d112233445566',rights,pending:false},diagnostics:{firmware:'v1.18.0-ahr0.9.0-alpha · DEMO',uptimeSeconds:3661,resetReason:1,minHeapBytes:131072,largestHeapBlockBytes:98304,wifiClients:1,txFlood:12,txDirect:3,rxFlood:28,rxDirect:7,txAirMs:1800,rxAirMs:4200,txBudgetMs:1600,txBudgetWaiting:false,txBudgetWaitEvents:1,txBudgetWaitSeconds:2,txQueuePackets:0}});
  if(path==='history')return plain(rows.join('\n')+'\n');if(path==='outbox')return json([]);
  if(path==='admin/login'){if(data.get('password')!=='DemoAdmin2026!')return plain('Demo-Passwort: DemoAdmin2026!',401);logged=true;return json({token,expiresIn:900});}
  if(['radio','name','channel','admin/logout','admin/password','history-wipe'].includes(path)&&!admin)return plain('Adminanmeldung erforderlich',401);
  if(path==='admin/logout'){logged=false;return plain('Demo-Adminbereich gesperrt');}
  if(path==='admin/password')return plain('In der öffentlichen Demo kann das Adminpasswort nicht geändert werden.',400);
  if(path==='history-wipe'){rows.length=0;return plain('Lokaler Verlauf geloescht. Schluessel und optionales SD-Archiv bleiben.');}
  if(path==='radio'){const presets={'de-narrow':[869618,62500,8,8],'ahr-legacy':[869618,62500,8,5],'eu-legacy':[869525,250000,11,5]},p=presets[data.get('preset')];if(!p)return plain('Unbekanntes Funkprofil',400);u32(info,48,p[0]);u32(info,52,p[1]);info[56]=p[2];info[57]=p[3];result='Demo: Funkprofil geändert, kein Funkgerät gesteuert';}
  if(path==='name'){info.fill(0,58);put(info,58,(data.get('name')||'Demo').slice(0,24));}
  if(path==='channel'){const i=Number(data.get('slot'));if(i>=0&&i<8){const b=new Uint8Array(34);b[0]=18;b[1]=i;put(b,2,(data.get('name')||'Demo').slice(0,24));channels[i]=hex(b);}}
  if(path==='room-login'){rights=2;result='Demo: Raumzugang simuliert';}
  if(path==='send'){const target=data.get('target')||'',body=data.get('text')||'';if(target.startsWith('c'))message(body,true,Number(target.slice(1)));else if(/^d[0-9a-f]{12}$/.test(target)){const t=encoder.encode(body),b=new Uint8Array(13+t.length);b[0]=0xf2;u32(b,3,Math.floor(Date.now()/1000));b.set(target.slice(1).match(/../g).map(x=>parseInt(x,16)),7);b.set(t,13);rows.push((++seq)+':'+hex(b));}result='Nur in der Demo angezeigt · nicht über Funk gesendet';}
  return plain('Demoaktion ausgeführt · keine Funkübertragung',202);
 };
 const banner=document.createElement('div');banner.className='demo-banner';banner.id='demo-banner';banner.textContent='INTERAKTIVE DEMO · Alle Daten simuliert · Adminpasswort: DemoAdmin2026!';document.querySelector('main').prepend(banner);
})();
