# Steam Wrapped Backend

Node.js + Express server that fetches Steam data for the frontend. See [API.md](API.md) for every route, response shape, and error code.

## Getting Started

```bash
npm install
```

Create a `.env` file in this folder (it's git-ignored, never commit it):

```
STEAM_API_KEY=your_key_here
```

Run the development server (restarts automatically when you edit a file):

```bash
npm run dev
```

The server runs on [http://localhost:3001](http://localhost:3001) by default, so it doesn't clash with the Next.js frontend on 3000. Set `PORT` to change it.

To run without watch mode or a `.env` file (this is what Railway uses):

```bash
npm start
```

## Health Check

```bash
curl http://localhost:3001/health
```

```json
{ "status": "ok", "hasKey": true }
```

`hasKey: false` means `STEAM_API_KEY` isn't set.

## Test Page

Open [http://localhost:3001](http://localhost:3001) for a minimal profile search page, useful for checking the backend without running the frontend.
