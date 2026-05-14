# CASES — Project Memo

CS:GO-style multiplayer case-opening game with extras (Blackjack, Plinko, Roulette, Buckshot Roulette, Bitcoin trading, horse racing, daily login bonus, Wheel of Fortune, weather for Sollentuna).

This README is **Claude's memo across sessions**. If you (Claude) are reading this in a future session, read it before making changes.

## Repos & deployment

- **Frontend**: `Good-player/gameopenersigmaboy` → `good-player.github.io/gameopenersigmaboy` (auto-deploys on push)
- **Main backend**: `Good-player/samptonweb.dpdns.org` → `samptonweb.dpdns.org` (deploy with `npx wrangler deploy`)
- **Light backend**: `Good-player/samptonweb.but.litre` → `samptonweb.wat-the-heck-lol12.workers.dev` (mirror of main, different D1)

GitHub token: (stored in conversation context — not in repo)

**Real game HTML is `index2.html`**. NOT index3.html.

D1 bindings:
- Main: `7882705d-5298-41b5-8b6e-92e5d4d398cd` ("case-opener-db")
- Light: `e47a28a9-1a24-441e-b61b-c2d459871100` ("caseopen")

## Frontend files

- `index2.html` — HTML shell, loads React + babel-standalone + i18n.js + app.js
- `i18n.js` — `window.I18N` with `t(key, vars)`, `setLang(lang)`, `getLang()`. EN + SV
- `app.js` — All React/JSX
- `styles.css` — base body styles
- `sound/caseselect.mp3` — tick sound

## User preferences (durable)

- Direct, blunt feedback expected. Push back on vague specs.
- Use `str_replace` for edits, never full rewrites.
- Verify with `node --check` after JS changes; check brace depth.
- Never add unrequested features.
- **Play-time restriction was REMOVED. Do NOT re-add it.**
- Real game HTML is `index2.html`.
- School slug: `sollentuna-international-school`

## Common gotchas (memo of things I broke)

1. **Owner panel JS string has 5 levels of escaping.** Inline `onclick=` needs `\\\\"` (4 backslashes + quote). Never `\"`. Never `\\\"`. If you use 2 backslashes the whole panel script aborts.

2. **`useState`/`useRef` are not hoisted.** Place new `useEffect`s AFTER state declarations (line ~165). Otherwise `ReferenceError: Cannot access X before initialization` → blank screen.

3. **DM and chat polling: incremental.** When `newMsgs.length === 0`, DO NOT replace existing state. If you wipe `chatLog` to `[]` on empty polls, chat appears to flicker / disappear.

4. **Material Icons font**: now **Material Symbols Rounded**, not legacy. Class is `material-symbols-rounded`.

5. **Cloudflare Worker uncaught exception → no CORS headers** → browser shows "CORS Missing Allow Origin". ALWAYS wrap new endpoints in try/catch.

6. **Cloud save table is `slots`**, not `cloud_saves`. Columns: `username, slot_num, data, updated_at`. Got this wrong once and caused a 500.

7. **Skolmaten.se API** requires a client-token we don't have. Use the RSS endpoint at `/<slug>/rss/weeks?limit=N`.

8. **met.no requires a User-Agent header.**

9. **D1 doesn't have persistent in-memory state**. Use D1 for everything shared.

10. **Lobby `state` column** is freeform JSON TEXT used by buckshot. Parse with try/catch.

## API references

- BTC price: Coinbase → CoinGecko → FreeCryptoAPI (`Bearer nhkgc50hbhxaliadlg34`)
- BTC history: Alpha Vantage `DIGITAL_CURRENCY_DAILY` (key `67BZZH91984X64MJ`)
- Weather: `api.met.no/weatherapi/locationforecast/2.0/complete` + `sunrise/3.0/sun`
- SMHI warnings: `opendata-download-warnings.smhi.se/ibww/api/version/1/warning.json`
- Pollen: `api.pollenrapporten.se/v1/`
- Air quality: `air-quality-api.open-meteo.com/v1/air-quality`
- School menu: `skolmaten.se/<slug>/rss/weeks?limit=N`

## Things removed (don't re-add)

- Play time restriction (Mon-Thu 08:00-15:00, Fri 08:00-14:00 Stockholm)
- School lunch menu tab
- Report button on "Me" tab (session 28)
- Earthquake sim: per-station distance rings, animated SVG `<animate>` EEW, auto-deleting X markers, stacked top-toolbar, separate EEW panel

## Tab keys (page state)

`shop, inv, stats, loan, flip, pvp, live, lb, chat, dm, me, map, horse, bj, btc, plinko, roulette, wheel, school` (key is `school` for Weather, legacy), `faq`

## Owner / admin

- Owner username: `awdsgaga`, password: `Gonglili1975`
- Owner panel: type `owner('password')` in console
- Admin panel: type `admin('password')`

## Session log (newest first)

- 28: User status (online/away/offline), loan v2 with online-time tracking, wheel quick Sell/Spin Again, removed Me-tab report, language file expansion, addiction effects (balance ticker, big-win flash, particles)
- 27: Buckshot Roulette in PvP, ban check tightened, slots-table fix
- 26: Removed play hours, removed lunch, i18n.js created, language toggle in header, FAQ page
- 25: Daily bonus, Wheel of Fortune, Material Symbols font fix, BTC clock-aligned refresh, chat empty-on-load fix, DM incremental, school+weather+pollen+SMHI+air quality
