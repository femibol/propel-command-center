import { Router } from 'express';

const router = Router();

// ── In-memory cache ──────────────────────────────────────────────────
const cache = {
  data: null,
  timestamp: 0,
  promise: null, // dedup concurrent requests
};
const CACHE_TTL_MS = 120_000; // 2 minutes

// Board IDs — must match client-side ACTIVE_BOARDS
const ACTIVE_BOARDS = [
  { id: '7277229518', name: 'United Services Association', shortName: 'USA' },
  { id: '9792115688', name: 'Plain & Fancy', shortName: 'PNF' },
  { id: '9645630795', name: 'Wolverine Ind.', shortName: 'WLV' },
  { id: '7886439284', name: "World's Best Cheeses", shortName: 'WBC' },
  { id: '9444730253', name: 'Attainment Company', shortName: 'ATT' },
  { id: '7239730474', name: 'Sharpline Converting', shortName: 'SHP' },
  { id: '18392167162', name: 'Econo-Pak', shortName: 'EPK' },
  { id: '4950155999', name: 'Baron Francois', shortName: 'BFR' },
  { id: '5282901875', name: 'Olympus Power', shortName: 'OLY' },
  { id: '3288060633', name: 'Mara Technologies', shortName: 'MAR' },
  { id: '1870137983', name: 'NAW Support', shortName: 'SUP' },
];

const MONDAY_API_URL = 'https://api.monday.com/v2';

// ── Monday.com GraphQL helper ────────────────────────────────────────
async function mondayQuery(query, token) {
  const res = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
      'API-Version': '2024-10',
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throw new Error(`Monday.com API: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (data.errors) {
    throw new Error(`Monday.com GraphQL: ${data.errors.map((e) => e.message).join(', ')}`);
  }
  return data.data;
}

// Fetch all items + subitems for one board (paginated)
async function fetchBoardItems(boardId, token) {
  const allItems = [];
  let cursor = null;
  let hasMore = true;

  while (hasMore) {
    const cursorArg = cursor ? `cursor: "${cursor}"` : '';
    const query = `{
      boards(ids: [${boardId}]) {
        id
        name
        groups { id title }
        items_page(limit: 100 ${cursorArg ? ', ' + cursorArg : ''}) {
          cursor
          items {
            id
            name
            group { id title }
            updated_at
            column_values {
              id
              text
              value
            }
            subitems {
              id
              name
              created_at
              updated_at
              board { id }
              column_values {
                id
                text
                value
              }
            }
          }
        }
      }
    }`;

    const data = await mondayQuery(query, token);
    const board = data.boards[0];
    const page = board.items_page;

    for (const item of page.items) {
      allItems.push({
        ...item,
        _boardId: boardId,
        _boardName: board.name,
      });
    }

    cursor = page.cursor;
    hasMore = !!cursor;
  }

  return allItems;
}

// Fetch all boards in parallel, flatten subitems
async function fetchAllBoards(token) {
  const t0 = Date.now();

  const results = await Promise.allSettled(
    ACTIVE_BOARDS.map(async (board) => {
      const items = await fetchBoardItems(board.id, token);
      return { board, items };
    })
  );

  const boards = [];
  const errors = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      boards.push(result.value);
    } else {
      errors.push(result.reason?.message || 'Unknown error');
    }
  }

  // Flatten subitems
  const allSubitems = [];
  for (const { board, items } of boards) {
    for (const item of items) {
      for (const sub of item.subitems || []) {
        allSubitems.push({
          ...sub,
          _parentId: item.id,
          _parentName: item.name,
          _parentGroup: item.group?.title || 'Unknown',
          _boardId: board.id,
          _boardName: board.name,
          _clientName: board.name
            .replace('PROPEL - ', '')
            .replace(' - Acumatica Project', '')
            .replace('Upgrade - ', '')
            .replace('Managed Support - (CA) ', ''),
          _clientShort: board.shortName,
          _subitemBoardId: sub.board?.id,
        });
      }
    }
  }

  const elapsed = Date.now() - t0;
  console.log(`[boards] Fetched ${boards.length} boards, ${allSubitems.length} subitems in ${elapsed}ms`);

  return { boards: boards.length, allSubitems, errors, elapsed };
}

// ── GET /api/boards/all — cached board data ──────────────────────────
router.get('/all', async (req, res) => {
  try {
    const token = process.env.VITE_MONDAY_API_TOKEN || req.headers['x-monday-token'];
    if (!token) {
      return res.status(400).json({ error: 'Monday.com API token not configured' });
    }

    const now = Date.now();

    // Return cached data if fresh
    if (cache.data && (now - cache.timestamp) < CACHE_TTL_MS) {
      return res.json({ ...cache.data, cached: true, cacheAge: now - cache.timestamp });
    }

    // Dedup: if a fetch is already running, wait for it
    if (cache.promise) {
      const data = await cache.promise;
      return res.json({ ...data, cached: true, deduped: true });
    }

    // Fetch fresh data
    cache.promise = fetchAllBoards(token);
    const data = await cache.promise;

    // Store in cache
    cache.data = data;
    cache.timestamp = Date.now();
    cache.promise = null;

    res.json({ ...data, cached: false });
  } catch (err) {
    cache.promise = null;
    console.error('[boards] Fetch error:', err.message);
    // If we have stale cache, return it with a warning
    if (cache.data) {
      return res.json({ ...cache.data, cached: true, stale: true, cacheAge: Date.now() - cache.timestamp });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/boards/invalidate — force cache refresh ────────────────
router.post('/invalidate', (req, res) => {
  cache.data = null;
  cache.timestamp = 0;
  cache.promise = null;
  res.json({ success: true, message: 'Board cache invalidated' });
});

export { fetchAllBoards, cache };
export default router;
