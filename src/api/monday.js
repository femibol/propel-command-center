import { MONDAY_API_URL, MONDAY_API_TOKEN } from './config';

async function mondayQuery(query, variables = {}) {
  if (!MONDAY_API_TOKEN) {
    throw new Error(
      'Monday.com API token not configured. Copy .env.example to .env and add your token.'
    );
  }

  const res = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: MONDAY_API_TOKEN,
      'API-Version': '2024-10',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Monday.com API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (data.errors) {
    throw new Error(`Monday.com GraphQL error: ${data.errors.map((e) => e.message).join(', ')}`);
  }

  return data.data;
}

// Fetch all items + subitems for a board
export async function fetchBoardItems(boardId) {
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

    const data = await mondayQuery(query);
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

// Update a column value on a subitem
export async function updateColumnValue(subitemBoardId, itemId, columnId, value) {
  const query = `mutation {
    change_simple_column_value(
      board_id: ${subitemBoardId}
      item_id: ${itemId}
      column_id: "${columnId}"
      value: "${value.replace(/"/g, '\\"')}"
    ) {
      id
      name
    }
  }`;

  return mondayQuery(query);
}

// Update status specifically (uses JSON value)
export async function updateStatus(subitemBoardId, itemId, columnId, label) {
  const query = `mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
    change_column_value(
      board_id: $boardId
      item_id: $itemId
      column_id: $columnId
      value: $value
    ) {
      id
      name
    }
  }`;

  return mondayQuery(query, {
    boardId: subitemBoardId,
    itemId: itemId,
    columnId: columnId,
    value: JSON.stringify({ label }),
  });
}

// Post an update/comment on an item
export async function postUpdate(itemId, body) {
  const query = `mutation ($itemId: ID!, $body: String!) {
    create_update(item_id: $itemId, body: $body) {
      id
      created_at
    }
  }`;

  return mondayQuery(query, { itemId, body });
}

// Move item to a different group
export async function moveToGroup(itemId, groupId) {
  const query = `mutation ($itemId: ID!, $groupId: String!) {
    move_item_to_group(item_id: $itemId, group_id: $groupId) {
      id
    }
  }`;

  return mondayQuery(query, { itemId, groupId });
}
