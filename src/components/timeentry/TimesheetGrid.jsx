import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Monitor, Clock } from 'lucide-react';
import TimesheetCell from './TimesheetCell';
import TaskRowHeader from './TaskRowHeader';

const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
];

function ActivityDetail({ sources }) {
  if (!sources || sources.length === 0) {
    return (
      <div className="text-xs text-[#5C6178] italic px-3 py-2">
        No activity detail (manually added row)
      </div>
    );
  }

  // Group sources by day, then by app
  const byDay = {};
  for (const s of sources) {
    const day = s.day || 'unknown';
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(s);
  }

  // Sort days chronologically
  const sortedDays = Object.keys(byDay).sort();

  return (
    <div className="space-y-1.5 px-3 py-2">
      {sortedDays.map(day => {
        const blocks = byDay[day];
        // Group by app within the day
        const byApp = {};
        for (const b of blocks) {
          const app = b.app || 'Unknown';
          if (!byApp[app]) byApp[app] = { mins: 0, titles: new Set() };
          byApp[app].mins += b.durationMinutes || 0;
          if (b.title) byApp[app].titles.add(b.title);
        }

        const dayLabel = (() => {
          try {
            const d = new Date(day + 'T12:00:00');
            return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          } catch { return day; }
        })();

        const dayTotal = blocks.reduce((s, b) => s + (b.durationMinutes || 0), 0);

        return (
          <div key={day}>
            <div className="flex items-center gap-2 text-[10px] text-[#8B8FA3] font-medium uppercase tracking-wide mb-0.5">
              <span>{dayLabel}</span>
              <span className="text-[#5C6178]">({Math.round(dayTotal)}min)</span>
            </div>
            {Object.entries(byApp).map(([app, data]) => {
              const titles = [...data.titles];
              return (
                <div key={app} className="flex items-start gap-2 ml-2 py-0.5">
                  <Monitor size={10} className="text-[#5C6178] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] text-[#8B8FA3]">{app}</span>
                    <span className="text-[10px] text-[#5C6178] ml-1">
                      ({Math.round(data.mins)}min)
                    </span>
                    {titles.length > 0 && (
                      <p className="text-[10px] text-[#5C6178] truncate leading-tight">
                        {titles.slice(0, 3).join(' · ')}
                        {titles.length > 3 && ` +${titles.length - 3} more`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function TimesheetGrid({ rows, totals, weekDays, onSetHours, onRemoveRow }) {
  const [expandedRow, setExpandedRow] = useState(null);

  // Separate rows with hours from empty ones
  const activeRows = rows.filter(r => DAYS.some(d => (r.hours[d.key] || 0) > 0));
  const emptyRows = rows.filter(r => !DAYS.some(d => (r.hours[d.key] || 0) > 0));

  return (
    <div className="border border-[#2E3348] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_repeat(5,64px)_60px] bg-[#1A1D27] border-b border-[#2E3348] text-xs font-medium text-[#8B8FA3]">
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
        <>
          {/* Active rows (with hours) */}
          {activeRows.map(row => {
            const rowTotal = DAYS.reduce((sum, d) => sum + (row.hours[d.key] || 0), 0);
            const isExpanded = expandedRow === row.id;
            return (
              <div key={row.id}>
                <div
                  className={`grid grid-cols-[1fr_repeat(5,64px)_60px] border-b border-[#2E3348]/50 hover:bg-[#242836]/30 transition-colors ${isExpanded ? 'bg-[#242836]/20' : ''}`}
                >
                  <div
                    className="px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
                    onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                  >
                    <div className="text-[#5C6178] shrink-0">
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <TaskRowHeader row={row} onRemove={onRemoveRow} />
                    </div>
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
                {/* Expandable activity detail */}
                {isExpanded && (
                  <div className="bg-[#0F1117] border-b border-[#2E3348]/50">
                    <ActivityDetail sources={row.sources} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty rows (matched but no hours after rounding) */}
          {emptyRows.length > 0 && (
            <div className="border-t border-dashed border-[#2E3348]/50">
              <div className="px-3 py-1.5 text-[10px] text-[#5C6178] uppercase tracking-wide bg-[#0F1117]">
                Matched but &lt;15min total ({emptyRows.length} tasks)
              </div>
              {emptyRows.map(row => {
                const isExpanded = expandedRow === row.id;
                return (
                  <div key={row.id}>
                    <div
                      className={`grid grid-cols-[1fr_repeat(5,64px)_60px] border-b border-[#2E3348]/30 opacity-60 hover:opacity-100 transition-opacity cursor-pointer ${isExpanded ? 'opacity-100 bg-[#242836]/20' : ''}`}
                      onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                    >
                      <div className="px-3 py-1 flex items-center gap-1.5">
                        <div className="text-[#5C6178] shrink-0">
                          {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <TaskRowHeader row={row} onRemove={onRemoveRow} />
                        </div>
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
                      <div className="px-1 py-1.5 text-center text-xs font-mono text-[#5C6178]">—</div>
                    </div>
                    {isExpanded && (
                      <div className="bg-[#0F1117] border-b border-[#2E3348]/30">
                        <ActivityDetail sources={row.sources} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Totals row */}
      <div className="grid grid-cols-[1fr_repeat(5,64px)_60px] bg-[#1A1D27] border-t border-[#2E3348] text-sm font-semibold">
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
