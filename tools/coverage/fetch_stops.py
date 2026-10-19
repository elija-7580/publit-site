import urllib.parse,json,struct,zlib,urllib.request,concurrent.futures as cf,os,csv,io,sys
EU='ge am ad al at ba be bg ch cy cz de dk ee es fi fr gb gr hr hu ie is it lt lu lv mc md me mk nl no pl pt ro rs se si sk tr ua xk eu'.split()
B='https://api.transitous.org/gtfs/'
def rng(url,a,b):
    r=urllib.request.Request(url,headers={'Range':f'bytes={a}-{b}','User-Agent':'publit-coverage/1.0'})
    with urllib.request.urlopen(r,timeout=60) as f: return f.read()
def size(url):
    r=urllib.request.Request(url,method='HEAD',headers={'User-Agent':'publit-coverage/1.0'})
    with urllib.request.urlopen(r,timeout=60) as f: return int(f.headers['Content-Length'])
def stops(fn):
    out=f'stops/{fn}.txt'
    if os.path.exists(out): return fn,'cached'
    url=B+urllib.parse.quote(fn); n=size(url)
    tail=rng(url,max(0,n-66000),n-1)
    i=tail.rfind(b'PK\x05\x06')
    cd_size,cd_off=struct.unpack('<II',tail[i+12:i+20])
    if cd_off==0xFFFFFFFF:  # zip64
        j=tail.rfind(b'PK\x06\x06'); cd_size,cd_off=struct.unpack('<QQ',tail[j+40:j+56])
    cd=rng(url,cd_off,cd_off+cd_size-1)
    p=0
    while p<len(cd) and cd[p:p+4]==b'PK\x01\x02':
        meth,=struct.unpack('<H',cd[p+10:p+12]); csz,usz=struct.unpack('<II',cd[p+20:p+28])
        nl,el,cl=struct.unpack('<HHH',cd[p+28:p+34]); lo,=struct.unpack('<I',cd[p+42:p+46])
        name=cd[p+46:p+46+nl].decode('utf-8','replace'); extra=cd[p+46+nl:p+46+nl+el]
        if csz==0xFFFFFFFF or lo==0xFFFFFFFF:
            q=0
            while q<len(extra):
                hid,hl=struct.unpack('<HH',extra[q:q+4]); body=extra[q+4:q+4+hl]
                if hid==1:
                    vals=list(struct.unpack('<'+'Q'*(hl//8),body[:hl//8*8])); k=0
                    if usz==0xFFFFFFFF: usz=vals[k]; k+=1
                    if csz==0xFFFFFFFF: csz=vals[k]; k+=1
                    if lo==0xFFFFFFFF: lo=vals[k]
                q+=4+hl
        if name.split('/')[-1]=='stops.txt':
            h=rng(url,lo,lo+29+65535+csz)
            ln,le=struct.unpack('<HH',h[26:30]); data=h[30+ln+le:30+ln+le+csz]
            raw=zlib.decompress(data,-15) if meth==8 else data
            rd=csv.DictReader(io.StringIO(raw.decode('utf-8-sig','replace')))
            pts=set()
            for r in rd:
                try: pts.add((round(float(r['stop_lat']),4),round(float(r['stop_lon']),4)))
                except Exception: pass
            with open(out,'w') as f: f.write('\n'.join(f'{a},{b}' for a,b in pts))
            return fn,len(pts)
        p+=46+nl+el+cl
    return fn,'no stops'
d=json.load(open('lic.json'))
fns=sorted({x['filename'] for x in d if x.get('filename','').split('_')[0] in EU})
print(len(fns),flush=True)
done=0
with cf.ThreadPoolExecutor(12) as ex:
    for fut in cf.as_completed([ex.submit(stops,f) for f in fns]):
        done+=1
        try: r=fut.result()
        except Exception as e: r=('ERR',str(e)[:80])
        if done%50==0 or r[0]=='ERR': print(done,r,flush=True)
print('fertig')
