import React from 'react';
import { Plus, Check, TrendingUp, TrendingDown } from 'lucide-react';

export default function StockCard({ data, loading, onAddWatchlist, inWatchlist }) {
  if (loading) return (
    <div className="bg-navy-card border border-navy-border rounded-xl p-4 grid grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12" />)}
    </div>
  );
  if (!data) return null;

  const isUp = parseFloat(data.changePercent) >= 0;
  const fmtCap = (n) => {
    if (!n || n === 'N/A') return 'N/A';
    const num = parseInt(n);
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  return (
    <div className={`bg-navy-card border rounded-xl p-4 ${isUp ? 'border-bull/30 glow-bull' : 'border-bear/30 glow-bear'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono text-white">{data.ticker}</span>
            <span className="text-muted text-sm">{data.companyName}</span>
            <span className="text-xs px-2 py-0.5 bg-navy-border rounded text-muted">{data.sector}</span>
          </div>
        </div>
        <button onClick={onAddWatchlist}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${inWatchlist ? 'bg-bull/20 text-bull border border-bull/30' : 'bg-navy-border text-muted hover:text-white border border-navy-border'}`}>
          {inWatchlist ? <><Check size={12} /> Watching</> : <><Plus size={12} /> Watch</>}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="col-span-2">
          <div className={`text-3xl font-bold font-mono ${isUp ? 'text-bull' : 'text-bear'}`}>
            ${data.price?.toFixed(2)}
          </div>
          <div className={`flex items-center gap-1 text-sm font-mono ${isUp ? 'text-bull' : 'text-bear'}`}>
            {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {isUp ? '+' : ''}{data.change?.toFixed(2)} ({data.changePercent}%)
          </div>
        </div>
        {[
          ['Open', `$${data.open?.toFixed(2)}`],
          ['High', `$${data.high?.toFixed(2)}`],
          ['Low', `$${data.low?.toFixed(2)}`],
          ['Mkt Cap', fmtCap(data.marketCap)],
          ['P/E', data.peRatio],
          ['52W Hi', `$${parseFloat(data.week52High || 0).toFixed(2)}`],
          ['52W Lo', `$${parseFloat(data.week52Low || 0).toFixed(2)}`],
          ['EPS', data.eps],
        ].map(([label, value]) => (
          <div key={label}>
            <div className="text-xs text-muted mb-0.5">{label}</div>
            <div className="text-sm font-mono text-white">{value || 'N/A'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
