import React from 'react';
import TimesheetCell from './TimesheetCell';
import TaskRowHeader from './TaskRowHeader';

const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
];

export default function TimesheetGrid({ rows, totals, weekDays, onSetHours, onRemoveRow }) {
  return (
    <div className="border border-[#2E3348] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_repeat(5,70px)_70px] bg-[#1A1D27] border-b border-[#2E3348] text-xs font-medium text-[#8B8FA3]">
        <div className="px-3 py-2">Client / Task</div>
        {DAYS.map((d, i) => (
          <div key={d.key} className="px-1 py-2 text-center">
            <div>{d.label}</div>
            {weekDays?.[i] && (
              <div className="text-[10px] text-[#5C6178] font-mono">
                {weekDays[i].getDate()}
              </div>
            )}
          </div>
        ))}
        <div className="px-1 py-2 text-center font-semibold text-[#E8E9ED]">Total</div>
      </div>

      {/* Rows */}
      {rows.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-[#5C6178]">
          No timesheet data. Click "Auto-Generate" to populate from Timely activity.
        </div>
      ) : (
        rows.map(row => {
          const rowTotal = DAYS.reduce((sum, d) => sum + (row.hours[d.key] || 0), 0);
          return (
            <div
              key={row.id}
              className="grid grid-cols-[1fr_repeat(5,70px)_70px] border-b border-[#2E3348]/50 hover:bg-[#242836]/30 transition-colors"
            >
              <div className="px-3 py-2">
                <TaskRowHeader row={row} onRemove={onRemoveRow} />
              </div>
              {DAYS.map(d => (
                <div key={d.key} className="px-1 py-1">
                  <TimesheetCell
                    value={row.hours[d.key] || 0}
                    onChange={(val) => onSetHours(row.id, d.key, val)}
                    isModified={row.isModified}
                  />
                </div>
              ))}
              <div className="px-1 py-2 text-center text-sm font-mono font-semibold text-[#E8E9ED]">
                {rowTotal > 0 ? rowTotal.toFixed(1) : '—'}
              </div>
            </div>
          );
        })
      )}

      {/* Totals row */}
      <div className="grid grid-cols-[1fr_repeat(5,70px)_70px] bg-[#1A1D27] border-t border-[#2E3348] text-sm font-semibold">
        <div className="px-3 py-2 text-[#8B8FA3] uppercase text-xs tracking-wide">Daily Totals</div>
        {DAYS.map(d => (
          <div key={d.key} className="px-1 py-2 text-center font-mono text-accent">
            {(totals[d.key] || 0) > 0 ? totals[d.key].toFixed(1) : '—'}
          </div>
        ))}
        <div className="px-1 py-2 text-center font-mono text-green-400 text-base">
          {(totals.total || 0).toFixed(1)}
        </div>
      </div>
    </div>
  );
}
