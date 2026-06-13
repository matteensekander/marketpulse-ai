import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { fetchNews } from '../api';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NewsFeed({ ticker }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchNews(ticker).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [ticker]);

  const sentimentColor = (label) => label === 'Positive' ? 'text-bull' : label === 'Negative' ? 'text-bear' : 'text-gold';
  const sentimentBg = (label) => label === 'Positive' ? 'bg-bull/10 border-bull/20' : label === 'Negative' ? 'bg-bear/10 border-bear/20' : 'bg-gold/10 border-gold/20';

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-white font-bold text-sm">News Feed</span>
        {data && (
          <span className={`text-xs font-mono font-bold ${sentimentColor(data.overallLabel)}`}>
            {data.overallLabel} ({data.overallScore}/100)
          </span>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-14" />)}</div>
      ) : !data?.articles?.length ? (
        <div className="text-muted text-sm text-center py-4">No news found for {ticker}</div>
      ) : (
        <div className="space-y-2">
          {data.articles.map((a, i) => (
            <a key={i} href={a.url} target="_blank" rel="noreferrer"
              className="block bg-navy border border-navy-border rounded-lg p-2.5 hover:border-bull/30 transition-colors group">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className={`text-xs px-1.5 py-0.5 rounded border font-mono ${sentimentBg(a.sentiment)} ${sentimentColor(a.sentiment)}`}>
                  {a.sentiment}
                </span>
                <ExternalLink size={10} className="text-muted group-hover:text-bull flex-shrink-0 mt-0.5" />
              </div>
              <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">{a.title}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted font-mono">
                <span>{a.source}</span><span>·</span><span>{timeAgo(a.publishedAt)}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
