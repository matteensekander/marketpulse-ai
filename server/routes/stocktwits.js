const express = require('express');
const axios = require('axios');
const router = express.Router();
const cache = require('../utils/cache');
const { scoreStockTwits } = require('../utils/sentimentScorer');

// GET /api/stocktwits/:ticker — live posts + sentiment
router.get('/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const cacheKey = `st_${ticker}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const { data } = await axios.get(
      `https://api.stocktwits.com/api/2/streams/symbol/${ticker}.json`,
      { headers: { 'User-Agent': 'MarketPulseAI/1.0' }, timeout: 8000 }
    );

    const messages = (data.messages || []).map(m => ({
      id: m.id,
      body: m.body,
      createdAt: m.created_at,
      username: m.user?.username || 'Anonymous',
      avatar: m.user?.avatar_url || null,
      sentiment: m.entities?.sentiment?.basic || null,
      likes: m.likes?.total || 0,
      url: `https://stocktwits.com/${m.user?.username}/message/${m.id}`
    }));

    const sentimentData = scoreStockTwits(data.messages || []);

    const result = { ticker, messages, sentiment: sentimentData };
    cache.set(cacheKey, result, 180); // 3 min cache
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch StockTwits data', details: err.message });
  }
});

// GET /api/stocktwits/market/trending — trending tickers
router.get('/market/trending', async (req, res) => {
  const cacheKey = 'st_trending';
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const { data } = await axios.get(
      'https://api.stocktwits.com/api/2/trending/symbols.json',
      { headers: { 'User-Agent': 'MarketPulseAI/1.0' }, timeout: 8000 }
    );
    const symbols = (data.symbols || []).slice(0, 10).map(s => ({
      ticker: s.symbol,
      name: s.title,
      watchlistCount: s.watchlist_count
    }));
    cache.set(cacheKey, symbols, 300);
    res.json(symbols);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trending', details: err.message });
  }
});

module.exports = router;
