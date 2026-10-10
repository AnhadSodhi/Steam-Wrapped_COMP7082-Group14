# Steam Replay API

Backend for the Steam stats site. All responses are JSON.

**Base URL**
- Production: `https://<our-railway-domain>`
- Local: `http://localhost:3000`

Every route is a `GET`. No authentication is needed from the frontend; the Steam API key stays on the server.

---

## `GET /api/search`

Find a Steam profile. Use this for the player search box.

**Query parameters**

| Name | Required | Description |
|------|----------|-------------|
| `q`  | yes | A vanity name (`gabelogannewell`), a SteamID64 (`76561197960287930`), or a full profile URL (`https://steamcommunity.com/id/gabelogannewell/`) |

**Example**
```
GET /api/search?q=gabelogannewell
```

**Response `200`**
```json
{
  "steamid": "76561197960287930",
  "name": "Rabscuttle",
  "avatar": "https://avatars.steamstatic.com/..._full.jpg",
  "profileUrl": "https://steamcommunity.com/id/gabelogannewell/",
  "isPublic": true,
  "countryCode": "US",
  "createdAt": "2003-09-12T18:00:00.000Z"
}
```

| Field | Notes |
|-------|-------|
| `steamid` | Use this for every other call and in share links. Always a string (it's too large for a JS number). |
| `isPublic` | `false` means the profile is private. `/api/profile` will likely return `PRIVATE` for them. |
| `countryCode`, `createdAt` | Can be `null` if the user hides them. |

---

## `GET /api/profile/:steamid`

Full stats for one player. Use this for the stats page, the share-link page, and the card.

**Path parameter**: `steamid`, the 17-digit SteamID64 from `/api/search`.

**Query parameters (all optional)**

| Name | Description |
|------|-------------|
| `from` | Start date, `YYYY-MM-DD` |
| `to`   | End date, `YYYY-MM-DD` |
| `top`  | How many games in `topGames` / `recentGames` (default 10, max 50) |

> **Date range caveat:** for now, `from`/`to` only filter *which games were last played* in that window. Hours shown are still lifetime totals. Accurate hours-per-range is planned (requires daily snapshots), and the response shape won't change when it lands.

**Example**
```
GET /api/profile/76561197960287930?top=5
```

**Response `200`**
```json
{
  "profile": { "...same object as /api/search...": "" },
  "range": { "from": null, "to": null },
  "totals": {
    "gamesOwned": 412,
    "gamesPlayed": 198,
    "neverPlayed": 214,
    "hoursPlayed": 3120,
    "hoursLast2Weeks": 14
  },
  "topGames": [
    {
      "appid": 570,
      "name": "Dota 2",
      "minutesTotal": 52340,
      "minutes2Weeks": 300,
      "lastPlayed": "2026-10-08T22:14:00.000Z",
      "icon": "https://media.steampowered.com/.../icon.jpg",
      "header": "https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg",
      "hours": 872.3,
      "share": 0.279
    }
  ],
  "recentGames": [ "...games played in the last 2 weeks, sorted by minutes2Weeks..." ],
  "allPlayed":   [ "...every game with playtime, sorted by minutesTotal..." ]
}
```

| Field | Notes |
|-------|-------|
| `topGames` | Most played, highest first. `hours` is rounded to 1 decimal. `share` is the fraction (0–1) of the player's total playtime, handy for bar/pie charts. |
| `recentGames` | Same game shape, but without `hours`/`share`. Use `minutes2Weeks`. May be empty. |
| `allPlayed` | Same shape as `recentGames`. Use for full lists or search within a player's library. |
| `lastPlayed` | ISO date or `null` (Steam doesn't track this for very old playtime). |
| `icon` | Small square icon, can be `null`. |
| `header` | 460×215 banner image. A few old or delisted games have no banner, so handle image load errors. |
| Time units | Fields ending in `minutes…` are minutes; `hours…` are hours. |

Responses are cached for about 10 minutes, so very recent playtime may lag slightly.

---

## Errors

Every error returns JSON with a human-readable message and a stable `code` to switch on:

```json
{ "error": "This profile’s game details are private", "code": "PRIVATE" }
```

| Status | `code` | When | Suggested UI |
|--------|--------|------|--------------|
| 400 | `BAD_INPUT` | Empty search, or `:steamid` isn't 17 digits | "Enter a Steam name or profile link" |
| 403 | `PRIVATE` | Player's game details are private | "This player's games are private" + how to change Steam privacy |
| 404 | `NOT_FOUND` | No profile matches the search | "No Steam profile found" |
| 429 | `RATE_LIMITED` | Steam is throttling us | "Try again in a minute" |
| 502 | `STEAM_ERROR` | Steam API is down or errored | "Steam isn't responding, try again" |
| 500 | `ERROR` | Bug on our side | Generic error |

---

## Other

- `GET /health` returns `{ "ok": true, "hasKey": true }`. Use it to check the server is up.
- `GET /` serves a minimal search page for testing the backend. It is not the real frontend.

## Running locally

```bash
npm install
# create .env containing: STEAM_API_KEY=your_key
npm run dev
```

## Environment variables

| Name | Required | Description |
|------|----------|-------------|
| `STEAM_API_KEY` | yes | Steam Web API key |
| `ALLOWED_ORIGINS` | no | Comma-separated frontend URLs allowed to call the API, e.g. `https://our-site.up.railway.app,http://localhost:5173`. If unset, any origin is allowed. Set it before launch. |
| `PORT` | no | Set automatically by Railway; defaults to 3000 locally |
