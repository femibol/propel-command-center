import { useState, useEffect, useCallback } from 'react';

export function useKeyboardNav(itemCount, { onExpand, onDone, onOpen } = {}) {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleKeyDown = useCallback((e) => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    switch (e.key) {
      case 'j':
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(i => Math.min(i + 1, itemCount - 1));
        break;
      case 'k':
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        if (focusedIndex >= 0) {
          e.preventDefault();
          onExpand?.(focusedIndex);
        }
        break;
      case 'Escape':
        setFocusedIndex(-1);
        break;
      case 'd':
        if (focusedIndex >= 0) {
          e.preventDefault();
          onDone?.(focusedIndex);
        }
        break;
      case 'o':
        if (focusedIndex >= 0) {
          e.preventDefault();
          onOpen?.(focusedIndex);
        }
        break;
    }
  }, [focusedIndex, itemCount, onExpand, onDone, onOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { focusedIndex, setFocusedIndex };
}
