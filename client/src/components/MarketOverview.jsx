import React, { useState, useEffect } from 'react';
import { fetchMovers } from '../api';

export default function MarketOverview({ onSelect }) {
  const [movers, setMovers] = useState(null);
  const [fearGreed, setFearGreed] = useState(null);

  useEffect(() => {
    fetchMovers().then(setMovers).catch(() => {});
    fetch('https://api.alternative.me/fng/?limit=1')
      .then(r => r.json())
      .then(d => setFearGreed(d.data?.[0]))
      .catch(() => {});
  }, []);

  const fgColor = fearGreed ? (parseInt(fearGreed.value) > 60 ? 'text-bull' : parseInt(fearGreed.value) < 40 ? 'text-bear' : 'text-gold') : 'text-muted';

  return (
    <div className="p-4">
      {fearGreed && (
        <div className="mb-4">
          <div className="text-xs font-mono text-muted mb-2">FEAR & GREED INDEX</div>
          <div className="bg-navy border border-navy-border rounded-lg p-3 text-center">
            <div className={`text-2xl font-bold font-mono ${fgColor}`}>{fearGreed.value}</div>
            <div className={`text-xs font-mono ${fgColor}`}>{fearGreed.value_classification}</div>
          </div>
        </div>
      )}

      {movers && (
        <>
          <div className="mb-3">
            <div className="text-xs font-mono text-muted mb-2">🚀 TOP GAINERS</div>
            <div className="space-y-1">
              {(movers.gainers || []).slice(0, 4).map(s => (
                <div key={s.ticker} onClick={() => onSelect(s.ticker)}
                  className="flex items-center justify-between text-xs font-mono cursor-pointer hover:bg-navy-border rounded px-1.5 py-1 transition-colors">
                  <span className="text-white">{s.ticker}</span>
                  <span className="text-bull">+{parseFloat(s.change_percentage).toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-mono text-muted mb-2">📉 TOP LOSERS</div>
            <div className="space-y-1">
              {(movers.losers || []).slice(0, 4).map(s => (
                <div key={s.ticker} onClick={() => onSelect(s.ticker)}
                  className="flex items-center justify-between text-xs font-mono cursor-pointer hover:bg-navy-border rounded px-1.5 py-1 transition-colors">
                  <span className="text-white">{s.ticker}</span>
                  <span className="text-bear">{parseFloat(s.change_percentage).toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
