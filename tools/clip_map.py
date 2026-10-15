#!/usr/bin/env python3
"""Clip prepared GeoJSON to a local region. Optional preparation dependency: shapely==2.1.2."""
import argparse
import json
from pathlib import Path

def clip_collection(data,bounds):
    from shapely.geometry import shape, mapping, box
    from shapely import make_valid
    west,south,east,north=bounds
    if not(-180<=west<east<=180 and -85<=south<north<=85):
        raise ValueError('Invalid WGS84 bounds')
    window=box(*bounds)
    features=[]
    def parts(geometry):
        if geometry.is_empty:return
        if geometry.geom_type=='GeometryCollection':
            for part in geometry.geoms:yield from parts(part)
        elif geometry.geom_type in ('Point','LineString','MultiLineString','Polygon','MultiPolygon'):
            yield geometry
    for feature in data['features']:
        raw=feature.get('geometry')
        if not raw:continue
        geometry=shape(raw)
        if not geometry.is_valid:geometry=make_valid(geometry)
        for clipped in parts(geometry.intersection(window)):
            props=dict(feature.get('properties',{}))
            from osm_to_geojson import useful_poi
            if useful_poi(props) and clipped.geom_type!='Point':
                point=clipped.representative_point();props['poi_position']=[point.x,point.y]
            features.append({**feature,'properties':props,'geometry':mapping(clipped)})
    if not features:raise ValueError('No features intersect requested region')
    return {**data,'features':features,'bbox':list(bounds),'viewBounds':list(bounds)}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input',type=Path);parser.add_argument('output',type=Path)
    parser.add_argument('--bbox',nargs=4,type=float,required=True,metavar=('WEST','SOUTH','EAST','NORTH'))
    args=parser.parse_args();data=json.loads(args.input.read_text(encoding='utf-8'))
    result=clip_collection(data,args.bbox)
    args.output.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print(f"{len(data['features'])} → {len(result['features'])} features; clipped to {args.bbox}")

if __name__=='__main__':main()
