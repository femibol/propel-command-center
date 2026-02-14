import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, Zap, Trash2, Plus } from 'lucide-react';
import WeekNavigator, { getWeekDates, formatDateISO } from '../components/timeentry/WeekNavigator';
import TimesheetGrid from '../components/timeentry/TimesheetGrid';
import UnmatchedBlocks from '../components/timeentry/UnmatchedBlocks';
import ActivityTimeline from '../components/timeentry/ActivityTimeline';
import { useMatchedBlocks, useTimeBlocks } from '../hooks/useTimeEntry';
import { useTimesheetReducer } from '../hooks/useTimesheetReducer';
import { useSweepData } from '../hooks/useBoards';
import { useToast } from '../contexts/ToastContext';

export default function TimeEntryPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [generating, setGenerating] = useState(false);
  const { addToast } = useToast();

  const { monday, friday, days } = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const startDate = formatDateISO(monday);
  const endDate = formatDateISO(friday);

  const { myActive } = useSweepData();
  const timeBlocksQuery = useTimeBlocks(startDate, endDate);
  const matchedQuery = useMatchedBlocks(startDate, endDate);

  const {
    rows, unmatched, totals, initialized,
    initialize, setHours, addRow, removeRow, assignUnmatched, clear,
  } = useTimesheetReducer();

  // Auto-initialize when matched data arrives
  useEffect(() => {
    if (matchedQuery.data?.timesheet && !initialized) {
      initialize(matchedQuery.data.timesheet);
    }
  }, [matchedQuery.data, initialized, initialize]);

  // Reset when week changes
  useEffect(() => {
    clear();
  }, [weekOffset, clear]);

  async function handleAutoGenerate() {
    setGenerating(true);
    try {
      await matchedQuery.refetch();
      if (matchedQuery.data?.timesheet) {
        initialize(matchedQuery.data.timesheet);
        addToast(`Generated ${matchedQuery.data.timesheet.rows?.length || 0} rows from Timely data`, 'success');
      }
    } catch (err) {
      addToast('Failed to generate timesheet: ' + err.message, 'error');
    } finally {
      setGenerating(false);
    }
  }

  function handleAddRow() {
    // Show a simple prompt for now - could be enhanced with a task picker modal
    if (myActive && myActive.length > 0) {
      addRow(myActive[0], myActive[0]._clientName, myActive[0]._clientShort);
      addToast('Added new row', 'info');
    } else {
      addRow(null, 'Manual', '???');
    }
  }

  const isLoading = timeBlocksQuery.isLoading || matchedQuery.isLoading || generating;
  const allBlocks = timeBlocksQuery.data?.blocks || [];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#2E3348] bg-[#1A1D27] flex items-center gap-4">
        <h2 className="text-base font-semibold text-[#E8E9ED]">Time Entry</h2>
        <WeekNavigator weekOffset={weekOffset} onWeekChange={setWeekOffset} />
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#2E3348] bg-[#0F1117]">
        <button
          onClick={handleAutoGenerate}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded text-xs font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          Auto-Generate
        </button>
        <button
          onClick={handleAddRow}
          className="flex items-center gap-1.5 px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/40 rounded text-xs font-medium hover:bg-green-500/30 transition-colors"
        >
          <Plus size={14} />
          Add Row
        </button>
        <button
          onClick={() => { clear(); addToast('Timesheet cleared', 'info'); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded text-xs font-medium hover:bg-red-500/20 transition-colors"
        >
          <Trash2 size={14} />
          Clear
        </button>

        <div className="flex-1" />

        {/* Summary stats */}
        <div className="flex items-center gap-4 text-xs text-[#8B8FA3]">
          {timeBlocksQuery.data && (
            <>
              <span>{timeBlocksQuery.data.summary?.blockCount || 0} blocks</span>
              <span>{timeBlocksQuery.data.summary?.totalHours?.toFixed(1) || 0}h tracked</span>
            </>
          )}
          <span className="font-semibold text-green-400">{totals.total.toFixed(1)}h entered</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {isLoading && !initialized ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-[#8B8FA3]">Analyzing Timely activity data...</p>
              <p className="text-xs text-[#5C6178] mt-1">Aggregating time blocks and matching to tasks</p>
            </div>
          </div>
        ) : (
          <>
            {/* Timesheet Grid */}
            <TimesheetGrid
              rows={rows}
              totals={totals}
              weekDays={days}
              onSetHours={setHours}
              onRemoveRow={removeRow}
            />

            {/* Unmatched blocks */}
            <UnmatchedBlocks
              blocks={unmatched}
              rows={rows}
              onAssign={assignUnmatched}
            />

            {/* Activity Timeline */}
            {allBlocks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#E8E9ED]">Activity Timeline</h3>
                {days.map(day => (
                  <ActivityTimeline
                    key={formatDateISO(day)}
                    blocks={allBlocks}
                    day={formatDateISO(day)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
