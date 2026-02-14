import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, AlertTriangle, Clock, Zap, Target } from 'lucide-react';
import { useSweepData } from '../hooks/useBoards';
import { getColumnText, daysSince, isWaiting } from '../utils/helpers';
import { SUBITEM_COLUMNS, FOLLOWUP_OVERDUE_DAYS } from '../utils/constants';

export default function AIInsightsPanel() {
  const [expanded, setExpanded] = useState(true);
  const { myActive, stale, waiting, quickWins, highPriority } = useSweepData();

  // Compute insights from cached data (no API call)
  const overdueFollowups = waiting.filter(s => daysSince(s.updated_at) >= FOLLOWUP_OVERDUE_DAYS);
  const stalledHighPriority = highPriority.filter(s => daysSince(s.updated_at) >= 5);
  const nearlyComplete = myActive.filter(s => {
    const pct = parseInt(getColumnText(s, SUBITEM_COLUMNS.PERCENT_COMPLETE)) || 0;
    return pct >= 80;
  });
  const noEstimate = myActive.filter(s => {
    const est = parseFloat(getColumnText(s, SUBITEM_COLUMNS.ESTIMATED_TIME));
    return !est || est === 0;
  });

  const insights = [];

  if (overdueFollowups.length > 0) {
    insights.push({
      icon: Clock,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: `${overdueFollowups.length} item${overdueFollowups.length > 1 ? 's' : ''} overdue for follow-up`,
      detail: 'Waiting items with no update for 7+ days. Send a follow-up message.',
    });
  }

  if (stalledHighPriority.length > 0) {
    insights.push({
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: `${stalledHighPriority.length} high-priority item${stalledHighPriority.length > 1 ? 's' : ''} stalled`,
      detail: 'High/System Down items with no update for 5+ days need attention.',
    });
  }

  if (nearlyComplete.length > 0) {
    insights.push({
      icon: Target,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: `${nearlyComplete.length} item${nearlyComplete.length > 1 ? 's' : ''} nearly complete - close them out!`,
      detail: 'Items at 80%+ completion. A quick push can clear these from your queue.',
    });
  }

  if (quickWins.length > 0) {
    insights.push({
      icon: Zap,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: `${quickWins.length} quick win${quickWins.length > 1 ? 's' : ''} available`,
      detail: 'Small tasks, support tickets, and nearly-done items you can knock out fast.',
    });
  }

  if (noEstimate.length > 5) {
    insights.push({
      icon: AlertTriangle,
      color: 'text-gray-400',
      bg: 'bg-gray-500/10',
      border: 'border-gray-500/30',
      text: `${noEstimate.length} items missing time estimates`,
      detail: 'Adding estimates improves planning accuracy and time tracking.',
    });
  }

  if (insights.length === 0) return null;

  return (
    <div className="bg-[#1A1D27] border border-purple-500/20 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-[#242836] transition-colors"
      >
        <Sparkles size={14} className="text-purple-400" />
        <span className="text-xs font-semibold text-purple-300">AI Insights</span>
        <span className="text-[10px] text-[#5C6178] ml-1">
          {insights.length} suggestion{insights.length > 1 ? 's' : ''}
        </span>
        <div className="flex-1" />
        {expanded ? <ChevronUp size={14} className="text-[#5C6178]" /> : <ChevronDown size={14} className="text-[#5C6178]" />}
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {insights.map((insight, i) => {
            const Icon = insight.icon;
            return (
              <div key={i} className={`flex items-start gap-3 p-2.5 rounded-lg ${insight.bg} border ${insight.border}`}>
                <Icon size={14} className={`${insight.color} mt-0.5 shrink-0`} />
                <div>
                  <p className={`text-xs font-medium ${insight.color}`}>{insight.text}</p>
                  <p className="text-[10px] text-[#8B8FA3] mt-0.5">{insight.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
