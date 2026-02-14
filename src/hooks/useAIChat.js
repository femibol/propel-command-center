import { useState, useCallback, useRef } from 'react';

export default function useAIChat() {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const abortRef = useRef(null);

  const sendMessage = useCallback(async (userMessage, context = {}, model = 'fast') => {
    // Add user message to history
    const newUserMsg = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, newUserMsg]);
    setIsStreaming(true);
    setStreamingText('');

    const allMessages = [...messages, newUserMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Only send last 10 messages to keep context manageable
    const recentMessages = allMessages.slice(-10);

    const controller = new AbortController();
    abortRef.current = controller;

    let fullText = '';

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: recentMessages, context, model }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'AI request failed');
      }

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
              fullText += event.text;
              setStreamingText(fullText);
            } else if (event.type === 'error') {
              throw new Error(event.error);
            }
          } catch (e) {
            if (e.message && !e.message.includes('JSON')) throw e;
          }
        }
      }

      // Add assistant message to history
      if (fullText) {
        setMessages(prev => [...prev, { role: 'assistant', content: fullText }]);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      // Add error message
      const errorMsg = err.message || 'Something went wrong';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${errorMsg}`,
        isError: true,
      }]);
    } finally {
      setIsStreaming(false);
      setStreamingText('');
      abortRef.current = null;
    }
  }, [messages]);

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const clearMessages = useCallback(() => {
    stopStreaming();
    setMessages([]);
    setStreamingText('');
  }, [stopStreaming]);

  return {
    messages,
    isStreaming,
    streamingText,
    sendMessage,
    stopStreaming,
    clearMessages,
  };
}
