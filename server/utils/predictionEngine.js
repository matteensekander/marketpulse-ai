function generatePrediction({ rsi, macdSignal, volumeRatio, priceTrend5d, stockTwitsSentiment, newsSentiment }) {
  let score = 50;
  const signals = [];

  // RSI
  if (rsi !== null && rsi !== undefined) {
    if (rsi < 30) {
      score += 15;
      signals.push({ name: 'RSI', value: rsi.toFixed(1), impact: '+15', note: 'Oversold — potential bounce', direction: 'bullish' });
    } else if (rsi > 70) {
      score -= 15;
      signals.push({ name: 'RSI', value: rsi.toFixed(1), impact: '-15', note: 'Overbought — potential pullback', direction: 'bearish' });
    } else {
      signals.push({ name: 'RSI', value: rsi.toFixed(1), impact: '0', note: 'Neutral range', direction: 'neutral' });
    }
  }

  // MACD
  if (macdSignal) {
    if (macdSignal === 'bullish_crossover') {
      score += 20;
      signals.push({ name: 'MACD', value: 'Bullish Cross', impact: '+20', note: 'MACD crossed above signal line', direction: 'bullish' });
    } else if (macdSignal === 'bearish_crossover') {
      score -= 20;
      signals.push({ name: 'MACD', value: 'Bearish Cross', impact: '-20', note: 'MACD crossed below signal line', direction: 'bearish' });
    } else {
      signals.push({ name: 'MACD', value: 'Neutral', impact: '0', note: 'No crossover detected', direction: 'neutral' });
    }
  }

  // Volume multiplier
  let volumeMultiplier = 1;
  if (volumeRatio && volumeRatio > 1.5) {
    volumeMultiplier = 1.2;
    signals.push({ name: 'Volume', value: `${(volumeRatio * 100).toFixed(0)}% of avg`, impact: 'x1.2', note: 'High volume amplifies signals', direction: 'neutral' });
  } else {
    signals.push({ name: 'Volume', value: volumeRatio ? `${(volumeRatio * 100).toFixed(0)}% of avg` : 'N/A', impact: '0', note: 'Normal volume', direction: 'neutral' });
  }

  // Apply volume multiplier to score deviation
  const deviation = (score - 50) * volumeMultiplier;
  score = 50 + deviation;

  // 5-day price trend
  if (priceTrend5d !== null && priceTrend5d !== undefined) {
    if (priceTrend5d > 0) {
      score += 10;
      signals.push({ name: '5-Day Trend', value: `+${priceTrend5d.toFixed(2)}%`, impact: '+10', note: 'Positive short-term momentum', direction: 'bullish' });
    } else {
      score -= 10;
      signals.push({ name: '5-Day Trend', value: `${priceTrend5d.toFixed(2)}%`, impact: '-10', note: 'Negative short-term momentum', direction: 'bearish' });
    }
  }

  // StockTwits sentiment
  if (stockTwitsSentiment !== null && stockTwitsSentiment !== undefined) {
    if (stockTwitsSentiment > 60) {
      score += 12;
      signals.push({ name: 'StockTwits', value: `${stockTwitsSentiment}/100`, impact: '+12', note: 'Community is bullish', direction: 'bullish' });
    } else if (stockTwitsSentiment < 40) {
      score -= 12;
      signals.push({ name: 'StockTwits', value: `${stockTwitsSentiment}/100`, impact: '-12', note: 'Community is bearish', direction: 'bearish' });
    } else {
      signals.push({ name: 'StockTwits', value: `${stockTwitsSentiment}/100`, impact: '0', note: 'Community is mixed', direction: 'neutral' });
    }
  }

  // News sentiment
  if (newsSentiment !== null && newsSentiment !== undefined) {
    if (newsSentiment > 60) {
      score += 8;
      signals.push({ name: 'News', value: `${newsSentiment}/100`, impact: '+8', note: 'Positive news coverage', direction: 'bullish' });
    } else if (newsSentiment < 40) {
      score -= 8;
      signals.push({ name: 'News', value: `${newsSentiment}/100`, impact: '-8', note: 'Negative news coverage', direction: 'bearish' });
    } else {
      signals.push({ name: 'News', value: `${newsSentiment}/100`, impact: '0', note: 'Neutral news coverage', direction: 'neutral' });
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let direction, confidence, summary;
  if (score > 65) {
    direction = 'UP';
    confidence = Math.round((score - 50) / 50 * 100);
    summary = 'Multiple bullish signals align. Consider watching for entry.';
  } else if (score < 35) {
    direction = 'DOWN';
    confidence = Math.round((50 - score) / 50 * 100);
    summary = 'Multiple bearish signals present. Caution advised.';
  } else {
    direction = 'NEUTRAL';
    confidence = 50;
    summary = 'Mixed signals. No clear directional edge detected.';
  }

  return { direction, confidence, score, summary, signals };
}

module.exports = { generatePrediction };
