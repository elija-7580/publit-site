# Erzeugt abdeckung/data/*.json aus allen GTFS-Quellen von Transitous, weltweit. Siehe .github/workflows/coverage.yml
# Kein Land und keine Stadt ist fest eingetragen: kommt bei Transitous ein Gebiet dazu, erscheint es beim naechsten Lauf.
import json,glob,os,math,re,collections
import numpy as np, shapely
from shapely.geometry import shape, box, mapping, Polygon, MultiPolygon
from shapely.ops import unary_union
SITE=os.environ.get('SITE','/data/repos/publit-site'); OUT=SITE+'/abdeckung/data'; os.makedirs(OUT,exist_ok=True)
K=0.6156614753256583; SX=22.87703162651752; Y1=1.81486224426954; S=K*SX
def px(lon): return (lon+SX)*S
def py(lat): return (Y1-np.log(np.tan(np.pi/4+np.asarray(lat)*np.pi/360)))*S*180/np.pi
BOX=box(-180,-60,180,84)
# Europe is always listed, also where there is no data yet; elsewhere a country appears once it has stops.
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
    if iso not in countries: continue
    g=shape(ft['geometry']).intersection(BOX)
    if g.is_empty: continue
    nm=p['name'] or p.get('name_en') or p.get('woe_name') or p.get('adm1_code') or '?'
    key=nm; de=p.get('name_de') or nm; en=p.get('name_en') or nm
    if iso in GROUP:
        r=p.get(GROUP[iso]) or nm
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
for iso,c in countries.items(): c['eu']=c['eu'] or bool(CS[iso]['stops'])
print('countries with data',sum(1 for i in countries if CS[i]['stops']))
# ---------- towns: does a town have stops? (keeps big, empty countries from looking blank) ----------
TOWNS=collections.defaultdict(list)
for ft in json.load(open('pp.geojson'))['features']:
    p=ft['properties']
    if p['pop_max']>=50000: TOWNS[(p.get('iso_a2') or '').lower()].append((p['latitude'],p['longitude']))
def town_share(st,iso,g=None):
    ts=TOWNS.get(iso,[])
    if g is not None and ts:
        a=np.array(ts); ts=[t for t,ok in zip(ts,shapely.contains_xy(g,a[:,1],a[:,0])) if ok]
    if len(ts)<3: return None
    hit=0
    for la,lo in ts:
        i,j=math.floor(lo/DX),math.floor(la/DY)
        if any((i+a,j+b) in st['cells'] for a in (-1,0,1) for b in (-1,0,1)): hit+=1
    return round(hit/len(ts),3)
def area_cells(g):
    b=g.bounds; xs=np.arange(math.floor(b[0]/DX),math.ceil(b[2]/DX)); ys=np.arange(math.floor(b[1]/DY),math.ceil(b[3]/DY))
    X,Y=np.meshgrid((xs+.5)*DX,(ys+.5)*DY); return int(shapely.contains_xy(g,X.ravel(),Y.ravel()).sum()) or 1
def summ(st,g,iso,whole=False):
    n=len(st['stops']); tot=area_cells(g)
    return dict(towns=town_share(st,iso,None if whole else g),stops=n,live=round(len(st['live'])/n,3) if n else 0,area=round(min(1,len(st['cells'])/tot),3),
        feeds=[[fi,c] for fi,c in st['feeds'].most_common() if c>=3 or c/len(feeds[fi]['pts'])>.2])
def cat(s):
    if not s['stops']: return 'n'
    if s['area']<.05 and (s['towns'] is None or s['towns']<.3): return 'v'
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
eu_rec={}
import datetime
# The day the data was read (feeds sometimes carry dates in the future); the apps take the newest atlas by this date.
eu=dict(date=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d'),scale=10,feeds=fe,countries=[])
for iso,c in sorted(countries.items()):
    rec=dict(iso=iso,de=c['de'],en=c['en'],eu=c['eu'],d=path(c['geom'],.35,1) or path(c['geom'],.01,1) or path(c['geom'].buffer(.02),.01,1),b=pb(c['geom']))
    if c['eu']:
        s=summ(CS[iso],c['geom'],iso,True); s['cat']=cat(s); rec.update(s); rec['regions']=len(regions.get(iso,{}))
    eu['countries'].append(rec); eu_rec[iso]=rec
    if c['eu'] and iso in regions:
        rr=[]
        for rk,R in sorted(regions[iso].items()):
            s=summ(RS[(iso,rk)],R['geom'],iso); s['cat']=cat(s)
            rr.append(dict(id=rk,de=R['de'],en=R['en'],d=path(R['geom'],.06,2) or path(R['geom'],.005,2),b=pb(R['geom']),**s))
        st=CS[iso]; enc=lambda S_: ';'.join(f'{a},{b}' for a,b in sorted(S_))
        stat_only=st['cells']-st['lcells']
        rec['rn']=[[r['id'],r['de'],r['en']] for r in rr]
        json.dump(dict(iso=iso,scale=100,dx=DX,dy=DY,regions=rr,cs=enc(stat_only),cl=enc(st['lcells'])),open(f'{OUT}/{iso}.json','w'),ensure_ascii=False,separators=(',',':'))
# ---------- stop tiles (2 x 2 degrees, 0.001 degree grid) ----------
# Each file data/t/<x>_<y>.txt has two lines: stops with a realtime source, stops with timetable only.
# A line is a sorted list of cell indices (iy*2000+ix), delta coded as base-32 varints in a 64-char alphabet.
import shutil
TD=OUT+'/t'; shutil.rmtree(TD,ignore_errors=True); os.makedirs(TD)
ALPH='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
def venc(vals):
    out=[]; prev=-1
    for v in vals:
        d=v-prev-1; prev=v
        while d>=32: out.append(ALPH[32+(d&31)]); d>>=5
        out.append(ALPH[d])
    return ''.join(out)
live=collections.defaultdict(set); tt=collections.defaultdict(set)
for f in feeds:
    P=f['pts']
    if not len(P): continue
    lat,lon=P[:,0],P[:,1]; m=(lat>=-60)&(lat<84); lat,lon=lat[m],lon[m]
    q=np.round(lon*1000).astype(np.int64)*1000000+np.round(lat*1000).astype(np.int64)
    (live if f['rt'] else tt)[0].update(q.tolist())
L_=live[0]; T_=tt[0]-L_
tiles=collections.defaultdict(lambda:([],[]))
for k,S_ in ((0,L_),(1,T_)):
    for q in S_:
        x=q//1000000; y=q-x*1000000
        if y>=500000: y-=1000000; x+=1
        tx,ty=x//2000,y//2000
        tiles[(tx,ty)][k].append((y-ty*2000)*2000+(x-tx*2000))
for (tx,ty),(a,b) in tiles.items():
    open(f'{TD}/{tx}_{ty}.txt','w').write(venc(sorted(a))+'\n'+venc(sorted(b)))
eu['tiles']=sorted(f'{tx}_{ty}' for tx,ty in tiles)
print('tiles',len(tiles),'live',len(L_),'tt',len(T_))
# ---------- place names ----------
pl=[]
for ft in json.load(open('pp.geojson'))['features']:
    p=ft['properties']; lo,la=p['longitude'],p['latitude']
    shown=countries.get((p.get('iso_a2') or '').lower(),{}).get('eu')
    if -60<la<84 and p['scalerank']<=(8 if shown else 3):
        pl.append([p['name'],round(la,3),round(lo,3),p['scalerank'],1 if p['adm0cap'] else 0])
pl.sort(key=lambda r:(r[3],-r[4])); eu['places']=pl
# ---------- cities: computed from the stops, plus the hand-kept list in cities.json ----------
CUR=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'cities.json')))
GAPS={'L':('local and regional buses','Regionalbusse'),'C':('city buses','Stadtbusse'),'M':('metro','Metro'),'T':('trams','Trams'),'F':('ferries','Fähren'),'S':('suburban trains','S-Bahn')}
def qll(q):
    x=q//1000000; y=q-x*1000000
    if y>=500000: y-=1000000; x+=1
    return y/1000,x/1000
BIN=collections.defaultdict(list)
for live_,S_ in ((1,L_),(0,T_)):
    for q in S_:
        la,lo=qll(q); BIN[(math.floor(la/.05),math.floor(lo/.05))].append((la,lo,live_))
def near(la,lo,km=5):
    n=l=0; r=int(math.ceil(km/5.5))+1; cl=math.cos(math.radians(la))
    for a in range(-r,r+1):
        for b in range(-2*r,2*r+1):
            for y,x,lv in BIN.get((math.floor(la/.05)+a,math.floor(lo/.05)+b),()):
                if math.hypot((y-la)*111.2,(x-lo)*111.2*cl)<=km: n+=1; l+=lv
    return n,l
def partial_at(la,lo):
    for c in CUR['partial']:
        if 'circle' in c:
            y,x,rad=c['circle']
            if math.hypot((y-la)*111.2,(x-lo)*111.2*math.cos(math.radians(la)))*1000<=rad: return c
    return None
cities=[]
for nm,la,lo,en,de in CUR['own_live']: cities.append([nm,la,lo,'x',en,de])
seen={(round(c[1]),round(c[2])) for c in cities}
for ft in json.load(open('pp.geojson'))['features']:
    p=ft['properties']; iso=(p.get('iso_a2') or '').lower()
    if not countries.get(iso,{}).get('eu'): continue
    if not (p['adm0cap'] or p['scalerank']<=2 or (iso in EUROPE and p['scalerank']<=3 and p['pop_max']>=500000)): continue
    la,lo=round(p['latitude'],2),round(p['longitude'],2)
    if any(math.hypot(la-c[1],lo-c[2])<.3 for c in cities): continue
    n,l=near(la,lo)
    pc_=partial_at(la,lo)
    if pc_:
        miss=[GAPS[g] for g in pc_['gaps']]
        cities.append([p['name'],la,lo,'p','Missing: '+', '.join(m[0] for m in miss),'Es fehlen: '+', '.join(m[1] for m in miss)])
    elif n<20: cities.append([p['name'],la,lo,'n'])
    elif l/n>=.5: cities.append([p['name'],la,lo,'l'])
    else: cities.append([p['name'],la,lo,'t'])
eu['publit']=cities
print('cities',len(cities),collections.Counter(c[3] for c in cities))
# ---------- home.json: small file for the map on the start page ----------
home=dict(date=eu['date'],countries=[],cities=cities)
for iso,c in sorted(countries.items()):
    d=path(c['geom'],1.5,0)
    if not d: continue
    home['countries'].append([iso,c['en'],c['de'],eu_rec[iso].get('cat','') if c['eu'] else '',eu_rec[iso].get('stops',0) if c['eu'] else 0,d,[round(v) for v in pb(c['geom'])]])
json.dump(home,open(f'{OUT}/home.json','w'),ensure_ascii=False,separators=(',',':'))
print('home.json',os.path.getsize(f'{OUT}/home.json'))
json.dump(eu,open(f'{OUT}/europe.json','w'),ensure_ascii=False,separators=(',',':'))
print('ok')
