import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSweepData } from '../hooks/useBoards';
import SubitemRow from '../components/SubitemRow';
import { getColumnText, isWithinWeek, isActive } from '../utils/helpers';
import { SUBITEM_COLUMNS } from '../utils/constants';
import { getWeekDates } from '../components/timeentry/WeekNavigator';

function formatWeekHeader(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDayHeader(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function PlannerPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const { myActive, isLoading } = useSweepData();

  const { monday, sunday, days } = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  // Items with est_wip overlapping this week
  const scheduled = useMemo(() => {
    return (myActive || []).filter((sub) => {
      const wip = sub.column_values?.find?.((c) => c.id === SUBITEM_COLUMNS.EST_WIP)?.value;
      return isWithinWeek(wip, monday, sunday);
    });
  }, [myActive, monday, sunday]);

  // Active items without est_wip
  const unscheduled = useMemo(() => {
    return (myActive || []).filter((sub) => {
      const wip = sub.column_values?.find?.((c) => c.id === SUBITEM_COLUMNS.EST_WIP)?.text;
      const status = getColumnText(sub, SUBITEM_COLUMNS.STATUS);
      return (!wip || wip === '') && isActive(status);
    });
  }, [myActive]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-5 py-4 border-b border-[#2E3348] bg-[#1A1D27] flex items-center gap-4">
        <h2 className="text-base font-semibold text-[#E8E9ED]">Weekly Planner</h2>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-1 hover:bg-[#242836] rounded transition-colors text-[#8B8FA3]"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-[#E8E9ED] font-mono min-w-[180px] text-center">
            {formatWeekHeader(monday)} – {formatWeekHeader(sunday)}
          </span>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-1 hover:bg-[#242836] rounded transition-colors text-[#8B8FA3]"
          >
            <ChevronRight size={16} />
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-accent hover:underline ml-2"
            >
              This week
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Scheduled items */}
            <div className="border border-[#2E3348] rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-[#1A1D27] border-b border-[#2E3348]">
                <span className="text-sm font-semibold text-[#E8E9ED]">
                  Scheduled This Week ({scheduled.length})
                </span>
              </div>
              {scheduled.length === 0 ? (
                <div className="p-6 text-center text-sm text-[#5C6178]">
                  No items with Est. WIP timelines overlapping this week.
                </div>
              ) : (
                <div className="bg-[#0F1117]">
                  {scheduled.map((sub) => (
                    <SubitemRow key={sub.id} subitem={sub} showClient showStale />
                  ))}
                </div>
              )}
            </div>

            {/* Unscheduled active items */}
            <div className="border border-[#2E3348] rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-[#1A1D27] border-b border-[#2E3348]">
                <span className="text-sm font-semibold text-yellow-400">
                  Unscheduled Active Items ({unscheduled.length})
                </span>
                <span className="text-xs text-[#5C6178] ml-2">
                  Active status but no Est. WIP timeline set
                </span>
              </div>
              {unscheduled.length === 0 ? (
                <div className="p-6 text-center text-sm text-[#5C6178]">
                  All active items have timelines.
                </div>
              ) : (
                <div className="bg-[#0F1117]">
                  {unscheduled.map((sub) => (
                    <SubitemRow key={sub.id} subitem={sub} showClient showStale />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
