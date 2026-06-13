require('dotenv').config();
const express = require('express');
const cors = require('cors');

const stockRoutes = require('./routes/stock');
const stocktwitsRoutes = require('./routes/stocktwits');
const newsRoutes = require('./routes/news');
const predictionRoutes = require('./routes/prediction');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/stock', stockRoutes);
app.use('/api/stocktwits', stocktwitsRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/prediction', predictionRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`MarketPulse server running on port ${PORT}`);
  });
}

module.exports = app;
