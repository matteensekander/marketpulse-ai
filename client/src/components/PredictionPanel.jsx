import React, { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function PredictionPanel({ prediction, loading }) {
  const [expanded, setExpanded] = useState(false);

  if (loading) return (
    <div className="bg-navy-card border border-navy-border rounded-xl p-4">
      <div className="skeleton h-32 w-full" />
    </div>
  );
  if (!prediction) return null;

  const { direction, confidence, score, summary, signals } = prediction;
  const isUp = direction === 'UP';
  const isDown = direction === 'DOWN';
  const color = isUp ? '#00ff88' : isDown ? '#ff3b3b' : '#f5c518';
  const bgClass = isUp ? 'border-bull/40 glow-bull' : isDown ? 'border-bear/40 glow-bear' : 'border-gold/40 glow-gold';
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  const dirLabel = { UP: '↑ BULLISH', DOWN: '↓ BEARISH', NEUTRAL: '— NEUTRAL' }[direction];

  return (
    <div className={`bg-navy-card border rounded-xl p-4 ${bgClass}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white">AI Prediction — Next Session</h3>
        <button onClick={() => setExpanded(!expanded)} className="text-muted hover:text-white transition-colors flex items-center gap-1 text-xs">
          Why this? {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-3">
          <Icon size={40} style={{ color }} />
          <div>
            <div className="text-3xl font-bold font-mono" style={{ color }}>{dirLabel}</div>
            <div className="text-muted text-sm">{confidence}% confidence</div>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-xs font-mono text-muted mb-1">
            <span>BEARISH</span><span>SCORE: {score}/100</span><span>BULLISH</span>
          </div>
          <div className="h-3 bg-navy-border rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${score}%`, background: `linear-gradient(90deg, #ff3b3b, #f5c518, #00ff88)` }} />
          </div>
        </div>
      </div>

      <p className="text-muted text-sm mb-3">{summary}</p>

      {expanded && signals && (
        <div className="border-t border-navy-border pt-3 space-y-2">
          <div className="text-xs text-muted font-mono mb-2">SIGNAL BREAKDOWN</div>
          {signals.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${s.direction === 'bullish' ? 'bg-bull' : s.direction === 'bearish' ? 'bg-bear' : 'bg-gold'}`} />
                <span className="text-white font-mono text-xs w-24">{s.name}</span>
                <span className="text-muted text-xs">{s.note}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white font-mono text-xs">{s.value}</span>
                <span className={`font-mono text-xs font-bold w-12 text-right ${s.direction === 'bullish' ? 'text-bull' : s.direction === 'bearish' ? 'text-bear' : 'text-muted'}`}>
                  {s.impact}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted/60 mt-3">⚠️ Educational tool only. Not financial advice. Always do your own research.</p>
    </div>
  );
}
