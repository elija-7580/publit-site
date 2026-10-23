# Generates the neutral global land layer used beneath the European coverage map.
import json, os
import numpy as np
import shapely
from shapely.geometry import shape, box, Polygon

SITE = os.environ.get('SITE', '/data/repos/publit-site')
K=0.6156614753256583; SX=22.87703162651752; Y1=1.81486224426954; S=K*SX
WORLD=box(-180,-85,180,85)

def px(lon): return (lon+SX)*S
def py(lat): return (Y1-np.log(np.tan(np.pi/4+np.asarray(lat)*np.pi/360)))*S*180/np.pi

def path(g, tol=.7, dec=1):
    polys=[g] if isinstance(g,Polygon) else list(getattr(g,'geoms',[]))
    out=[]
    for pg in polys:
        if not isinstance(pg,Polygon) or pg.is_empty: continue
        for ring in [pg.exterior,*pg.interiors]:
            c=np.asarray(ring.coords); X=px(c[:,0]); Y=py(c[:,1])
            q=shapely.simplify(shapely.linestrings(np.c_[X,Y]),tol)
            cc=np.asarray(shapely.get_coordinates(q))
            if len(cc)<4: continue
            ar=0.5*abs(np.dot(cc[:-1,0],cc[1:,1])-np.dot(cc[1:,0],cc[:-1,1]))
            if ar<tol*tol*4: continue
            r=np.round(cc*10**dec).astype(int)
            out.append('M%d %d'%tuple(r[0])+'l'+' '.join('%d %d'%tuple(d) for d in np.diff(r[:-1],axis=0) if d.any())+'z')
    return ''.join(out)

features=json.load(open('a0.geojson'))['features']
layers=[]
for feature in features:
    geom=shape(feature['geometry']).intersection(WORLD)
    if not geom.is_empty:
        d=path(geom)
        if d: layers.append(d)
out=f'{SITE}/abdeckung/data/world.json'
os.makedirs(os.path.dirname(out),exist_ok=True)
json.dump({'layers':layers},open(out,'w'),separators=(',',':'))
print(f'world map: {len(layers)} countries, {os.path.getsize(out):,} bytes')
