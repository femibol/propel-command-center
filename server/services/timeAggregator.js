const GAP_THRESHOLD_SECONDS = 300; // 5 minutes
const MIN_BLOCK_SECONDS = 120; // 2 minutes minimum block

function normalizeTitle(title) {
  if (!title) return '';
  // Strip notification counts, tab counts, dynamic prefixes
  return title
    .replace(/^\(\d+\)\s*/, '') // (3) prefix
    .replace(/\s*[-–—]\s*(Google Chrome|Microsoft Edge|Opera|Firefox|Opera GX).*$/i, '') // browser suffix
    .replace(/\s*[-–—]\s*Personal\s*[-–—]\s*Microsoft Edge$/i, '')
    .replace(/\s*and \d+ more pages?.*$/i, '') // "and 5 more pages"
    .trim();
}

function extractCategory(appName, windowTitle) {
  const app = (appName || '').toLowerCase();
  if (app.includes('claude')) return 'AI/Research';
  if (app.includes('teams')) return 'Meetings';
  if (app.includes('outlook') || (windowTitle || '').toLowerCase().includes('outlook')) return 'Email';
  if (app.includes('excel')) return 'Data Work';
  if (app.includes('reportdesigner') || app.includes('report designer')) return 'Reports';
  if (app.includes('snagit') || app.includes('screenshot')) return 'Documentation';
  if (app.includes('explorer')) return 'File Management';
  if (app.includes('edge') || app.includes('chrome') || app.includes('opera') || app.includes('firefox')) return 'Browser';
  if (app.includes('visual studio') || app.includes('code')) return 'Development';
  return 'Other';
}

export function aggregateEntries(entries) {
  if (!entries || entries.length === 0) return [];

  const blocks = [];
  let currentBlock = null;

  for (const entry of entries) {
    const entryTime = new Date(entry.captured_at_utc + 'Z').getTime() / 1000;
    const normalizedTitle = normalizeTitle(entry.window_title);
    const category = extractCategory(entry.app_name, entry.window_title);

    if (!currentBlock) {
      currentBlock = {
        start: entry.captured_at_with_tz || entry.captured_at_utc,
        startUtc: entry.captured_at_utc,
        end: entry.captured_at_with_tz || entry.captured_at_utc,
        endUtc: entry.captured_at_utc,
        app: entry.app_name,
        title: normalizedTitle,
        rawTitle: entry.window_title,
        category,
        url: entry.details || null,
        entryCount: 1,
        _lastTimestamp: entryTime,
      };
      continue;
    }

    const gap = entryTime - currentBlock._lastTimestamp;
    const sameContext = entry.app_name === currentBlock.app &&
      normalizedTitle === currentBlock.title;

    if (sameContext && gap <= GAP_THRESHOLD_SECONDS) {
      // Extend current block
      currentBlock.end = entry.captured_at_with_tz || entry.captured_at_utc;
      currentBlock.endUtc = entry.captured_at_utc;
      currentBlock.entryCount++;
      currentBlock._lastTimestamp = entryTime;
      if (!currentBlock.url && entry.details) {
        currentBlock.url = entry.details;
      }
    } else {
      // Finalize current block and start new one
      blocks.push(finalizeBlock(currentBlock));
      currentBlock = {
        start: entry.captured_at_with_tz || entry.captured_at_utc,
        startUtc: entry.captured_at_utc,
        end: entry.captured_at_with_tz || entry.captured_at_utc,
        endUtc: entry.captured_at_utc,
        app: entry.app_name,
        title: normalizedTitle,
        rawTitle: entry.window_title,
        category,
        url: entry.details || null,
        entryCount: 1,
        _lastTimestamp: entryTime,
      };
    }
  }

  if (currentBlock) {
    blocks.push(finalizeBlock(currentBlock));
  }

  // Merge tiny blocks into adjacent blocks for same app
  return mergeSmallBlocks(blocks);
}

function finalizeBlock(block) {
  const startSec = new Date(block.startUtc + 'Z').getTime() / 1000;
  const endSec = new Date(block.endUtc + 'Z').getTime() / 1000;
  const durationSeconds = Math.max(endSec - startSec, block.entryCount);
  const durationMinutes = Math.round(durationSeconds / 60 * 10) / 10;

  return {
    id: `${block.startUtc}-${block.app}`.replace(/[^a-zA-Z0-9-]/g, '_'),
    start: block.start,
    end: block.end,
    startUtc: block.startUtc,
    endUtc: block.endUtc,
    durationMinutes,
    durationHours: Math.round(durationMinutes / 6) / 10, // round to 0.1h
    app: block.app,
    title: block.title,
    rawTitle: block.rawTitle,
    category: block.category,
    url: block.url,
    entryCount: block.entryCount,
    day: block.startUtc.split(' ')[0] || block.startUtc.split('T')[0],
  };
}

function mergeSmallBlocks(blocks) {
  if (blocks.length <= 1) return blocks;

  const merged = [];
  for (const block of blocks) {
    if (block.durationMinutes < MIN_BLOCK_SECONDS / 60 && merged.length > 0) {
      const prev = merged[merged.length - 1];
      if (prev.app === block.app && prev.day === block.day) {
        prev.end = block.end;
        prev.endUtc = block.endUtc;
        prev.durationMinutes += block.durationMinutes;
        prev.durationHours = Math.round(prev.durationMinutes / 6) / 10;
        prev.entryCount += block.entryCount;
        continue;
      }
    }
    merged.push(block);
  }

  // Filter out blocks less than 1 minute
  return merged.filter(b => b.durationMinutes >= 1);
}

export function aggregateByDay(blocks) {
  const byDay = {};
  for (const block of blocks) {
    if (!byDay[block.day]) byDay[block.day] = [];
    byDay[block.day].push(block);
  }
  return byDay;
}

export function summarizeBlocks(blocks) {
  const totalMinutes = blocks.reduce((sum, b) => sum + b.durationMinutes, 0);
  const byCategory = {};
  const byApp = {};

  for (const block of blocks) {
    byCategory[block.category] = (byCategory[block.category] || 0) + block.durationMinutes;
    byApp[block.app] = (byApp[block.app] || 0) + block.durationMinutes;
  }

  return {
    totalMinutes,
    totalHours: Math.round(totalMinutes / 6) / 10,
    blockCount: blocks.length,
    byCategory,
    byApp,
  };
}
