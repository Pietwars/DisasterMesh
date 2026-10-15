/* SPDX-License-Identifier: MIT */
const dec=new TextDecoder();
function bytes(hex){if(!/^(?:[0-9a-f]{2})*$/i.test(hex))throw Error('Ungültiges Datenformat');return Uint8Array.from(hex.match(/../g)||[],x=>parseInt(x,16));}
function text(p,start,end=p.length){return dec.decode(p.slice(start,end)).replace(/\0.*$/s,'');}
function u32(p,i){return new DataView(p.buffer,p.byteOffset,p.byteLength).getUint32(i,true);}
function decodeRecord(hex){
 const p=bytes(hex); if(!p.length)return null;
 const code=p[0];let at,stamp,label,own=false,target='';
 if(code===17&&p.length>=11){at=11;stamp=u32(p,7);target='c'+p[4];label='Kanal '+p[4];}
 else if(code===16&&p.length>=16){at=16;stamp=u32(p,12);label='Direkt von '+hex.slice(8,20);target='d'+hex.slice(8,20);}
 else if(code===0xf3&&p.length>=7){at=7;stamp=u32(p,3);target='c'+p[2];label='Du → Kanal '+p[2]+' · Funkkern angenommen';own=true;}
 else if((code===0xf2&&p.length>=13)||(code===0xf4&&p.length>=17)){at=code===0xf4?17:13;stamp=u32(p,3);target='d'+hex.slice(14,26);label='Du → '+hex.slice(14,26)+' · Zustellung offen';own=true;}
 else if(code===0x82){return {label:'Funkstatus',body:'Empfangsbestätigung für eine Direktnachricht eingegangen.',own:false,target:'',ack:p.length>=9?hex.slice(2,10):null};}
 else return null;
 return {label:new Date(stamp*1000).toLocaleString('de-DE')+' · '+label,body:text(p,at),own,target,ack:code===0xf4?hex.slice(26,34):null};
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

if(typeof module!=="undefined")module.exports={bytes,text,u32,decodeRecord,decodeHistory};
