const express = require('express');
const axios = require('axios');
const router = express.Router();
const cache = require('../utils/cache');
const { scoreText } = require('../utils/sentimentScorer');

const NEWS_KEY = process.env.NEWS_API_KEY;

router.get('/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const cacheKey = `news_${ticker}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const { data } = await axios.get(
      `https://newsapi.org/v2/everything?q=${ticker}&sortBy=publishedAt&pageSize=10&language=en&apiKey=${NEWS_KEY}`
    );

    const articles = (data.articles || []).map(a => {
      const textToScore = `${a.title} ${a.description || ''}`;
      const sentiment = scoreText(textToScore);
      return {
        title: a.title,
        description: a.description,
        source: a.source?.name || 'Unknown',
        url: a.url,
        publishedAt: a.publishedAt,
        sentiment: sentiment.label,
        sentimentScore: sentiment.score
      };
    });

    const avgScore = articles.length
      ? Math.round(articles.reduce((sum, a) => sum + a.sentimentScore, 0) / articles.length)
      : 50;

    const result = {
      ticker,
      articles,
      overallScore: avgScore,
      overallLabel: avgScore > 60 ? 'Positive' : avgScore < 40 ? 'Negative' : 'Neutral'
    };

    cache.set(cacheKey, result, 300);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch news', details: err.message });
  }
});

module.exports = router;
