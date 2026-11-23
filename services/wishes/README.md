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

Easier: set status (and, if needed, a cleaner title/body) in `wuensche/status.json` in this repo,
keyed by wish id. The website applies it right after deploy; the API applies it too, reading
https://publit.eu/wuensche/status.json (cached a minute; `--overlay` / `WISHES_OVERLAY` for a file
or another URL), so the apps see the same board.

Update the installed service in place (run on the server; finds the path the service uses):

```sh
f=$(systemctl show -p ExecStart --value publit-wishes | grep -o '/[^ ;]*wishes\.py' | head -1)
sudo curl -fsSL https://raw.githubusercontent.com/elija-7580/publit-site/main/services/wishes/wishes.py -o "$f"
sudo systemctl restart publit-wishes
```

## Privacy and abuse

No accounts, no cookies, no IP addresses stored. The browser keeps a random voter id in
localStorage. To limit posting (3 per hour) and voting (60 per hour), the address is hashed
with a salt that lives only in memory and changes every day. A hidden form field catches
simple bots; titles must be unique; at most two links per wish.

## Test

`python3 test_wishes.py`

## Automatic status

Nobody sets statuses by hand. `.github/workflows/wishes-sync.yml` runs every 30 minutes and
`tools/wishes_sync.py` derives each wish's status from its linked GitHub issues (issue links in the
wish text plus `wuensche/links.json`): label `released` → Done, closed as completed / label
`in progress` / open PR → In progress, label `planned` → Planned. Plain-language titles for the
features page live in `wuensche/overrides.json`.

## Wishes become GitHub issues

The same workflow files new wishes as issues in `elija-7580/Publit` (label `wish`) and writes the
link to `wuensche/links.json`, so their status follows the issue from then on. Spam stays out:
a wish is filed only when it has no issue yet, is still open, is at least 24 hours old (time to
`hide` it) and has at least 2 votes (the author's own plus one), at most 5 per run. Mentions
(`@name`) and `#123` references in the wish text are defused. Change the limits with the repository
variables `WISHES_ISSUE_MIN_VOTES` and `WISHES_ISSUE_MIN_HOURS`.

The token never reaches the wish server or the browser: it is an Actions secret of this repository.

1. GitHub → Settings → Developer settings → Fine-grained tokens → Generate new token.
   Repository access: only `elija-7580/Publit`; permissions: Issues → Read and write.
2. This repository → Settings → Secrets and variables → Actions → New repository secret
   `WISHES_ISSUE_TOKEN`.

Without the secret nothing is filed; status and roadmap still sync.

## Roadmap from GitHub issues

Give an issue in `elija-7580/Publit` or `elija-7580/Publit-Android` the label `roadmap` and it
appears on the board of publit.eu/features (open → Later, `planned` → Next, `in progress` / open PR /
closed as completed → In progress, `released` → Available), with a link to the issue. Issues a wish
already links to are shown through the wish instead. Optional labels: `area:plan|go|map|tix|dev|com`,
`ios` / `android` / `watch`. A German title goes into `wuensche/overrides.json` under
`"elija-7580/Publit#123": {"short": {"de": …, "en": …, "deX": …, "enX": …, "area": …}}`.
The wish list (publit.eu/wuensche) and the board link every wish to its issues.
