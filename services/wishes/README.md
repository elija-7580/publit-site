# Wünsche (publit.eu/wuensche)

Feature requests with voting, without accounts. `wishes.py` is a small HTTP service
(Python 3 standard library and SQLite only) that Caddy proxies at `/api/wishes`.
The page is `wuensche/index.html`.

## Install on the server

```sh
sudo useradd --system --no-create-home publit-wishes
sudo mkdir -p /opt/publit-wishes && sudo cp wishes.py /opt/publit-wishes/
sudo cp publit-wishes.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now publit-wishes
curl -s http://127.0.0.1:8787/api/wishes/health        # {"ok": true}
```

Add `Caddyfile.snippet` to the publit.eu site block, then `sudo systemctl reload caddy`.
Check: `curl -s https://publit.eu/api/wishes/health`.

## Moderation

```sh
sudo -u publit-wishes python3 /opt/publit-wishes/wishes.py --db /var/lib/publit-wishes/wishes.db list
... hide <id> | show <id> | delete <id> | status <id> open|planned|doing|done
```

## Privacy and abuse

No accounts, no cookies, no IP addresses stored. The browser keeps a random voter id in
localStorage. To limit posting (3 per hour) and voting (60 per hour), the address is hashed
with a salt that lives only in memory and changes every day. A hidden form field catches
simple bots; titles must be unique; at most two links per wish.

## Test

`python3 test_wishes.py`
