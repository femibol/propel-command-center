import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let urlMappings = null;

function loadMappings() {
  if (urlMappings) return urlMappings;
  try {
    const raw = readFileSync(join(__dirname, '..', 'config', 'urlMappings.json'), 'utf-8');
    urlMappings = JSON.parse(raw);
  } catch {
    urlMappings = { patterns: [], appCategories: {} };
  }
  return urlMappings;
}

function matchByUrl(block, tasks) {
  if (!block.url) return null;

  const mappings = loadMappings();
  const url = block.url.toLowerCase();

  for (const pattern of mappings.patterns) {
    if (url.includes(pattern.domain.toLowerCase())) {
      // Found the client, now try to match specific task
      const clientTasks = tasks.filter(t =>
        t._clientShort === pattern.boardShort || t._clientName === pattern.client
      );

      if (clientTasks.length === 0) {
        return {
          task: null,
          client: pattern.client,
          clientShort: pattern.boardShort,
          confidence: 'medium',
          reason: `URL matches ${pattern.client} (${pattern.domain})`,
        };
      }

      // Try to match by URL path keywords
      const urlPath = url.split(pattern.domain)[1] || '';
      const bestTask = findBestTaskMatch(urlPath, clientTasks);

      if (bestTask) {
        return {
          task: bestTask.task,
          client: pattern.client,
          clientShort: pattern.boardShort,
          confidence: bestTask.score > 2 ? 'high' : 'medium',
          reason: `URL domain + keyword match: "${bestTask.keyword}"`,
        };
      }

      // Default to first active task for this client
      return {
        task: clientTasks[0],
        client: pattern.client,
        clientShort: pattern.boardShort,
        confidence: 'low',
        reason: `URL matches client ${pattern.client}, assigned to first task`,
      };
    }
  }

  return null;
}

function matchByTitle(block, tasks) {
  if (!block.title) return null;

  const title = block.title.toLowerCase();

  // Check client names in title
  for (const task of tasks) {
    const clientName = (task._clientName || '').toLowerCase();
    const clientShort = (task._clientShort || '').toLowerCase();
    const taskName = (task.name || '').toLowerCase();

    if (clientName && title.includes(clientName)) {
      return {
        task,
        client: task._clientName,
        clientShort: task._clientShort,
        confidence: 'medium',
        reason: `Window title contains client name "${task._clientName}"`,
      };
    }

    if (clientShort && clientShort.length >= 3 && title.includes(clientShort)) {
      return {
        task,
        client: task._clientName,
        clientShort: task._clientShort,
        confidence: 'low',
        reason: `Window title contains client code "${task._clientShort}"`,
      };
    }
  }

  // Check task name keywords in title
  const bestMatch = findBestTaskMatch(title, tasks);
  if (bestMatch && bestMatch.score >= 2) {
    return {
      task: bestMatch.task,
      client: bestMatch.task._clientName,
      clientShort: bestMatch.task._clientShort,
      confidence: bestMatch.score >= 3 ? 'high' : 'medium',
      reason: `Window title keyword match: "${bestMatch.keyword}"`,
    };
  }

  return null;
}

function findBestTaskMatch(text, tasks) {
  const textLower = text.toLowerCase();
  let bestScore = 0;
  let bestTask = null;
  let bestKeyword = '';

  for (const task of tasks) {
    const taskWords = (task.name || '')
      .toLowerCase()
      .split(/[\s\-_/]+/)
      .filter(w => w.length >= 3);

    let score = 0;
    let matchedKeyword = '';

    for (const word of taskWords) {
      if (textLower.includes(word)) {
        score++;
        matchedKeyword = matchedKeyword ? matchedKeyword + ', ' + word : word;
      }
    }

    // Also check parent name
    const parentWords = (task._parentName || '')
      .toLowerCase()
      .split(/[\s\-_/]+/)
      .filter(w => w.length >= 3);

    for (const word of parentWords) {
      if (textLower.includes(word)) {
        score += 0.5;
        if (!matchedKeyword) matchedKeyword = word;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestTask = task;
      bestKeyword = matchedKeyword;
    }
  }

  return bestTask ? { task: bestTask, score: bestScore, keyword: bestKeyword } : null;
}

export function matchBlocks(blocks, tasks) {
  const matched = [];
  const unmatched = [];

  for (const block of blocks) {
    // Skip very short blocks
    if (block.durationMinutes < 2) {
      continue;
    }

    // Try URL match first (highest confidence)
    let match = matchByUrl(block, tasks);

    // Then try title match
    if (!match) {
      match = matchByTitle(block, tasks);
    }

    if (match) {
      matched.push({
        ...block,
        matchedTask: match.task ? {
          id: match.task.id,
          name: match.task.name,
          _parentName: match.task._parentName,
          _clientName: match.task._clientName,
          _clientShort: match.task._clientShort,
        } : null,
        matchedClient: match.client,
        matchedClientShort: match.clientShort,
        matchConfidence: match.confidence,
        matchReason: match.reason,
      });
    } else {
      unmatched.push({
        ...block,
        matchedTask: null,
        matchedClient: null,
        matchedClientShort: null,
        matchConfidence: null,
        matchReason: 'No match found',
      });
    }
  }

  return { matched, unmatched };
}

export function buildTimesheetRows(matched, unmatched) {
  const rows = {};

  for (const block of matched) {
    const key = block.matchedTask
      ? `task-${block.matchedTask.id}`
      : `client-${block.matchedClientShort || 'unknown'}`;

    if (!rows[key]) {
      rows[key] = {
        id: key,
        task: block.matchedTask,
        client: block.matchedClient || 'Unknown',
        clientShort: block.matchedClientShort || '???',
        projectName: block.matchedTask?.name || block.matchedClient || 'Unknown',
        parentName: block.matchedTask?._parentName || '',
        hours: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0 },
        sources: [],
        isManual: false,
      };
    }

    // Determine day of week
    const dayOfWeek = getDayOfWeek(block.day);
    if (dayOfWeek) {
      rows[key].hours[dayOfWeek] += block.durationHours;
      rows[key].sources.push(block);
    }
  }

  // Round hours to nearest 0.25
  for (const row of Object.values(rows)) {
    for (const day of ['mon', 'tue', 'wed', 'thu', 'fri']) {
      row.hours[day] = Math.round(row.hours[day] * 4) / 4;
    }
  }

  return {
    rows: Object.values(rows),
    unmatched,
  };
}

function getDayOfWeek(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDay();
  const map = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri' };
  return map[day] || null;
}
