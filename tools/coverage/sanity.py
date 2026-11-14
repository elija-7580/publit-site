# Guards the weekly update: a short outage of a Transitous source must not wipe countries off the map.
# Compares the new abdeckung/data/europe.json with the one on main (git HEAD).
import json, subprocess, sys
new = json.load(open('abdeckung/data/europe.json'))
try:
    old = json.loads(subprocess.run(['git', 'show', 'HEAD:abdeckung/data/europe.json'], capture_output=True, check=True).stdout)
except Exception:
    print('no previous data, skipping comparison'); sys.exit(0)
stops = lambda d: {c['iso']: c.get('stops', 0) for c in d['countries'] if c.get('eu')}
o, n = stops(old), stops(new)
lost = [iso for iso, s in o.items() if s >= 1000 and n.get(iso, 0) < s * 0.5]
total_o, total_n = sum(o.values()), sum(n.values())
print(f'stops {total_o} -> {total_n}; countries with data {sum(1 for v in o.values() if v)} -> {sum(1 for v in n.values() if v)}')
if lost:
    sys.exit('Lost more than half the stops in: ' + ', '.join(sorted(lost)))
if total_n < total_o * 0.8:
    sys.exit('Total stops dropped by more than 20 %')
atlas = open('abdeckung/data/atlas.txt').read()
assert atlas.startswith('D|') and atlas.count('\nA|') > 10, 'atlas.txt looks broken'
print('ok')
