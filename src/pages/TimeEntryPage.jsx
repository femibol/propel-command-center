import React, { useState, useMemo, useEffect } from 'react';
import { Loader2, Zap, Trash2, Plus, FileText, X, Copy, Check } from 'lucide-react';
import WeekNavigator, { getWeekDates, formatDateISO } from '../components/timeentry/WeekNavigator';
import TimesheetGrid from '../components/timeentry/TimesheetGrid';
import UnmatchedBlocks from '../components/timeentry/UnmatchedBlocks';
import ActivityTimeline from '../components/timeentry/ActivityTimeline';
import NudgeBanner from '../components/NudgeBanner';
import { useMatchedBlocks, useTimeBlocks } from '../hooks/useTimeEntry';
import { useTimesheetReducer } from '../hooks/useTimesheetReducer';
import { useSweepData } from '../hooks/useBoards';
import { useAICoach } from '../contexts/AICoachContext';
import { useToast } from '../contexts/ToastContext';

export default function TimeEntryPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [timeLog, setTimeLog] = useState(null);
  const [timeLogLoading, setTimeLogLoading] = useState(false);
  const [timeLogCopied, setTimeLogCopied] = useState(false);
  const { addToast } = useToast();
  const { setPageContext } = useAICoach();

  useEffect(() => {
    setPageContext({ page: 'time-entry', data: 'Time entry and Timely matching' });
  }, [setPageContext]);

  const { monday, sunday, days } = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const startDate = formatDateISO(monday);
  const endDate = formatDateISO(sunday);

  const { myActive } = useSweepData();
  const timeBlocksQuery = useTimeBlocks(startDate, endDate);
  const matchedQuery = useMatchedBlocks(startDate, endDate);

  const {
    rows, unmatched, totals, initialized,
    initialize, setHours, addRow, removeRow, assignUnmatched, clear,
  } = useTimesheetReducer();

  // Auto-initialize when matched data arrives (auto-populate on page load)
  useEffect(() => {
    if (matchedQuery.data?.timesheet && !initialized && !matchedQuery.isLoading) {
      initialize(matchedQuery.data.timesheet);
      if (matchedQuery.data.timesheet.rows?.length > 0) {
        addToast(`Auto-loaded ${matchedQuery.data.timesheet.rows.length} rows from Timely`, 'success');
      }
    }
  }, [matchedQuery.data, matchedQuery.isLoading, initialized, initialize, addToast]);

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

  async function handleGenerateTimeLog() {
    if (rows.length === 0) {
      addToast('No timesheet rows to generate a log from', 'warning');
      return;
    }
    setTimeLogLoading(true);
    setTimeLog(null);
    try {
      // Build row data with sources for AI context
      const rowData = rows.map(r => ({
        client: r.client || r.clientShort,
        clientShort: r.clientShort,
        projectName: r.projectName,
        parentName: r.parentName,
        hours: r.hours || {},
        sources: (r.sources || []).map(s => ({
          app: s.app,
          title: s.title,
          category: s.category,
          url: s.url,
          durationMinutes: s.durationMinutes,
        })),
      }));
      const res = await fetch('/api/ai/time-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: rowData, weekStart: startDate }),
      });
      if (!res.ok) throw new Error('Time log generation failed');
      const data = await res.json();
      setTimeLog(data.log);
      addToast('Time log generated', 'success');
    } catch (err) {
      addToast('Failed to generate time log: ' + err.message, 'error');
    } finally {
      setTimeLogLoading(false);
    }
  }

  function handleCopyTimeLog() {
    if (!timeLog) return;
    navigator.clipboard.writeText(timeLog).then(() => {
      setTimeLogCopied(true);
      addToast('Time log copied to clipboard', 'success');
      setTimeout(() => setTimeLogCopied(false), 2000);
    });
  }

  const isLoading = timeBlocksQuery.isLoading || matchedQuery.isLoading || generating;
  const allBlocks = timeBlocksQuery.data?.blocks || [];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <NudgeBanner page="time-entry" />
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
          onClick={() => { clear(); setTimeLog(null); addToast('Timesheet cleared', 'info'); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded text-xs font-medium hover:bg-red-500/20 transition-colors"
        >
          <Trash2 size={14} />
          Clear
        </button>

        <div className="w-px h-6 bg-[#2E3348]" />

        <button
          onClick={handleGenerateTimeLog}
          disabled={timeLogLoading || rows.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-xs font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-50"
        >
          {timeLogLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
          Generate Time Log
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
        {(isLoading || !myActive) && !initialized ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-[#8B8FA3]">
                {!myActive ? 'Loading Monday.com task data...' :
                 matchedQuery.isLoading ? 'Matching Timely blocks to tasks...' :
                 'Analyzing Timely activity data...'}
              </p>
              <p className="text-xs text-[#5C6178] mt-1">
                {!myActive ? 'Fetching active subitems from 10 boards' :
                 'Aggregating time blocks and building timesheet'}
              </p>
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
              tasks={myActive}
            />

            {/* Time Log Panel */}
            {(timeLog || timeLogLoading) && (
              <div className="border border-amber-500/30 rounded-lg overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10">
                  <FileText size={14} className="text-amber-400" />
                  <span className="text-sm font-semibold text-amber-400 flex-1">
                    Billing Time Log
                  </span>
                  <div className="flex items-center gap-2">
                    {timeLog && (
                      <button
                        onClick={handleCopyTimeLog}
                        className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-xs hover:bg-amber-500/30 transition-colors"
                      >
                        {timeLogCopied ? <Check size={12} /> : <Copy size={12} />}
                        {timeLogCopied ? 'Copied!' : 'Copy'}
                      </button>
                    )}
                    <button
                      onClick={() => setTimeLog(null)}
                      className="p-1 text-[#5C6178] hover:text-[#E8E9ED] transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className="bg-[#0F1117] p-4">
                  {timeLogLoading ? (
                    <div className="flex items-center gap-2 text-xs text-[#8B8FA3] py-4 justify-center">
                      <Loader2 size={14} className="animate-spin" />
                      Generating detailed billing descriptions from activity data...
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#5C6178] mb-3">
                        Format: DATE | HOURS | CLIENT | CATEGORY | DESCRIPTION
                      </p>
                      <div className="font-mono text-xs text-[#C8C9CD] leading-relaxed whitespace-pre-wrap bg-[#1A1D27] rounded-lg p-4 border border-[#2E3348] max-h-96 overflow-y-auto">
                        {timeLog}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

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
