# PROPEL Command Center

A unified task management dashboard for NetAtWork ERP consulting, pulling active subitems across all Monday.com PROPEL boards into a single screen.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure your API token
cp .env.example .env
# Edit .env and add your Monday.com API token

# 3. Start the dev server
npm run dev
```

The app will open at `http://localhost:5173`.

## Getting Your Monday.com API Token

1. Go to Monday.com
2. Click your profile picture (bottom-left)
3. Select **Developers**
4. Click **My Access Tokens**
5. Click **Show** or **Generate** to get your token
6. Paste it into the `.env` file as `VITE_MONDAY_API_TOKEN`

## Screens

- **Sweep** — Morning sweep: all active subitems assigned to you across all PROPEL boards, grouped by client, sorted by priority.
- **Stale** — Items not updated in 5+ days that are still in active (non-waiting) statuses.
- **Waiting** — All items in Waiting states, grouped by who you're waiting on, with aging indicators.
- **Planner** — Weekly view showing items with Est. WIP timelines overlapping the selected week.
- **CP Check** — Completed items missing ChangePoint project or task values (needed for time entry reconciliation).

## Features

- Click any item row to expand full details, ChangePoint mapping, and action controls.
- Change statuses directly from the detail panel.
- Post updates/comments to Monday.com from the dashboard.
- "Mark Done" sets status, % complete, and completion date in one click.
- Auto-refreshes every 5 minutes with manual refresh available.

## Customization

Edit `src/utils/constants.js` to:
- Add/remove boards from `ACTIVE_BOARDS`
- Change the team member filter (`TEAM_MEMBER`)
- Adjust stale threshold (`STALE_THRESHOLD_DAYS`)
- Adjust refresh interval (`REFRESH_INTERVAL_MS`)

## Tech Stack

React 18, Vite, Tailwind CSS, TanStack Query, Monday.com GraphQL API.
