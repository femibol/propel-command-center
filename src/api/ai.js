export async function generateSuggestion(subitem, context) {
  const res = await fetch('/api/ai/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subitem, context }),
  });
  if (!res.ok) throw new Error('AI suggestion failed');
  return res.json();
}

export async function generateDailyTasks(subitems, timeBlocks, claudeSessions) {
  const res = await fetch('/api/ai/daily-tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subitems, timeBlocks, claudeSessions }),
  });
  if (!res.ok) throw new Error('Daily tasks generation failed');
  return res.json();
}

export async function reviewMatches(unmatchedBlocks, availableTasks) {
  const res = await fetch('/api/ai/match-review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ unmatchedBlocks, availableTasks }),
  });
  if (!res.ok) throw new Error('Match review failed');
  return res.json();
}
