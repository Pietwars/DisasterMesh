#!/usr/bin/env python3
"""Prepare actual OSM vectors on a connected PC; the portal never requests online tiles."""
import argparse,json,xml.etree.ElementTree as ET
from pathlib import Path
from urllib.request import Request,urlopen

def convert(xml):
    if len(xml)>20*1024*1024: raise ValueError('OSM input larger than 20 MB; choose a smaller area')
    root=ET.fromstring(xml);nodes={};features=[]
    for node in root.findall('node'):
        coordinate=[float(node.attrib['lon']),float(node.attrib['lat'])];nodes[node.attrib['id']]=coordinate
        tags={t.attrib['k']:t.attrib['v'] for t in node.findall('tag')}
        if tags.get('place') and tags.get('name'):features.append({'type':'Feature','properties':tags,'geometry':{'type':'Point','coordinates':coordinate}})
    for way in root.findall('way'):
        tags={t.attrib['k']:t.attrib['v'] for t in way.findall('tag')}
        if not any(k in tags for k in ('highway','waterway','natural','landuse','building')):continue
        refs=[n.attrib['ref'] for n in way.findall('nd')]
        if len(refs)<2 or any(ref not in nodes for ref in refs):continue
        points=[nodes[ref] for ref in refs];area=len(points)>=4 and refs[0]==refs[-1] and not tags.get('highway') and (tags.get('building') or tags.get('landuse') or tags.get('natural')=='water')
        features.append({'type':'Feature','properties':tags,'geometry':{'type':'Polygon' if area else 'LineString','coordinates':[points] if area else points}})
    return {'type':'FeatureCollection','attribution':'© OpenStreetMap contributors · ODbL 1.0 · https://www.openstreetmap.org/copyright','features':features}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('output');g=p.add_mutually_exclusive_group(required=True);g.add_argument('--input',help='Local .osm XML export');g.add_argument('--bbox',nargs=4,type=float,metavar=('WEST','SOUTH','EAST','NORTH'));a=p.parse_args()
    if a.input: xml=Path(a.input).read_bytes()
    else:
        w,s,e,n=a.bbox
        if not(-180<=w<e<=180 and -85<=s<n<=85 and (e-w)*(n-s)<=.01):p.error('Invalid/too large bbox; maximum .01 square degrees')
        url='https://api.openstreetmap.org/api/0.6/map?bbox='+','.join(map(str,(w,s,e,n)))
        with urlopen(Request(url,headers={'User-Agent':'DisasterMesh/0.5 offline-map-preparation'}),timeout=60) as r:xml=r.read(20*1024*1024+1)
    data=convert(xml);encoded=json.dumps(data,ensure_ascii=False,separators=(',',':')).encode()
    if not data['features']:p.error('No supported map features')
    if len(encoded)>5*1024*1024 or len(data['features'])>20000:p.error('Result too large; choose a smaller region')
    Path(a.output).write_bytes(encoded);print(f"{len(data['features'])} features, {len(encoded)} bytes saved to {a.output}")
if __name__=='__main__':main()
