export function matchClaudeSessions(blocks, tasks) {
  const claudeBlocks = blocks.filter(b =>
    (b.app || '').toLowerCase().includes('claude') ||
    (b.title || '').toLowerCase().includes('claude')
  );

  const matches = [];

  for (const block of claudeBlocks) {
    const title = (block.title || '').toLowerCase();

    // Extract topic from title (remove "Claude" prefix/suffix)
    const topic = title
      .replace(/^claude\s*[-–—]?\s*/i, '')
      .replace(/\s*[-–—]?\s*claude$/i, '')
      .replace(/\s*[-–—]\s*opera.*$/i, '')
      .trim();

    if (!topic || topic === 'claude') {
      matches.push({
        ...block,
        topic: 'General Claude session',
        matchedTask: null,
        confidence: 'none',
      });
      continue;
    }

    // Try to match topic to task names
    const topicWords = topic.split(/[\s\-_/]+/).filter(w => w.length >= 3);
    let bestTask = null;
    let bestScore = 0;

    for (const task of tasks) {
      const taskName = (task.name || '').toLowerCase();
      const parentName = (task._parentName || '').toLowerCase();
      let score = 0;

      for (const word of topicWords) {
        if (taskName.includes(word)) score += 2;
        if (parentName.includes(word)) score += 1;
      }

      if (score > bestScore) {
        bestScore = score;
        bestTask = task;
      }
    }

    matches.push({
      ...block,
      topic: topic || 'General Claude session',
      matchedTask: bestScore >= 2 ? {
        id: bestTask.id,
        name: bestTask.name,
        _clientName: bestTask._clientName,
        _clientShort: bestTask._clientShort,
        _parentName: bestTask._parentName,
      } : null,
      confidence: bestScore >= 3 ? 'high' : bestScore >= 2 ? 'medium' : 'low',
    });
  }

  return matches;
}
