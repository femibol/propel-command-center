import React, { useState } from 'react';
import { Zap, Clock, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { useSweepData } from '../hooks/useBoards';
import SubitemRow from '../components/SubitemRow';
import SubitemDetail from '../components/SubitemDetail';
import SkeletonRow from '../components/SkeletonRow';
import { getQuickWinBadges, getColumnText, quickWinScore } from '../utils/helpers';
import { SUBITEM_COLUMNS } from '../utils/constants';

export default function QuickWinsPage() {
  const { quickWins, isLoading, myActive } = useSweepData();
  const [expandedId, setExpandedId] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const displayed = showAll ? quickWins : quickWins.slice(0, 20);

  // Estimate total hours to clear
  const totalEstHours = quickWins.reduce((sum, sub) => {
    const est = parseFloat(getColumnText(sub, SUBITEM_COLUMNS.ESTIMATED_TIME)) || 0;
    const pct = parseInt(getColumnText(sub, SUBITEM_COLUMNS.PERCENT_COMPLETE)) || 0;
    return sum + est * ((100 - pct) / 100);
  }, 0);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-5 space-y-2">
        <h2 className="text-lg font-semibold text-[#E8E9ED] mb-4">Quick Wins</h2>
        {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {/* Header + Stats */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-[#E8E9ED]">Quick Wins</h2>
        <div className="flex items-center gap-4 text-xs text-[#8B8FA3]">
          <span className="flex items-center gap-1">
            <Target size={12} className="text-green-400" />
            {quickWins.length} items
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} className="text-blue-400" />
            ~{totalEstHours.toFixed(1)}h remaining
          </span>
        </div>
      </div>

      <p className="text-xs text-[#5C6178]">
        Items you can close quickly: nearly complete, small tasks, support tickets, and unassigned items.
        Sorted by quickest to complete.
      </p>

      {/* Quick Win Scoreboard */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Almost Done (80%+)', count: quickWins.filter(s => (parseInt(getColumnText(s, SUBITEM_COLUMNS.PERCENT_COMPLETE)) || 0) >= 80).length, color: 'text-green-400' },
          { label: 'Small Tasks (< 2h)', count: quickWins.filter(s => { const e = parseFloat(getColumnText(s, SUBITEM_COLUMNS.ESTIMATED_TIME)) || 0; return e > 0 && e <= 2; }).length, color: 'text-blue-400' },
          { label: 'Support', count: quickWins.filter(s => (getColumnText(s, SUBITEM_COLUMNS.TYPE) || '').toLowerCase().includes('support')).length, color: 'text-orange-400' },
          { label: 'Unassigned', count: quickWins.filter(s => !getColumnText(s, SUBITEM_COLUMNS.NAW_TEAM)).length, color: 'text-yellow-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#1A1D27] border border-[#2E3348] rounded-lg p-3 text-center">
            <p className={`text-xl font-bold ${stat.color}`}>{stat.count}</p>
            <p className="text-[10px] text-[#5C6178] mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Items List */}
      {quickWins.length === 0 ? (
        <div className="text-center py-12 text-[#5C6178]">
          <Zap size={32} className="mx-auto mb-3 text-[#2E3348]" />
          <p className="text-sm">No quick wins right now!</p>
          <p className="text-xs mt-1">All items require significant effort. Check back later.</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {displayed.map(sub => (
            <div key={sub.id}>
              {/* Badges row */}
              <div className="flex items-center gap-1.5 px-3 pt-1.5">
                {getQuickWinBadges(sub).map((badge, i) => (
                  <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${badge.color}`}>
                    {badge.label}
                  </span>
                ))}
                <span className="text-[10px] text-[#3A3F55] ml-auto">
                  score: {quickWinScore(sub)}
                </span>
              </div>
              <SubitemRow
                subitem={sub}
                isExpanded={expandedId === sub.id}
                onToggle={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                showClient
              />
              {expandedId === sub.id && <SubitemDetail subitem={sub} />}
            </div>
          ))}
        </div>
      )}

      {/* Show more/less */}
      {quickWins.length > 20 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 text-xs text-accent hover:text-blue-400 mx-auto"
        >
          {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showAll ? 'Show less' : `Show all ${quickWins.length} items`}
        </button>
      )}
    </div>
  );
}
