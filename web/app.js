/* SPDX-License-Identifier: MIT */
const $=id=>document.getElementById(id), enc=new TextEncoder();
let state=null,lastHistory='',selected='',polling=false,hasClock=false;
async function api(path,data){const opts={headers:{'X-Disaster-Request':'1'},cache:'no-store'};if(data){opts.method='POST';opts.body=new URLSearchParams(data);}const r=await fetch('/api/'+path,opts);if(!r.ok)throw Error(await r.text());return r;}
async function act(path,data){try{const r=await api(path,data);$('feedback').textContent=await r.text();await update();return true;}catch(e){$('feedback').textContent=e.message;return false;}}
function renderHistory(raw){lastHistory=raw;const box=$('messages');box.replaceChildren();let count=0;
 const rows=raw.trim().split('\n').filter(Boolean).map(line=>{const i=line.indexOf(':');return [Number(line.slice(0,i)),line.slice(i+1)];}).sort((a,b)=>a[0]-b[0]);
 for(const [,hex]of rows){let m;try{m=decodeRecord(hex);}catch{continue;}if(!m||m.target&&m.target!==$('target').value)continue;count++;const el=document.createElement('div');el.className='message'+(m.own?' own':'');const label=document.createElement('small');label.textContent=m.label;const body=document.createElement('div');body.textContent=m.body;el.append(label,body);box.append(el);}
 if(!count){const p=document.createElement('p');p.className='muted';p.textContent='Keine gespeicherten Nachrichten für dieses Ziel.';box.append(p);}box.scrollTop=box.scrollHeight;
}
async function update(){if(polling)return;polling=true;try{
 state=await(await api('state')).json();$('link').textContent=state.ready?'Knoten online':'Startet …';$('result').textContent=state.result;
 $('stats').textContent='Speicher: '+(state.storage?'bereit':'Schreibfehler')+' · Freier RAM: '+Math.round(state.heap/1024)+' KB';
 if(state.info){const p=bytes(state.info);if(p.length>=58){$('node').textContent=text(p,58)||'Zugangsknoten';$('stats').textContent+=' · '+(u32(p,48)/1000).toFixed(3)+' MHz · '+p[2]+' dBm';}}
 const opts=[];state.channels.forEach((h,i)=>{if(h){const p=bytes(h);opts.push(['c'+i,text(p,2,34)||'Kanal '+i]);}});
 state.contacts.forEach(h=>{const p=bytes(h);if(p.length>=132&&p[33]===1)opts.push(['d'+h.slice(2,14),'Direkt: '+text(p,100,132)]);});
 const old=$('target').value;$('target').replaceChildren();for(const [value,label]of opts){const o=document.createElement('option');o.value=value;o.textContent=label;$('target').append(o);}if(opts.some(o=>o[0]===old))$('target').value=old;
 $('sendbutton').disabled=!state.ready||state.busy||!$('target').value||enc.encode($('text').value).length>100;
 const raw=await(await api('history')).text();if(raw!==lastHistory||old!==$('target').value)renderHistory(raw);
 $('link').style.color='';
 }catch(e){$('link').textContent='Verbindung fehlt';$('sendbutton').disabled=true;$('stats').textContent='Mit dem WLAN des Boards verbinden und diese Seite erneut öffnen.';}finally{polling=false;}}
$('target').addEventListener('change',()=>renderHistory(lastHistory));
$('text').addEventListener('input',()=>{const n=enc.encode($('text').value).length;$('counter').textContent=n+' / 100 Bytes';$('sendbutton').disabled=n>100||!n||!state?.ready||state?.busy;});
$('send').onsubmit=async e=>{e.preventDefault();$('sendbutton').disabled=true;const content=$('text').value;if(!content.trim())return;if(await act('send',{text:content,target:$('target').value,time:Math.floor(Date.now()/1000)})){$('text').value='';$('counter').textContent='0 / 100 Bytes';}};
$('rename').onsubmit=e=>{e.preventDefault();act('name',{name:$('name').value});};
$('advert').onclick=()=>act('advert',{});$('refresh').onclick=()=>act('refresh',{});$('clock').onclick=()=>act('time',{time:Math.floor(Date.now()/1000)});
$('channel').onsubmit=async e=>{e.preventDefault();if(await act('channel',{slot:$('slot').value,name:$('channelname').value,key:$('key').value}))$('key').value='';};
$('radio').onsubmit=e=>{e.preventDefault();act('radio',{freq:Math.round(Number($('freq').value)*1000),bw:$('bw').value,sf:$('sf').value,cr:$('cr').value});};
update();setInterval(update,2500);
