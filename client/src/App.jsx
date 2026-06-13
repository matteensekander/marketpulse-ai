import React, { useState, useEffect, useCallback } from 'react';
import SearchBar from './components/SearchBar';
import StockCard from './components/StockCard';
import PriceChart from './components/PriceChart';
import PredictionPanel from './components/PredictionPanel';
import StockTwitsFeed from './components/StockTwitsFeed';
import NewsFeed from './components/NewsFeed';
import Watchlist from './components/Watchlist';
import MarketOverview from './components/MarketOverview';
import { fetchStock, fetchPrediction } from './api';

export default function App() {
  const [ticker, setTicker] = useState('AAPL');
  const [stockData, setStockData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('watchlist') || '["AAPL","TSLA","NVDA","MSFT"]'); }
    catch { return ['AAPL', 'TSLA', 'NVDA', 'MSFT']; }
  });

  const loadTicker = useCallback(async (sym) => {
    setLoading(true);
    try {
      const [stock, pred] = await Promise.allSettled([fetchStock(sym), fetchPrediction(sym)]);
      if (stock.status === 'fulfilled') setStockData(stock.value);
      if (pred.status === 'fulfilled') setPrediction(pred.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTicker(ticker); }, [ticker]);

  const addToWatchlist = (sym) => {
    const updated = [...new Set([...watchlist, sym.toUpperCase()])];
    setWatchlist(updated);
    localStorage.setItem('watchlist', JSON.stringify(updated));
  };

  const removeFromWatchlist = (sym) => {
    const updated = watchlist.filter(t => t !== sym);
    setWatchlist(updated);
    localStorage.setItem('watchlist', JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-navy font-display">
      {/* Header */}
      <header className="border-b border-navy-border px-4 py-3 flex items-center justify-between sticky top-0 z-50 bg-navy">
        <a href="https://marketpulse-ai-roan.vercel.app" target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <span className="text-bull font-mono text-xl font-bold">▲</span>
          <span className="text-white font-bold text-lg tracking-wide">MarketPulse AI</span>
        </a>
        <SearchBar onSelect={setTicker} currentTicker={ticker} />
        <div className="flex items-center gap-3 text-xs font-mono">
          {stockData && (
            <span className={`${parseFloat(stockData.changePercent) >= 0 ? 'text-bull' : 'text-bear'}`}>
              {stockData.companyName} ${stockData.price?.toFixed(2)} ({stockData.changePercent}%)
            </span>
          )}
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            stockData?.marketStatus === 'OPEN' ? 'bg-bull/20 text-bull' :
            stockData?.marketStatus === 'CLOSED' ? 'bg-bear/20 text-bear' : 'bg-gold/20 text-gold'
          }`}>
            {stockData?.marketStatus || 'LOADING'}
          </span>
        </div>
      </header>

      <div className="flex h-[calc(100vh-57px)]">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-navy-border overflow-y-auto scrollbar-hide flex-shrink-0">
          <Watchlist
            watchlist={watchlist}
            currentTicker={ticker}
            onSelect={setTicker}
            onRemove={removeFromWatchlist}
          />
          <MarketOverview onSelect={setTicker} />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
          <StockCard data={stockData} loading={loading} onAddWatchlist={() => addToWatchlist(ticker)} inWatchlist={watchlist.includes(ticker)} />
          <PriceChart ticker={ticker} />
          <PredictionPanel prediction={prediction} loading={loading} />
        </main>

        {/* Right Sidebar */}
        <aside className="w-80 border-l border-navy-border overflow-y-auto scrollbar-hide flex-shrink-0">
          <StockTwitsFeed ticker={ticker} />
          <NewsFeed ticker={ticker} />
        </aside>
      </div>
    </div>
  );
}
