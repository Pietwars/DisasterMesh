/* SPDX-License-Identifier: MIT */
const $=id=>document.getElementById(id), enc=new TextEncoder();
let state=null,lastHistory='',polling=false,sending=false;
async function api(path,data){const opts={headers:{'X-Disaster-Request':'1'},cache:'no-store'};if(data){opts.method='POST';opts.body=new URLSearchParams(data);}const r=await fetch('/api/'+path,opts);if(!r.ok)throw Error(await r.text());return r;}
async function act(path,data){try{const r=await api(path,data);$('feedback').textContent=await r.text();await update();return true;}catch(e){$('feedback').textContent=e.message;return false;}}
function renderHistory(raw){lastHistory=raw;const box=$('messages'),previousScroll=box.scrollTop,atBottom=box.scrollHeight-box.scrollTop-box.clientHeight<50;box.replaceChildren();let count=0;
 const query=$('search').value.toLocaleLowerCase('de-DE');
 for(const m of decodeHistory(raw)){if(m.target&&m.target!==$('target').value)continue;if(query&&!(m.label+' '+m.body).toLocaleLowerCase('de-DE').includes(query))continue;count++;const el=document.createElement('div');el.className='message'+(m.own?' own':'');const label=document.createElement('small');const notice=parseNotice(m.body);label.textContent=m.label+(notice?' · '+({H:'Hilfe',A:'Angebot',I:'Info'}[notice.kind])+' · '+(Date.now()/1000>notice.expires?'ABGELAUFEN':'gültig bis '+new Date(notice.expires*1000).toLocaleString('de-DE')):'');const body=document.createElement('div');body.textContent=m.body;el.append(label,body);box.append(el);}
 if(!count){const p=document.createElement('p');p.className='muted';p.textContent='Keine gespeicherten Nachrichten für dieses Ziel.';box.append(p);}box.scrollTop=atBottom?box.scrollHeight:previousScroll;
}
async function update(){if(polling)return;polling=true;try{
 state=await(await api('state')).json();$('link').textContent=state.ready?'Knoten online':'Startet …';$('result').textContent=state.result;
 $('stats').textContent='Lokaler Speicher: '+(state.storage?'bereit':'Schreibfehler')+' · Freier RAM: '+Math.round(state.heap/1024)+' KB';
 if(state.info){const p=bytes(state.info);if(p.length>=58){$('node').textContent=text(p,58)||'Zugangsknoten';$('stats').textContent+=' · '+(u32(p,48)/1000).toFixed(3)+' MHz · '+p[2]+' dBm';}}
 const opts=[];state.channels.forEach((h,i)=>{if(h){const p=bytes(h);opts.push(['c'+i,text(p,2,34)||'Kanal '+i]);}});
 state.contacts.forEach(h=>{const p=bytes(h);if(p.length>=132&&(p[33]===1||p[33]===3))opts.push(['d'+h.slice(2,14),(p[33]===3?'Schwarzes Brett: ':'Direkt: ')+text(p,100,132)]);});
 const old=$('target').value;$('target').replaceChildren();for(const [value,label]of opts){const o=document.createElement('option');o.value=value;o.textContent=label;$('target').append(o);}if(opts.some(o=>o[0]===old))$('target').value=old;
 updateRoomPanel();updateSendButton();
 const raw=await(await api('history')).text();renderHistory(raw);
 $('queuestatus').textContent=state.queueStorage===false?'Warteschlangenspeicher fehlerhaft; keine automatischen Sendungen':state.queueReady?'Warteschlange aktiv':'Nach Neustart: Handy-Uhr übernehmen, damit Aufträge geprüft werden';
 $('archivecurrent').disabled=$('archiveprevious').disabled=!state.archive;
 const jobs=await(await api('outbox')).json();const box=$('outbox');box.replaceChildren();
 for(const job of jobs){const line=document.createElement('div');line.className='message';const title=document.createElement('small');title.textContent='#'+job.id+' · '+job.target.slice(1)+' · '+({1:'Wartet auf Bestätigung',2:'Empfang bestätigt',3:'Abgelaufen',4:'Ohne Bestätigung beendet',5:'Abgebrochen'}[job.state]||'Unbekannt')+' · '+job.attempts+'/4 Versuche';const body=document.createElement('div');body.textContent=text(bytes(job.textHex),0);line.append(title,body);if(job.state===1){const cancel=document.createElement('button');cancel.className='secondary';cancel.textContent='Weitere Versuche abbrechen';cancel.onclick=()=>act('outbox-cancel',{id:job.id});line.append(cancel);}box.append(line);}
 if(typeof updateMapNotices==='function')updateMapNotices(decodeHistory(lastHistory).map(m=>parseNotice(m.body)).filter(Boolean));
 $('link').style.color='';
 }catch(e){state=null;$('link').textContent='Verbindung fehlt';$('sendbutton').disabled=true;$('stats').textContent='Mit dem WLAN des Boards verbinden und diese Seite erneut öffnen.';}finally{polling=false;}}
$('target').addEventListener('change',()=>{renderHistory(lastHistory);updateRoomPanel();updateSendButton();});
function selectedRoom(){return state?.contacts.some(h=>h.slice(2,14)===$('target').value.slice(1)&&bytes(h)[33]===3);}
function selectedPrivate(){return !selectedRoom()&&state?.contacts.some(h=>h.slice(2,14)===$('target').value.slice(1)&&bytes(h)[33]===1);}
function updateRoomPanel(){
 $('queueoptions').hidden=!selectedPrivate();
 const isRoom=selectedRoom();$('roompanel').hidden=!isRoom;
 const session=state?.room,matches=session?.target===$('target').value;
 $('roomstatus').textContent=!matches?'Noch nicht angemeldet':session.pending?'Serverantwort ausstehend …':session.rights>=2?'Angemeldet · Lesen und Schreiben':'Keine Schreibberechtigung; erneut anmelden';
 $('roomloginbutton').disabled=!state?.ready||state?.busy||(matches&&session?.pending);
}
function updateSendButton(){
 const content=$('text').value,n=enc.encode(content).length;
 $('counter').textContent=n+' / 100 Bytes';
 $('sendbutton').disabled=sending||!state?.ready||state?.busy||!$('target').value||!content.trim()||n>100||(selectedRoom()&&(state?.room?.target!==$('target').value||state?.room?.rights<2));
}
$('text').addEventListener('input',updateSendButton);
$('search').addEventListener('input',()=>renderHistory(lastHistory));
$('export').onclick=()=>{
 const data={format:'DisasterMesh-history',version:1,exportedAt:new Date().toISOString(),node:$('node').textContent,messages:decodeHistory(lastHistory)};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='disastermesh-verlauf.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('send').onsubmit=async e=>{
 e.preventDefault();const content=$('text').value,target=$('target').value;
 if(sending||!state?.ready||state?.busy||!target||!content.trim()||enc.encode(content).length>100){updateSendButton();return;}
 sending=true;updateSendButton();
 try{if(await act($('deferdelivery').checked&&selectedPrivate()?'outbox':'send',{text:content,target,time:Math.floor(Date.now()/1000),hours:$('queuehours').value})){
  // Never erase a new draft written while the HTTP request was in flight.
  if($('text').value===content&&$('target').value===target)$('text').value='';
 }}finally{sending=false;updateSendButton();}
};
async function loadArchive(previous){
 try{const r=await api('archive?part='+(previous?'previous':'current'));const url=URL.createObjectURL(await r.blob());const a=document.createElement('a');a.href=url;a.download='disastermesh-archive-'+(previous?'previous':'current')+'.bin';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){$('feedback').textContent=e.message;}
}
$('archivecurrent').onclick=()=>loadArchive(false);$('archiveprevious').onclick=()=>loadArchive(true);
$('roomlogin').onsubmit=async e=>{
 e.preventDefault();if(!selectedRoom()||state?.busy)return;
 $('roomloginbutton').disabled=true;
 if(await act('room-login',{target:$('target').value,password:$('roompassword').value,time:Math.floor(Date.now()/1000)}))$('roompassword').value='';
 updateRoomPanel();updateSendButton();
};
$('noticeform').onsubmit=e=>{
 e.preventDefault();
 try{$('text').value=makeNotice({kind:$('noticekind').value,expires:Math.floor(Date.now()/1000)+Number($('noticehours').value)*3600,lat:$('noticelat').value,lon:$('noticelon').value,place:$('noticeplace').value,need:$('noticeneed').value});updateSendButton();$('feedback').textContent='Meldung vorbereitet. Ziel prüfen und über Funk senden.';$('text').focus();}
 catch(err){$('feedback').textContent=err.message;}
};
$('rename').onsubmit=e=>{e.preventDefault();act('name',{name:$('name').value});};
$('advert').onclick=()=>act('advert',{});$('refresh').onclick=()=>act('refresh',{});$('clock').onclick=()=>act('time',{time:Math.floor(Date.now()/1000)});
$('channel').onsubmit=async e=>{e.preventDefault();if(await act('channel',{slot:$('slot').value,name:$('channelname').value,key:$('key').value}))$('key').value='';};
$('radio').onsubmit=e=>{e.preventDefault();act('radio',{freq:Math.round(Number($('freq').value)*1000),bw:$('bw').value,sf:$('sf').value,cr:$('cr').value});};
update();setInterval(update,2500);
