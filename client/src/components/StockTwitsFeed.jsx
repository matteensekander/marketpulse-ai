import React, { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink } from 'lucide-react';
import { fetchStockTwits, fetchTrending } from '../api';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function SentimentMeter({ score, label }) {
  const color = score > 60 ? '#00ff88' : score < 40 ? '#ff3b3b' : '#f5c518';
  return (
    <div className="bg-navy border border-navy-border rounded-lg p-3 mb-3">
      <div className="flex justify-between text-xs font-mono mb-2">
        <span className="text-muted">COMMUNITY SENTIMENT</span>
        <span className="font-bold" style={{ color }}>{label}</span>
      </div>
      <div className="h-2 bg-navy-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <div className="flex justify-between text-xs font-mono text-muted mt-1">
        <span>BEAR</span><span>{score}/100</span><span>BULL</span>
      </div>
    </div>
  );
}

export default function StockTwitsFeed({ ticker }) {
  const [data, setData] = useState(null);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.allSettled([fetchStockTwits(ticker), fetchTrending()])
      .then(([stResult, trendResult]) => {
        if (stResult.status === 'fulfilled') setData(stResult.value);
        if (trendResult.status === 'fulfilled') setTrending(trendResult.value);
        setLastUpdated(new Date());
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); const interval = setInterval(load, 180000); return () => clearInterval(interval); }, [ticker]);

  return (
    <div className="p-4 border-b border-navy-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-bull font-bold text-sm">StockTwits</span>
          <span className="text-xs text-muted font-mono">${ticker}</span>
        </div>
        <button onClick={load} className="text-muted hover:text-white transition-colors">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && !data ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16" />)}</div>
      ) : (
        <>
          {data?.sentiment && <SentimentMeter score={data.sentiment.score} label={data.sentiment.label} />}

          <div className="space-y-2 mb-4">
            {data?.sentiment && (
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="bg-bull/10 border border-bull/20 rounded p-2">
                  <div className="text-bull font-bold text-lg">{data.sentiment.bullish}</div>
                  <div className="text-muted">Bullish</div>
                </div>
                <div className="bg-navy border border-navy-border rounded p-2">
                  <div className="text-muted font-bold text-lg">{data.sentiment.neutral}</div>
                  <div className="text-muted">Neutral</div>
                </div>
                <div className="bg-bear/10 border border-bear/20 rounded p-2">
                  <div className="text-bear font-bold text-lg">{data.sentiment.bearish}</div>
                  <div className="text-muted">Bearish</div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-hide">
            {(data?.messages || []).slice(0, 15).map((msg) => (
              <div key={msg.id} className="bg-navy border border-navy-border rounded-lg p-2.5 hover:border-navy-border/80 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    {msg.avatar ? (
                      <img src={msg.avatar} alt={msg.username} className="w-5 h-5 rounded-full" onError={(e) => e.target.style.display='none'} />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-navy-border flex items-center justify-center text-xs text-muted">
                        {msg.username[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-mono text-white">@{msg.username}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {msg.sentiment && (
                      <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${msg.sentiment === 'Bullish' ? 'bg-bull/20 text-bull' : 'bg-bear/20 text-bear'}`}>
                        {msg.sentiment === 'Bullish' ? '🟢' : '🔴'} {msg.sentiment}
                      </span>
                    )}
                    <a href={msg.url} target="_blank" rel="noreferrer" className="text-muted hover:text-white"><ExternalLink size={10} /></a>
                  </div>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">{msg.body}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted font-mono">
                  <span>{timeAgo(msg.createdAt)}</span>
                  {msg.likes > 0 && <span>♥ {msg.likes}</span>}
                </div>
              </div>
            ))}
          </div>

          {lastUpdated && (
            <div className="text-xs text-muted font-mono mt-2 text-center">
              Updated {timeAgo(lastUpdated)} · Auto-refreshes every 3 min
            </div>
          )}

          {trending.length > 0 && (
            <div className="mt-4 border-t border-navy-border pt-3">
              <div className="text-xs text-muted font-mono mb-2">🔥 HOT ON STOCKTWITS</div>
              <div className="flex flex-wrap gap-1">
                {trending.map(t => (
                  <span key={t.ticker} className="text-xs font-mono px-2 py-0.5 bg-navy-border rounded text-white cursor-pointer hover:bg-bull/20 hover:text-bull transition-colors">
                    ${t.ticker}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
