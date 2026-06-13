import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { fetchChart } from '../api';

const PERIODS = ['1d', '1w', '1m', '3m', '1y'];

export default function PriceChart({ ticker }) {
  const [period, setPeriod] = useState('1m');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchChart(ticker, period)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [ticker, period]);

  const isUp = data.length >= 2 && data[data.length - 1]?.close >= data[0]?.close;
  const color = isUp ? '#00ff88' : '#ff3b3b';

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-navy-card border border-navy-border rounded-lg p-3 text-xs font-mono">
        <div className="text-muted mb-1">{label}</div>
        <div className="text-white">Close: <span style={{ color }}>${payload[0]?.value?.toFixed(2)}</span></div>
        {payload[1] && <div className="text-muted">Vol: {parseInt(payload[1]?.value).toLocaleString()}</div>}
      </div>
    );
  };

  return (
    <div className="bg-navy-card border border-navy-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white">Price Chart</h3>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors ${period === p ? 'bg-bull/20 text-bull' : 'text-muted hover:text-white'}`}>
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="skeleton h-48 w-full" />
      ) : data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-muted text-sm">No chart data available</div>
      ) : (
        <div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" />
              <XAxis dataKey="time" tick={{ fill: '#4b6080', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#4b6080', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `$${v.toFixed(0)}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="close" stroke={color} strokeWidth={2} fill="url(#colorGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={50}>
            <BarChart data={data} margin={{ top: 0, right: 5, left: 5, bottom: 0 }}>
              <Bar dataKey="volume" fill="#1e2d45" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
