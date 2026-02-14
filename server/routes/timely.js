import { Router } from 'express';
import { getCapturedEntries, getEntryStats, getAppBreakdown, getTimelySettings } from '../db/timely.js';
import { aggregateEntries, aggregateByDay, summarizeBlocks } from '../services/timeAggregator.js';
import { matchBlocks, buildTimesheetRows } from '../services/taskMatcher.js';
import { matchClaudeSessions } from '../services/claudeMatcher.js';

const router = Router();

// Get Timely DB stats
router.get('/stats', (req, res) => {
  try {
    const stats = getEntryStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get aggregated time blocks for a date range
router.get('/blocks', (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'start and end query params required (YYYY-MM-DD)' });
    }

    const entries = getCapturedEntries(start, end);
    const blocks = aggregateEntries(entries);
    const byDay = aggregateByDay(blocks);
    const summary = summarizeBlocks(blocks);

    res.json({ blocks, byDay, summary, entryCount: entries.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get app breakdown for date range
router.get('/apps', (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: 'start and end query params required' });
    }
    const breakdown = getAppBreakdown(start, end);
    res.json(breakdown);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Match time blocks to Monday.com tasks
router.post('/match', (req, res) => {
  try {
    const { start, end, tasks } = req.body;
    if (!start || !end) {
      return res.status(400).json({ error: 'start and end required in body' });
    }

    const entries = getCapturedEntries(start, end);
    const blocks = aggregateEntries(entries);
    const { matched, unmatched } = matchBlocks(blocks, tasks || []);
    const timesheet = buildTimesheetRows(matched, unmatched);

    res.json({
      timesheet,
      matched: matched.length,
      unmatched: unmatched.length,
      totalBlocks: blocks.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Claude session matches
router.post('/claude-sessions', (req, res) => {
  try {
    const { start, end, tasks } = req.body;
    if (!start || !end) {
      return res.status(400).json({ error: 'start and end required' });
    }

    const entries = getCapturedEntries(start, end);
    const blocks = aggregateEntries(entries);
    const sessions = matchClaudeSessions(blocks, tasks || []);

    res.json({ sessions, totalClaudeMinutes: sessions.reduce((s, b) => s + b.durationMinutes, 0) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Timely settings (for cloud API integration)
router.get('/settings', (req, res) => {
  try {
    const settings = getTimelySettings();
    // Redact sensitive fields for security
    const safe = {
      userName: settings.user_name,
      userEmail: settings.user_email,
      workspaceName: settings.workspace_name,
      hasToken: !!settings.token,
    };
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
