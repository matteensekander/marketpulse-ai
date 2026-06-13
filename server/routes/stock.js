const express = require('express');
const axios = require('axios');
const router = express.Router();
const cache = require('../utils/cache');
const { getMarketStatus } = require('../utils/marketHours');

const AV_KEY = process.env.ALPHA_VANTAGE_KEY;
const FH_KEY = process.env.FINNHUB_KEY;

// GET /api/stock/:ticker — quote data
router.get('/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const cacheKey = `stock_${ticker}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const [quoteRes, overviewRes] = await Promise.allSettled([
      axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${AV_KEY}`),
      axios.get(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${AV_KEY}`)
    ]);

    const quote = quoteRes.status === 'fulfilled' ? quoteRes.value.data['Global Quote'] : {};
    const overview = overviewRes.status === 'fulfilled' ? overviewRes.value.data : {};

    const data = {
      ticker,
      price: parseFloat(quote['05. price']) || 0,
      change: parseFloat(quote['09. change']) || 0,
      changePercent: quote['10. change percent']?.replace('%', '') || '0',
      volume: parseInt(quote['06. volume']) || 0,
      high: parseFloat(quote['03. high']) || 0,
      low: parseFloat(quote['04. low']) || 0,
      open: parseFloat(quote['02. open']) || 0,
      prevClose: parseFloat(quote['08. previous close']) || 0,
      marketCap: overview['MarketCapitalization'] || 'N/A',
      sector: overview['Sector'] || 'N/A',
      industry: overview['Industry'] || 'N/A',
      companyName: overview['Name'] || ticker,
      description: overview['Description'] || '',
      peRatio: overview['PERatio'] || 'N/A',
      eps: overview['EPS'] || 'N/A',
      week52High: overview['52WeekHigh'] || 'N/A',
      week52Low: overview['52WeekLow'] || 'N/A',
      marketStatus: getMarketStatus()
    };

    cache.set(cacheKey, data, 60);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stock data', details: err.message });
  }
});

// GET /api/stock/chart/:ticker/:period
router.get('/chart/:ticker/:period', async (req, res) => {
  const { ticker, period } = req.params;
  const sym = ticker.toUpperCase();
  const cacheKey = `chart_${sym}_${period}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    let url, parser;

    if (period === '1d' || period === '1w') {
      url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${sym}&interval=60min&outputsize=full&apikey=${AV_KEY}`;
      parser = (data) => {
        const ts = data['Time Series (60min)'] || {};
        const limit = period === '1d' ? 7 : 40;
        return Object.entries(ts).slice(0, limit).reverse().map(([time, v]) => ({
          time, open: parseFloat(v['1. open']), high: parseFloat(v['2. high']),
          low: parseFloat(v['3. low']), close: parseFloat(v['4. close']), volume: parseInt(v['5. volume'])
        }));
      };
    } else {
      const outputsize = (period === '1m') ? 'compact' : 'full';
      url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${sym}&outputsize=${outputsize}&apikey=${AV_KEY}`;
      parser = (data) => {
        const ts = data['Time Series (Daily)'] || {};
        const limits = { '1m': 22, '3m': 66, '1y': 252 };
        const limit = limits[period] || 252;
        return Object.entries(ts).slice(0, limit).reverse().map(([time, v]) => ({
          time, open: parseFloat(v['1. open']), high: parseFloat(v['2. high']),
          low: parseFloat(v['3. low']), close: parseFloat(v['4. close']), volume: parseInt(v['5. volume'])
        }));
      };
    }

    const { data } = await axios.get(url);
    const chartData = parser(data);
    cache.set(cacheKey, chartData, 300);
    res.json(chartData);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chart data', details: err.message });
  }
});

// GET /api/stock/indicators/:ticker
router.get('/indicators/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const cacheKey = `indicators_${ticker}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const [rsiRes, macdRes, sma50Res, sma200Res] = await Promise.allSettled([
      axios.get(`https://www.alphavantage.co/query?function=RSI&symbol=${ticker}&interval=daily&time_period=14&series_type=close&apikey=${AV_KEY}`),
      axios.get(`https://www.alphavantage.co/query?function=MACD&symbol=${ticker}&interval=daily&series_type=close&apikey=${AV_KEY}`),
      axios.get(`https://www.alphavantage.co/query?function=SMA&symbol=${ticker}&interval=daily&time_period=50&series_type=close&apikey=${AV_KEY}`),
      axios.get(`https://www.alphavantage.co/query?function=SMA&symbol=${ticker}&interval=daily&time_period=200&series_type=close&apikey=${AV_KEY}`)
    ]);

    const getRSI = () => {
      if (rsiRes.status !== 'fulfilled') return null;
      const d = rsiRes.value.data['Technical Analysis: RSI'];
      if (!d) return null;
      return parseFloat(Object.values(d)[0]?.RSI);
    };

    const getMACDSignal = () => {
      if (macdRes.status !== 'fulfilled') return 'neutral';
      const d = macdRes.value.data['Technical Analysis: MACD'];
      if (!d) return 'neutral';
      const entries = Object.entries(d);
      if (entries.length < 2) return 'neutral';
      const latest = entries[0][1];
      const prev = entries[1][1];
      const latestDiff = parseFloat(latest.MACD) - parseFloat(latest.MACD_Signal);
      const prevDiff = parseFloat(prev.MACD) - parseFloat(prev.MACD_Signal);
      if (latestDiff > 0 && prevDiff <= 0) return 'bullish_crossover';
      if (latestDiff < 0 && prevDiff >= 0) return 'bearish_crossover';
      return latestDiff > 0 ? 'bullish' : 'bearish';
    };

    const getSMA = (result) => {
      if (result.status !== 'fulfilled') return null;
      const d = result.value.data['Technical Analysis: SMA'];
      if (!d) return null;
      return parseFloat(Object.values(d)[0]?.SMA);
    };

    const data = {
      rsi: getRSI(),
      macdSignal: getMACDSignal(),
      sma50: getSMA(sma50Res),
      sma200: getSMA(sma200Res)
    };

    cache.set(cacheKey, data, 300);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch indicators', details: err.message });
  }
});

// GET /api/stock/market/movers
router.get('/market/movers', async (req, res) => {
  const cacheKey = 'movers';
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const { data } = await axios.get(`https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${AV_KEY}`);
    const result = {
      gainers: (data.top_gainers || []).slice(0, 5),
      losers: (data.top_losers || []).slice(0, 5),
      mostActive: (data.most_actively_traded || []).slice(0, 5)
    };
    cache.set(cacheKey, result, 300);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch movers', details: err.message });
  }
});

module.exports = router;
