/* SPDX-License-Identifier: MIT */
const HEAP_WARN_DEFAULT=40960;// Warnschwelle freier Heap, falls die Firmware keine heapWarn meldet
const $=id=>document.getElementById(id), enc=new TextEncoder();
let state=null,lastHistory='',polling=false,sending=false;
let adminToken='',adminExpires=0;
function adminUI(){const open=!!adminToken&&Date.now()<adminExpires;if(!open)adminToken='';document.querySelectorAll('[data-admin]').forEach(x=>x.disabled=!open);$('adminlogin').hidden=open;$('adminlogout').hidden=!open;$('adminchange').hidden=!open;$('adminstatus').textContent=open?'Adminbereich entsperrt · Sitzung maximal 15 Minuten':'Funk- und Kanaleinstellungen sind gesperrt.';}
function clientId(){
 try{
  let id=localStorage.getItem('disahrster-client');
  if(!/^[a-f0-9]{16}$/.test(id||'')){
   const bytes=new Uint8Array(8);
   (globalThis.crypto||crypto).getRandomValues(bytes);
   id=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
   localStorage.setItem('disahrster-client',id);
  }
  return id;
 }catch{return '0000000000000000';}
}
function senderPrefix(){
 const raw=($('sendername').value||'').trim();
 if(!raw)return '';
 if(raw.length>16||/[|\[\]\r\n\0]/.test(raw))throw Error('Handy-Name: höchstens 16 Zeichen, ohne | [ ]');
 return '['+raw+'] ';
}
function composeOutgoing(content){
 if(content.startsWith('!DM1|')||content.startsWith('!DP1|'))return content;
 const next=senderPrefix()+content;
 if(enc.encode(next).length>100)throw Error('Mit Handy-Name über 100 Bytes: Text kürzen');
 return next;
}
const radioPresets={
 'de-narrow':{freq:869618,bw:62500,sf:8,cr:8,label:'EU/UK Narrow · 869,618 MHz · 62,5 kHz · SF8 · CR 4/8'},
 'ahr-legacy':{freq:869618,bw:62500,sf:8,cr:5,label:'Bisheriges DisAHRsterRadio-Netz · 869,618 MHz · 62,5 kHz · SF8 · CR 4/5'},
 'eu-legacy':{freq:869525,bw:250000,sf:11,cr:5,label:'EU/UK Deprecated · 869,525 MHz · 250 kHz · SF11 · CR 4/5'}
};
function showPreset(){const p=radioPresets[$('radiopreset').value];if(!p)return;for(const k of ['bw','sf','cr'])$(k).value=p[k];$('freq').value=(p.freq/1000).toFixed(3);$('presetdescription').textContent=p.label+' · TX 10 dBm · internes Airtime-Budget 10 %';}
function renderRadio(){if(!state?.info)return;const p=bytes(state.info);if(p.length<58)return;$('radio-current').textContent='Aktiv am Board: '+(u32(p,48)/1000).toFixed(3)+' MHz · '+(u32(p,52)/1000)+' kHz · SF'+p[56]+' · CR 4/'+p[57]+' · '+p[2]+' dBm';}
let conversationView='chat';
const selectedTargets={chat:'',board:''};
function setView(view){
 if(!['chat','board','map','device'].includes(view))return;
 selectedTargets[conversationView]=$('target').value;
 document.querySelectorAll('[data-panel]').forEach(panel=>panel.hidden=panel.dataset.panel!==view);
 document.querySelectorAll('[data-view]').forEach(tab=>tab.setAttribute('aria-selected',String(tab.dataset.view===view)));
 if(view==='chat'||view==='board'){
  conversationView=view;
  $(view==='chat'?'view-chat':'view-board').prepend($('conversation'));
  $('conversationtitle').textContent=view==='board'?'Schwarzes Brett':'Funknachrichten';
  populateTargets();renderHistory(lastHistory);updateRoomPanel();updateSendButton();
 }
 if(view==='map'&&typeof fitOfflineMap==='function')fitOfflineMap();
}
document.querySelectorAll('[data-view]').forEach(tab=>{
 tab.addEventListener('click',()=>setView(tab.dataset.view));
 tab.addEventListener('keydown',event=>{
  const tabs=[...document.querySelectorAll('[data-view]')],index=tabs.indexOf(tab);
  const next=event.key==='ArrowRight'?(index+1)%tabs.length:event.key==='ArrowLeft'?(index+tabs.length-1)%tabs.length:event.key==='Home'?0:event.key==='End'?tabs.length-1:-1;
  if(next<0)return;event.preventDefault();setView(tabs[next].dataset.view);tabs[next].focus();
 });
});
// A single composer keeps room login, history and byte checks on the same API path.
function populateTargets(){
 const opts=[];
 if(conversationView==='chat')state?.channels.forEach((h,i)=>{if(h){const p=bytes(h);opts.push(['c'+i,text(p,2,34)||'Kanal '+i]);}});
 state?.contacts.forEach(h=>{const p=bytes(h),kind=conversationView==='board'?3:1;
  if(p.length>=132&&p[33]===kind)opts.push(['d'+h.slice(2,14),(kind===3?'Raum: ':'Direkt: ')+text(p,100,132)]);
 });
 const old=selectedTargets[conversationView];$('target').replaceChildren();
 for(const [value,label]of opts){const o=document.createElement('option');o.value=value;o.textContent=label;$('target').append(o);}
 if(opts.some(o=>o[0]===old))$('target').value=old;
 selectedTargets[conversationView]=$('target').value;
 $('target').disabled=!opts.length;
 $('targetempty').hidden=!!opts.length;
 $('targetempty').textContent=state?(conversationView==='board'?'Kein Room-Server bekannt. Unter Gerät Kontakte neu lesen oder am Room-Server eine Bekanntgabe auslösen.':'Noch keine Kanäle oder Chat-Kontakte vorhanden. Unter Gerät Kanal einrichten oder Kontakte neu lesen.'):'Keine Verbindung zum Board. Mit dessen WLAN verbinden.';
}

async function api(path,data){const opts={headers:{'X-Disaster-Request':'1','X-Disaster-Client':clientId()},cache:'no-store'};if(adminToken)opts.headers['X-Disaster-Admin']=adminToken;if(data){opts.method='POST';opts.body=new URLSearchParams(data);}const r=await fetch('/api/'+path,opts);if(r.status===401){adminToken='';adminUI();}if(!r.ok)throw Error(await r.text());return r;}
async function act(path,data){try{const r=await api(path,data);$('feedback').textContent=await r.text();await update();return true;}catch(e){$('feedback').textContent=e.message;return false;}}
function renderHistory(raw){lastHistory=raw;const box=$('messages'),previousScroll=box.scrollTop,atBottom=box.scrollHeight-box.scrollTop-box.clientHeight<50;box.replaceChildren();
 const query=$('search').value.toLocaleLowerCase('de-DE');
 let list=decodeHistory(raw).filter(m=>{if(m.target&&m.target!==$('target').value)return false;if(query&&!(m.label+' '+m.body).toLocaleLowerCase('de-DE').includes(query))return false;return true;});
 if(conversationView==='board')list=boardOrder(list,Date.now());
 let help=0;
 for(const m of list){const el=document.createElement('div');const notice=parseNotice(m.body);const active=notice&&Date.now()/1000<=notice.expires;el.className='message'+(m.own?' own':'')+(active&&notice.kind==='H'?' help':active&&notice.kind==='A'?' offer':'')+(notice&&!active?' expired':'');if(active&&notice.kind==='H')help++;const label=document.createElement('small');label.textContent=m.label;if(notice){el.className+=' notice-msg';el.append(label,noticeCard(document,notice,Date.now()));box.append(el);continue;}const body=document.createElement('div');const pos=typeof parsePosition==='function'?parsePosition(m.body):null;body.textContent=pos?'📍 '+pos.name+' teilt Position · nahe '+nearestPlace(pos.lat,pos.lon).name+' · ±'+(pos.radius>=1000?'1 km':pos.radius+' m')+' · auf der Karte sichtbar':m.body;if(pos)el.className+=' position';el.append(label,body);box.append(el);}
 if(!list.length){const p=document.createElement('p');p.className='muted';p.textContent='Keine gespeicherten Nachrichten für dieses Ziel.';box.append(p);}
 const order=$('boardorder');if(order){order.hidden=conversationView!=='board';order.textContent=help?help+' aktuelle Hilfe steht oben, danach Angebote und der übrige Verlauf.':'Auf dem Brett stehen aktuelle Hilfen oben. Abgelaufene Meldungen bleiben im zeitlichen Verlauf.';}
 box.scrollTop=atBottom?box.scrollHeight:previousScroll;
}
function diagnosticSnapshot(){
 if(!state?.diagnostics)return null;
 const d=state.diagnostics,out={firmware:typeof d.firmware==='string'?d.firmware:'Unbekannt'};
 // Explicit allowlist: never export contacts, channel configuration or history.
 for(const key of ['uptimeSeconds','resetReason','minHeapBytes','largestHeapBlockBytes','wifiClients','txFlood','txDirect','rxFlood','rxDirect','txAirMs','rxAirMs','txBudgetMs','txBudgetWaitEvents','txBudgetWaitSeconds','txQueuePackets','heapWarn'])out[key]=Number.isFinite(d[key])?d[key]:null;
 out.txBudgetWaiting=typeof d.txBudgetWaiting==='boolean'?d.txBudgetWaiting:null;
 out.heapBytes=Number.isFinite(state.heap)?state.heap:null;
 out.storage=typeof state.storage==='boolean'?state.storage:null;
 out.queueStorage=typeof state.queueStorage==='boolean'?state.queueStorage:null;
 return out;
}
function txBudgetStatus(d){
 if(d?.txBudgetWaiting===true)return 'Funkkern wartet auf Airtime-Budget';
 if(d?.txBudgetWaiting===false)return 'Funkkern aktuell nicht wegen Airtime-Budget blockiert';
 return 'Airtime-Wartezustand nicht verfügbar';
}
function renderDiagnostics(){
 const d=diagnosticSnapshot();$('exportdiagnostics').disabled=!d;
 $('txstatus').textContent=txBudgetStatus(d);
 if(!d){$('heapwarn').hidden=true;$('diagnostics').textContent=state?'Diese Firmware liefert noch keine Diagnosedaten.':'Keine aktuellen Diagnosedaten; Verbindung zum Board fehlt.';return;}
 const num=n=>n===null?'unbekannt':String(n);
 const resets={0:'Unbekannt',1:'Einschalten',2:'Externer Reset',3:'Software-Neustart',4:'Absturz (Panic)',5:'Interrupt-Watchdog',6:'Task-Watchdog',7:'Watchdog',8:'Deep-Sleep',9:'Unterspannung',10:'SDIO-Reset'};
 const sec=d.uptimeSeconds,warn=d.heapWarn||HEAP_WARN_DEFAULT,kb=n=>n===null?'unbekannt':(n/1024).toFixed(1).replace('.',',')+' KB';
 const low=[d.heapBytes,d.minHeapBytes].some(n=>n!==null&&n<warn);
 $('heapwarn').hidden=!low;$('heapwarn').textContent=low?'⚠ Wenig freier Speicher: frei '+kb(d.heapBytes)+', Minimum '+kb(d.minHeapBytes)+' (Warnschwelle '+Math.round(warn/1024)+' KB). Bei weiter sinkenden Werten Board neu starten und Diagnose exportieren.':'';
 $('diagnostics').textContent='Firmware: '+d.firmware+'\nLaufzeit: '+(sec===null?'unbekannt':Math.floor(sec/3600)+' h '+Math.floor(sec%3600/60)+' min '+sec%60+' s')+'\nNeustartgrund: '+(resets[d.resetReason]||'Unbekannt')+' ('+num(d.resetReason)+')\nRAM frei / Minimum / größter Block: '+kb(d.heapBytes)+' / '+kb(d.minHeapBytes)+' / '+kb(d.largestHeapBlockBytes)+'\nWLAN-Clients: '+num(d.wifiClients)+'\nTX Flood / Direkt: '+num(d.txFlood)+' / '+num(d.txDirect)+' · RX Flood / Direkt: '+num(d.rxFlood)+' / '+num(d.rxDirect)+'\nFunkzeit TX / RX: '+num(d.txAirMs)+' / '+num(d.rxAirMs)+' ms\nInternes TX-Budget: '+num(d.txBudgetMs)+' ms\n'+txBudgetStatus(d)+'\nFunkwarteschlange: '+num(d.txQueuePackets)+' Pakete\nBudget-Wartephasen seit Boot: '+num(d.txBudgetWaitEvents)+' · '+num(d.txBudgetWaitSeconds)+' s gesamt';
}
$('exportdiagnostics').onclick=()=>{
 const d=diagnosticSnapshot();if(!d)return;
 const data={format:'DisAHRsterRadio-diagnostics',version:1,browserExportedAt:new Date().toISOString(),...d};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='disahrsterradio-diagnose.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
async function update(){if(polling)return;polling=true;try{
 state=await(await api('state')).json();$('link').textContent=state.ready?'Knoten online':'Startet …';$('result').textContent=state.result;
 renderDiagnostics();renderRadio();adminUI();
 const heapLow=Number.isFinite(state.heap)&&state.heap<(state.diagnostics?.heapWarn||HEAP_WARN_DEFAULT);$('stats').textContent='Lokaler Speicher: '+(state.storage?'bereit':'Schreibfehler')+' · Freier RAM: '+Math.round(state.heap/1024)+' KB'+(heapLow?' ⚠':'');$('stats').classList.toggle('heap-low',heapLow);
 if(state.info){const p=bytes(state.info);if(p.length>=58){$('node').textContent=text(p,58)||'Zugangsknoten';$('stats').textContent+=' · '+(u32(p,48)/1000).toFixed(3)+' MHz · '+p[2]+' dBm';}}
 populateTargets();
 updateRoomPanel();updateSendButton();
 const raw=await(await api('history')).text();renderHistory(raw);
 $('queuestatus').textContent=state.queueStorage===false?'Warteschlangenspeicher fehlerhaft; keine automatischen Sendungen':state.queueReady?'Warteschlange aktiv':'Nach Neustart: Handy-Uhr übernehmen, damit Aufträge geprüft werden';
 $('archivecurrent').disabled=$('archiveprevious').disabled=!state.archive;
 $('contactstatus').textContent=state.contacts.length+' bekannte Kontakte';
 $('archivestatus').textContent=state.archive?'SD-Archiv bereit':'SD-Archiv nicht verfügbar';
 const jobs=await(await api('outbox')).json();
 $('outboxstatus').textContent=jobs.filter(job=>job.state===1).length+' aktive Zustellaufträge';const box=$('outbox');box.replaceChildren();
 if(!jobs.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='Keine gespeicherten Zustellaufträge.';box.append(empty);}
 for(const job of jobs){const line=document.createElement('div');line.className='message';const title=document.createElement('small');title.textContent='#'+job.id+' · '+job.target.slice(1)+' · '+({1:'Wartet auf Bestätigung',2:'Empfang bestätigt',3:'Abgelaufen',4:'Ohne Bestätigung beendet',5:'Abgebrochen'}[job.state]||'Unbekannt')+' · '+job.attempts+'/4 Versuche';const body=document.createElement('div');body.textContent=text(bytes(job.textHex),0);line.append(title,body);if(job.state===1){const cancel=document.createElement('button');cancel.className='secondary';cancel.textContent='Weitere Versuche abbrechen';cancel.onclick=()=>act('outbox-cancel',{id:job.id});line.append(cancel);}box.append(line);}
 if(typeof updateMapNotices==='function')updateMapNotices(decodeHistory(lastHistory).map(m=>parseNotice(m.body)).filter(Boolean));renderPositions();
 $('link').style.color='';
 }catch(e){state=null;renderDiagnostics();$('link').textContent='Verbindung fehlt';populateTargets();updateRoomPanel();updateSendButton();$('archivecurrent').disabled=$('archiveprevious').disabled=true;$('contactstatus').textContent='Kontakte: keine aktuellen Daten';$('archivestatus').textContent='SD-Status unbekannt';$('outboxstatus').textContent='Zustellstatus unbekannt';$('queuestatus').textContent='Keine aktuellen Daten; Verbindung zum Board fehlt';$('stats').textContent='Mit dem WLAN des Boards verbinden und diese Seite erneut öffnen.';}finally{polling=false;}}
$('target').addEventListener('change',()=>{selectedTargets[conversationView]=$('target').value;renderHistory(lastHistory);updateRoomPanel();updateSendButton();});
function selectedRoom(){return state?.contacts.some(h=>h.slice(2,14)===$('target').value.slice(1)&&bytes(h)[33]===3);}
function selectedPrivate(){return !selectedRoom()&&state?.contacts.some(h=>h.slice(2,14)===$('target').value.slice(1)&&bytes(h)[33]===1);}
function updateRoomPanel(){
 $('queueoptions').hidden=!selectedPrivate();
 const isRoom=selectedRoom();$('roompanel').hidden=!isRoom;
 const session=state?.room,matches=session?.target===$('target').value;
 $('roomstatus').textContent=!matches?'Noch nicht angemeldet':session.pending?'Serverantwort ausstehend …':session.rights>=2?'Angemeldet · Lesen und Schreiben':'Keine Schreibberechtigung; erneut anmelden';
 $('roomloginbutton').disabled=!state?.ready||!isRoom||state?.busy||(matches&&session?.pending);
}
function updateSendButton(){
 const typed=$('text').value;let total=enc.encode(typed).length;
 try{if(typed&&!typed.startsWith('!DM1|'))total=enc.encode(senderPrefix()+typed).length;}catch{total=101;}
 $('counter').textContent=total+' / 100 Bytes';
 $('sendbutton').disabled=sending||!state?.ready||state?.busy||!$('target').value||!typed.trim()||total>100||(selectedRoom()&&(state?.room?.target!==$('target').value||state?.room?.rights<2));
}
$('text').addEventListener('input',updateSendButton);
$('search').addEventListener('input',()=>renderHistory(lastHistory));
$('export').onclick=()=>{
 const data={format:'DisasterMesh-history',version:1,exportedAt:new Date().toISOString(),node:$('node').textContent,messages:decodeHistory(lastHistory)};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='disahrsterradio-verlauf.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('send').onsubmit=async e=>{
 e.preventDefault();const typed=$('text').value,target=$('target').value;let content=typed;
 try{content=composeOutgoing(typed);}catch(err){$('feedback').textContent=err.message;updateSendButton();return;}
 if(sending||!state?.ready||state?.busy||!target||!content.trim()||enc.encode(content).length>100){updateSendButton();return;}
 sending=true;updateSendButton();
 try{if(await act($('deferdelivery').checked&&selectedPrivate()?'outbox':'send',{text:content,target,time:Math.floor(Date.now()/1000),hours:$('queuehours').value})){
  // Never erase a new draft written while the HTTP request was in flight.
  if($('text').value===typed&&$('target').value===target)$('text').value='';
 }}finally{sending=false;updateSendButton();}
};
async function loadArchive(previous){
 try{const r=await api('archive?part='+(previous?'previous':'current'));const url=URL.createObjectURL(await r.blob());const a=document.createElement('a');a.href=url;a.download='disahrsterradio-archive-'+(previous?'previous':'current')+'.bin';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){$('feedback').textContent=e.message;}
}
$('archivecurrent').onclick=()=>loadArchive(false);$('archiveprevious').onclick=()=>loadArchive(true);
$('roomlogin').onsubmit=async e=>{
 e.preventDefault();if(!state?.ready||!selectedRoom()||state?.busy)return;
 $('roomloginbutton').disabled=true;
 if(await act('room-login',{target:$('target').value,password:$('roompassword').value,time:Math.floor(Date.now()/1000)}))$('roompassword').value='';
 updateRoomPanel();updateSendButton();
};
$('noticeform').onsubmit=e=>{
 e.preventDefault();
 try{$('text').value=makeNotice({kind:$('noticekind').value,expires:Math.floor(Date.now()/1000)+Number($('noticehours').value)*3600,lat:$('noticelat').value,lon:$('noticelon').value,place:$('noticeplace').value,need:$('noticeneed').value});updateSendButton();$('feedback').textContent='Meldung vorbereitet. Ziel prüfen und über Funk senden.';setView('board');$('text').focus();}
 catch(err){$('feedback').textContent=err.message;}
};
$('rename').onsubmit=e=>{e.preventDefault();act('name',{name:$('name').value});};
$('advert').onclick=()=>act('advert',{});$('refresh').onclick=()=>act('refresh',{});$('clock').onclick=()=>act('time',{time:Math.floor(Date.now()/1000)});
$('channel').onsubmit=async e=>{e.preventDefault();if(await act('channel',{slot:$('slot').value,name:$('channelname').value,key:$('key').value}))$('key').value='';};
$('radiopreset').onchange=showPreset;showPreset();adminUI();
$('radio').onsubmit=e=>{e.preventDefault();const p=radioPresets[$('radiopreset').value];if(!p||!adminToken)return;act('radio',{preset:$('radiopreset').value,freq:p.freq,bw:p.bw,sf:p.sf,cr:p.cr});};
$('adminlogin').onsubmit=async e=>{e.preventDefault();try{const r=await api('admin/login',{password:$('adminpassword').value});const d=await r.json();if(typeof d.token!=='string'||!/^[a-f0-9]{32}$/.test(d.token))throw Error('Ungültige Adminantwort');adminToken=d.token;adminExpires=Date.now()+900000;$('feedback').textContent='Adminbereich entsperrt.';}catch(err){$('feedback').textContent=err.message;}finally{$('adminpassword').value='';adminUI();}};
$('adminlogout').onclick=async()=>{try{await api('admin/logout',{});}catch{}adminToken='';adminUI();};
$('adminchange').onsubmit=async e=>{e.preventDefault();if(await act('admin/password',{password:$('adminnew').value})){adminToken='';adminUI();}$('adminnew').value='';};
function showPairing(){
 const name=$('channelname').value.trim(),key=$('key').value.trim().toLowerCase();
 const line=name&&/^[0-9a-f]{32}$/.test(key)?'DisAHRsterRadio|'+$('slot').value+'|'+name+'|'+key+'|'+$('radiopreset').value:'';
 $('paircard').textContent=line||'Kopierzeile erscheint, sobald Kanalname und 32 Hex-Zeichen stehen. Vor dem Speichern kopieren. Nicht über Funk senden.';
}
$('channelname').addEventListener('input',showPairing);$('key').addEventListener('input',showPairing);$('slot').addEventListener('change',showPairing);
$('paircopy').onclick=async()=>{showPairing();const line=$('paircard').textContent;if(!line.startsWith('DisAHRsterRadio|')){$('feedback').textContent='Zuerst Kanalname und Schlüssel eintragen.';return;}try{await navigator.clipboard.writeText(line);$('feedback').textContent='Kopierzeile in der Zwischenablage. Am zweiten Board einfügen, nicht funken.';}catch{$('feedback').textContent='Kopieren nicht verfügbar. Zeile oben ablesen.';}};
$('wipehistory').onclick=async()=>{if(!adminToken){$('feedback').textContent='Zuerst den Adminbereich entsperren.';return;}if(!confirm('Den unverschlüsselten Flash-Verlauf auf diesem Board löschen? Schlüssel und ein optionales SD-Archiv bleiben.'))return;await act('history-wipe',{});};
try{const saved=localStorage.getItem('disahrster-sender');if(saved)$('sendername').value=saved;}catch{}
$('sendername').addEventListener('input',()=>{try{localStorage.setItem('disahrster-sender',$('sendername').value.trim());}catch{}updateSendButton();});
$('channelpreset').onchange=()=>{const name=$('channelpreset').value;if(!name)return;$('channelname').value=name;$('key').value=name==='Public'?'8b3387e9c5cdea6ac9e5edbaa115cd72':'';showPairing();};
update();setInterval(update,2500);

// Standort: Handy-Ortung (nur sichere Verbindung), Karte antippen oder Ort wählen.
// Geteilt wird nur auf Knopfdruck, als kompakte !DP1-Meldung, höchstens alle 5 Minuten.
let myPos=null,posPick=false,lastPosShare=0;
for(const sel of ['posplace','noticeplacepick'])for(const [n] of AHR_PLACES){const o=document.createElement('option');o.value=n;o.textContent=n;$(sel).append(o);}
function posChannel(){const chosen=selectedTargets.chat||(conversationView==='chat'?$('target').value:'');if(/^c\d$/.test(chosen)&&state?.channels?.[Number(chosen.slice(1))])return chosen;const i=(state?.channels||[]).findIndex(Boolean);return i<0?'':'c'+i;}
function updatePosShare(){const c=posChannel();$('posshare').disabled=!myPos||!state?.ready||!c;if(c){const h=state.channels[Number(c.slice(1))];$('posshare').textContent='Position in Kanal „'+(text(bytes(h),2,34)||'Kanal '+c.slice(1))+'“ senden';}}
function setMyPos(lat,lon,source){myPos={lat,lon};const near=nearestPlace(lat,lon);$('posstatus').textContent='Deine Position: '+lat.toFixed(4)+', '+lon.toFixed(4)+' · '+source+' · nahe '+near.name+(near.km>1.5?' (ca. '+near.km.toFixed(1)+' km)':'');updatePosShare();renderPositions();}
function renderPositions(){
 const list=latestPositions(decodeHistory(lastHistory).map(m=>m.body),Date.now()),box=$('poslist');box.replaceChildren();
 if(list.length){const h=document.createElement('h3');h.textContent='Zuletzt geteilte Positionen';box.append(h);}
 for(const p of list){const row=document.createElement('div');row.className='pos-row';const near=nearestPlace(p.lat,p.lon);row.textContent=p.name+' · nahe '+near.name+' · '+positionAge(p.stamp,Date.now())+' · ±'+(p.radius>=1000?'1 km':p.radius+' m');box.append(row);}
 if(typeof updateMapPositions==='function')updateMapPositions(list,myPos);updatePosShare();
}
$('posgeo').onclick=()=>{
 const g=state?.diagnostics?.gps;if(g?.fix&&Number.isFinite(g.lat)&&Number.isFinite(g.lon)){setMyPos(g.lat,g.lon,'GPS-Modul am Board');return;}
 if(!('geolocation' in navigator)){$('posstatus').textContent='Dieser Browser bietet keine Ortung. Bitte Karte antippen oder Ort wählen.';return;}
 if(!window.isSecureContext){$('posstatus').textContent=(g?.enabled?'Board-GPS hat noch keinen Fix (freie Sicht zum Himmel, bis zu einigen Minuten). ':'')+'Handy-Ortung vom Browser gesperrt: Sie ist nur über HTTPS erlaubt, das Board-WLAN nutzt http://. Bitte Karte antippen oder Ort wählen.';return;}
 $('posstatus').textContent='Ortung läuft … (bis 15 Sekunden)';
 navigator.geolocation.getCurrentPosition(p=>setMyPos(p.coords.latitude,p.coords.longitude,'Handy-Ortung ±'+Math.round(p.coords.accuracy)+' m'),e=>{$('posstatus').textContent=(e.code===1?'Ortung abgelehnt oder vom Browser blockiert.':'Keine Ortung möglich.')+' Bitte Karte antippen oder Ort wählen.';},{enableHighAccuracy:true,timeout:15000,maximumAge:60000});
};
$('posplace').onchange=()=>{const p=AHR_PLACES.find(x=>x[0]===$('posplace').value);if(p){setMyPos(p[1],p[2],'Ortsmitte '+p[0]);$('posprecision').value='grob';}};
$('pospick').onclick=()=>{posPick=!posPick;$('pospick').textContent=posPick?'Auswahl abbrechen':'Auf Karte tippen';$('posstatus').textContent=posPick?'Jetzt auf die Karte tippen.':'Auswahl beendet.';};
{const c=$('mapcanvas');let start=null;c.addEventListener('pointerdown',e=>{start=[e.clientX,e.clientY];});c.addEventListener('click',e=>{if(!posPick||!offlineMap||!start||Math.hypot(e.clientX-start[0],e.clientY-start[1])>8)return;const r=c.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const lon=((x-mapX)/mapScale)*360-180,lat=Math.atan(Math.sinh(Math.PI*(1-2*(y-mapY)/mapScale)))*180/Math.PI;posPick=false;$('pospick').textContent='Auf Karte tippen';setMyPos(lat,lon,'auf der Karte gewählt');});}
$('posshare').onclick=async()=>{
 const wait=POSITION_MIN_INTERVAL_MS-(Date.now()-lastPosShare);if(wait>0){$('feedback').textContent='Funk schonen: nächste Position in '+Math.ceil(wait/60000)+' Min.';return;}
 let msg;try{msg=makePosition({...myPos,stamp:Math.floor(Date.now()/1000),precision:$('posprecision').value,name:$('sendername').value});}catch(e){$('feedback').textContent=e.message;return;}
 const target=posChannel();if(!target)return;
 if(await act('send',{text:msg,target,time:Math.floor(Date.now()/1000)}))lastPosShare=Date.now();
};
document.querySelectorAll('.quick-btn').forEach(b=>b.onclick=()=>{$('noticekind').value=b.dataset.kind;$('noticeneed').value=b.dataset.need;const d=b.closest('[data-panel]').querySelector('details');if(d)d.open=true;$(($('noticeplace').value?'noticeneed':'noticeplace')).focus();});
$('noticeplacepick').onchange=()=>{const p=AHR_PLACES.find(x=>x[0]===$('noticeplacepick').value);if(!p)return;$('noticeplace').value=p[0];$('noticelat').value=p[1].toFixed(4);$('noticelon').value=p[2].toFixed(4);};
