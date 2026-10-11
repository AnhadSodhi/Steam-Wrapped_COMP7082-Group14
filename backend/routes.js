// routes.js — Express routes for search + profile stats
// Mount with: app.use('/api', require('./routes'));

const express = require('express');
const steam = require('./steam');

const router = express.Router();

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: err.message, code: err.code || 'ERROR' });
  });

// GET /api/search?q=<vanity | steamid64 | profile url>
// → lightweight profile card for the search results UI
router.get('/search', wrap(async (req, res) => {
  const steamid = await steam.resolveSteamId(req.query.q);
  const profile = await steam.getPlayerSummary(steamid);
  res.json(profile);
}));

// GET /api/profile/:steamid?from=2026-01-01&to=2026-12-31&top=10
// → full stats payload (also what a shared link /u/:steamid would fetch)
router.get('/profile/:steamid', wrap(async (req, res) => {
  const { steamid } = req.params;
  if (!/^\d{17}$/.test(steamid)) {
    return res.status(400).json({ error: 'Invalid SteamID64', code: 'BAD_INPUT' });
  }
  const stats = await steam.getProfileStats(steamid, {
    from: req.query.from,
    to: req.query.to,
    top: Math.min(parseInt(req.query.top, 10) || 10, 50),
  });
  res.set('Cache-Control', 'public, max-age=300');
  res.json(stats);
}));

module.exports = router;
