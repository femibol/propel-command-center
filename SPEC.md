# PROPEL Command Center — Project Specification

**Version:** 1.0
**Author:** Femi Bolarin / Claude
**Date:** February 13, 2026
**Purpose:** Technical specification for building a local web application that serves as a unified task management dashboard across multiple Monday.com PROPEL boards, replacing the current 13-tab browser workflow.

---

## 1. Problem Statement

Femi manages Acumatica ERP implementations for 10+ clients at NetAtWork. Each client has a PROPEL board in Monday.com with dozens of subitems (tasks) nested under parent items. The current workflow requires manually opening each board, expanding collapsed subitems, and mentally tracking priorities across clients. Monday.com's native "My Work" widget does not reliably surface subitems, especially when the `ps_team` column is a text field rather than a People column.

This has led to missed deadlines, invisible tasks, and significant daily overhead reconstructing what needs attention. The Command Center consolidates all active work into a single screen with actionable controls.

---

## 2. Goals

The application must accomplish the following:

1. **Morning Sweep in one click** — Pull all subitems assigned to Femi across all PROPEL boards, grouped by client and sorted by priority, with no manual board-by-board navigation.
2. **Status updates without context switching** — Change subitem statuses, add comments/updates, and mark tasks complete directly from the dashboard.
3. **Stale item detection** — Automatically flag subitems that have not been updated in 5+ days and are still in active statuses.
4. **Weekly planning** — View upcoming work by `est__wip` timeline, prioritize the week, and identify blocked items that need follow-up.
5. **ChangePoint readiness** — Surface completed items that are missing `cp_project__1` or `cp_task__1` values, which are required for time entry reconciliation.
6. **Follow-up management** — Track items in "Waiting" states with aging indicators, and support drafting follow-up messages.

---

## 3. Tech Stack

The recommended stack for a local development workflow with Claude Code:

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 18 + Vite | Fast dev server, hot reload, component architecture |
| Styling | Tailwind CSS | Utility-first, rapid iteration, no separate CSS files |
| State Management | React Query (TanStack Query) | Handles API caching, background refetching, loading/error states |
| API Layer | Monday.com GraphQL API v2 | Direct board/subitem queries, mutations for status updates |
| AI Features | Anthropic API (Claude Sonnet) | Reply suggestions, task summaries, weekly planning assistance |
| Runtime | Node.js 18+ | Required for Vite dev server |
| Package Manager | npm | Standard tooling |

The app runs locally via `npm run dev` and is accessed at `http://localhost:5173`. No deployment infrastructure is needed initially.

---

## 4. Monday.com API Integration

### 4.1 Authentication

Monday.com uses API tokens for authentication. The token is stored in a `.env` file at the project root and never committed to version control.

```
VITE_MONDAY_API_TOKEN=your_token_here
VITE_MONDAY_API_URL=https://api.monday.com/v2
```

To generate a token: Monday.com > Profile Picture > Developers > My Access Tokens > Show/Generate.

The token must belong to a user with access to all PROPEL boards listed below. All API calls include the header:

```
Authorization: your_token_here
Content-Type: application/json
```

### 4.2 API Endpoint

All queries go to `https://api.monday.com/v2` as POST requests with a JSON body containing a `query` field (GraphQL).

### 4.3 Rate Limits

Monday.com enforces complexity-based rate limiting. Each account gets 10,000,000 complexity points per minute. Key costs:

- Querying items: ~1-5 complexity per item
- Querying column values: adds ~1 per column per item
- Querying subitems: adds ~1-3 per subitem
- Mutations (status changes, updates): ~5-10 per call

For a sweep across 10 boards with subitems, expect roughly 50,000-100,000 complexity per full refresh. This is well within limits for periodic polling (every 5 minutes).

### 4.4 Core Queries

#### Fetch Subitems for a Board

This is the primary query. It retrieves all parent items and their subitems with the columns needed for the dashboard.

```graphql
query GetBoardSubitems($boardId: [ID!]!) {
  boards(ids: $boardId) {
    id
    name
    items_page(limit: 100) {
      cursor
      items {
        id
        name
        group { title }
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
          column_values {
            id
            text
            value
          }
        }
      }
    }
  }
}
```

For boards with more than 100 items, use the `cursor` from the response to paginate:

```graphql
query GetNextPage($boardId: [ID!]!, $cursor: String!) {
  boards(ids: $boardId) {
    items_page(limit: 100, cursor: $cursor) {
      cursor
      items { ... }
    }
  }
}
```

#### Update Subitem Status

```graphql
mutation ChangeStatus($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
  change_column_value(
    board_id: $boardId
    item_id: $itemId
    column_id: $columnId
    value: $value
  ) {
    id
    name
  }
}
```

The `value` for a status column is a JSON string with the label index:

```json
{"label": "Done"}
```

Note: The `column_id` for subitem status is `status__march_2022_` across all PROPEL boards. The `board_id` for subitem mutations is the **subitems board ID** (not the parent board ID). Retrieve this from the subitem's `board` field, or use the `change_simple_column_value` mutation which accepts the label directly.

#### Post an Update (Comment) on a Subitem

```graphql
mutation CreateUpdate($itemId: ID!, $body: String!) {
  create_update(
    item_id: $itemId
    body: $body
  ) {
    id
    created_at
  }
}
```

#### Move Item to Group (e.g., move to "Completed")

```graphql
mutation MoveToGroup($itemId: ID!, $groupId: String!) {
  move_item_to_group(
    item_id: $itemId
    group_id: $groupId
  ) {
    id
  }
}
```

---

## 5. Board & Column Reference (Validated Feb 13, 2026)

All data below was validated by live API queries against production boards.

### 5.1 Active PROPEL Boards

| Board ID | Client | Active Femi Items | Notes |
|----------|--------|-------------------|-------|
| 7277229518 | United Services Association | ~14 active | Highest priority, complex AR/dashboard work |
| 9792115688 | Plain & Fancy | ~25 active | Data migration phase, new AR module work |
| 9645630795 | Wolverine Ind. | ~20 active | Data migration + reports, approaching UAT |
| 7886439284 | World's Best Cheeses | ~30 active | Data validation, reports, low-code dev |
| 9444730253 | Attainment Company | ~15 active | Data imports, system admin |
| 7239730474 | Sharpline Converting | TBD | Query on first run |
| 18392167162 | Econo-Pak | TBD | Query on first run |
| 4950155999 | Baron Francois | TBD | Query on first run |
| 5282901875 | Olympus Power | TBD | Upgrade project |
| 3288060633 | Mara Technologies | TBD | Managed support |

Also relevant: Support Team Tasks (1870137983), Development Team Tasks (1293206994), NAW Premium and Client Modifications (1238263659).

### 5.2 Parent Item Columns

| Column ID | Title | Type |
|-----------|-------|------|
| `status_1` | PM Tracking | Status |
| `details` | Details | Long Text |
| `files` | Files | File |
| `due_date` | Due Date | Date |
| `completed_date` | Completed Date | Date |
| `text4` | CP Project | Text |
| `wbs` | CP Task | Text |
| `last_updated` | Last Updated | Auto |

Mirror columns on parents (read-only, reflect subitem data): `subitems_status4`, `subitems_naw_team`, `mirror__1`, `subitems_est__wip`, `subitems_estimated_time5`, `subitems___complete`.

### 5.3 Subitem Columns

These are the columns that the dashboard needs to read and write.

| Column ID | Title | Type | Dashboard Use |
|-----------|-------|------|---------------|
| `status__march_2022_` | Status | Status | Primary filter, editable |
| `priority5` | Priority | Status | Sort order |
| `numbers` | % Complete | Numbers | Progress display |
| `ps_team` | NAW Team | Text/People | Filter for "Femi" |
| `client_team` | Client Team | Text/People | Display |
| `details` | Details | Long Text | Expandable view |
| `est__wip` | Est. WIP | Timeline | Weekly planning |
| `estimated_time` | Estimate | Numbers | Hours display |
| `type_` | Type | Status | Work category tag |
| `module` | Module | Status | Acumatica module tag |
| `cp_project__1` | CP Project | Text | ChangePoint mapping check |
| `cp_task__1` | CP Task | Text | ChangePoint mapping check |
| `text1` | Dev Task ID | Text | Cross-ref to Dev board |
| `link1` | Dev Task Link | Link | Cross-ref to Dev board |
| `date` | Completed Date | Date | Completion tracking |

### 5.4 Status Values

#### Active Work States (items requiring attention)

| Label | Sort Priority | Color Suggestion |
|-------|--------------|-----------------|
| In Progress | 1 | Blue |
| Under Review | 2 | Purple |
| Review with Customer | 3 | Teal |
| Scoping / Researching | 4 | Indigo |
| Scheduled | 5 | Slate |
| New | 6 | Gray |
| Not Started | 6 | Gray (United Services variant) |
| Estimating | 7 | Amber (United Services, dev estimation) |

#### Waiting States (blocked, need follow-up tracking)

| Label | Waiting On |
|-------|-----------|
| Waiting - Customer | Client |
| Waiting - Client | Client (United Services variant) |
| Waiting - NAW | Internal NAW colleague |
| Waiting - Dev | Development Team (board 1293206994) |
| Waiting - Tech | Technical resource |
| Waiting - Sales | Sales team |
| Waiting - ISV | ISV vendor |
| Waiting -Acumatica | Acumatica support (note: no space before "Acumatica") |
| Waiting - Support | Support team |

#### Terminal States (excluded from active views)

Done, Pending Close, On Hold, NA.

### 5.5 Priority Values

| Label | Sort Order | Color |
|-------|-----------|-------|
| System Down | 0 | Red |
| High | 1 | Orange |
| Medium | 2 | Yellow |
| Low | 3 | Gray/Default |

### 5.6 NAW Team Members by Client

**United Services Association:**
Femi Bolarin, Alan Johnson, Roger Urbina, Bill Filipiak, Shashi Kanth Belde, Edson Villarosa

**Plain & Fancy:**
Femi Bolarin, Liam O'Hara, Nick Horvath, John Oakley

**Wolverine Ind.:**
Femi Bolarin, Viktor Zelenko, Dan Strabbing, Casey Pausewang

**World's Best Cheeses:**
Femi Bolarin, Monica Franco, Christine Reeders, Alex Kleyff

**Attainment Company:**
Femi Bolarin (solo)

---

## 6. Application Screens

### 6.1 Screen: Morning Sweep (Home / Default View)

This is the primary screen. It loads automatically on app startup and shows all active subitems assigned to Femi across all boards.

**Layout:**

```
┌──────────────────────────────────────────────────────────────┐
│  PROPEL Command Center              [Refresh] [Last: 2m ago] │
├──────────────────────────────────────────────────────────────┤
│  Filters: [All Clients ▼] [All Statuses ▼] [All Priority ▼] │
│  Summary: 84 active items │ 14 HIGH │ 23 WAITING │ 6 STALE  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ▼ UNITED SERVICES ASSOCIATION (14 items)                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 🔴 HIGH  Excluding Prepays           [In Progress]  ▶  │ │
│  │ 🔴 HIGH  CSM Dashboard               [Waiting-NAW]  ▶  │ │
│  │ 🔴 HIGH  SR Dashboard                [Waiting-NAW]  ▶  │ │
│  │ 🟡 MED   Sales Order w/ Release...   [Waiting-Client]▶ │ │
│  │ ...                                                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ▼ PLAIN & FANCY (25 items)                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 🔵 LOW   SQL stored procedure...     [In Progress]  ▶  │ │
│  │ ...                                                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ▼ WOLVERINE IND. (20 items)                                 │
│  ...                                                         │
└──────────────────────────────────────────────────────────────┘
```

**Behavior:**

- On load, queries all boards in parallel (Promise.all) and merges results.
- Subitems are filtered where `ps_team` column text contains "Femi" (case-insensitive substring match).
- Subitems in terminal states (Done, Pending Close, NA) are excluded by default.
- Results are grouped by client board, then sorted by priority (System Down > High > Medium > Low), then by status (In Progress first, then Waiting states, then New).
- Each row shows: priority indicator, subitem name, current status (as a colored badge), and an expand arrow.
- The summary bar at the top shows total counts and highlights: total active, high priority count, waiting count, and stale count (items not updated in 5+ days with non-terminal, non-waiting statuses).
- Clicking a row expands an inline detail panel (see Section 6.2).
- Filter dropdowns allow narrowing by client, status category (Active/Waiting/All), and priority level.
- The Refresh button forces a re-query. The "Last: Xm ago" indicator shows time since last data fetch.

### 6.2 Component: Item Detail Panel (Inline Expand)

When a subitem row is clicked, it expands below the row to show full details and action controls.

```
┌─────────────────────────────────────────────────────────────┐
│  Excluding Prepays (AR Aging)                               │
│  Parent: Action Items │ Board: United Services Association  │
│  ──────────────────────────────────────────────────────────  │
│  Status: [In Progress ▼]     Priority: [High ▼]            │
│  % Complete: [70____]        Est. Hours: 4                  │
│  NAW Team: Femi Bolarin      Client Team: Taylor Lock       │
│  Type: Form/Report           Module: Finance Advanced       │
│  Est. WIP: Jan 20 – Feb 14   Last Updated: Feb 13, 1:19 PM │
│  ──────────────────────────────────────────────────────────  │
│  CP Project: United Services Assoc... - 250000768 - Acu...  │
│  CP Task: Acumatica United Services Association Impl...     │
│  Dev Task: (none)                                           │
│  ──────────────────────────────────────────────────────────  │
│  Details:                                                   │
│  AR Aging report excluding prepayment line items from       │
│  the aging buckets. Working on filter logic in Report...    │
│  ──────────────────────────────────────────────────────────  │
│  Quick Actions:                                             │
│  [Mark Done] [Post Update] [Move to Completed] [Open in M] │
│                                                             │
│  Post Update:                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Type your update here...                            │    │
│  │                                                     │    │
│  │                              [AI Suggest] [Post]    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Behavior:**

- Status and Priority dropdowns allow changing values directly. On change, the app fires a `change_column_value` mutation and optimistically updates the UI.
- % Complete is editable inline. On blur, fires mutation.
- "Mark Done" sets status to "Done", sets % Complete to 100, sets Completed Date to today, and prompts "Move parent to Completed group?" if all sibling subitems are also Done.
- "Post Update" sends a `create_update` mutation with the text content. The update appears in Monday.com's update feed for that subitem.
- "AI Suggest" calls the Anthropic API with the subitem context (name, status, details, client) and generates a suggested follow-up message or status update note. The suggestion populates the text area for editing before posting.
- "Open in M" opens the Monday.com subitem in a new browser tab using the URL format: `https://[account].monday.com/boards/[boardId]/pulses/[parentItemId]/posts/[subitemId]`

### 6.3 Screen: Stale Items

A filtered view showing items that are potentially forgotten.

**Filter logic:**
- `ps_team` contains "Femi"
- Status NOT in terminal states (Done, Pending Close, NA, On Hold)
- Status NOT in any "Waiting" state (waiting items are expected to be stale)
- `last_updated` (from the item's `updated_at` field) is older than 5 days

**Layout:** Same table structure as Morning Sweep, but with an additional "Days Stale" column showing how many days since last update. Sorted by staleness (oldest first). Color-coded: 5-7 days = yellow, 8-14 days = orange, 15+ days = red.

### 6.4 Screen: Waiting / Blocked Items

Shows all subitems in any "Waiting" state, with aging and follow-up tools.

**Columns:** Client, Item Name, Waiting On (extracted from status label), Days Waiting (from `last_updated`), Last Updated Date.

**Features:**
- Grouped by waiting category (Waiting - Customer, Waiting - NAW, Waiting - Dev, etc.).
- Items waiting 7+ days are highlighted as "follow-up overdue."
- "Draft Follow-up" button uses AI to generate a follow-up message based on the item context and how long it has been waiting.
- For "Waiting - Dev" items, shows the Dev Task ID (`text1`) and a link to the Dev Team Tasks board.

### 6.5 Screen: Weekly Planner

A week-view for planning and prioritizing upcoming work.

**Data source:** Subitems where `est__wip` timeline overlaps with the selected week. Also includes all "In Progress" items regardless of timeline.

**Layout:**

```
┌──────────────────────────────────────────────────────────────┐
│  Week of Feb 10 – Feb 14, 2026       [◀ Prev] [Next ▶]     │
├──────────────────────────────────────────────────────────────┤
│  Mon    │ Tue    │ Wed    │ Thu    │ Fri                     │
│  ────── │ ────── │ ────── │ ────── │ ──────                  │
│  Item A │ Item A │ Item B │ Item C │ Weekly Review           │
│  Item D │        │        │ Item D │                         │
├──────────────────────────────────────────────────────────────┤
│  Unscheduled Active Items (no Est. WIP set):                 │
│  • CSM Dashboard [Waiting-NAW] - 3 days waiting             │
│  • SQL stored procedure [In Progress] - no timeline          │
│  ...                                                         │
└──────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Items with `est__wip` timelines are placed on the days their timeline spans.
- Unscheduled items (no `est__wip` value) appear in a bottom section for manual triage.
- Clicking an item opens the same detail panel as the Morning Sweep.

### 6.6 Screen: ChangePoint Check

Shows completed items that need ChangePoint reconciliation.

**Filter logic:**
- Status is "Done" or "Pending Close"
- `cp_project__1` is empty OR `cp_task__1` is empty
- `ps_team` contains "Femi"

**Columns:** Client, Item Name, Completed Date, CP Project (filled/missing), CP Task (filled/missing), Estimated Hours.

This screen supports the Friday weekly review and daily time entry reconciliation.

### 6.7 Navigation

A left sidebar or top nav with the following items:

- **Sweep** (home) — Morning Sweep view
- **Stale** — Stale items view (with count badge)
- **Waiting** — Blocked/waiting items (with count badge)
- **Planner** — Weekly planner
- **CP Check** — ChangePoint reconciliation
- **Settings** — API token config, board selection, refresh interval

---

## 7. Component Architecture

```
src/
├── main.jsx                    # App entry point
├── App.jsx                     # Router, layout shell, global state
├── api/
│   ├── monday.js               # Monday.com GraphQL client
│   │                           # - fetchBoardSubitems(boardId)
│   │                           # - updateSubitemStatus(boardId, itemId, status)
│   │                           # - updateSubitemColumn(boardId, itemId, columnId, value)
│   │                           # - postUpdate(itemId, body)
│   │                           # - moveItemToGroup(itemId, groupId)
│   ├── anthropic.js            # Anthropic API client for AI features
│   │                           # - generateFollowUp(context)
│   │                           # - generateUpdateNote(context)
│   └── config.js               # Environment variable access
├── hooks/
│   ├── useAllBoards.js         # React Query hook: fetches all PROPEL boards in parallel
│   ├── useBoardItems.js        # React Query hook: single board fetch with caching
│   ├── useSubitemMutation.js   # Mutation hook: status/column updates with optimistic UI
│   └── useStaleItems.js        # Derived hook: filters for stale items from cached data
├── components/
│   ├── Layout.jsx              # App shell: sidebar nav + main content area
│   ├── Sidebar.jsx             # Navigation with count badges
│   ├── SummaryBar.jsx          # Top-level counts (active, high, waiting, stale)
│   ├── FilterBar.jsx           # Client, status, priority filter dropdowns
│   ├── ClientGroup.jsx         # Collapsible section for one client's items
│   ├── SubitemRow.jsx          # Single subitem row with priority, name, status badge
│   ├── SubitemDetail.jsx       # Expandable detail panel with edit controls
│   ├── StatusBadge.jsx         # Colored status label component
│   ├── PriorityIndicator.jsx   # Priority dot/icon component
│   ├── QuickActions.jsx        # Mark Done, Post Update, Move, Open in Monday buttons
│   ├── UpdateComposer.jsx      # Text area + AI Suggest + Post button
│   ├── WeekView.jsx            # Weekly planner grid
│   ├── StaleTable.jsx          # Stale items table with aging colors
│   ├── WaitingTable.jsx        # Waiting/blocked items grouped by wait type
│   └── CPCheckTable.jsx        # ChangePoint reconciliation table
├── pages/
│   ├── SweepPage.jsx           # Morning Sweep (home)
│   ├── StalePage.jsx           # Stale items
│   ├── WaitingPage.jsx         # Blocked items
│   ├── PlannerPage.jsx         # Weekly planner
│   ├── CPCheckPage.jsx         # ChangePoint check
│   └── SettingsPage.jsx        # Configuration
├── utils/
│   ├── filters.js              # filterByTeam(), filterByStatus(), filterStale()
│   ├── sort.js                 # sortByPriority(), sortByClient()
│   ├── dates.js                # daysSince(), isWithinWeek(), formatDate()
│   └── constants.js            # Board IDs, status labels, priority order, column IDs
└── index.css                   # Tailwind imports + custom theme variables
```

---

## 8. Data Flow

### 8.1 Initial Load Sequence

```
1. App mounts
2. useAllBoards hook fires
3. For each board ID in ACTIVE_BOARDS:
     → fetchBoardSubitems(boardId) via Monday.com GraphQL API
     → Returns: parent items with nested subitems and column values
4. Results cached in React Query with 5-minute stale time
5. Client-side filtering:
     → Filter subitems where ps_team contains "Femi"
     → Exclude terminal statuses
     → Sort by priority, then status
6. Render Morning Sweep with grouped results
7. Compute derived counts for Summary Bar and nav badges
```

### 8.2 Status Update Flow

```
1. User changes status dropdown in SubitemDetail
2. useSubitemMutation fires:
     → Optimistically update cached data (immediate UI feedback)
     → POST mutation to Monday.com API
3. On success: cache is consistent, no action needed
4. On error: roll back optimistic update, show error toast
5. If new status is "Done":
     → Prompt "Set % Complete to 100?"
     → Prompt "Set Completed Date to today?"
     → Check sibling subitems: if all Done, prompt "Move parent to Completed group?"
```

### 8.3 AI Suggestion Flow

```
1. User clicks "AI Suggest" in UpdateComposer
2. Collect context: subitem name, status, details, client name, days in current status
3. POST to Anthropic API (/v1/messages):
     → System prompt: "You are an ERP consultant assistant. Draft a brief, professional
        follow-up message for a Monday.com task update."
     → User message: context payload
4. Response populates the text area
5. User edits as needed, then clicks "Post"
6. Post fires create_update mutation to Monday.com
```

---

## 9. Configuration & Environment

### 9.1 Environment Variables

```env
# .env (root of project, git-ignored)
VITE_MONDAY_API_TOKEN=your_monday_api_token
VITE_MONDAY_API_URL=https://api.monday.com/v2
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key  # Optional, for AI features
VITE_MONDAY_ACCOUNT_SLUG=proserve-solutions-company  # For "Open in Monday" URLs
```

### 9.2 Constants (src/utils/constants.js)

```javascript
export const ACTIVE_BOARDS = [
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
];

export const DEV_BOARD_ID = '1293206994';
export const SUPPORT_BOARD_ID = '1870137983';

export const SUBITEM_COLUMNS = {
  STATUS: 'status__march_2022_',
  PRIORITY: 'priority5',
  PERCENT_COMPLETE: 'numbers',
  NAW_TEAM: 'ps_team',
  CLIENT_TEAM: 'client_team',
  DETAILS: 'details',
  EST_WIP: 'est__wip',
  ESTIMATED_TIME: 'estimated_time',
  TYPE: 'type_',
  MODULE: 'module',
  CP_PROJECT: 'cp_project__1',
  CP_TASK: 'cp_task__1',
  DEV_TASK_ID: 'text1',
  DEV_TASK_LINK: 'link1',
  COMPLETED_DATE: 'date',
};

export const TERMINAL_STATUSES = ['Done', 'Pending Close', 'NA', 'On Hold'];

export const WAITING_STATUSES = [
  'Waiting - Customer', 'Waiting - Client', 'Waiting - NAW',
  'Waiting - Dev', 'Waiting - Tech', 'Waiting - Sales',
  'Waiting - ISV', 'Waiting -Acumatica', 'Waiting - Support',
];

export const ACTIVE_STATUSES = [
  'In Progress', 'Under Review', 'Review with Customer',
  'Scoping / Researching', 'Scheduled', 'New', 'Not Started', 'Estimating',
];

export const PRIORITY_ORDER = {
  'System Down': 0,
  'High': 1,
  'Medium': 2,
  'Low': 3,
};

export const STALE_THRESHOLD_DAYS = 5;
export const FOLLOWUP_OVERDUE_DAYS = 7;
export const REFRESH_INTERVAL_MS = 300000; // 5 minutes
```

---

## 10. Design Specifications

### 10.1 Visual Direction

The design should be utilitarian and information-dense, optimized for a consultant scanning tasks at the start of the day. Think Bloomberg terminal meets Notion — dark mode default, high contrast status colors, compact rows, and generous use of monospace for IDs and dates.

### 10.2 Color Palette

```
Background:     #0F1117 (near-black)
Surface:        #1A1D27 (card/panel background)
Surface Hover:  #242836
Border:         #2E3348
Text Primary:   #E8E9ED
Text Secondary: #8B8FA3
Text Muted:     #5C6178

Priority System Down:  #EF4444 (red-500)
Priority High:         #F97316 (orange-500)
Priority Medium:       #EAB308 (yellow-500)
Priority Low:          #6B7280 (gray-500)

Status In Progress:    #3B82F6 (blue-500)
Status Waiting:        #A855F7 (purple-500)
Status New:            #6B7280 (gray-500)
Status Under Review:   #8B5CF6 (violet-500)
Status Done:           #22C55E (green-500)

Stale Warning:         #FBBF24 (amber-400)
Stale Critical:        #EF4444 (red-500)

Accent:                #3B82F6 (blue-500, for buttons and links)
```

### 10.3 Typography

- Headings: Inter or system sans-serif, semi-bold
- Body text: system sans-serif, regular, 14px
- Monospace (IDs, dates, CP values): JetBrains Mono or system monospace, 13px
- Subitem row height: 40px compact, 48px comfortable

### 10.4 Responsive Behavior

The app is designed for desktop use (1280px+ viewport). No mobile optimization is needed for v1. A minimum width of 1024px should be supported with horizontal scrolling for the weekly planner.

---

## 11. Future Enhancements (Post-v1)

These are documented for context but are NOT part of the initial build.

1. **ChangePoint API integration** — If ChangePoint exposes an API, pull actual time entries and compare against Monday.com completed items for automated reconciliation.
2. **Google Sheets export** — One-click export of weekly time data to a Google Sheet template via the Sheets API.
3. **Acumatica REST API agent** — MCP server wrapping Acumatica endpoints for read/write operations on client tenants. Would allow the Command Center to pull report data, check screen values, and trigger operations directly.
4. **Notification system** — Desktop notifications when items change status or become stale.
5. **Multi-user support** — Allow other NAW consultants to use the tool by parameterizing the team member filter.
6. **Monday.com webhook listener** — Instead of polling every 5 minutes, subscribe to board webhooks for real-time updates.
7. **Zapier MCP bridge** — Connect ChangePoint and other tools that lack native APIs through Zapier's MCP integration.

---

## 12. Getting Started with Claude Code

To build this app with Claude Code, follow this sequence:

1. **Share this spec.** Open Claude Code in a new project directory and paste or reference this document. Tell Claude Code: "Build the PROPEL Command Center app according to this specification."

2. **Provide your API token.** Claude Code will create the `.env` file. You'll need to paste your Monday.com API token (from Monday.com > Developers > My Access Tokens).

3. **Iterate screen by screen.** Start with the Morning Sweep (most critical), then add Stale Items, Waiting Items, Weekly Planner, and CP Check one at a time.

4. **Test against live data.** After each screen is built, run `npm run dev` and verify against your actual Monday.com boards.

5. **Add AI features last.** The Anthropic API integration (reply suggestions, update drafts) is a polish layer. Get the core CRUD working first.

---

## Appendix A: Monday.com GraphQL API Quick Reference

**Endpoint:** `https://api.monday.com/v2`
**Method:** POST
**Headers:** `Authorization: {token}`, `Content-Type: application/json`, `API-Version: 2024-10`
**Body:** `{ "query": "...", "variables": { ... } }`

**Complexity check:** Include `complexity { before after query }` in any query to monitor rate limit consumption.

**Pagination:** The `items_page` field returns a `cursor`. Pass it to subsequent queries to get the next page. A null cursor means no more pages.

**Subitem board IDs:** Subitems live on a separate "subitems board" with its own ID. When mutating subitem column values, you need the subitems board ID, not the parent board ID. Retrieve it via `subitems { board { id } }` in your query, or use `change_simple_column_value` which is more forgiving.

## Appendix B: Cross-System Mapping Reference

| Monday.com Field | ChangePoint Equivalent |
|-----------------|----------------------|
| Board name (client) | CP Project string (`cp_project__1`) |
| Subitem name | Time entry work description |
| `type_` + subitem name | Detailed work description |
| `estimated_time` | Quoted/estimated hours |
| `cp_task__1` | ChangePoint task code |
| Subitem status = Done | Billable time entry exists |

**Example United Services mapping:**
- CP Project: `United Services Association, Inc. - 250000768 - Acumatica Implementation`
- CP Task: `Acumatica United Services Association Implementation`
