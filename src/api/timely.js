export async function fetchTimeBlocks(startDate, endDate) {
  const res = await fetch(`/api/timely/blocks?start=${startDate}&end=${endDate}`);
  if (!res.ok) throw new Error('Failed to fetch time blocks');
  return res.json();
}

export async function fetchMatchedBlocks(startDate, endDate, tasks) {
  const res = await fetch('/api/timely/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start: startDate, end: endDate, tasks }),
  });
  if (!res.ok) throw new Error('Failed to match time blocks');
  return res.json();
}

export async function fetchTimelyStats() {
  const res = await fetch('/api/timely/stats');
  if (!res.ok) throw new Error('Failed to fetch Timely stats');
  return res.json();
}

export async function fetchClaudeSessions(startDate, endDate, tasks) {
  const res = await fetch('/api/timely/claude-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start: startDate, end: endDate, tasks }),
  });
  if (!res.ok) throw new Error('Failed to fetch Claude sessions');
  return res.json();
}

export async function fetchAppBreakdown(startDate, endDate) {
  const res = await fetch(`/api/timely/apps?start=${startDate}&end=${endDate}`);
  if (!res.ok) throw new Error('Failed to fetch app breakdown');
  return res.json();
}
