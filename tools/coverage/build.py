# Erzeugt abdeckung/data/*.json. Siehe .github/workflows/coverage.yml
import json,glob,os,math,re,collections
import numpy as np, shapely
from shapely.geometry import shape, box, mapping, Polygon, MultiPolygon
from shapely.ops import unary_union
SITE=os.environ.get('SITE','/data/repos/publit-site'); OUT=SITE+'/abdeckung/data'; os.makedirs(OUT,exist_ok=True)
K=0.6156614753256583; SX=22.87703162651752; Y1=1.81486224426954; S=K*SX
def px(lon): return (lon+SX)*S
def py(lat): return (Y1-np.log(np.tan(np.pi/4+np.asarray(lat)*np.pi/360)))*S*180/np.pi
BOX=box(-25,34,45.5,71.5)
EUROPE='ad al am at ba be bg by ch cy cz de dk ee es fi fr gb ge gr hr hu ie is it li lt lu lv mc md me mk mt nl no pl pt ro rs ru se si sk sm tr ua va xk az'.split()
# ---------- feeds ----------
lic=[e for e in json.load(open('lic.json')) if 'filename' in e]
LIC={e['filename']:e for e in lic}
def slug(s): return re.sub(r'[^a-z0-9]','',s.lower())
rtby=collections.defaultdict(list)
for f in glob.glob('transitous-main/feeds/*.json'):
    cc=os.path.basename(f)[:-5]
    for s in json.load(open(f))['sources']:
        if s.get('spec') in ('gtfs-rt','siri','siri-lite'): rtby[(cc.split('-')[0],slug(s.get('name','')))].append(s.get('spec'))
feeds=[]
for fn in sorted(os.listdir('stops')):
    fz=fn[:-4]; e=LIC.get(fz,{}); cc=fz.split('_')[0]; nm=fz[len(cc)+1:-9]
    rt=bool(e.get('rt')) or bool(rtby.get((cc,slug(nm)))) or bool(rtby.get((cc,slug(e.get('human_name','')))))
    pts=np.loadtxt('stops/'+fn,delimiter=',',ndmin=2) if os.path.getsize('stops/'+fn) else np.zeros((0,2))
    feeds.append(dict(file=fz,cc=cc,name=e.get('human_name') or nm.replace('-',' '),ops=(e.get('operators') or [])[:40],rt=rt,
        lic=e.get('spdx_license_identifier'),pub=(e.get('publisher') or {}).get('name'),upd=(e.get('last_updated') or '')[:10],pts=pts))
print('feeds',len(feeds),'rt',sum(f['rt'] for f in feeds))
# ---------- countries ----------
a0=json.load(open('a0.geojson'))['features']
countries={}
for ft in a0:
    p=ft['properties']; iso=(p['ISO_A2_EH'] if p['ISO_A2_EH']!='-99' else p['ISO_A2']).lower()
    if iso=='-99': continue
    g=shape(ft['geometry']).intersection(BOX)
    if g.is_empty: continue
    countries[iso]=dict(iso=iso,de=p['NAME_DE'],en=p['NAME_EN'],geom=g,eu=iso in EUROPE)
print('countries',len(countries))
# ---------- regions ----------
GROUP={'fr':'region','it':'region','es':'region','si':'region','lv':'region','hu':'region','ie':'region','gb':'region','mk':'region','pt':'region'}
a1=json.load(open('a1.geojson'))['features']
regions=collections.defaultdict(dict)
for ft in a1:
    p=ft['properties']; iso=(p['iso_a2'] or '').lower()
    if iso not in countries or not countries[iso]['eu']: continue
    g=shape(ft['geometry']).intersection(BOX)
    if g.is_empty: continue
    key=p['name']; de=p.get('name_de') or p['name']; en=p.get('name_en') or p['name']
    if iso in GROUP:
        r=p.get(GROUP[iso]) or p['name']
        if iso=='pt' and r=='Norte, Centro': r='Centro'
        key=r; de=r; en=r
    R=regions[iso].setdefault(key,dict(name=key,de=de,en=en,parts=[]))
    R['parts'].append(g.buffer(0))
for iso in regions:
    for R in regions[iso].values(): R['geom']=unary_union(R['parts']).buffer(0); del R['parts']
print('regions',sum(len(v) for v in regions.values()))
# ---------- grid ----------
DX,DY=0.05,0.03
def cells_of(lon,lat): return set(zip(np.floor(lon/DX).astype(int).tolist(),np.floor(lat/DY).astype(int).tolist()))
# assign every stop to a country and region
for c in countries.values(): c['prep']=c['geom']; shapely.prepare(c['geom'])
for iso in regions:
    for R in regions[iso].values(): shapely.prepare(R['geom'])
stat=lambda: dict(stops=set(),live=set(),cells=set(),lcells=set(),feeds=collections.Counter())
CS=collections.defaultdict(stat); RS=collections.defaultdict(stat)
for fi,f in enumerate(feeds):
    P=f['pts']
    if not len(P): continue
    lat,lon=P[:,0],P[:,1]
    left=np.ones(len(P),bool)
    for iso,c in countries.items():
        mn=c['geom'].bounds
        cand=left&(lon>=mn[0])&(lon<=mn[2])&(lat>=mn[1])&(lat<=mn[3])
        if not cand.any(): continue
        idx=np.where(cand)[0]
        ins=shapely.contains_xy(c['geom'],lon[idx],lat[idx]); idx=idx[ins]
        if not len(idx): continue
        left[idx]=False
        st=CS[iso]; pts=set(zip(lat[idx].tolist(),lon[idx].tolist())); st['stops']|=pts; st['feeds'][fi]+=len(idx)
        cl=cells_of(lon[idx],lat[idx]); st['cells']|=cl
        if f['rt']: st['live']|=pts; st['lcells']|=cl
        for rk,R in regions.get(iso,{}).items():
            b=R['geom'].bounds; sub=idx[(lon[idx]>=b[0])&(lon[idx]<=b[2])&(lat[idx]>=b[1])&(lat[idx]<=b[3])]
            if not len(sub): continue
            sub=sub[shapely.contains_xy(R['geom'],lon[sub],lat[sub])]
            if not len(sub): continue
            rs=RS[(iso,rk)]; pts=set(zip(lat[sub].tolist(),lon[sub].tolist())); rs['stops']|=pts; rs['feeds'][fi]+=len(sub)
            if f['rt']: rs['live']|=pts
            rs['cells']|=cells_of(lon[sub],lat[sub])
    if fi%100==0: print('feed',fi,flush=True)
def area_cells(g):
    b=g.bounds; xs=np.arange(math.floor(b[0]/DX),math.ceil(b[2]/DX)); ys=np.arange(math.floor(b[1]/DY),math.ceil(b[3]/DY))
    X,Y=np.meshgrid((xs+.5)*DX,(ys+.5)*DY); return int(shapely.contains_xy(g,X.ravel(),Y.ravel()).sum()) or 1
def summ(st,g):
    n=len(st['stops']); tot=area_cells(g)
    return dict(stops=n,live=round(len(st['live'])/n,3) if n else 0,area=round(min(1,len(st['cells'])/tot),3),
        feeds=[[fi,c] for fi,c in st['feeds'].most_common() if c>=3 or c/len(feeds[fi]['pts'])>.2])
def cat(s):
    if not s['stops']: return 'n'
    if s['area']<.05: return 'v'
    if s['live']>=.5: return 'l2'
    if s['live']>=.05: return 'l1'
    return 't'
# ---------- geometry to path ----------
def path(g,tol,dec):
    g=g.simplify(tol*0.068/ S * 1.0 if False else tol, preserve_topology=True) if False else g
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
            s='M%d %d'%tuple(r[0])+'l'+' '.join('%d %d'%tuple(d) for d in np.diff(r[:-1],axis=0) if d.any())+'z'
            out.append(s)
    return ''.join(out)
def pb(g): b=g.bounds; return [round(float(px(b[0])),1),round(float(py(b[3])),1),round(float(px(b[2])),1),round(float(py(b[1])),1)]
# ---------- write ----------
fe=[dict(n=f['name'],o=f['ops'][:12],no=len(f['ops']),rt=f['rt'],l=f['lic'],p=f['pub'],u=f['upd'],cc=f['cc'],s=len(f['pts'])) for f in feeds]
eu=dict(date=max(f['upd'] for f in feeds if f['upd']),scale=10,feeds=fe,countries=[])
for iso,c in sorted(countries.items()):
    rec=dict(iso=iso,de=c['de'],en=c['en'],eu=c['eu'],d=path(c['geom'],.35,1) or path(c['geom'],.01,1) or path(c['geom'].buffer(.02),.01,1),b=pb(c['geom']))
    if c['eu']:
        s=summ(CS[iso],c['geom']); s['cat']=cat(s); rec.update(s); rec['regions']=len(regions.get(iso,{}))
    eu['countries'].append(rec)
    if c['eu'] and iso in regions:
        rr=[]
        for rk,R in sorted(regions[iso].items()):
            s=summ(RS[(iso,rk)],R['geom']); s['cat']=cat(s)
            rr.append(dict(id=rk,de=R['de'],en=R['en'],d=path(R['geom'],.06,2) or path(R['geom'],.005,2),b=pb(R['geom']),**s))
        st=CS[iso]; enc=lambda S_: ';'.join(f'{a},{b}' for a,b in sorted(S_))
        stat_only=st['cells']-st['lcells']
        json.dump(dict(iso=iso,scale=100,dx=DX,dy=DY,regions=rr,cs=enc(stat_only),cl=enc(st['lcells'])),open(f'{OUT}/{iso}.json','w'),ensure_ascii=False,separators=(',',':'))
import ast
src=open(SITE+'/coverage.js').read()
arr=src[src.index('const C = [')+10:src.index('];',src.index('const C = ['))+1]
eu['publit']=ast.literal_eval(arr)
json.dump(eu,open(f'{OUT}/europe.json','w'),ensure_ascii=False,separators=(',',':'))
print('ok')
