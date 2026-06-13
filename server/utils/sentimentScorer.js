const Sentiment = require('sentiment');
const analyzer = new Sentiment();

function scoreText(text) {
  const result = analyzer.analyze(text);
  const score = result.score;
  if (score > 1) return { label: 'Positive', score: Math.min(100, 50 + score * 5) };
  if (score < -1) return { label: 'Negative', score: Math.max(0, 50 + score * 5) };
  return { label: 'Neutral', score: 50 };
}

function scoreStockTwits(messages) {
  const tagged = messages.filter(m => m.entities?.sentiment?.basic);
  const bullish = messages.filter(m => m.entities?.sentiment?.basic === 'Bullish').length;
  const bearish = messages.filter(m => m.entities?.sentiment?.basic === 'Bearish').length;
  const total = tagged.length || 1;
  const score = Math.round(((bullish - bearish) / total) * 50 + 50);
  const label = score > 60 ? 'Bullish' : score < 40 ? 'Bearish' : 'Neutral';
  return { score, label, bullish, bearish, neutral: messages.length - tagged.length, total: messages.length };
}

module.exports = { scoreText, scoreStockTwits };
