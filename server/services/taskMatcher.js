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

// ─── URL-based matching (highest confidence) ───
function matchByUrl(block, tasks) {
  if (!block.url) return null;

  const mappings = loadMappings();
  const url = block.url.toLowerCase();

  for (const pattern of mappings.patterns) {
    if (url.includes(pattern.domain.toLowerCase())) {
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

      if (bestTask && bestTask.score >= 1) {
        return {
          task: bestTask.task,
          client: pattern.client,
          clientShort: pattern.boardShort,
          confidence: bestTask.score > 2 ? 'high' : 'medium',
          reason: `URL domain + keyword: "${bestTask.keyword}"`,
        };
      }

      // Default to first active task for this client
      return {
        task: clientTasks[0],
        client: pattern.client,
        clientShort: pattern.boardShort,
        confidence: 'low',
        reason: `URL matches client ${pattern.client}`,
      };
    }
  }

  // Check for ".acumatica.com" in URL even if not in patterns
  // This catches any Acumatica instance
  if (url.includes('.acumatica.com')) {
    const domainMatch = url.match(/([a-z0-9-]+)\.acumatica\.com/);
    if (domainMatch) {
      const subdomain = domainMatch[1];
      // Try fuzzy match subdomain against client names/shorts
      for (const task of tasks) {
        const clientLower = (task._clientName || '').toLowerCase().replace(/[^a-z]/g, '');
        const shortLower = (task._clientShort || '').toLowerCase();
        if (clientLower.includes(subdomain) || subdomain.includes(clientLower) ||
            subdomain.includes(shortLower)) {
          return {
            task,
            client: task._clientName,
            clientShort: task._clientShort,
            confidence: 'medium',
            reason: `Acumatica URL subdomain "${subdomain}" ~ ${task._clientShort}`,
          };
        }
      }
      // Still Acumatica but unknown client — mark as general ERP
      return {
        task: null,
        client: 'Acumatica (Unknown)',
        clientShort: 'ACU',
        confidence: 'low',
        reason: `Acumatica URL: ${subdomain}.acumatica.com`,
      };
    }
  }

  return null;
}

// ─── Title-based matching (medium confidence) ───
function matchByTitle(block, tasks) {
  if (!block.title) return null;

  const title = block.title.toLowerCase();

  // 1. Check for Acumatica screen IDs in title (e.g., AP303000, SO301000)
  const screenMatch = title.match(/[a-z]{2}\d{6}/i);
  if (screenMatch) {
    // This is definitely Acumatica work — try to find which client
    // Use URL if available, otherwise check recent context
    for (const task of tasks) {
      const taskName = (task.name || '').toLowerCase();
      if (taskName.includes(screenMatch[0].toLowerCase())) {
        return {
          task,
          client: task._clientName,
          clientShort: task._clientShort,
          confidence: 'high',
          reason: `Acumatica screen ${screenMatch[0]} in task name`,
        };
      }
    }
  }

  // 2. Check full client names in title
  for (const task of tasks) {
    const clientName = (task._clientName || '').toLowerCase();
    if (clientName && clientName.length >= 4 && title.includes(clientName)) {
      return {
        task,
        client: task._clientName,
        clientShort: task._clientShort,
        confidence: 'medium',
        reason: `Title contains client "${task._clientName}"`,
      };
    }
  }

  // 3. Check client short codes (only 3+ chars, and only if the short code
  //    appears as a separate word or clear substring to avoid false positives)
  for (const task of tasks) {
    const shortCode = (task._clientShort || '').toLowerCase();
    if (shortCode && shortCode.length >= 3) {
      // Match as word boundary to avoid "USA" matching "usage" etc.
      const regex = new RegExp(`\\b${shortCode}\\b`, 'i');
      if (regex.test(block.title)) {
        return {
          task,
          client: task._clientName,
          clientShort: task._clientShort,
          confidence: 'low',
          reason: `Title contains client code "${task._clientShort}"`,
        };
      }
    }
  }

  // 4. Check task name keywords in title (lowered threshold: score >= 1)
  const bestMatch = findBestTaskMatch(title, tasks);
  if (bestMatch && bestMatch.score >= 1) {
    return {
      task: bestMatch.task,
      client: bestMatch.task._clientName,
      clientShort: bestMatch.task._clientShort,
      confidence: bestMatch.score >= 2 ? 'medium' : 'low',
      reason: `Title keyword: "${bestMatch.keyword}"`,
    };
  }

  return null;
}

// ─── Browser tab title matching ───
// If the block is a Browser category and the title contains common Acumatica
// page names, try to identify it
function matchByBrowserContext(block, tasks) {
  if (!block.title) return null;
  const title = block.title.toLowerCase();

  // Common Acumatica pages/phrases that appear in browser tabs
  const acumaticaKeywords = [
    'purchase order', 'sales order', 'invoice', 'journal transaction',
    'general ledger', 'inventory', 'warehouse', 'stock item', 'non-stock',
    'import scenario', 'import by scenario', 'data provider',
    'business account', 'customer', 'vendor', 'employee',
    'accounts payable', 'accounts receivable', 'cash management',
    'project', 'expense claim', 'time card', 'service order',
    'bill of materials', 'production order', 'manufacturing',
    'bank transaction', 'reconciliation', 'tax', 'report',
    'notification', 'automation', 'generic inquiry', 'dashboard',
    'acumatica', 'erp',
  ];

  for (const kw of acumaticaKeywords) {
    if (title.includes(kw)) {
      // It's Acumatica work — try to figure out which client
      // Check if any client name or short is also in the title
      for (const task of tasks) {
        const cn = (task._clientName || '').toLowerCase();
        const cs = (task._clientShort || '').toLowerCase();
        if ((cn && title.includes(cn)) || (cs && cs.length >= 3 && title.includes(cs))) {
          return {
            task,
            client: task._clientName,
            clientShort: task._clientShort,
            confidence: 'low',
            reason: `Browser: Acumatica "${kw}" + client hint`,
          };
        }
      }
      // Acumatica work but client unknown — return partial match
      return {
        task: null,
        client: null,
        clientShort: null,
        confidence: 'low',
        reason: `Browser: Acumatica-related ("${kw}")`,
        isAcumatica: true,
      };
    }
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

// ─── Temporal proximity matching ───
// If a block is surrounded by matched blocks for the same client,
// it's likely related work (e.g., switching between Excel and browser
// while working on the same client)
function applyProximityMatching(blocks, matched, unmatched) {
  const promoted = [];
  const stillUnmatched = [];

  // Build a timeline: map of blockId → match info
  const matchMap = new Map();
  for (const m of matched) {
    matchMap.set(m.id, m);
  }

  for (const block of unmatched) {
    // Skip very generic blocks (personal browsing, etc.)
    if (block.category === 'Other' && block.durationMinutes < 3) {
      stillUnmatched.push(block);
      continue;
    }

    // Look at matched blocks on the same day within ±15 minutes
    const blockDay = block.day;
    const blockStart = new Date(block.startUtc + 'Z').getTime();
    const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

    const nearbyClients = {};
    for (const m of matched) {
      if (m.day !== blockDay) continue;
      const mStart = new Date(m.startUtc + 'Z').getTime();
      if (Math.abs(mStart - blockStart) <= WINDOW_MS && m.matchedClientShort) {
        const cs = m.matchedClientShort;
        nearbyClients[cs] = (nearbyClients[cs] || 0) + m.durationMinutes;
      }
    }

    // If one client dominates nearby time (>60% of nearby matched time)
    const entries = Object.entries(nearbyClients);
    if (entries.length > 0) {
      const totalNearby = entries.reduce((s, [, v]) => s + v, 0);
      entries.sort((a, b) => b[1] - a[1]);
      const [topClient, topMinutes] = entries[0];

      if (topMinutes / totalNearby >= 0.6 && totalNearby >= 5) {
        // Find a task for this client
        const clientMatch = matched.find(m => m.matchedClientShort === topClient);
        if (clientMatch) {
          promoted.push({
            ...block,
            matchedTask: clientMatch.matchedTask,
            matchedClient: clientMatch.matchedClient,
            matchedClientShort: clientMatch.matchedClientShort,
            matchConfidence: 'low',
            matchReason: `Proximity: surrounded by ${topClient} work`,
          });
          continue;
        }
      }
    }

    stillUnmatched.push(block);
  }

  return { promoted, stillUnmatched };
}

export function matchBlocks(blocks, tasks) {
  const matched = [];
  const unmatched = [];

  for (const block of blocks) {
    // Skip very short blocks (lowered from 2min to 1min)
    if (block.durationMinutes < 1) {
      continue;
    }

    // 1. Try URL match first (highest confidence)
    let match = matchByUrl(block, tasks);

    // 2. Try title match
    if (!match) {
      match = matchByTitle(block, tasks);
    }

    // 3. Try browser context matching (Acumatica keywords in tab titles)
    if (!match && (block.category === 'Browser' || block.app?.toLowerCase().includes('chrome') ||
        block.app?.toLowerCase().includes('edge'))) {
      match = matchByBrowserContext(block, tasks);
    }

    if (match && (match.task || match.clientShort)) {
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
        matchReason: match?.reason || 'No match found',
      });
    }
  }

  // 4. Apply proximity matching to recover more unmatched blocks
  const { promoted, stillUnmatched } = applyProximityMatching(blocks, matched, unmatched);
  matched.push(...promoted);

  return { matched, unmatched: stillUnmatched };
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
        // Accumulate raw MINUTES first to avoid rounding-per-block loss
        _rawMinutes: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
        hours: { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 },
        sources: [],
        isManual: false,
      };
    }

    // Determine day of week
    const dayOfWeek = getDayOfWeek(block.day);
    if (dayOfWeek) {
      // Accumulate raw minutes (not pre-rounded hours) to prevent rounding loss
      rows[key]._rawMinutes[dayOfWeek] += block.durationMinutes;
      rows[key].sources.push(block);
    }
  }

  // Convert minutes to hours and round ONCE to nearest 0.25
  for (const row of Object.values(rows)) {
    for (const day of ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']) {
      row.hours[day] = Math.round((row._rawMinutes[day] / 60) * 4) / 4;
    }
    delete row._rawMinutes; // clean up internal field
  }

  return {
    rows: Object.values(rows),
    unmatched,
  };
}

function getDayOfWeek(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDay();
  const map = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' };
  return map[day] || null;
}
