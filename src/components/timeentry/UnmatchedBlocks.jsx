import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Monitor, Clock, Sparkles, Loader2, Check } from 'lucide-react';

export default function UnmatchedBlocks({ blocks, rows, onAssign, tasks }) {
  const [open, setOpen] = useState(false);
  const [aiMatching, setAiMatching] = useState(false);
  const [aiResults, setAiResults] = useState(null);

  if (!blocks || blocks.length === 0) return null;

  const totalMinutes = blocks.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);

  async function handleAIMatch() {
    setAiMatching(true);
    setAiResults(null);
    try {
      const res = await fetch('/api/ai/match-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unmatchedBlocks: blocks,
          availableTasks: tasks || [],
        }),
      });
      if (!res.ok) throw new Error('AI match failed');
      const data = await res.json();

      if (data.matches && data.matches.length > 0) {
        const resultMap = {};
        for (const match of data.matches) {
          if (match.taskId === 'SKIP') continue;

          const targetRow = rows.find(r =>
            r.task?.id === match.taskId ||
            r.clientShort === match.client
          );

          if (targetRow) {
            resultMap[match.blockId] = {
              rowId: targetRow.id,
              client: match.client,
              reason: match.reason,
            };
            onAssign(match.blockId, targetRow.id);
          } else if (match.taskId !== 'GENERAL') {
            resultMap[match.blockId] = {
              rowId: null,
              client: match.client,
              reason: match.reason,
            };
          }
        }
        setAiResults(resultMap);
      }
    } catch (err) {
      console.error('AI match error:', err);
    } finally {
      setAiMatching(false);
    }
  }

  return (
    <div className="border border-yellow-500/30 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-yellow-500/10 hover:bg-yellow-500/15 transition-colors text-left"
      >
        <div className="text-yellow-400">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
        <span className="text-sm font-semibold text-yellow-400 flex-1">
          Unmatched Activity ({blocks.length} blocks, {Math.round(totalMinutes)}min)
        </span>
        <span className="text-xs text-[#8B8FA3]">Click to assign to tasks</span>
      </button>

      {open && (
        <div className="bg-[#0F1117]">
          {/* AI Match bar */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#2E3348]/50">
            <button
              onClick={handleAIMatch}
              disabled={aiMatching || !tasks || tasks.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-xs font-medium hover:bg-purple-500/30 transition-colors disabled:opacity-50"
            >
              {aiMatching ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              AI Smart Match
            </button>
            {aiResults && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <Check size={12} />
                Matched {Object.keys(aiResults).length} blocks
              </span>
            )}
            <span className="text-[10px] text-[#5C6178]">
              Claude matches remaining blocks to your tasks
            </span>
          </div>

          {/* Block list */}
          <div className="divide-y divide-[#2E3348]/50">
            {blocks.map(block => {
              const aiMatch = aiResults?.[block.id];
              return (
                <div key={block.id} className={`flex items-center gap-3 px-4 py-2.5 ${aiMatch ? 'bg-purple-500/5' : ''}`}>
                  <Monitor size={14} className="text-[#5C6178] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#E8E9ED] truncate">{block.title || block.app}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-[#5C6178] truncate">
                        {block.app} · {block.category}
                        {block.url && (() => { try { return ` · ${new URL(block.url).hostname}`; } catch { return ''; } })()}
                      </p>
                      {aiMatch && (
                        <span className="text-[10px] text-purple-400 italic shrink-0">
                          AI: {aiMatch.reason}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#8B8FA3] shrink-0">
                    <Clock size={12} />
                    {Math.round(block.durationMinutes)}min
                  </div>
                  <select
                    onChange={(e) => {
                      if (e.target.value) onAssign(block.id, e.target.value);
                      e.target.value = '';
                    }}
                    className="bg-[#1A1D27] border border-[#2E3348] rounded px-2 py-1 text-xs text-[#E8E9ED] focus:outline-none focus:border-accent shrink-0"
                    defaultValue=""
                  >
                    <option value="">Assign to...</option>
                    {rows.map(row => (
                      <option key={row.id} value={row.id}>
                        {row.clientShort} - {row.projectName}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
