import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { fetchStock } from '../api';

export default function Watchlist({ watchlist, currentTicker, onSelect, onRemove }) {
  const [stockData, setStockData] = useState({});

  useEffect(() => {
    watchlist.forEach(async (sym) => {
      try {
        const data = await fetchStock(sym);
        setStockData(prev => ({ ...prev, [sym]: data }));
      } catch {}
    });
  }, [watchlist]);

  return (
    <div className="p-4 border-b border-navy-border">
      <div className="text-xs font-mono text-muted mb-3">WATCHLIST</div>
      {watchlist.length === 0 ? (
        <div className="text-xs text-muted text-center py-2">Search a ticker and click Watch to add</div>
      ) : (
        <div className="space-y-1">
          {watchlist.map(sym => {
            const d = stockData[sym];
            const isUp = d ? parseFloat(d.changePercent) >= 0 : null;
            return (
              <div key={sym} onClick={() => onSelect(sym)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${sym === currentTicker ? 'bg-bull/10 border border-bull/20' : 'hover:bg-navy-border'}`}>
                <div className="flex items-center gap-2 flex-1">
                  <span className={`text-xs font-mono font-bold ${sym === currentTicker ? 'text-bull' : 'text-white'}`}>{sym}</span>
                  {d && (
                    <div className="flex items-center gap-1">
                      <span className={`text-xs font-mono ${isUp ? 'text-bull' : 'text-bear'}`}>${d.price?.toFixed(2)}</span>
                      <span className={`text-xs font-mono ${isUp ? 'text-bull' : 'text-bear'}`}>
                        {isUp ? '+' : ''}{parseFloat(d.changePercent).toFixed(2)}%
                      </span>
                    </div>
                  )}
                  {!d && <div className="skeleton h-3 w-16" />}
                </div>
                <button onClick={(e) => { e.stopPropagation(); onRemove(sym); }}
                  className="text-muted hover:text-bear transition-colors ml-1">
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
