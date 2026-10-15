/* SPDX-License-Identifier: MIT */
const dec=new TextDecoder();
function bytes(hex){if(!/^(?:[0-9a-f]{2})*$/i.test(hex))throw Error('Ungültiges Datenformat');return Uint8Array.from(hex.match(/../g)||[],x=>parseInt(x,16));}
function text(p,start,end=p.length){return dec.decode(p.slice(start,end)).replace(/\0.*$/s,'');}
function u32(p,i){return new DataView(p.buffer,p.byteOffset,p.byteLength).getUint32(i,true);}
function decodeRecord(hex){
 const p=bytes(hex); if(!p.length)return null;
 const code=p[0];let at,stamp,label,own=false,target='';
 if(code===17&&p.length>=11){at=11;stamp=u32(p,7);target='c'+p[4];label='Kanal '+p[4];}
 else if(code===16&&p.length>=16){at=16;stamp=u32(p,12);label='Direkt von '+hex.slice(8,20);target='d'+hex.slice(8,20);if(p[11]===2){if(p.length<20)return null;at=20;label='Raumbeitrag von '+hex.slice(32,40);}}
 else if(code===0xf3&&p.length>=7){at=7;stamp=u32(p,3);target='c'+p[2];label='Du → Kanal '+p[2]+' · Funkkern angenommen';own=true;}
 else if((code===0xf2&&p.length>=13)||(code===0xf4&&p.length>=17)){at=code===0xf4?17:13;stamp=u32(p,3);target='d'+hex.slice(14,26);label='Du → '+hex.slice(14,26)+' · Zustellung offen';own=true;}
 else if(code===0x82){return {label:'Funkstatus',body:'Empfangsbestätigung für eine Direktnachricht eingegangen.',own:false,target:'',ack:p.length>=9?hex.slice(2,10):null};}
 else return null;
 return {roomPost:code===16&&p[11]===2,stamp,author:code===16&&p[11]===2?hex.slice(32,40):null,label:new Date(stamp*1000).toLocaleString('de-DE')+' · '+label,body:text(p,at),own,target,ack:code===0xf4?hex.slice(26,34):null};
}

// Only a unique stored send with an earlier sequence may consume an ACK.
// A 32-bit ACK tag is not a globally unique message ID; collisions stay unassigned.
function decodeHistory(raw){
 const rows=[];
 for(const line of raw.trim().split('\n')){
  const match=/^(\d+):([0-9a-f]+)$/i.exec(line);if(!match)continue;
  try{const m=decodeRecord(match[2].toLowerCase());if(m)rows.push({...m,seq:Number(match[1])});}catch{}
 }
 rows.sort((a,b)=>a.seq-b.seq);
 const seenPosts=new Set();
 const unique=rows.filter(m=>{if(!m.roomPost)return true;const key=JSON.stringify([m.target,m.stamp,m.author,m.body]);if(seenPosts.has(key))return false;seenPosts.add(key);return true;});
 rows.length=0;rows.push(...unique);
 const sends=new Map();
 for(const m of rows)if(m.own&&m.ack&&m.ack!=='00000000'){
  const items=sends.get(m.ack)||[];items.push(m);sends.set(m.ack,items);
 }
 const consumed=new Set();
 for(const m of rows)if(!m.own&&m.ack){
  const items=sends.get(m.ack)||[];
  if(items.length===1&&items[0].seq<m.seq){
   const send=items[0];send.delivered=true;consumed.add(m);
  }
 }
 for(const m of rows)if(m.delivered)m.label=m.label.replace('Zustellung offen','Empfang bestätigt');
 return rows.filter(m=>!consumed.has(m));
}

function makeNotice({kind,expires,lat='',lon='',place,need}){
 if(!['H','A','I'].includes(kind)||!Number.isSafeInteger(expires)||expires<1700000000||expires>4102444800)throw Error('Typ oder Ablaufzeit ungültig');
 if(!place?.trim()||!need?.trim()||/[|\r\n\0]/.test(place+need))throw Error('Ort und Bedarf ohne Trennstriche oder Zeilenumbrüche eingeben');
 let position='-';
 if(String(lat).trim()||String(lon).trim()){
  if(!String(lat).trim()||!String(lon).trim()||!Number.isFinite(Number(lat))||!Number.isFinite(Number(lon))||Math.abs(Number(lat))>90||Math.abs(Number(lon))>180)throw Error('Beide Koordinaten gültig eingeben');
  position=Number(lat).toFixed(5)+','+Number(lon).toFixed(5);
 }
 const result=['!DM1',kind,expires,position,place.trim(),need.trim()].join('|');
 if(new TextEncoder().encode(result).length>100)throw Error('Meldung über 100 UTF-8-Bytes: Ort oder Text kürzen');
 return result;
}
function parseNotice(body){
 const p=body.split('|');if(p.length!==6||p[0]!=='!DM1')return null;
 const coords=p[3]==='-'?['','']:p[3].split(',');if(coords.length!==2)return null;
 const n={kind:p[1],expires:Number(p[2]),lat:coords[0],lon:coords[1],place:p[4],need:p[5]};
 try{makeNotice(n);return n;}catch{return null;}
}

if(typeof module!=="undefined")module.exports={bytes,text,u32,decodeRecord,decodeHistory,makeNotice,parseNotice};
