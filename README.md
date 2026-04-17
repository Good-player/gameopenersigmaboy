# CASES - Multiplayer Case Opener Game

## Project Overview

A CS:GO-style case opening game with multiplayer features, built on Cloudflare Workers + D1 database. Single-page React app served as static HTML from GitHub Pages.

## Architecture

### Three Deployments

| Repo | Purpose | URL | D1 Database |
|------|---------|-----|-------------|
| `Good-player/samptonweb.dpdns.org` | Main backend (heavy endpoints) | `samptonweb.dpdns.org` | `case-opener-db` (`7882705d-5298-41b5-8b6e-92e5d4d398cd`) |
| `Good-player/samptonweb.but.litre` | Light backend (BTC price proxy) | `samptonweb.wat-the-heck-lol12.workers.dev` | `caseopen` (`e47a28a9-1a24-441e-b61b-c2d459871100`) |
| `Good-player/gameopenersigmaboy` | Frontend (index.html) | `good-player.github.io/gameopenersigmaboy` | — |

**Why split?** The main worker's CPU time was exploding because the DM inbox endpoint takes ~200ms per call. Splitting lets BTC price polling (hit frequently) go to a separate worker that doesn't touch the main D1 at all.

**Current light-server endpoints:** only `/btc/price` and `/btc/history` (external API proxies, no D1 needed). Everything else stays on main because the data lives in the main D1.

### File Structure

```
samptonweb.dpdns.org/    (and samptonweb.but.litre)
├── worker.js            # Single-file Cloudflare Worker, ~2000 lines
├── wrangler.jsonc       # Cloudflare deployment config
└── package.json         # wrangler dependency

gameopenersigmaboy/
└── index.html           # Single-file React app, ~1100 lines, uses babel-standalone in-browser
```

## Key Features

### Case Opening
- 14 cases from $30 (Scrap Box) to $50M (Epstein Island)
- 8 rarities: consumer, industrial, milspec, restricted, classified, covert, chroma, legendary
- Single open + x10 open (x10 disabled on Epstein case)
- 3D-ish horizontal scrolling reveal animation (~5 seconds)

### Blackjack (D1-backed multiplayer)
- $10K min bet, 5 players max
- Requires one-time $50K "Blackjack Card" purchase to play (spectating is free)
- Full 52-card dealing with suit colors
- HIT / STAND / DOUBLE actions
- Dealer stands on 17, blackjack pays 1.5x
- **Single global table** ("main") - shared across all players
- **State stored in D1** via `config` table key `bj_main` (JSON blob) - no in-memory state because Workers are stateless
- Client polls `/bj/state` every 1 second
- Auto-starts 20 seconds after first player joins (or instantly at 5 players)

### Bitcoin Investment
- Real-time BTC price from Coinbase API (cached 30s)
- SVG chart with 1D/7D/30D/90D timeframes
- Buy with game money at current price, sell anytime
- P&L tracked in `investments` D1 table, persists while offline
- Falls back to CoinGecko if Coinbase fails, then to $87K fixed if both fail

### Plinko (Physics-based)
- Canvas-rendered with actual ball physics (gravity + peg collisions)
- 8/10/12/14/16 row configurations
- 3 risk levels (low/medium/high) with different multiplier distributions
- Server validates outcome (client predicts path visually)
- Bet range: $100 - $1M

### Roulette (European single-zero)
- Canvas spinning wheel animation (4s ease-out, 5 rotations + landing)
- Multiple simultaneous bets (red/black, even/odd, low/high, dozens, numbers)
- 2x payout for colors/even-odd/halves, 3x for dozens, 36x for straight number
- Min $100, max $5M total

### Horse Racing
- 7 horses, 3 laps, smooth rAF animation on canvas oval track
- 20s race duration with live leaderboard

### Multiplayer PvP
- Lobbies with profit race mode
- Real-time chat within lobbies

### Social
- Friends system with requests
- DMs with gift money feature
- Global chat (200 char limit, 5s cooldown)
- Live feed of big opens
- Leaderboard (30 top earners, with BAN/DEL tags for moderated accounts)
- Profiles with bio, pfp, privacy settings

### Economy
- Dynamic rent: $200 flat if under $1M, 1% if $1M-$1B, 2% if over $1B
- Loans with credit score system (0-1000, 5 tiers)
- Credit score < 10 triggers account reset
- Multi-slot save (3 slots per browser/account)

## Critical Technical Details

### State Management
- **Local**: `localStorage` with keys `co-s0`, `co-s1`, `co-s2` (one per slot)
- **Cloud**: D1 `slots` table, synced via cloud save/load buttons
- **Auto-save**: Every 5s to localStorage (with sync lock to prevent overwriting force-synced data)
- **Cloud sync**: Every 30s background upload

### Offline Detection
Monitors actual network failures, not HTTP errors:
```js
try { resp = await fetch(...) } catch(e) { setOffline(true); return null; }
setOnline(true);
try { return await resp.json() } catch { return null; }  // Bad JSON, still online
```
HTTP 4xx/5xx return a Response (don't throw) — only `TypeError: Failed to fetch` triggers offline.

### Chat (Incremental Loading)
- First load: `GET /chatlog` returns all 50 messages with pfps
- Every 6s poll: `GET /chatlog?after=<lastId>` returns only new messages
- Client merges by ID, caps at 200 in memory
- After sending: incremental fetch picks up own message

### Worker Stateless Issue
**The #1 bug pattern**: in-memory JavaScript variables reset between Worker isolates. Player A hits isolate X, Player B hits isolate Y — they never see each other's state. Fix: always use D1 for shared state.

Applied to:
- Blackjack table → D1 `config` row
- BJ cards → D1 `bj_cards` table
- BTC price → D1 `config` fallback (currently uses in-memory + 30s cache; acceptable because price changes slowly)

### Auto-Warning Bot
Server-side monitors 8 patterns with 5min cooldowns:
- `gift_frequent` - 5+ gifts per hour
- `bet` - >$3M on horse or >$1M on BJ
- `rapid_open` - 30+ cases quickly
- `login_multi_ip` - 3+ distinct IPs
- `new_rich` - new account (<1hr) with $10M+ earned
- `chat_spam` - 8+ messages in 30s
- `dm_spam` - mass DMs
- `gift_pattern` - repeated gifts to same user (laundering)

All logged to `admin_logs` table (no cap, visible in owner panel Logs tab).

### Play Time Restrictions (Stockholm timezone)
- Mon-Thu: 08:00-15:00
- Fri: 08:00-14:00
- Sat-Sun: unlimited
- Owner/admin accounts bypass
- Checks every 30s client-side

### Owner Panel
Tabs: Stats, Players, Chat, Bans, Alts, Tools, Events, Reports, Lobbies, DMs, Flips, Friends, Gifts, Horses, Lookup, Logs

Access: Password-protected overlay activated via console `owner("password")` or Owner button.
Admin panel: `admin("password")` - subset of owner features.

Every owner/admin login logged (`owner_login`, `admin_login` entries in `admin_logs`).

### Events / Broadcasts
10 types: announcement, event, sale (% discount on cases), maintenance, update, warning, takeover (bg image), rain (money emojis), brainrot, jumpscare, luck (boosts roll probabilities).

- Sale: discount applied on client (visual) + server (validated in `/roll`)
- Luck: shifts roll probabilities toward rarer items; in x10 enables tiny legendary chance
- Events polled every 6s, expired ones auto-deactivated server-side

### Reports
- 8 preset categories + custom reason (max 200 chars)
- Shows message content being reported
- Evidence stored as `msg:<id> ch:<channel>`
- Owner sees full context with ban/resolve/dismiss buttons
- Users can view own report history (sent + received) via `/reports/mine`

## Deployment

### Frontend (index.html)
Push to `gameopenersigmaboy` repo. GitHub Pages serves it automatically.

### Backend (worker.js)
```bash
cd samptonweb.dpdns.org
npx wrangler deploy
```
Same for `samptonweb.but.litre` (uses its own D1 database ID in wrangler.jsonc).

### Database Setup
Run on each D1 database:
```sql
-- All the CREATE TABLE statements in db-setup.sql
-- Key tables: accounts, chat, feed, slots, events, reports, bj_cards, 
-- investments, admin_logs, friends, dms, gift_logs, config, bans
```

## Known Limitations

1. **Workers can't use setTimeout for long delays** — all timed events (BJ round start, intermission transitions) are deadline-based, checked on each poll
2. **CoinGecko rate limits** the free API — Coinbase used as primary, CoinGecko as fallback
3. **Babel in-browser** means slower initial load; compile step would speed this up but breaks the "deploy HTML to GitHub Pages" simplicity
4. **No ad system** — per user preference
5. **Single global BJ table** by design (simpler, more social)

## Development Tips

- Always validate with `node --check worker.js` after edits
- Always verify `@babel/standalone` transform of the script block in index.html
- Check that `export default { ... }` in worker.js has balanced braces (depth should end at 0)
- When adding new D1 columns, use `try/catch` with fallback query for graceful degradation during migration
- When adding new tables, use `CREATE TABLE IF NOT EXISTS` in the endpoint itself as a self-healing safety net

## Credits

Built iteratively. Lots of state bugs fixed along the way. The number one lesson: **Cloudflare Workers are stateless, use D1 for anything shared between users**.
