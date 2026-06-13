const express = require('express');
const axios = require('axios');
const router = express.Router();
const cache = require('../utils/cache');
const { generatePrediction } = require('../utils/predictionEngine');

const AV_KEY = process.env.ALPHA_VANTAGE_KEY;
const NEWS_KEY = process.env.NEWS_API_KEY;

router.get('/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const cacheKey = `pred_${ticker}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const [rsiRes, macdRes, dailyRes, stRes, newsRes] = await Promise.allSettled([
      axios.get(`https://www.alphavantage.co/query?function=RSI&symbol=${ticker}&interval=daily&time_period=14&series_type=close&apikey=${AV_KEY}`),
      axios.get(`https://www.alphavantage.co/query?function=MACD&symbol=${ticker}&interval=daily&series_type=close&apikey=${AV_KEY}`),
      axios.get(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${AV_KEY}`),
      axios.get(`https://api.stocktwits.com/api/2/streams/symbol/${ticker}.json`, { headers: { 'User-Agent': 'MarketPulseAI/1.0' }, timeout: 8000 }),
      axios.get(`https://newsapi.org/v2/everything?q=${ticker}&sortBy=publishedAt&pageSize=5&language=en&apiKey=${NEWS_KEY}`)
    ]);

    // RSI
    let rsi = null;
    if (rsiRes.status === 'fulfilled') {
      const d = rsiRes.value.data['Technical Analysis: RSI'];
      if (d) rsi = parseFloat(Object.values(d)[0]?.RSI);
    }

    // MACD signal
    let macdSignal = 'neutral';
    if (macdRes.status === 'fulfilled') {
      const d = macdRes.value.data['Technical Analysis: MACD'];
      if (d) {
        const entries = Object.entries(d);
        if (entries.length >= 2) {
          const latestDiff = parseFloat(entries[0][1].MACD) - parseFloat(entries[0][1].MACD_Signal);
          const prevDiff = parseFloat(entries[1][1].MACD) - parseFloat(entries[1][1].MACD_Signal);
          if (latestDiff > 0 && prevDiff <= 0) macdSignal = 'bullish_crossover';
          else if (latestDiff < 0 && prevDiff >= 0) macdSignal = 'bearish_crossover';
          else macdSignal = latestDiff > 0 ? 'bullish' : 'bearish';
        }
      }
    }

    // Volume ratio + 5d trend
    let volumeRatio = null;
    let priceTrend5d = null;
    if (dailyRes.status === 'fulfilled') {
      const ts = dailyRes.value.data['Time Series (Daily)'];
      if (ts) {
        const entries = Object.entries(ts).slice(0, 30);
        const volumes = entries.map(e => parseInt(e[1]['5. volume']));
        const avgVol = volumes.slice(1, 31).reduce((a, b) => a + b, 0) / volumes.length;
        volumeRatio = volumes[0] / avgVol;
        if (entries.length >= 6) {
          const latest = parseFloat(entries[0][1]['4. close']);
          const fiveDaysAgo = parseFloat(entries[5][1]['4. close']);
          priceTrend5d = ((latest - fiveDaysAgo) / fiveDaysAgo) * 100;
        }
      }
    }

    // StockTwits sentiment
    let stockTwitsSentiment = null;
    if (stRes.status === 'fulfilled') {
      const msgs = stRes.value.data.messages || [];
      const tagged = msgs.filter(m => m.entities?.sentiment?.basic);
      const bullish = msgs.filter(m => m.entities?.sentiment?.basic === 'Bullish').length;
      const bearish = msgs.filter(m => m.entities?.sentiment?.basic === 'Bearish').length;
      const total = tagged.length || 1;
      stockTwitsSentiment = Math.round(((bullish - bearish) / total) * 50 + 50);
    }

    // News sentiment
    let newsSentiment = null;
    if (newsRes.status === 'fulfilled') {
      const { scoreText } = require('../utils/sentimentScorer');
      const articles = newsRes.value.data.articles || [];
      if (articles.length > 0) {
        const scores = articles.map(a => scoreText(`${a.title} ${a.description || ''}`).score);
        newsSentiment = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      }
    }

    const prediction = generatePrediction({ rsi, macdSignal, volumeRatio, priceTrend5d, stockTwitsSentiment, newsSentiment });
    cache.set(cacheKey, prediction, 300);
    res.json(prediction);
  } catch (err) {
    res.status(500).json({ error: 'Prediction failed', details: err.message });
  }
});

module.exports = router;
