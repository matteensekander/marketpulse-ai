import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

const POPULAR = ['AAPL','TSLA','NVDA','MSFT','AMZN','GOOGL','META','AMD','NFLX','SPY','QQQ','BRK.B','JPM','BAC','V','MA','DIS','COIN','PLTR','RIVN'];

export default function SearchBar({ onSelect, currentTicker }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === '/' && !['INPUT','TEXTAREA'].includes(e.target.tagName)) { e.preventDefault(); ref.current?.focus(); } };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handleClick = (e) => { if (!e.target.closest('.search-container')) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = query.length > 0 ? POPULAR.filter(t => t.includes(query.toUpperCase())) : POPULAR;

  const handleSelect = (sym) => {
    onSelect(sym);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="search-container relative">
      <div className="flex items-center gap-2 bg-navy-card border border-navy-border rounded-lg px-3 py-2 w-72">
        <Search size={14} className="text-muted" />
        <input
          ref={ref}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter' && query) handleSelect(query.toUpperCase()); if (e.key === 'Escape') setOpen(false); }}
          placeholder="Search ticker... (press /)"
          className="bg-transparent text-white text-sm outline-none w-full placeholder-muted font-mono"
        />
        <span className="text-muted text-xs border border-navy-border rounded px-1">/</span>
      </div>
      {open && (
        <div className="absolute top-full mt-1 w-72 bg-navy-card border border-navy-border rounded-lg overflow-hidden z-50 shadow-2xl">
          <div className="p-2 text-xs text-muted font-mono border-b border-navy-border">POPULAR TICKERS</div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.slice(0, 12).map(sym => (
              <button key={sym} onClick={() => handleSelect(sym)}
                className="w-full text-left px-3 py-2 text-sm font-mono hover:bg-navy-border transition-colors flex items-center justify-between">
                <span className={sym === currentTicker ? 'text-bull' : 'text-white'}>{sym}</span>
                {sym === currentTicker && <span className="text-bull text-xs">● ACTIVE</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
