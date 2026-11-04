# Steam Replay API

Backend for the Steam stats site. All responses are JSON.

**Base URL**
- Production: `https://<our-railway-domain>`
- Local: `http://localhost:3001` (the Next.js frontend runs on 3000)

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

## `GET /api/achievements/:steamid`

Achievement summary across the player's **most-played games**. Use this for an achievements section on the dashboard or summary card.

**Query parameters (optional)**

| Name | Description |
|------|-------------|
| `top` | How many of the player's most-played games to check (default 10, max 25). Higher is slower the first time, since each game needs its own Steam requests. |

**Example**
```
GET /api/achievements/76561197960287930?top=10
```

**Response `200`**
```json
{
  "steamid": "76561197960287930",
  "gamesChecked": 10,
  "totals": {
    "gamesWithAchievements": 7,
    "unlocked": 312,
    "total": 540,
    "averageCompletion": 0.581,
    "perfectGames": 2
  },
  "games": [
    {
      "appid": 620,
      "name": "Portal 2",
      "header": "https://cdn.cloudflare.steamstatic.com/steam/apps/620/header.jpg",
      "icon": "https://media.steampowered.com/.../icon.jpg",
      "hours": 41.2,
      "unlocked": 51,
      "total": 51,
      "completion": 1,
      "perfect": true,
      "lastUnlockedAt": "2026-03-02T19:40:00.000Z"
    }
  ],
  "rarestUnlocked": [ "...up to 5 achievements (see shape below), rarest first, each with a game: { appid, name }..." ],
  "recentUnlocks":  [ "...up to 10 achievements, newest first, each with a game: { appid, name }..." ]
}
```

| Field | Notes |
|-------|-------|
| `gamesChecked` | How many games were looked at. Games without achievements are left out of `games`, so `games` can be shorter. |
| `totals` | Only counts the games in `games`, not the player's whole library. |
| `averageCompletion` / `completion` | Fraction from 0 to 1. Multiply by 100 for a percentage. |
| `games` | Sorted by completion, highest first. |
| `rarestUnlocked` | The player's unlocked achievements with the lowest `globalPercent`. Great for "your rarest achievement" on the summary card. |

---

## `GET /api/achievements/:steamid/:appid`

Every achievement in one game for one player, unlocked and locked. Use this for a per-game achievements view. The `appid` comes from any game object in the other responses.

**Example**
```
GET /api/achievements/76561197960287930/620
```

**Response `200`**
```json
{
  "appid": 620,
  "name": "Portal 2",
  "header": "https://cdn.cloudflare.steamstatic.com/steam/apps/620/header.jpg",
  "icon": "https://media.steampowered.com/.../icon.jpg",
  "minutesTotal": 2472,
  "hasAchievements": true,
  "total": 51,
  "unlocked": 30,
  "completion": 0.588,
  "achievements": [
    {
      "apiName": "ACH_WAKE_UP",
      "name": "Wake Up Call",
      "description": "Survive the manual override",
      "hidden": false,
      "unlocked": true,
      "unlockedAt": "2026-03-02T19:40:00.000Z",
      "globalPercent": 71.4,
      "icon": "https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/620/....jpg"
    }
  ]
}
```

| Field | Notes |
|-------|-------|
| `hasAchievements` | `false` (with `total: 0` and an empty list) for games that have no achievements. This is not an error. |
| `achievements` | Unlocked first (newest first), then locked (easiest first, by `globalPercent`). |
| `icon` | Colour icon if unlocked, grey version if locked. Can be `null`. |
| `globalPercent` | % of all Steam players who have this achievement. Lower is rarer. Can be `null`. |
| `hidden` | Steam marks some achievements secret. `description` is often empty for these; consider showing "Hidden achievement" while locked. |
| `unlockedAt` | ISO date, or `null` if locked. |

**Images:** achievement icons are served from Steam's CDN (often `cdn.akamai.steamstatic.com` or `steamcdn-a.akamaihd.net`). If you display them with Next.js `<Image>`, add those hostnames to `images.remotePatterns` in `next.config.ts`.

---

## Errors

Every error returns JSON with a human-readable message and a stable `code` to switch on:

```json
{ "error": "This profile’s game details are private", "code": "PRIVATE" }
```

| Status | `code` | When | Suggested UI |
|--------|--------|------|--------------|
| 400 | `BAD_INPUT` | Empty search, `:steamid` isn't 17 digits, or `:appid` isn't a number | "Enter a Steam name or profile link" |
| 403 | `PRIVATE` | Player's game details are private (applies to achievements too) | "This player's games are private" + how to change Steam privacy |
| 404 | `NOT_FOUND` | No profile matches the search | "No Steam profile found" |
| 429 | `RATE_LIMITED` | Steam is throttling us | "Try again in a minute" |
| 502 | `STEAM_ERROR` | Steam API is down or errored | "Steam isn't responding, try again" |
| 500 | `ERROR` | Bug on our side | Generic error |

---

## Other

- `GET /health` returns `{ "status": "ok", "hasKey": true }`. Use it to check the server is up.
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
| `ALLOWED_ORIGINS` | no | Comma-separated frontend URLs allowed to call the API, e.g. `https://our-site.up.railway.app,http://localhost:3000`. If unset, any origin is allowed. Set it before launch. |
| `PORT` | no | Set automatically by Railway; defaults to 3001 locally |
