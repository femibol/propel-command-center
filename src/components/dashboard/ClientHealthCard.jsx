import React from 'react';
import { getColumnText, daysSince } from '../../utils/helpers';
import { SUBITEM_COLUMNS, STALE_THRESHOLD_DAYS } from '../../utils/constants';

function healthColor(staleCount, highCount, total) {
  if (highCount > 0 || staleCount >= 3) return { dot: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/30' };
  if (staleCount > 0) return { dot: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/30' };
  return { dot: 'bg-green-500', text: 'text-green-400', border: 'border-green-500/30' };
}

export default function ClientHealthCard({ clientName, shortName, items }) {
  const stale = items.filter(s => {
    const status = getColumnText(s, SUBITEM_COLUMNS.STATUS);
    return !['Done', 'Pending Close', 'NA', 'On Hold'].includes(status) &&
           !status.startsWith('Waiting') &&
           daysSince(s.updated_at) >= STALE_THRESHOLD_DAYS;
  });

  const highPriority = items.filter(s => {
    const p = getColumnText(s, SUBITEM_COLUMNS.PRIORITY);
    return p === 'High' || p === 'System Down';
  });

  const waiting = items.filter(s => {
    const status = getColumnText(s, SUBITEM_COLUMNS.STATUS);
    return status.startsWith('Waiting');
  });

  const health = healthColor(stale.length, highPriority.length, items.length);

  return (
    <div className={`bg-[#1A1D27] border ${health.border} rounded-lg p-3.5 hover:bg-[#242836] transition-colors`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${health.dot}`} />
        <span className="text-xs font-mono text-[#8B8FA3] font-bold">{shortName}</span>
        <span className="text-xs text-[#E8E9ED] truncate flex-1" title={clientName}>
          {clientName}
        </span>
        <span className="text-sm font-bold font-mono text-[#E8E9ED]">{items.length}</span>
      </div>

      <div className="flex items-center gap-3 text-[10px]">
        {highPriority.length > 0 && (
          <span className="text-red-400">{highPriority.length} high</span>
        )}
        {stale.length > 0 && (
          <span className="text-yellow-400">{stale.length} stale</span>
        )}
        {waiting.length > 0 && (
          <span className="text-purple-400">{waiting.length} waiting</span>
        )}
        {highPriority.length === 0 && stale.length === 0 && waiting.length === 0 && (
          <span className="text-green-400">All healthy</span>
        )}
      </div>
    </div>
  );
}
