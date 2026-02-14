import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Copy, Send, CheckCircle, X, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function AISuggestionCard({ subitem, context, onUseReply, onClose }) {
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [fullText, setFullText] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const { addToast } = useToast();
  const abortRef = useRef(null);

  // Parse sections from the AI response
  const sections = parseSections(fullText || streamingText);

  useEffect(() => {
    generateSuggestion();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  async function generateSuggestion() {
    setIsStreaming(true);
    setStreamingText('');
    setFullText('');

    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = '';

    try {
      const msgs = [{
        role: 'user',
        content: `Generate follow-up suggestions for this task:
Task: ${subitem?.name || 'Unknown'}
Client: ${subitem?._clientName || 'Unknown'}
Status: ${context?.status || 'Unknown'}
Priority: ${context?.priority || 'Unknown'}
Days since update: ${context?.daysSinceUpdate || 'Unknown'}
${context?.waitingOn ? `Waiting on: ${context.waitingOn}` : ''}
${context?.details ? `Details: ${context.details}` : ''}

Provide:
1. **Analysis**: What's likely happening and what needs attention (2-3 sentences)
2. **Professional Reply**: A polished follow-up message (2-3 sentences)
3. **Urgent Reply**: A more pressing follow-up (2-3 sentences)
4. **Friendly Reply**: A casual check-in (2-3 sentences)
5. **Next Steps**: Concrete actions to move this forward (2-3 bullets)`,
      }];

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: msgs,
          context: {
            page: 'task-detail',
            data: `Working on: ${subitem?.name} for ${subitem?._clientName}`,
          },
          model: 'smart',
        }),
        signal: controller.signal,
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'text') {
              accumulated += event.text;
              setStreamingText(accumulated);
            }
          } catch {}
        }
      }

      setFullText(accumulated);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setFullText(`⚠️ Failed to generate suggestion: ${err.message}`);
      }
    } finally {
      setIsStreaming(false);
    }
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text);
    addToast('Copied to clipboard', 'success');
  }

  function handleUseReply(text) {
    if (onUseReply) onUseReply(text);
    addToast('Reply loaded into update field', 'info');
  }

  const tabs = ['Analysis', 'Professional', 'Urgent', 'Friendly', 'Next Steps'];

  return (
    <div className="bg-[#0F1117] border border-accent/20 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2E3348] bg-[#12141D]">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-accent" />
          <span className="text-xs font-semibold text-[#E8E9ED]">AI Suggestion</span>
          {isStreaming && (
            <Loader2 size={12} className="text-accent animate-spin" />
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 text-[#5C6178] hover:text-[#E8E9ED] transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      {(fullText || streamingText) ? (
        <>
          {/* Tabs */}
          <div className="flex border-b border-[#2E3348] bg-[#12141D]">
            {tabs.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`px-3 py-2 text-[11px] font-medium transition-colors ${
                  activeTab === i
                    ? 'text-accent border-b-2 border-accent'
                    : 'text-[#5C6178] hover:text-[#8B8FA3]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Active section */}
          <div className="p-4 min-h-[80px]">
            <p className="text-xs text-[#C8C9CD] leading-relaxed whitespace-pre-wrap">
              {sections[activeTab] || (isStreaming ? streamingText : 'Generating...')}
              {isStreaming && <span className="inline-block w-1.5 h-3 bg-accent/60 ml-0.5 animate-pulse" />}
            </p>
          </div>

          {/* Actions */}
          {!isStreaming && sections[activeTab] && (
            <div className="flex items-center gap-2 px-4 pb-3">
              <button
                onClick={() => handleCopy(sections[activeTab])}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1A1D27] border border-[#2E3348] rounded text-[11px] text-[#8B8FA3] hover:text-[#E8E9ED] hover:border-[#3E4255] transition-colors"
              >
                <Copy size={11} />
                Copy
              </button>
              {activeTab >= 1 && activeTab <= 3 && (
                <button
                  onClick={() => handleUseReply(sections[activeTab])}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-accent/10 border border-accent/30 rounded text-[11px] text-accent hover:bg-accent/20 transition-colors"
                >
                  <Send size={11} />
                  Use This Reply
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-xs text-[#5C6178]">
            <Loader2 size={14} className="animate-spin text-accent" />
            Generating AI suggestion...
          </div>
        </div>
      )}
    </div>
  );
}

function parseSections(text) {
  if (!text) return [];

  // Try to split by bold headers
  const parts = text.split(/\*\*([^*]+)\*\*/);
  const sections = [];
  let current = '';

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    // Check if this part is a header-like text
    const isHeader = /^(analysis|professional|urgent|friendly|next steps)/i.test(part);

    if (isHeader) {
      if (current.trim()) sections.push(current.trim());
      current = '';
    } else {
      current += part + ' ';
    }
  }
  if (current.trim()) sections.push(current.trim());

  // If parsing didn't split well, just return the whole text in the first section
  if (sections.length === 0) return [text];
  return sections;
}
