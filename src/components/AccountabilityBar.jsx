import React from 'react';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useSweepData } from '../hooks/useBoards';
import { getColumnText, daysSince } from '../utils/helpers';
import { SUBITEM_COLUMNS } from '../utils/constants';

export default function AccountabilityBar() {
  const { myActive, stale, counts } = useSweepData();

  if (!myActive || myActive.length === 0) return null;

  // Count items completed today (or recently — items with Done status and recent updated_at)
  const completedToday = myActive.filter(s => {
    const pct = parseInt(getColumnText(s, SUBITEM_COLUMNS.PERCENT_COMPLETE)) || 0;
    return pct === 100;
  }).length;

  const highNeedingAction = counts.high || 0;
  const staleCount = stale?.length || 0;

  // Simple daily progress estimate
  const totalItems = myActive.length;
  const progressPct = totalItems > 0 ? Math.min(100, Math.round((completedToday / Math.max(totalItems * 0.1, 1)) * 100)) : 0;

  return (
    <div className="flex items-center gap-4 px-5 py-1.5 border-b border-[#2E3348] bg-[#12141D] text-[10px]">
      {/* Progress bar */}
      <div className="flex items-center gap-2 flex-1">
        <span className="text-[#5C6178] shrink-0">Daily progress</span>
        <div className="flex-1 h-1.5 bg-[#1A1D27] rounded-full overflow-hidden max-w-[200px]">
          <div
            className="h-full bg-gradient-to-r from-accent to-green-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-[#5C6178]">{progressPct}%</span>
      </div>

      {/* Metrics */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <CheckCircle size={10} className="text-green-400" />
          <span className="text-green-400 font-medium">{completedToday}</span>
          <span className="text-[#5C6178]">complete</span>
        </div>

        <div className="flex items-center gap-1">
          <AlertTriangle size={10} className={highNeedingAction > 0 ? 'text-red-400' : 'text-[#5C6178]'} />
          <span className={highNeedingAction > 0 ? 'text-red-400 font-medium' : 'text-[#5C6178]'}>{highNeedingAction}</span>
          <span className="text-[#5C6178]">high</span>
        </div>

        <div className="flex items-center gap-1">
          <Clock size={10} className={staleCount > 0 ? 'text-orange-400' : 'text-[#5C6178]'} />
          <span className={staleCount > 0 ? 'text-orange-400 font-medium' : 'text-[#5C6178]'}>{staleCount}</span>
          <span className="text-[#5C6178]">stale</span>
        </div>
      </div>
    </div>
  );
}
