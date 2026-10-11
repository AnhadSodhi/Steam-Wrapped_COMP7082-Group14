// server.js — entry point. Railway runs this via `npm start`.
const express = require('express');
const path = require('path');

const app = express();

// --- CORS: lets a frontend on a different URL call this API.
// ALLOWED_ORIGINS is a comma-separated list, e.g.
//   https://our-frontend.up.railway.app,http://localhost:5173
// If it's not set, any origin is allowed (fine while developing).
const allowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!allowed.length) {
    res.set('Access-Control-Allow-Origin', '*');
  } else if (origin && allowed.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
  }
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// API routes: /api/search and /api/profile/:steamid
app.use('/api', require('./routes'));

// Health check — confirms the server is up and the key is set
app.get('/health', (req, res) => res.json({ status: 'ok', hasKey: !!process.env.STEAM_API_KEY }));

// Minimal backend test page at the site root
app.use(express.static(path.join(__dirname, 'public')));

// Railway sets PORT automatically. Locally we use 3001 so it doesn't clash
// with the Next.js frontend, which runs on 3000.
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
