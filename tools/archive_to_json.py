#!/usr/bin/env python3
"""Read the fixed 186-byte SD archive records, ignoring torn or corrupt records."""
import argparse,json,struct
from pathlib import Path

def records(data):
    result=[]
    for offset in range(0,len(data)-185,186):
        chunk=data[offset:offset+186];seq,length,payload,crc=struct.unpack('<IH176sI',chunk);h=2166136261
        for byte in chunk[:-4]:h=((h^byte)*16777619)&0xffffffff
        if not seq or not 1<=length<=176 or h!=crc:continue
        p=payload[:length];code=p[0];start=None;stamp=None;target=''
        if code==17 and length>=11:start=11;stamp=struct.unpack_from('<I',p,7)[0];target='c'+str(p[4])
        elif code==16 and length>=16:start=20 if p[11]==2 else 16;stamp=struct.unpack_from('<I',p,12)[0];target='d'+p[4:10].hex()
        elif code in (0xf2,0xf4) and length>=(17 if code==0xf4 else 13):start=17 if code==0xf4 else 13;stamp=struct.unpack_from('<I',p,3)[0];target='d'+p[7:13].hex()
        elif code==0xf3 and length>=7:start=7;stamp=struct.unpack_from('<I',p,3)[0];target='c'+str(p[2])
        item={'seq':seq,'code':code,'hex':p.hex()}
        if start is not None and start<=length:item.update(target=target,timestamp=stamp,text=p[start:].split(b'\0')[0].decode('utf-8','replace'))
        result.append(item)
    return sorted(result,key=lambda x:x['seq'])

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('input',nargs='+');p.add_argument('-o','--output',required=True);a=p.parse_args()
    result=[]
    for name in a.input:result.extend(records(Path(name).read_bytes()))
    Path(a.output).write_text(json.dumps({'format':'DisasterMesh-SD-archive','version':1,'records':sorted(result,key=lambda x:x['seq'])},ensure_ascii=False,indent=2),encoding='utf-8');print(f'{len(result)} valid records')
if __name__=='__main__':main()
