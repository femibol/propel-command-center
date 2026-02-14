import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = Router();

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  if (!key) throw new Error('Anthropic API key not configured');
  return new Anthropic({ apiKey: key });
}

function buildSystemPrompt(context) {
  const clientList = context?.clients?.length
    ? `Active clients: ${context.clients.join(', ')}`
    : '';
  const pageInfo = context?.page ? `The user is currently on the "${context.page}" page.` : '';
  const dataContext = context?.data ? `\nCurrent data context:\n${context.data}` : '';

  return `You are PROPEL Coach — an assertive, sharp productivity coach for Femi Bolarin, a Senior Acumatica ERP Consultant at NetAtWork (NAW). Femi manages 10+ simultaneous client PROPEL implementations.

YOUR PERSONALITY:
- Direct, no-nonsense, slightly pushy (in a motivating way)
- Use short punchy sentences. No fluff.
- You pressure Femi to stay on track and close tasks
- Celebrate wins briefly, then push for the next thing
- Reference specific client names and task details when available
- You know the PROPEL workflow: New → In Progress → Under Review → Done

PROPEL STATUS WORKFLOW:
Active: In Progress, Under Review, Review with Customer, Scoping / Researching, Scheduled, New, Not Started, Estimating
Waiting: Waiting - Customer, Waiting - Client, Waiting - NAW, Waiting - Dev, Waiting - Tech
Terminal: Done, Pending Close, NA, On Hold

PRIORITY LEVELS (severity order): System Down > High > Medium > Low

${clientList}
${pageInfo}
${dataContext}

RULES:
- Keep responses concise (2-5 sentences for quick questions, longer for analysis)
- Always be actionable — tell Femi WHAT to do, not just what's happening
- If asked about tasks, reference specific names and clients
- Use markdown formatting for clarity (bold, bullets, etc.)
- When pressuring, be motivating not demotivating`;
}

// ───────── SSE Streaming Chat ─────────
router.post('/chat', async (req, res) => {
  try {
    const { messages, context, model } = req.body;
    const client = getClient();

    // SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const modelId = model === 'fast'
      ? 'claude-haiku-4-5-20250929'
      : 'claude-sonnet-4-5-20250929';

    const stream = client.messages.stream({
      model: modelId,
      max_tokens: model === 'fast' ? 512 : 1536,
      system: buildSystemPrompt(context),
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    });

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
    });

    stream.on('message', () => {
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    });

    stream.on('error', (err) => {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
      res.end();
    });

    // Handle client disconnect
    req.on('close', () => {
      stream.abort();
    });
  } catch (err) {
    console.error('AI chat error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// ───────── Quick Insights (haiku, fast) ─────────
router.post('/insights', async (req, res) => {
  try {
    const { data } = req.body;
    const client = getClient();

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20250929',
      max_tokens: 200,
      system: `You are PROPEL Coach. Give 2-3 sentences of actionable advice based on the consultant's current task data. Be specific — mention client names and task names. Be direct and motivating. No preamble.`,
      messages: [{ role: 'user', content: data }],
    });

    res.json({ insight: message.content[0].text });
  } catch (err) {
    console.error('AI insights error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ───────── Morning Briefing (haiku, cached client-side) ─────────
router.post('/briefing', async (req, res) => {
  try {
    const { summary } = req.body;
    const client = getClient();

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20250929',
      max_tokens: 400,
      system: `You are PROPEL Coach giving Femi his morning briefing. Based on his task data, give:
1. Top 3 priorities for today (specific task + client names)
2. Any items that need immediate attention (stale, high priority, overdue follow-ups)
3. One quick win suggestion

Be direct, use bullet points, keep it under 150 words. Start with a motivating one-liner.`,
      messages: [{ role: 'user', content: summary }],
    });

    res.json({ briefing: message.content[0].text });
  } catch (err) {
    console.error('AI briefing error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

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
