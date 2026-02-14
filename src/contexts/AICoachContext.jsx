import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import useAIChat from '../hooks/useAIChat';

const AICoachContext = createContext(null);

export function AICoachProvider({ children }) {
  const chat = useAIChat();
  const [pageContext, setPageContextRaw] = useState({
    page: 'dashboard',
    data: '',
    clients: [],
  });
  const [isOpen, setIsOpen] = useState(false);

  const setPageContext = useCallback((ctx) => {
    setPageContextRaw(prev => {
      // Only update if something actually changed to avoid re-renders
      if (
        prev.page === ctx.page &&
        prev.data === ctx.data &&
        JSON.stringify(prev.clients) === JSON.stringify(ctx.clients)
      ) {
        return prev;
      }
      return { ...prev, ...ctx };
    });
  }, []);

  const toggleCoach = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const openCoach = useCallback(() => setIsOpen(true), []);
  const closeCoach = useCallback(() => setIsOpen(false), []);

  const askCoach = useCallback((question, model = 'fast') => {
    setIsOpen(true);
    chat.sendMessage(question, pageContext, model);
  }, [chat, pageContext]);

  const value = useMemo(() => ({
    ...chat,
    pageContext,
    setPageContext,
    isOpen,
    toggleCoach,
    openCoach,
    closeCoach,
    askCoach,
  }), [chat, pageContext, setPageContext, isOpen, toggleCoach, openCoach, closeCoach, askCoach]);

  return (
    <AICoachContext.Provider value={value}>
      {children}
    </AICoachContext.Provider>
  );
}

export function useAICoach() {
  const ctx = useContext(AICoachContext);
  if (!ctx) throw new Error('useAICoach must be used within AICoachProvider');
  return ctx;
}
