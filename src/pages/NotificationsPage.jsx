import React, { useState } from 'react';
import { Bell, Clock, AlertTriangle, MessageSquare, Sparkles, Loader2, Copy, Send } from 'lucide-react';
import { useSweepData, usePostUpdate } from '../hooks/useBoards';
import { getColumnText, daysSince, getWaitingOn } from '../utils/helpers';
import { SUBITEM_COLUMNS, FOLLOWUP_OVERDUE_DAYS } from '../utils/constants';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../contexts/ToastContext';

export default function NotificationsPage() {
  const { stale, waiting, cpMissing } = useSweepData();
  const { addToast } = useToast();

  // Build notification items
  const notifications = [];

  // Overdue follow-ups
  for (const sub of waiting || []) {
    const days = daysSince(sub.updated_at);
    if (days >= FOLLOWUP_OVERDUE_DAYS) {
      const status = getColumnText(sub, SUBITEM_COLUMNS.STATUS);
      notifications.push({
        id: `wait-${sub.id}`,
        type: 'followup',
        urgency: days >= 14 ? 'critical' : 'warning',
        title: sub.name,
        client: sub._clientName,
        clientShort: sub._clientShort,
        status,
        waitingOn: getWaitingOn(status),
        days,
        subitem: sub,
        message: `Waiting ${days} days on ${getWaitingOn(status)} — needs follow-up`,
      });
    }
  }

  // Stale items
  for (const sub of stale || []) {
    const days = daysSince(sub.updated_at);
    notifications.push({
      id: `stale-${sub.id}`,
      type: 'stale',
      urgency: days >= 15 ? 'critical' : days >= 10 ? 'warning' : 'info',
      title: sub.name,
      client: sub._clientName,
      clientShort: sub._clientShort,
      status: getColumnText(sub, SUBITEM_COLUMNS.STATUS),
      days,
      subitem: sub,
      message: `Not updated in ${days} days — review and update status`,
    });
  }

  // CP Missing
  for (const sub of cpMissing || []) {
    notifications.push({
      id: `cp-${sub.id}`,
      type: 'cp',
      urgency: 'info',
      title: sub.name,
      client: sub._clientName,
      clientShort: sub._clientShort,
      status: getColumnText(sub, SUBITEM_COLUMNS.STATUS),
      days: daysSince(sub.updated_at),
      subitem: sub,
      message: 'Missing ChangePoint project/task mapping — needed for time entry',
    });
  }

  // Sort by urgency
  const urgencyOrder = { critical: 0, warning: 1, info: 2 };
  notifications.sort((a, b) => (urgencyOrder[a.urgency] || 9) - (urgencyOrder[b.urgency] || 9));

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-5 py-4 border-b border-[#2E3348] bg-[#1A1D27] flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#E8E9ED]">Notifications</h2>
          <p className="text-xs text-[#5C6178] mt-0.5">
            {notifications.length} items need your attention
          </p>
        </div>
        <div className="flex gap-2">
          <StatBadge count={notifications.filter(n => n.urgency === 'critical').length} label="Critical" color="red" />
          <StatBadge count={notifications.filter(n => n.urgency === 'warning').length} label="Warning" color="orange" />
          <StatBadge count={notifications.filter(n => n.urgency === 'info').length} label="Info" color="blue" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell size={32} className="text-[#5C6178] mx-auto mb-3" />
            <p className="text-[#8B8FA3]">All clear — no notifications right now.</p>
          </div>
        ) : (
          notifications.map(notif => (
            <NotificationCard key={notif.id} notification={notif} />
          ))
        )}
      </div>
    </div>
  );
}

function NotificationCard({ notification }) {
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const postUpdate = usePostUpdate();
  const { addToast } = useToast();

  const borderColor = {
    critical: 'border-red-500/40',
    warning: 'border-orange-500/40',
    info: 'border-blue-500/40',
  }[notification.urgency] || 'border-[#2E3348]';

  const iconColor = {
    critical: 'text-red-400',
    warning: 'text-orange-400',
    info: 'text-blue-400',
  }[notification.urgency];

  const TypeIcon = {
    followup: Clock,
    stale: AlertTriangle,
    cp: MessageSquare,
  }[notification.type] || Bell;

  async function handleGetSuggestion() {
    setLoading(true);
    setExpanded(true);
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subitem: {
            name: notification.title,
            _clientName: notification.client,
          },
          context: {
            status: notification.status,
            daysSinceUpdate: notification.days,
            waitingOn: notification.waitingOn,
            type: notification.type,
          },
        }),
      });
      if (!res.ok) throw new Error('AI unavailable');
      const data = await res.json();
      setAiSuggestion(data.suggestion);
    } catch (err) {
      addToast('AI suggestion failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleSendUpdate(text) {
    postUpdate.mutate(
      { itemId: notification.subitem.id, body: text },
      {
        onSuccess: () => addToast('Update posted', 'success'),
        onError: () => addToast('Failed to post update', 'error'),
      }
    );
  }

  return (
    <div className={`border ${borderColor} rounded-lg overflow-hidden bg-[#1A1D27]`}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#242836] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <TypeIcon size={16} className={iconColor} />
        <span className="text-xs font-mono text-accent shrink-0">{notification.clientShort}</span>
        <span className="text-sm text-[#E8E9ED] flex-1 truncate">{notification.title}</span>
        <StatusBadge status={notification.status} />
        <span className={`text-xs font-mono shrink-0 ${
          notification.days >= 14 ? 'text-red-400' : notification.days >= 7 ? 'text-orange-400' : 'text-[#8B8FA3]'
        }`}>
          {notification.days}d
        </span>
      </div>

      {expanded && (
        <div className="px-4 py-3 border-t border-[#2E3348] bg-[#0F1117] space-y-3">
          <p className="text-sm text-[#8B8FA3]">{notification.message}</p>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGetSuggestion}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 text-purple-400 border border-purple-500/40 rounded text-xs font-medium hover:bg-purple-500/30 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              AI Suggest Replies
            </button>
          </div>

          {aiSuggestion && (
            <div className="bg-[#1A1D27] rounded p-3 border border-purple-500/20">
              <p className="text-xs font-medium text-purple-400 uppercase tracking-wide mb-2">AI Suggestions</p>
              <div className="text-sm text-[#E8E9ED] whitespace-pre-wrap leading-relaxed">{aiSuggestion}</div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { navigator.clipboard.writeText(aiSuggestion); addToast('Copied to clipboard', 'info'); }}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-[#8B8FA3] hover:text-[#E8E9ED] transition-colors"
                >
                  <Copy size={10} /> Copy
                </button>
                <button
                  onClick={() => handleSendUpdate(aiSuggestion)}
                  disabled={postUpdate.isPending}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-accent hover:text-blue-300 transition-colors"
                >
                  <Send size={10} /> Post as Update
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatBadge({ count, label, color }) {
  if (count === 0) return null;
  const colors = {
    red: 'bg-red-500/20 text-red-400 border-red-500/40',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  };
  return (
    <span className={`text-xs border rounded-full px-2.5 py-0.5 ${colors[color]}`}>
      {count} {label}
    </span>
  );
}
