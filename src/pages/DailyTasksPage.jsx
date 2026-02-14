import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Sparkles, Loader2, Clock, AlertTriangle, CheckCircle, MessageSquare } from 'lucide-react';
import { useSweepData } from '../hooks/useBoards';
import { useTimeBlocks, useClaudeSessions } from '../hooks/useTimeEntry';
import { getColumnText, daysSince, isWaiting, isActive } from '../utils/helpers';
import { SUBITEM_COLUMNS, FOLLOWUP_OVERDUE_DAYS } from '../utils/constants';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../contexts/ToastContext';

export default function DailyTasksPage() {
  const [aiTasks, setAiTasks] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const { myActive, stale, waiting } = useSweepData();
  const today = new Date().toISOString().split('T')[0];
  const timeBlocksQuery = useTimeBlocks(today, today);
  const claudeQuery = useClaudeSessions(today, today);

  // Build smart task list from Monday data
  const smartTasks = useMemo(() => {
    if (!myActive) return [];

    const tasks = myActive.map(sub => {
      const status = getColumnText(sub, SUBITEM_COLUMNS.STATUS);
      const priority = getColumnText(sub, SUBITEM_COLUMNS.PRIORITY);
      const pctComplete = getColumnText(sub, SUBITEM_COLUMNS.PERCENT_COMPLETE);
      const days = daysSince(sub.updated_at);
      const estHours = getColumnText(sub, SUBITEM_COLUMNS.ESTIMATED_TIME);

      let urgency = 0;
      if (priority === 'System Down') urgency += 100;
      if (priority === 'High') urgency += 50;
      if (priority === 'Medium') urgency += 20;
      if (isWaiting(status) && days >= FOLLOWUP_OVERDUE_DAYS) urgency += 40;
      if (isActive(status) && days >= 5) urgency += 30;
      if (isActive(status) && days >= 10) urgency += 20;

      let suggestedAction = '';
      if (isWaiting(status) && days >= FOLLOWUP_OVERDUE_DAYS) {
        suggestedAction = `Send follow-up (waiting ${days} days)`;
      } else if (isActive(status) && days >= 10) {
        suggestedAction = `Stale ${days}d - update status or post progress`;
      } else if (isActive(status) && parseInt(pctComplete) >= 80) {
        suggestedAction = 'Almost complete - finish and mark Done';
      } else if (isActive(status)) {
        suggestedAction = 'Continue working';
      } else if (isWaiting(status)) {
        suggestedAction = 'Monitor - check if blocker resolved';
      }

      return {
        ...sub,
        status,
        priority,
        pctComplete,
        daysSinceUpdate: days,
        estHours,
        urgency,
        suggestedAction,
      };
    });

    return tasks.sort((a, b) => b.urgency - a.urgency).slice(0, 15);
  }, [myActive]);

  async function generateAITasks() {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/daily-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subitems: smartTasks.map(t => ({
            name: t.name,
            client: t._clientName,
            status: t.status,
            priority: t.priority,
            daysSinceUpdate: t.daysSinceUpdate,
            pctComplete: t.pctComplete,
          })),
          timeBlocks: (timeBlocksQuery.data?.blocks || []).slice(0, 20).map(b => ({
            app: b.app, title: b.title, duration: b.durationMinutes, category: b.category,
          })),
          claudeSessions: (claudeQuery.data?.sessions || []).slice(0, 10).map(s => ({
            topic: s.topic, duration: s.durationMinutes, matchedTask: s.matchedTask?.name,
          })),
        }),
      });
      if (!res.ok) throw new Error('AI generation failed');
      const data = await res.json();
      setAiTasks(data);
      addToast('AI task list generated', 'success');
    } catch (err) {
      addToast('AI generation failed: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  const todayBlocks = timeBlocksQuery.data?.blocks || [];
  const todayHours = timeBlocksQuery.data?.summary?.totalHours || 0;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-5 py-4 border-b border-[#2E3348] bg-[#1A1D27] flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#E8E9ED]">
            Today's Focus — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </h2>
          <p className="text-xs text-[#5C6178] mt-0.5">
            {smartTasks.length} active tasks · {todayHours.toFixed(1)}h tracked today
          </p>
        </div>
        <button
          onClick={generateAITasks}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/40 rounded text-xs font-medium hover:bg-purple-500/30 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          AI Generate
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* AI Tasks (if generated) */}
        {aiTasks && (
          <div className="border border-purple-500/30 rounded-lg overflow-hidden mb-4">
            <div className="px-4 py-2.5 bg-purple-500/10 border-b border-purple-500/30">
              <span className="text-sm font-semibold text-purple-400">AI Recommendations</span>
            </div>
            <div className="bg-[#0F1117] p-4 space-y-3">
              {aiTasks.summary && (
                <p className="text-sm text-[#8B8FA3] mb-3">{aiTasks.summary}</p>
              )}
              {(aiTasks.tasks || []).map((task, i) => (
                <div key={i} className="bg-[#1A1D27] rounded-lg p-3 border border-[#2E3348]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-purple-500/20 text-purple-400 rounded-full w-6 h-6 flex items-center justify-center">
                      {task.rank || i + 1}
                    </span>
                    <span className="text-sm font-semibold text-[#E8E9ED]">{task.taskName}</span>
                    {task.client && (
                      <span className="text-xs font-mono text-accent">{task.client}</span>
                    )}
                  </div>
                  {task.reason && <p className="text-xs text-[#8B8FA3] ml-8">{task.reason}</p>}
                  {task.suggestedAction && (
                    <p className="text-xs text-green-400 ml-8 mt-1">{task.suggestedAction}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Smart Task List */}
        <div className="border border-[#2E3348] rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-[#1A1D27] border-b border-[#2E3348]">
            <span className="text-sm font-semibold text-[#E8E9ED]">Priority Tasks</span>
          </div>
          <div className="bg-[#0F1117] divide-y divide-[#2E3348]/50">
            {smartTasks.map((task, i) => (
              <div key={task.id} className="px-4 py-3 hover:bg-[#242836]/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono rounded-full w-6 h-6 flex items-center justify-center shrink-0 ${
                    i < 3 ? 'bg-orange-500/20 text-orange-400' : 'bg-[#2E3348] text-[#8B8FA3]'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="text-xs font-mono text-accent shrink-0">{task._clientShort}</span>
                  <span className="text-sm text-[#E8E9ED] flex-1 truncate">{task.name}</span>
                  <StatusBadge status={task.status} />
                </div>
                <div className="ml-9 mt-1 flex items-center gap-4 text-xs text-[#5C6178]">
                  {task.daysSinceUpdate >= 5 && (
                    <span className={task.daysSinceUpdate >= 10 ? 'text-red-400' : 'text-yellow-400'}>
                      <AlertTriangle size={10} className="inline mr-1" />
                      {task.daysSinceUpdate}d stale
                    </span>
                  )}
                  {task.pctComplete && <span>{task.pctComplete}% done</span>}
                  {task.estHours && <span>{task.estHours}h estimated</span>}
                  {task.suggestedAction && (
                    <span className="text-green-400">{task.suggestedAction}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Activity */}
        {todayBlocks.length > 0 && (
          <div className="border border-[#2E3348] rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-[#1A1D27] border-b border-[#2E3348]">
              <span className="text-sm font-semibold text-[#E8E9ED]">
                Activity So Far Today ({todayHours.toFixed(1)}h)
              </span>
            </div>
            <div className="bg-[#0F1117] divide-y divide-[#2E3348]/50">
              {todayBlocks.slice(0, 20).map(block => (
                <div key={block.id} className="flex items-center gap-3 px-4 py-2">
                  <span className="text-xs font-mono text-[#5C6178] w-20 shrink-0">
                    {formatTime(block.start)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#E8E9ED] truncate">{block.title || block.app}</p>
                  </div>
                  <span className="text-xs font-mono text-[#8B8FA3] shrink-0">
                    {Math.round(block.durationMinutes)}m
                  </span>
                  <span className="text-xs text-[#5C6178] bg-[#2E3348] rounded px-1.5 py-0.5 shrink-0">
                    {block.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  try {
    const d = new Date(timeStr.includes('T') ? timeStr : timeStr + 'Z');
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return '';
  }
}
