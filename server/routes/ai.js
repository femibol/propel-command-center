import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  if (!key) throw new Error('Anthropic API key not configured');
  return new Anthropic({ apiKey: key });
}

// Generate follow-up suggestion for a task
router.post('/suggest', async (req, res) => {
  try {
    const { subitem, context } = req.body;
    const client = getClient();

    const systemPrompt = `You are an assistant for an Acumatica ERP consultant at NetAtWork (NAW). The consultant manages 10+ client PROPEL implementations. Generate professional follow-up messages and resolution suggestions.

When generating suggestions, provide:
1. Three reply options with different tones (Professional, Urgent, Friendly)
2. A brief explanation of the issue and what's likely happening
3. Suggested next steps for resolution

Keep each reply to 2-4 sentences. Be specific about the task context.`;

    const userPrompt = `Task: ${subitem?.name || 'Unknown'}
Client: ${subitem?._clientName || 'Unknown'}
Status: ${context?.status || 'Unknown'}
Priority: ${context?.priority || 'Unknown'}
Days since update: ${context?.daysSinceUpdate || 'Unknown'}
Details: ${context?.details || 'None'}
Type: ${context?.type || 'Unknown'}
Module: ${context?.module || 'Unknown'}
${context?.claudeContext ? `Related Claude session: ${context.claudeContext}` : ''}

Generate three reply options and an analysis/suggestion.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    res.json({ suggestion: message.content[0].text });
  } catch (err) {
    console.error('AI suggest error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Generate prioritized daily task list
router.post('/daily-tasks', async (req, res) => {
  try {
    const { subitems, timeBlocks, claudeSessions } = req.body;
    const client = getClient();

    const systemPrompt = `You are a productivity assistant for an Acumatica ERP consultant. Given their active tasks, recent activity from screen monitoring, and Claude AI sessions, generate a prioritized daily task list.

Consider:
- Task priority levels (System Down > High > Medium > Low)
- Days since last update (stale items need attention)
- Items in waiting states that need follow-up (7+ days = overdue)
- What the consultant was working on recently
- Balanced client coverage
- Which tasks have related Claude sessions (meaning they were actively researching solutions)

Return a structured JSON response with format:
{
  "tasks": [
    {
      "rank": 1,
      "taskName": "...",
      "client": "...",
      "reason": "Why this should be prioritized",
      "suggestedAction": "What to do next",
      "estimatedMinutes": 30,
      "relatedActivity": "Recent Timely/Claude context if any"
    }
  ],
  "summary": "Brief overview of the day's focus"
}`;

    const taskSummary = (subitems || []).slice(0, 50).map(s => ({
      name: s.name,
      client: s._clientName,
      status: s.status,
      priority: s.priority,
      daysSinceUpdate: s.daysSinceUpdate,
      pctComplete: s.pctComplete,
    }));

    const activitySummary = (timeBlocks || []).slice(0, 30).map(b => ({
      app: b.app,
      title: b.title,
      duration: b.durationMinutes,
      category: b.category,
    }));

    const claudeSummary = (claudeSessions || []).slice(0, 20).map(s => ({
      topic: s.topic,
      duration: s.durationMinutes,
      matchedTask: s.matchedTask?.name,
    }));

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Active Tasks:\n${JSON.stringify(taskSummary, null, 2)}\n\nRecent Activity:\n${JSON.stringify(activitySummary, null, 2)}\n\nClaude Sessions:\n${JSON.stringify(claudeSummary, null, 2)}\n\nGenerate today's prioritized task list.`,
      }],
    });

    const responseText = message.content[0].text;
    // Try to parse JSON from the response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        res.json(parsed);
      } else {
        res.json({ tasks: [], summary: responseText });
      }
    } catch {
      res.json({ tasks: [], summary: responseText });
    }
  } catch (err) {
    console.error('AI daily-tasks error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// AI-assisted matching for unmatched blocks
router.post('/match-review', async (req, res) => {
  try {
    const { unmatchedBlocks, availableTasks } = req.body;
    const client = getClient();

    const systemPrompt = `You are helping match time tracking entries to project tasks. Given unmatched screen activity blocks and a list of available tasks, suggest the best task match for each block.

Return JSON: { "matches": [{ "blockId": "...", "suggestedTaskId": "...", "reason": "..." }] }`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Unmatched blocks:\n${JSON.stringify(unmatchedBlocks?.slice(0, 20))}\n\nAvailable tasks:\n${JSON.stringify(availableTasks?.slice(0, 30))}`,
      }],
    });

    const responseText = message.content[0].text;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        res.json(JSON.parse(jsonMatch[0]));
      } else {
        res.json({ matches: [] });
      }
    } catch {
      res.json({ matches: [] });
    }
  } catch (err) {
    console.error('AI match-review error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
