import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, Send, Trash2, StopCircle } from 'lucide-react';
import { useAICoach } from '../contexts/AICoachContext';

const QUICK_ACTIONS = [
  { label: '🎯 What should I do next?', msg: 'Based on my current tasks, what should I work on right now? Be specific.' },
  { label: '☀️ Morning briefing', msg: 'Give me a morning briefing. What are my top priorities today and what needs immediate attention?' },
  { label: '🔥 Stale items', msg: 'Which of my items are getting stale and need attention? Help me draft a plan to address them.' },
  { label: '⚡ Quick wins', msg: 'What quick wins can I knock out right now to build momentum?' },
];

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isError = message.isError;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? 'bg-accent/20 text-[#E8E9ED] border border-accent/30'
            : isError
              ? 'bg-red-500/10 text-red-300 border border-red-500/20'
              : 'bg-[#1A1D27] text-[#C8C9CD] border border-[#2E3348]'
        }`}
      >
        <div className="whitespace-pre-wrap break-words prose-sm">
          {message.content}
        </div>
      </div>
    </div>
  );
}

function StreamingBubble({ text }) {
  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed bg-[#1A1D27] text-[#C8C9CD] border border-accent/30">
        <div className="whitespace-pre-wrap break-words">
          {text}
          <span className="inline-block w-1.5 h-4 bg-accent/60 ml-0.5 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function AICoachPanel() {
  const {
    messages, isStreaming, streamingText,
    sendMessage, stopStreaming, clearMessages,
    isOpen, toggleCoach, closeCoach, pageContext,
  } = useAICoach();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Ctrl+K global shortcut
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleCoach();
      }
      if (e.key === 'Escape' && isOpen) {
        closeCoach();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCoach, closeCoach, isOpen]);

  const handleSend = useCallback(() => {
    const msg = input.trim();
    if (!msg || isStreaming) return;
    setInput('');
    sendMessage(msg, pageContext, 'fast');
  }, [input, isStreaming, sendMessage, pageContext]);

  const handleQuickAction = useCallback((msg) => {
    if (isStreaming) return;
    sendMessage(msg, pageContext, 'fast');
  }, [isStreaming, sendMessage, pageContext]);

  // When closed, render nothing (toggle via Sidebar button or Ctrl+K)
  if (!isOpen) return null;

  return (
    <div className="w-80 h-full border-l border-accent/20 bg-[#0F1117] flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2E3348] bg-[#12141D] shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-accent" />
          <span className="text-sm font-semibold text-[#E8E9ED]">PROPEL Coach</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-[#5C6178] bg-[#1A1D27] rounded px-1.5 py-0.5">
            {pageContext.page}
          </span>
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="p-1.5 text-[#5C6178] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
              title="Clear conversation"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={closeCoach}
            className="p-1.5 text-[#5C6178] hover:text-[#E8E9ED] hover:bg-[#2E3348] rounded transition-colors"
            title="Close (Esc)"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages area — fills available height */}
      <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
        {messages.length === 0 && !isStreaming ? (
          <div className="space-y-2">
            <p className="text-xs text-[#5C6178] text-center mb-3">
              Your PROPEL Coach. Ask about tasks, priorities, or next steps.
            </p>
            <div className="space-y-1.5">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.msg)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg bg-[#1A1D27] border border-[#2E3348] text-[#8B8FA3] hover:border-accent/40 hover:text-[#E8E9ED] hover:bg-[#242836] transition-all"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
            {isStreaming && streamingText && (
              <StreamingBubble text={streamingText} />
            )}
            {isStreaming && !streamingText && (
              <div className="flex justify-start mb-3">
                <div className="rounded-lg px-3 py-2 bg-[#1A1D27] border border-[#2E3348]">
                  <div className="flex items-center gap-2 text-xs text-[#5C6178]">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    Thinking...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 px-3 py-2 border-t border-[#2E3348] bg-[#12141D]">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isStreaming ? 'Responding...' : 'Ask anything...'}
            disabled={isStreaming}
            className="flex-1 bg-[#0F1117] border border-[#2E3348] rounded-lg px-3 py-2 text-sm text-[#E8E9ED] placeholder-[#3E4255] focus:outline-none focus:border-accent disabled:opacity-50"
          />
          {isStreaming ? (
            <button
              onClick={stopStreaming}
              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
              title="Stop"
            >
              <StopCircle size={18} />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-2 text-accent hover:bg-accent/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              title="Send"
            >
              <Send size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
