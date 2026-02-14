import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export default function AISuggestionButton({ subitem, context, onSuggestion }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subitem, context }),
      });
      if (!res.ok) throw new Error('AI service unavailable');
      const data = await res.json();
      onSuggestion(data.suggestion);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 text-purple-400 border border-purple-500/40 rounded text-xs font-medium hover:bg-purple-500/30 transition-colors disabled:opacity-50"
        title="Generate AI suggestions for follow-up"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
        AI Suggest
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
