/* SPDX-License-Identifier: MIT */
const $=id=>document.getElementById(id), enc=new TextEncoder();
let state=null,lastHistory='',polling=false,sending=false;
async function api(path,data){const opts={headers:{'X-Disaster-Request':'1'},cache:'no-store'};if(data){opts.method='POST';opts.body=new URLSearchParams(data);}const r=await fetch('/api/'+path,opts);if(!r.ok)throw Error(await r.text());return r;}
async function act(path,data){try{const r=await api(path,data);$('feedback').textContent=await r.text();await update();return true;}catch(e){$('feedback').textContent=e.message;return false;}}
function renderHistory(raw){lastHistory=raw;const box=$('messages');box.replaceChildren();let count=0;
 const query=$('search').value.toLocaleLowerCase('de-DE');
 for(const m of decodeHistory(raw)){if(m.target&&m.target!==$('target').value)continue;if(query&&!(m.label+' '+m.body).toLocaleLowerCase('de-DE').includes(query))continue;count++;const el=document.createElement('div');el.className='message'+(m.own?' own':'');const label=document.createElement('small');label.textContent=m.label;const body=document.createElement('div');body.textContent=m.body;el.append(label,body);box.append(el);}
 if(!count){const p=document.createElement('p');p.className='muted';p.textContent='Keine gespeicherten Nachrichten für dieses Ziel.';box.append(p);}box.scrollTop=box.scrollHeight;
}
async function update(){if(polling)return;polling=true;try{
 state=await(await api('state')).json();$('link').textContent=state.ready?'Knoten online':'Startet …';$('result').textContent=state.result;
 $('stats').textContent='Speicher: '+(state.storage?'bereit':'Schreibfehler')+' · Freier RAM: '+Math.round(state.heap/1024)+' KB';
 if(state.info){const p=bytes(state.info);if(p.length>=58){$('node').textContent=text(p,58)||'Zugangsknoten';$('stats').textContent+=' · '+(u32(p,48)/1000).toFixed(3)+' MHz · '+p[2]+' dBm';}}
 const opts=[];state.channels.forEach((h,i)=>{if(h){const p=bytes(h);opts.push(['c'+i,text(p,2,34)||'Kanal '+i]);}});
 state.contacts.forEach(h=>{const p=bytes(h);if(p.length>=132&&p[33]===1)opts.push(['d'+h.slice(2,14),'Direkt: '+text(p,100,132)]);});
 const old=$('target').value;$('target').replaceChildren();for(const [value,label]of opts){const o=document.createElement('option');o.value=value;o.textContent=label;$('target').append(o);}if(opts.some(o=>o[0]===old))$('target').value=old;
 updateSendButton();
 const raw=await(await api('history')).text();if(raw!==lastHistory||old!==$('target').value)renderHistory(raw);
 $('link').style.color='';
 }catch(e){state=null;$('link').textContent='Verbindung fehlt';$('sendbutton').disabled=true;$('stats').textContent='Mit dem WLAN des Boards verbinden und diese Seite erneut öffnen.';}finally{polling=false;}}
$('target').addEventListener('change',()=>renderHistory(lastHistory));
function updateSendButton(){
 const content=$('text').value,n=enc.encode(content).length;
 $('counter').textContent=n+' / 100 Bytes';
 $('sendbutton').disabled=sending||!state?.ready||state?.busy||!$('target').value||!content.trim()||n>100;
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
 try{if(await act('send',{text:content,target,time:Math.floor(Date.now()/1000)})){
  // Never erase a new draft written while the HTTP request was in flight.
  if($('text').value===content&&$('target').value===target)$('text').value='';
 }}finally{sending=false;updateSendButton();}
};
$('rename').onsubmit=e=>{e.preventDefault();act('name',{name:$('name').value});};
$('advert').onclick=()=>act('advert',{});$('refresh').onclick=()=>act('refresh',{});$('clock').onclick=()=>act('time',{time:Math.floor(Date.now()/1000)});
$('channel').onsubmit=async e=>{e.preventDefault();if(await act('channel',{slot:$('slot').value,name:$('channelname').value,key:$('key').value}))$('key').value='';};
$('radio').onsubmit=e=>{e.preventDefault();act('radio',{freq:Math.round(Number($('freq').value)*1000),bw:$('bw').value,sf:$('sf').value,cr:$('cr').value});};
update();setInterval(update,2500);
