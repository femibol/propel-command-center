import {
  TERMINAL_STATUSES,
  WAITING_STATUSES,
  ACTIVE_STATUSES,
  PRIORITY_ORDER,
  STALE_THRESHOLD_DAYS,
  FOLLOWUP_OVERDUE_DAYS,
  TEAM_MEMBER,
  SUBITEM_COLUMNS,
} from './constants';

// --- Filtering ---

export function isAssignedToMe(subitem) {
  const team = getColumnText(subitem, SUBITEM_COLUMNS.NAW_TEAM);
  return team.toLowerCase().includes(TEAM_MEMBER.toLowerCase());
}

export function isTerminal(status) {
  return TERMINAL_STATUSES.includes(status);
}

export function isWaiting(status) {
  return WAITING_STATUSES.includes(status);
}

export function isActive(status) {
  return ACTIVE_STATUSES.includes(status);
}

export function filterMyActiveItems(subitems) {
  return subitems.filter((sub) => {
    const status = getColumnText(sub, SUBITEM_COLUMNS.STATUS);
    return isAssignedToMe(sub) && !isTerminal(status);
  });
}

export function filterStaleItems(subitems) {
  return subitems.filter((sub) => {
    const status = getColumnText(sub, SUBITEM_COLUMNS.STATUS);
    const days = daysSince(sub.updated_at);
    return (
      isAssignedToMe(sub) &&
      !isTerminal(status) &&
      !isWaiting(status) &&
      days >= STALE_THRESHOLD_DAYS
    );
  });
}

export function filterWaitingItems(subitems) {
  return subitems.filter((sub) => {
    const status = getColumnText(sub, SUBITEM_COLUMNS.STATUS);
    return isAssignedToMe(sub) && isWaiting(status);
  });
}

export function filterCPMissing(subitems) {
  return subitems.filter((sub) => {
    const status = getColumnText(sub, SUBITEM_COLUMNS.STATUS);
    const cpProject = getColumnText(sub, SUBITEM_COLUMNS.CP_PROJECT);
    const cpTask = getColumnText(sub, SUBITEM_COLUMNS.CP_TASK);
    return (
      isAssignedToMe(sub) &&
      (status === 'Done' || status === 'Pending Close') &&
      (!cpProject || !cpTask)
    );
  });
}

// --- Sorting ---

export function sortByPriority(a, b) {
  const pa = PRIORITY_ORDER[getColumnText(a, SUBITEM_COLUMNS.PRIORITY)] ?? 4;
  const pb = PRIORITY_ORDER[getColumnText(b, SUBITEM_COLUMNS.PRIORITY)] ?? 4;
  if (pa !== pb) return pa - pb;
  // Secondary sort: active statuses before waiting
  const sa = getColumnText(a, SUBITEM_COLUMNS.STATUS);
  const sb = getColumnText(b, SUBITEM_COLUMNS.STATUS);
  const aActive = isActive(sa) ? 0 : 1;
  const bActive = isActive(sb) ? 0 : 1;
  return aActive - bActive;
}

// --- Column value helpers ---

export function getColumnText(item, columnId) {
  if (!item.column_values) return '';
  // column_values can be an array or object depending on query shape
  if (Array.isArray(item.column_values)) {
    const col = item.column_values.find((c) => c.id === columnId);
    return col?.text || '';
  }
  return item.column_values[columnId]?.text || item.column_values[columnId] || '';
}

export function getColumnValue(item, columnId) {
  if (!item.column_values) return null;
  if (Array.isArray(item.column_values)) {
    const col = item.column_values.find((c) => c.id === columnId);
    return col?.value ? JSON.parse(col.value) : null;
  }
  return item.column_values[columnId] || null;
}

// --- Date helpers ---

export function daysSince(dateStr) {
  if (!dateStr) return 999;
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatRelative(dateStr) {
  const days = daysSince(dateStr);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function timeSinceRefresh(timestamp) {
  if (!timestamp) return 'Never';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export function isWithinWeek(timelineStr, weekStart, weekEnd) {
  if (!timelineStr) return false;
  try {
    const parsed = typeof timelineStr === 'string' ? JSON.parse(timelineStr) : timelineStr;
    const from = new Date(parsed.from);
    const to = new Date(parsed.to);
    return from <= weekEnd && to >= weekStart;
  } catch {
    return false;
  }
}

export function getWaitingOn(status) {
  if (!status) return '';
  const match = status.match(/Waiting\s*-\s*(.+)/);
  return match ? match[1].trim() : '';
}

export function staleColor(days) {
  if (days >= 15) return 'text-red-400';
  if (days >= 8) return 'text-orange-400';
  return 'text-yellow-400';
}

// --- Quick Win helpers ---

export function quickWinScore(sub) {
  let score = 0;
  const pct = parseInt(getColumnText(sub, SUBITEM_COLUMNS.PERCENT_COMPLETE)) || 0;
  const est = parseFloat(getColumnText(sub, SUBITEM_COLUMNS.ESTIMATED_TIME)) || 999;
  const type = getColumnText(sub, SUBITEM_COLUMNS.TYPE);
  const status = getColumnText(sub, SUBITEM_COLUMNS.STATUS);
  const team = getColumnText(sub, SUBITEM_COLUMNS.NAW_TEAM);

  if (pct >= 90) score += 80;
  else if (pct >= 80) score += 50;
  if (est <= 1) score += 60;
  else if (est <= 2) score += 40;
  else if (est <= 4) score += 15;
  if (type?.toLowerCase().includes('support')) score += 30;
  if (status === 'New' || status === 'Not Started') score += 20;
  if (!team) score += 15;

  return score;
}

export function filterQuickWins(subitems) {
  return subitems.filter(sub => {
    const status = getColumnText(sub, SUBITEM_COLUMNS.STATUS);
    if (isTerminal(status)) return false;
    if (!isAssignedToMe(sub) && getColumnText(sub, SUBITEM_COLUMNS.NAW_TEAM)) return false;
    return quickWinScore(sub) >= 30;
  }).sort((a, b) => quickWinScore(b) - quickWinScore(a));
}

export function getQuickWinBadges(sub) {
  const badges = [];
  const pct = parseInt(getColumnText(sub, SUBITEM_COLUMNS.PERCENT_COMPLETE)) || 0;
  const est = parseFloat(getColumnText(sub, SUBITEM_COLUMNS.ESTIMATED_TIME)) || 0;
  const type = getColumnText(sub, SUBITEM_COLUMNS.TYPE);
  const team = getColumnText(sub, SUBITEM_COLUMNS.NAW_TEAM);
  const status = getColumnText(sub, SUBITEM_COLUMNS.STATUS);

  if (pct >= 90) badges.push({ label: `${pct}% Done`, color: 'bg-green-500/20 text-green-400' });
  else if (pct >= 80) badges.push({ label: `${pct}% Done`, color: 'bg-emerald-500/20 text-emerald-400' });
  if (est > 0 && est <= 2) badges.push({ label: `${est}h est`, color: 'bg-blue-500/20 text-blue-400' });
  if (type?.toLowerCase().includes('support')) badges.push({ label: 'Support', color: 'bg-orange-500/20 text-orange-400' });
  if (!team) badges.push({ label: 'Unassigned', color: 'bg-yellow-500/20 text-yellow-400' });
  if (status === 'New' || status === 'Not Started') badges.push({ label: 'New', color: 'bg-gray-500/20 text-gray-400' });

  return badges;
}

// --- AI Badge helpers ---

export function shouldShowAIBadge(subitem) {
  const status = getColumnText(subitem, SUBITEM_COLUMNS.STATUS);
  const days = daysSince(subitem.updated_at);
  const priority = getColumnText(subitem, SUBITEM_COLUMNS.PRIORITY);

  return (
    (isWaiting(status) && days >= FOLLOWUP_OVERDUE_DAYS) ||
    (!isTerminal(status) && !isWaiting(status) && days >= 10) ||
    priority === 'System Down' || priority === 'High'
  );
}
